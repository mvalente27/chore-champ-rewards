-- Update the avatar_url validation trigger to allow JSON avatar configs
CREATE OR REPLACE FUNCTION validate_avatar_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL or empty
  IF NEW.avatar_url IS NULL OR NEW.avatar_url = '' THEN
    RETURN NEW;
  END IF;
  
  -- Allow JSON avatar configs (new customizable avatars)
  IF NEW.avatar_url LIKE '{%' AND NEW.avatar_url LIKE '%}' THEN
    -- Basic validation: check it contains expected keys
    IF NEW.avatar_url LIKE '%"skinTone"%' THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Allow emoji avatars (single character or short strings without /)
  IF length(NEW.avatar_url) <= 10 AND position('/' in NEW.avatar_url) = 0 THEN
    RETURN NEW;
  END IF;
  
  -- For URLs, ensure they start with https://
  IF NEW.avatar_url LIKE 'https://%' THEN
    RETURN NEW;
  END IF;
  
  -- Reject invalid formats
  RAISE EXCEPTION 'Invalid avatar_url: must be an emoji, HTTPS URL, or valid avatar config';
END;
$$ LANGUAGE plpgsql;