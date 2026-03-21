-- Security hardening for core coin/xp RPCs and server-side badge unlocks

-- Harden reward redemption against cross-profile abuse.
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_reward_id UUID,
  p_profile_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost NUMERIC;
  v_current_earnings NUMERIC;
  v_redemption_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT cost INTO v_cost FROM public.rewards WHERE id = p_reward_id AND is_active = true;
  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'reward_not_found';
  END IF;

  SELECT total_earnings INTO v_current_earnings FROM public.profiles WHERE id = p_profile_id;
  IF v_current_earnings IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_current_earnings < v_cost THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  UPDATE public.profiles
  SET total_earnings = total_earnings - v_cost
  WHERE id = p_profile_id;

  INSERT INTO public.redemptions (reward_id, profile_id, cost)
  VALUES (p_reward_id, p_profile_id, v_cost)
  RETURNING id INTO v_redemption_id;

  RETURN v_redemption_id;
END;
$$;

-- Harden game play recording and keep per-play audit value consistent with awarded coins.
CREATE OR REPLACE FUNCTION public.record_game_play(
  p_profile_id UUID,
  p_game_type TEXT,
  p_score INTEGER
)
RETURNS TABLE(coins_earned INTEGER, remaining_plays INTEGER, daily_bonus_earned BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INTEGER;
  v_coins INTEGER;
  v_plays_today INTEGER;
  v_daily_bonus BOOLEAN := FALSE;
  v_play_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT get_remaining_game_plays(p_profile_id) INTO v_remaining;

  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'No remaining plays for today';
  END IF;

  v_coins := CASE
    WHEN p_score >= 1000 THEN 25
    WHEN p_score >= 500 THEN 15
    WHEN p_score >= 100 THEN 10
    ELSE 5
  END;

  INSERT INTO public.game_plays (profile_id, game_type, score, coins_earned)
  VALUES (p_profile_id, p_game_type, p_score, v_coins)
  RETURNING id INTO v_play_id;

  SELECT COUNT(*) INTO v_plays_today
  FROM public.game_plays
  WHERE profile_id = p_profile_id
    AND played_at >= CURRENT_DATE
    AND played_at < CURRENT_DATE + INTERVAL '1 day';

  IF v_plays_today = 5 THEN
    v_daily_bonus := TRUE;
    v_coins := v_coins + 25;

    UPDATE public.game_plays
    SET coins_earned = v_coins
    WHERE id = v_play_id;
  END IF;

  UPDATE public.profiles
  SET total_earnings = total_earnings + v_coins
  WHERE id = p_profile_id;

  coins_earned := v_coins;
  remaining_plays := 5 - v_plays_today;
  daily_bonus_earned := v_daily_bonus;

  RETURN NEXT;
END;
$$;

-- Harden XP awarding so only owner or parent of same household can award XP.
CREATE OR REPLACE FUNCTION public.award_xp(p_profile_id uuid, p_amount integer)
RETURNS TABLE(new_xp integer, new_level integer, leveled_up boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_level integer;
  v_new_xp integer;
  v_new_level integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles target
    LEFT JOIN public.profiles actor ON actor.user_id = auth.uid()
    WHERE target.id = p_profile_id
      AND (
        target.user_id = auth.uid()
        OR (
          actor.type = 'parent'
          AND actor.household_id = target.household_id
        )
      )
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT level INTO v_old_level FROM profiles WHERE id = p_profile_id;

  UPDATE profiles
  SET xp = xp + p_amount,
      level = calculate_level(xp + p_amount)
  WHERE id = p_profile_id
  RETURNING xp, level INTO v_new_xp, v_new_level;

  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$;

-- Server-side badge unlock evaluation to prevent client-forged unlocks.
CREATE OR REPLACE FUNCTION public.check_and_unlock_badges(p_profile_id uuid)
RETURNS TABLE(
  badge_id uuid,
  badge_name text,
  badge_icon text,
  xp_reward integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_level integer;
  v_total_earnings numeric;
  v_chores_completed integer;
  v_quiz_correct integer;
  v_streak_days integer := 0;
  v_latest_day date;
  v_day_cursor date;
  v_profile_household uuid;
  rec record;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT p.level, p.total_earnings, p.household_id
  INTO v_level, v_total_earnings, v_profile_household
  FROM public.profiles p
  WHERE p.id = p_profile_id;

  IF v_profile_household IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  SELECT COUNT(*)::integer
  INTO v_chores_completed
  FROM public.earnings e
  WHERE e.profile_id = p_profile_id
    AND e.status = 'approved';

  SELECT COUNT(*)::integer
  INTO v_quiz_correct
  FROM public.quiz_attempts qa
  WHERE qa.profile_id = p_profile_id
    AND qa.is_correct = true;

  SELECT MAX((e.approved_at AT TIME ZONE 'UTC')::date)
  INTO v_latest_day
  FROM public.earnings e
  WHERE e.profile_id = p_profile_id
    AND e.status = 'approved'
    AND e.approved_at IS NOT NULL;

  IF v_latest_day IS NOT NULL AND (v_latest_day = CURRENT_DATE OR v_latest_day = CURRENT_DATE - 1) THEN
    v_day_cursor := v_latest_day;
    LOOP
      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM public.earnings e
        WHERE e.profile_id = p_profile_id
          AND e.status = 'approved'
          AND (e.approved_at AT TIME ZONE 'UTC')::date = v_day_cursor
      );

      v_streak_days := v_streak_days + 1;
      v_day_cursor := v_day_cursor - 1;
    END LOOP;
  END IF;

  FOR rec IN
    SELECT b.id, b.name, b.icon, b.xp_reward
    FROM public.badges b
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.kid_badges kb
      WHERE kb.profile_id = p_profile_id
        AND kb.badge_id = b.id
    )
      AND (
        (b.requirement_type = 'chores_completed' AND v_chores_completed >= b.requirement_value)
        OR (b.requirement_type = 'coins_earned' AND COALESCE(v_total_earnings, 0) >= b.requirement_value)
        OR (b.requirement_type = 'level_reached' AND COALESCE(v_level, 1) >= b.requirement_value)
        OR (b.requirement_type = 'quiz_correct' AND v_quiz_correct >= b.requirement_value)
        OR (b.requirement_type = 'streak_days' AND v_streak_days >= b.requirement_value)
      )
  LOOP
    INSERT INTO public.kid_badges (profile_id, badge_id)
    VALUES (p_profile_id, rec.id)
    ON CONFLICT (profile_id, badge_id) DO NOTHING;

    IF FOUND THEN
      IF rec.xp_reward > 0 THEN
        PERFORM public.award_xp(p_profile_id, rec.xp_reward);
      END IF;

      badge_id := rec.id;
      badge_name := rec.name;
      badge_icon := rec.icon;
      xp_reward := rec.xp_reward;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;
