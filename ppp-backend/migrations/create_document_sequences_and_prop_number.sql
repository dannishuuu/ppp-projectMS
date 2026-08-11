-- 1. Create the document_sequences table
CREATE TABLE IF NOT EXISTS public.document_sequences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    
    -- Sequence Configuration
    entity_type character varying(50) NOT NULL, -- e.g., 'project_proposal', 'ppp_project'
    prefix character varying(20) NOT NULL, -- e.g., 'PROP-', 'PROJ-'
    suffix character varying(20), -- Optional suffix
    next_sequence integer DEFAULT 1 NOT NULL, -- The next number to be assigned (e.g., 1, 2, 3)
    padding_length integer DEFAULT 4 NOT NULL, -- Zero-padding length (e.g., 4 turns '1' into '0001')
    
    -- Year/Reset Configuration
    current_year integer, -- e.g., 2026. Used if you want to reset numbers every year
    reset_yearly boolean DEFAULT false NOT NULL, -- If true, sequence resets to 1 when the year changes
    
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
    CONSTRAINT document_sequences_pkey PRIMARY KEY (id),
    CONSTRAINT document_sequences_entity_uniq UNIQUE (entity_type, current_year),
    CONSTRAINT chk_not_both_deleted_doc_seq CHECK ((NOT ((is_deleted = true) AND (deleted_at IS NULL))))
);

-- 2. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_doc_sequences_entity ON public.document_sequences USING btree (entity_type);
CREATE INDEX IF NOT EXISTS idx_doc_sequences_active ON public.document_sequences USING btree (is_active) WHERE (is_active = true);

-- 3. Add comments for documentation
COMMENT ON TABLE public.document_sequences IS 'Centralized table to track and generate sequential document numbers for proposals, projects, etc.';
COMMENT ON COLUMN public.document_sequences.entity_type IS 'The table or entity this sequence belongs to (e.g., project_proposal).';
COMMENT ON COLUMN public.document_sequences.next_sequence IS 'The next integer to be used in the sequence.';
COMMENT ON COLUMN public.document_sequences.padding_length IS 'Number of leading zeros (e.g., 4 means 1 becomes 0001).';

-- 4. Add the prop_number column to project_proposals
ALTER TABLE public.project_proposals 
    ADD COLUMN IF NOT EXISTS prop_number character varying(50);

-- 5. Add a UNIQUE index (so two proposals never get the same number)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_prop_number 
    ON public.project_proposals (prop_number) 
    WHERE prop_number IS NOT NULL;

-- 6. Add a comment for documentation
COMMENT ON COLUMN public.project_proposals.prop_number IS 'The human-readable, sequentially generated proposal number (e.g., PROP-2026-0001). Generated using the document_sequences table.';
