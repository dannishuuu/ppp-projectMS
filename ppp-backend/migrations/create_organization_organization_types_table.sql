-- Drop the foreign key constraint first (if it exists)
ALTER TABLE public.organizations 
    DROP CONSTRAINT IF EXISTS organizations_org_type_fk;

-- Drop the index on the type column (if it exists)
DROP INDEX IF EXISTS public.idx_organizations_type;

-- Drop the column itself
ALTER TABLE public.organizations 
    DROP COLUMN IF EXISTS organization_type_id;

-- Create the organization_organization_types table
CREATE TABLE IF NOT EXISTS public.organization_organization_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL, -- Links to organizations
    organization_type_id uuid NOT NULL, -- Links to organization_types
    
    -- System & Audit Fields
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    
    -- Foreign Keys linking to users table for audit tracking
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT organization_org_types_pkey PRIMARY KEY (id),
    
    -- Foreign Keys linking the organization and the type
    CONSTRAINT org_org_types_org_fk FOREIGN KEY (organization_id) 
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    CONSTRAINT org_org_types_type_fk FOREIGN KEY (organization_type_id) 
        REFERENCES public.organization_types(id) ON DELETE RESTRICT,
        
    -- CRITICAL: Prevent assigning the exact same type to the same organization twice
    CONSTRAINT organization_org_types_uniq UNIQUE (organization_id, organization_type_id),
    
    CONSTRAINT chk_not_both_deleted_org_type CHECK ((NOT ((is_deleted = true) AND (deleted_at IS NULL))))
);

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_org_org_types_org ON public.organization_organization_types USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_org_types_type ON public.organization_organization_types USING btree (organization_type_id);
CREATE INDEX IF NOT EXISTS idx_org_org_types_active ON public.organization_organization_types USING btree (is_deleted) WHERE (is_deleted = false);

-- Add comments for documentation
COMMENT ON TABLE public.organization_organization_types IS 'Junction table mapping multiple organization types to multiple organizations (Many-to-Many).';
COMMENT ON COLUMN public.organization_organization_types.organization_id IS 'The organization being categorized.';
COMMENT ON COLUMN public.organization_organization_types.organization_type_id IS 'The type assigned to the organization (e.g., Developer, SPV).';
