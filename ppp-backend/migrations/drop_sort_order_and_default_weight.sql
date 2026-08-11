-- Migration script to remove sort_order and default_weight columns from tracking_item_types table

ALTER TABLE public.tracking_item_types 
    DROP COLUMN IF EXISTS sort_order;

ALTER TABLE public.tracking_item_types 
    DROP COLUMN IF EXISTS default_weight;
