-- Migration: Create rental_contracts and rental_payments tables

-- 1. Create rental_contracts table
CREATE TABLE IF NOT EXISTS public.rental_contracts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    
    -- Relationships to physical assets
    building_id uuid NOT NULL,
    floor_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    
    -- Snapshot data from building_units
    unit_number character varying(50) NOT NULL,
    floor_number integer NOT NULL,
    area_value numeric(18,2),
    
    -- Relationship to the renter (tenant)
    tenant_organization_id uuid,
    
    -- Financial details
    rent_amount_per_square_meter numeric(18,2),
    rent_amount_total_per_month numeric(18,2) NOT NULL,
    
    -- Payment relationships
    rental_payment_type_id uuid NOT NULL,
    payment_timing_id uuid NOT NULL,
    
    -- Contract details
    contract_number character varying(50) NOT NULL,
    contract_start_date date NOT NULL,
    contract_end_date date NOT NULL,
    remarks text,
    is_active boolean DEFAULT true NOT NULL,
    
    -- Standard audit and soft-delete columns
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    
    -- Constraints
    CONSTRAINT rental_contracts_pkey PRIMARY KEY (id),
    CONSTRAINT chk_not_both_deleted_contract CHECK ((NOT ((is_deleted = true) AND (deleted_at IS NULL)))),
    CONSTRAINT chk_contract_dates CHECK ((contract_end_date >= contract_start_date)),
    CONSTRAINT chk_rent_amount CHECK ((rent_amount_total_per_month >= (0)::numeric)),
    CONSTRAINT chk_rent_per_sqm CHECK (((rent_amount_per_square_meter IS NULL) OR (rent_amount_per_square_meter >= (0)::numeric)))
);

-- Comments for documentation
COMMENT ON TABLE public.rental_contracts IS 'Stores rental contracts for building units, linking physical assets to tenants and payment terms.';
COMMENT ON COLUMN public.rental_contracts.unit_number IS 'Snapshot of building_units.unit_number at the time of contract creation.';
COMMENT ON COLUMN public.rental_contracts.floor_number IS 'Snapshot of building_units.floor_number at the time of contract creation.';
COMMENT ON COLUMN public.rental_contracts.area_value IS 'Snapshot of building_units.area_value at the time of contract creation.';
COMMENT ON COLUMN public.rental_contracts.rent_amount_per_square_meter IS 'Calculated rent per square meter. Nullable if area_value is null.';
COMMENT ON COLUMN public.rental_contracts.is_active IS 'Status of the contract. True = Active, False = Inactive/Terminated.';

-- Foreign Key Constraints for rental_contracts (wrapped in DO block for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_building_fk') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_building_fk FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_floor_fk') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_floor_fk FOREIGN KEY (floor_id) REFERENCES public.building_floors(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_unit_fk') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_unit_fk FOREIGN KEY (unit_id) REFERENCES public.building_units(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_tenant_org_fk') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_tenant_org_fk FOREIGN KEY (tenant_organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_rental_pay_type_fk') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_rental_pay_type_fk FOREIGN KEY (rental_payment_type_id) REFERENCES public.rental_payment_types(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_pay_timing_fk') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_pay_timing_fk FOREIGN KEY (payment_timing_id) REFERENCES public.payment_timings(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_created_by_fkey') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_updated_by_fkey') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_deleted_by_fkey') THEN
        ALTER TABLE ONLY public.rental_contracts
            ADD CONSTRAINT contracts_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for rental_contracts
CREATE UNIQUE INDEX IF NOT EXISTS idx_rental_contracts_number_uniq 
    ON public.rental_contracts USING btree (contract_number) 
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_contracts_building 
    ON public.rental_contracts USING btree (building_id);

CREATE INDEX IF NOT EXISTS idx_contracts_unit 
    ON public.rental_contracts USING btree (unit_id);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant 
    ON public.rental_contracts USING btree (tenant_organization_id);

CREATE INDEX IF NOT EXISTS idx_contracts_active 
    ON public.rental_contracts USING btree (is_active) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_contracts_dates 
    ON public.rental_contracts USING btree (contract_start_date, contract_end_date);


-- 2. Create rental_payments table
CREATE TABLE IF NOT EXISTS public.rental_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    rental_contract_id uuid NOT NULL,
    amount_due numeric(18,2) NOT NULL,
    amount_paid numeric(18,2) DEFAULT (0)::numeric NOT NULL,
    due_date date NOT NULL,
    payment_date date,
    next_payment_date date,
    is_paid boolean DEFAULT false NOT NULL,
    transaction_reference character varying(100),
    remarks text,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    CONSTRAINT rental_payments_pkey PRIMARY KEY (id),
    CONSTRAINT chk_not_both_deleted_rent_pay CHECK ((NOT ((is_deleted = true) AND (deleted_at IS NULL)))),
    CONSTRAINT chk_pay_amounts CHECK (((amount_due >= (0)::numeric) AND (amount_paid >= (0)::numeric)))
);

COMMENT ON TABLE public.rental_payments IS 'Tracks individual payment schedules and transactions for rental contracts. next_payment_date is calculated and set by backend logic.';
COMMENT ON COLUMN public.rental_payments.next_payment_date IS 'Calculated by backend logic based on the rental_payment_types.duration_days associated with the contract.';
COMMENT ON COLUMN public.rental_payments.is_paid IS 'Indicates if this scheduled payment has been fully paid. Defaults to false.';

-- Foreign Key Constraints for rental_payments (wrapped in DO block for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_payments_contract_fk') THEN
        ALTER TABLE ONLY public.rental_payments
            ADD CONSTRAINT rent_payments_contract_fk FOREIGN KEY (rental_contract_id) REFERENCES public.rental_contracts(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_payments_created_by_fkey') THEN
        ALTER TABLE ONLY public.rental_payments
            ADD CONSTRAINT rent_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_payments_updated_by_fkey') THEN
        ALTER TABLE ONLY public.rental_payments
            ADD CONSTRAINT rent_payments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_payments_deleted_by_fkey') THEN
        ALTER TABLE ONLY public.rental_payments
            ADD CONSTRAINT rent_payments_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for rental_payments
CREATE INDEX IF NOT EXISTS idx_rent_payments_contract ON public.rental_payments USING btree (rental_contract_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_due_date ON public.rental_payments USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_rent_payments_next_payment ON public.rental_payments USING btree (next_payment_date);
CREATE INDEX IF NOT EXISTS idx_rent_payments_unpaid ON public.rental_payments USING btree (is_paid) WHERE (is_paid = false AND is_deleted = false);
CREATE INDEX IF NOT EXISTS idx_rent_payments_deleted ON public.rental_payments USING btree (is_deleted) WHERE (is_deleted = false);
