-- 1. Create the tracking_areas table
CREATE TABLE public.tracking_areas (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,

  -- Links to tracking_item_types (Defines if this area is a 'PILLAR' or 'PHASE')
  tracking_item_type_id uuid NOT NULL,

  -- Hierarchy Link (If NULL, this is a top-level Pillar. If set, it's a Phase belonging to a Pillar)
  parent_id uuid,

  -- Core Details
  name character varying(255) NOT NULL,
  description text,
  weight numeric(5,2) DEFAULT 1.00, -- How much this area contributes to overall progress
  order_index integer DEFAULT 0, -- For sorting (e.g., Phase 1, Phase 2)

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

  -- Constraints
  CONSTRAINT tracking_areas_pkey PRIMARY KEY (id),
  CONSTRAINT tracking_areas_type_fk FOREIGN KEY (tracking_item_type_id) REFERENCES public.tracking_item_types(id) ON DELETE RESTRICT,
  -- Self-referencing FK to allow Phases to link to Pillars
  CONSTRAINT tracking_areas_parent_fk FOREIGN KEY (parent_id) REFERENCES public.tracking_areas(id) ON DELETE CASCADE,
  CONSTRAINT chk_not_both_deleted_area CHECK ((NOT ((is_deleted = true) AND (deleted_at IS NULL))))
);

-- 2. Add helpful indexes
CREATE INDEX idx_tracking_areas_type ON public.tracking_areas USING btree (tracking_item_type_id);
CREATE INDEX idx_tracking_areas_parent ON public.tracking_areas USING btree (parent_id);
CREATE INDEX idx_tracking_areas_active ON public.tracking_areas USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_tracking_areas_deleted ON public.tracking_areas USING btree (is_deleted) WHERE (is_deleted = false);

-- 3. Add comments
COMMENT ON TABLE public.tracking_areas IS 'Stores project tracking areas (Pillars and Phases). Uses parent_id to link phases to pillars.';
COMMENT ON COLUMN public.tracking_areas.tracking_item_type_id IS 'Defines whether this record is a Pillar or a Phase.';
COMMENT ON COLUMN public.tracking_areas.parent_id IS 'If this is a Phase, this column points to its parent Pillar. If NULL, it is a Pillar.';

-- =====================================================

-- 1. Create the checklists table
CREATE TABLE public.checklists (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,

  -- Links to tracking_areas (The parent Pillar or Phase)
  tracking_area_id uuid NOT NULL,

  -- Core Details
  name character varying(255) NOT NULL,
  description text,
  is_completed boolean DEFAULT false NOT NULL, -- Tracks if this specific checklist item is done
  completed_at timestamp with time zone,
  order_index integer DEFAULT 0, -- For sorting checklist items

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
  completed_by uuid REFERENCES public.users(id) ON DELETE SET NULL, -- Who checked the box

  -- Constraints
  CONSTRAINT checklists_pkey PRIMARY KEY (id),
  CONSTRAINT checklists_area_fk FOREIGN KEY (tracking_area_id) REFERENCES public.tracking_areas(id) ON DELETE CASCADE,
  CONSTRAINT chk_not_both_deleted_checklist CHECK ((NOT ((is_deleted = true) AND (deleted_at IS NULL))))
);

-- 2. Add helpful indexes
CREATE INDEX idx_checklists_area ON public.checklists USING btree (tracking_area_id);
CREATE INDEX idx_checklists_completed ON public.checklists USING btree (is_completed) WHERE (is_completed = false);
CREATE INDEX idx_checklists_active ON public.checklists USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_checklists_deleted ON public.checklists USING btree (is_deleted) WHERE (is_deleted = false);

-- 3. Add comments
COMMENT ON TABLE public.checklists IS 'Stores actionable checklist items that belong to a tracking area (Pillar or Phase).';
COMMENT ON COLUMN public.checklists.tracking_area_id IS 'The Pillar or Phase that this checklist item belongs to.';
COMMENT ON COLUMN public.checklists.completed_by IS 'The user who marked this checklist item as complete.';
