-- 1. Add is_rented column (default false)
ALTER TABLE public.building_units
    ADD COLUMN IF NOT EXISTS is_rented boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.building_units.is_rented IS 'Indicates whether the unit is currently rented out. Defaults to false.';

-- 2. Add is_for_rent column (default true)
ALTER TABLE public.building_units
    ADD COLUMN IF NOT EXISTS is_for_rent boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.building_units.is_for_rent IS 'Indicates whether the unit is available for rent. Defaults to true.';

-- 3. Add partial index to quickly find units that are available to be rented
CREATE INDEX IF NOT EXISTS idx_building_units_available_for_rent
    ON public.building_units (building_id)
    WHERE is_for_rent = true AND is_rented = false AND is_deleted = false;

-- 4. Add partial index for units not currently rented
CREATE INDEX IF NOT EXISTS idx_building_units_not_rented
    ON public.building_units (building_id)
    WHERE is_rented = false AND is_deleted = false;
