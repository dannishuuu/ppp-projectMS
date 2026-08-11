-- Migration: Add proposal_categories junction table
-- This allows a proposal to have multiple categories

-- Create proposal_categories junction table
CREATE TABLE IF NOT EXISTS proposal_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(proposal_id, category_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_proposal_categories_proposal_id ON proposal_categories(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_categories_category_id ON proposal_categories(category_id);

-- Migrate existing data from project_proposals.project_category_id to proposal_categories
INSERT INTO proposal_categories (proposal_id, category_id)
SELECT id, project_category_id 
FROM project_proposals 
WHERE project_category_id IS NOT NULL 
ON CONFLICT (proposal_id, category_id) DO NOTHING;

-- Optional: Remove project_category_id column from project_proposals
-- Uncomment the following line if you want to drop the old column
-- ALTER TABLE project_proposals DROP COLUMN IF EXISTS project_category_id;

-- Note: If you want to keep the column for backward compatibility, leave it as is
-- The application will handle both the old single-category and new multi-category approach
