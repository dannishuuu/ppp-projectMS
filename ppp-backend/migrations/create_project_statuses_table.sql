-- Migration: Create project_statuses table
-- Description: Lookup table for the lifecycle status of a project (e.g., Signed, Under Construction, Operational)
-- Created: 2024

-- 1. Create the project_statuses table
CREATE TABLE IF NOT EXISTS public.project_statuses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    
    -- System & Audit Fields
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    
    -- Foreign Keys linking to users table
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    
    CONSTRAINT project_statuses_pkey PRIMARY KEY (id),
    CONSTRAINT project_statuses_name_key UNIQUE (name),
    CONSTRAINT chk_not_both_deleted_proj_status CHECK ((NOT ((is_deleted = true) AND (deleted_at IS NULL))))
);

-- 2. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_project_statuses_active 
ON public.project_statuses USING btree (is_active) 
WHERE (is_active = true);

CREATE INDEX IF NOT EXISTS idx_project_statuses_deleted 
ON public.project_statuses USING btree (is_deleted) 
WHERE (is_deleted = false);

-- 3. Add comments
COMMENT ON TABLE public.project_statuses IS 'Lookup table for the lifecycle status of a project (e.g., Signed, Under Construction, Operational).';
COMMENT ON COLUMN public.project_statuses.name IS 'Name of the project status (e.g., Signed, Under Construction, Operational)';
COMMENT ON COLUMN public.project_statuses.description IS 'Optional description providing details about the status';
COMMENT ON COLUMN public.project_statuses.is_active IS 'Whether this status is currently active and available for use';
COMMENT ON COLUMN public.project_statuses.is_deleted IS 'Soft delete flag for this status';

-- 4. Insert default project statuses (optional - you can add default values if needed)
INSERT INTO public.project_statuses (name, description) VALUES
    ('Draft', 'Project is in draft stage'),
    ('Signed', 'Project contract has been signed'),
    ('Under Construction', 'Project is currently under construction'),
    ('Operational', 'Project is operational and complete'),
    ('On Hold', 'Project has been temporarily paused'),
    ('Cancelled', 'Project has been cancelled')
ON CONFLICT (name) DO NOTHING;
