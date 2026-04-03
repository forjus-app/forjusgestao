-- Migrate existing statuses to new values
UPDATE public.deadlines SET status = 'completed' WHERE status = 'reviewed';
UPDATE public.deadlines SET status = 'open' WHERE status = 'adjustment_requested';

-- Remove review-related columns that are no longer needed
ALTER TABLE public.deadlines DROP COLUMN IF EXISTS review_status;
ALTER TABLE public.deadlines DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE public.deadlines DROP COLUMN IF EXISTS reviewed_notes;