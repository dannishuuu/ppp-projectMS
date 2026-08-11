-- Create tracking_item_types table
CREATE TABLE public.tracking_item_types (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  
  -- Core Identification
  code character varying(20) NOT NULL, -- Short system code (e.g., 'PILLAR', 'PHASE', 'TASK')
  name character varying(100) NOT NULL, -- Human-readable name
  description text,
  
  -- Structural & WBS Configuration
  is_wbs boolean DEFAULT false NOT NULL, -- TRUE if this type can act as a parent (Work Breakdown Structure)
  is_leaf boolean DEFAULT false NOT NULL, -- TRUE if this type is a final task/checklist and CANNOT have children
  
  -- UI & System Behaviors
  sort_order integer DEFAULT 0 NOT NULL, -- Orders the types in dropdowns (1=Pillar, 2=Phase, 3=Checklist)
  default_weight numeric(5,2) DEFAULT 1.00, -- Suggested weight when an item of this type is created
  
  -- System & Audit Fields
  is_active boolean DEFAULT true,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  
  -- Foreign Keys linking to users table for audit tracking
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT tracking_item_types_pkey PRIMARY KEY (id),
  CONSTRAINT tracking_item_types_code_key UNIQUE (code),
  CONSTRAINT tracking_item_types_name_key UNIQUE (name),
  CONSTRAINT chk_not_both_deleted_track_type CHECK ((NOT ((is_deleted = true) AND (deleted_at IS NULL))))
);

-- Add helpful indexes
CREATE INDEX idx_tracking_item_types_active ON public.tracking_item_types USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_tracking_item_types_deleted ON public.tracking_item_types USING btree (is_deleted) WHERE (is_deleted = false);
CREATE INDEX idx_tracking_item_types_sort ON public.tracking_item_types USING btree (sort_order);

-- Add comments for documentation
COMMENT ON TABLE public.tracking_item_types IS 'Lookup table defining the structural types of project tracking (Pillars, Phases, Checklists) and their WBS capabilities.';
COMMENT ON COLUMN public.tracking_item_types.code IS 'Short uppercase code used by the backend for system logic (e.g., PILLAR, PHASE, CHK).';
COMMENT ON COLUMN public.tracking_item_types.is_wbs IS 'If true, items of this type can be broken down into children (e.g., a Pillar can have Phases).';
COMMENT ON COLUMN public.tracking_item_types.is_leaf IS 'If true, items of this type cannot have children (e.g., a checklist item is a final leaf node).';
COMMENT ON COLUMN public.tracking_item_types.default_weight IS 'Default percentage/weight value applied when creating a tracking item of this type.';

-- Seed initial tracking item types
INSERT INTO public.tracking_item_types (code, name, description, is_wbs, is_leaf, sort_order, default_weight, is_active)
VALUES 
  ('PILLAR', 'Pillar', 'Top-level project pillar that can contain phases', true, false, 1, 1.00, true),
  ('PHASE', 'Phase', 'Middle-level project phase that can contain tasks', true, false, 2, 1.00, true),
  ('TASK', 'Task', 'Final task or checklist item that cannot have children', false, true, 3, 1.00, true);
