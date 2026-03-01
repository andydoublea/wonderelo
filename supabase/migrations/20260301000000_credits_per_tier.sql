-- Change credits table from single-row-per-user to one-row-per-tier
-- This allows users to have credits at different capacity tiers simultaneously
-- e.g. 2 credits at 50-participant tier AND 3 credits at 200-participant tier

-- Drop the old primary key (user_id only)
ALTER TABLE credits DROP CONSTRAINT credits_pkey;

-- Add composite primary key (user_id + capacity_tier)
ALTER TABLE credits ADD PRIMARY KEY (user_id, capacity_tier);
