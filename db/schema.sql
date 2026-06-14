CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE farmers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet     TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  location   TEXT,
  bio        TEXT,
  photo_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE receivables (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  on_chain_id        BIGINT UNIQUE,
  farmer_wallet      TEXT NOT NULL REFERENCES farmers(wallet),
  crop_type          TEXT NOT NULL,
  estimated_yield_kg INTEGER NOT NULL,
  estimated_value    NUMERIC(18,7) NOT NULL,
  harvest_date       DATE NOT NULL,
  discount_rate_bps  INTEGER NOT NULL,
  status             TEXT NOT NULL DEFAULT 'Created'
                       CHECK (status IN ('Created','Funded','Repaid','Defaulted')),
  risk_score         SMALLINT CHECK (risk_score BETWEEN 1 AND 100),
  crop_photo_url     TEXT,
  location           TEXT,
  funded_amount      NUMERIC(18,7),
  investor_wallet    TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON receivables(status);
CREATE INDEX ON receivables(farmer_wallet);

CREATE TABLE investments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receivable_id   UUID NOT NULL REFERENCES receivables(id),
  investor_wallet TEXT NOT NULL,
  amount          NUMERIC(18,7) NOT NULL,
  expected_return NUMERIC(18,7),
  invested_at     TIMESTAMPTZ DEFAULT NOW()
);
