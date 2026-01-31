-- Tune badge requirements to "medium" difficulty (2-6 weeks)
-- Assuming ~2-3 chores/day, quizzes daily, consistent activity

-- Chores completed badges: more gradual progression
UPDATE badges SET requirement_value = 3 WHERE name = 'Helper' AND requirement_type = 'chores_completed';
UPDATE badges SET requirement_value = 15 WHERE name = 'Super Helper' AND requirement_type = 'chores_completed';
UPDATE badges SET requirement_value = 50 WHERE name = 'Chore Champion' AND requirement_type = 'chores_completed';

-- Quiz correct badges: medium pacing
UPDATE badges SET requirement_value = 10 WHERE name = 'Quiz Whiz' AND requirement_type = 'quiz_correct';
UPDATE badges SET requirement_value = 35 WHERE name = 'Brain Power' AND requirement_type = 'quiz_correct';
UPDATE badges SET requirement_value = 75 WHERE name = 'Quiz Master' AND requirement_type = 'quiz_correct';

-- Coins earned badges: easier to reach with game coins + chores
UPDATE badges SET requirement_value = 50 WHERE name = 'Piggy Banker' AND requirement_type = 'coins_earned';
UPDATE badges SET requirement_value = 250 WHERE name = 'Money Maker' AND requirement_type = 'coins_earned';
UPDATE badges SET requirement_value = 750 WHERE name = 'Coin Collector' AND requirement_type = 'coins_earned';

-- Level badges: keep reasonable
UPDATE badges SET requirement_value = 3 WHERE name = 'Level Up!' AND requirement_type = 'level_reached';
UPDATE badges SET requirement_value = 7 WHERE name = 'Rising Star' AND requirement_type = 'level_reached';
UPDATE badges SET requirement_value = 15 WHERE name = 'Legend' AND requirement_type = 'level_reached';

-- Streak badges: keep as is (3, 7, 30 is good medium difficulty)