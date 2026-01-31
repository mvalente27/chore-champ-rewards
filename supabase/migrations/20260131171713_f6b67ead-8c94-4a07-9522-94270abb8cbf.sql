-- Add 'denied' as a valid status for chore_claims
-- The status column is already a text column, so we just need to handle the new value in the application

-- Add a column to track if the kid has acknowledged a denied claim
ALTER TABLE public.chore_claims 
ADD COLUMN IF NOT EXISTS denial_reason text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS acknowledged_at timestamp with time zone DEFAULT NULL;