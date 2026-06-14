CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Farmers (off-chain profile)
CREATE TABLE farmers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address      TEXT UNIQUE NOT NULL,
  full_name           TEXT NOT NULL,
  location            TEXT,
  phone_number        TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                        CHECK (verification_status IN ('unverified','pending','verified')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- On-chain receivable mirror + off-chain metadata
CREATE TABLE receivables_metadata (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_receivable_id BIGINT UNIQUE,          -- Soroban on-chain id
  farmer_id             UUID NOT NULL REFERENCES farmers(id),
  crop_type             TEXT NOT NULL,
  estimated_yield_kg    INTEGER NOT NULL,
  estimated_value       NUMERIC(18,7) NOT NULL,  -- XLM
  harvest_date          DATE NOT NULL,
  discount_rate_bps     INTEGER NOT NULL,
  status                TEXT NOT NULL DEFAULT 'Created'
                          CHECK (status IN ('Created','Funded','Repaid','Defaulted')),
  farm_location         TEXT,
  photo_urls            TEXT[],                  -- array of image URLs
  risk_score            SMALLINT CHECK (risk_score BETWEEN 1 AND 100),
  funded_amount         NUMERIC(18,7),
  investor_wallet       TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON receivables_metadata(status);
CREATE INDEX ON receivables_metadata(farmer_id);

-- Investors (off-chain aggregate)
CREATE TABLE investors (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  total_invested NUMERIC(18,7) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Individual investment records
CREATE TABLE investments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receivable_id   UUID NOT NULL REFERENCES receivables_metadata(id),
  investor_wallet TEXT NOT NULL,
  amount          NUMERIC(18,7) NOT NULL,
  expected_return NUMERIC(18,7),
  invested_at     TIMESTAMPTZ DEFAULT NOW()
);
