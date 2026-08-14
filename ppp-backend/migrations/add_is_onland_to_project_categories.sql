-- 1. Add the is_onland column to project_categories
ALTER TABLE public.project_categories 
ADD COLUMN is_onland boolean;

-- 2. Add a comment for documentation
COMMENT ON COLUMN public.project_categories.is_onland 
IS 'Indicates if the project category is on land. Can be NULL if not applicable.';
