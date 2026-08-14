-- Remove columns from tracking_areas
ALTER TABLE public.tracking_areas 
DROP COLUMN IF EXISTS weight,
DROP COLUMN IF EXISTS order_index;

-- Remove columns from checklists
ALTER TABLE public.checklists 
DROP COLUMN IF EXISTS is_completed,
DROP COLUMN IF EXISTS completed_at,
DROP COLUMN IF EXISTS order_index,
DROP COLUMN IF EXISTS completed_by;
