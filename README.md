# StellarReceivables

Harvest invoice financing protocol on Stellar. Smallholder farmers tokenize future crop yields as on-chain receivables and access instant working capital from DeFi liquidity providers via Soroban smart contracts.

## Stack

- **Smart Contract** — Soroban / Rust (`contracts/harvest-receivable/`)
- **Frontend** — Next.js 15 + React 19 + Tailwind 4
- **Database** — PostgreSQL (off-chain metadata)
- **Wallet** — Freighter / Stellar SDK

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Build & Test the Contract

```bash
cd contracts/harvest-receivable
cargo test
cargo build --target wasm32-unknown-unknown --release
```

### 3. Run the Frontend

```bash
cd frontend
cp .env.example .env.local   # fill in DATABASE_URL and CONTRACT_ID
npm install
npm run dev
```

## Contract API

| Function | Description |
|---|---|
| `create_receivable(farmer, crop_type, estimated_yield_kg, estimated_value, harvest_date, discount_rate_bps)` | Farmer tokenizes a future harvest |
| `fund_receivable(investor, receivable_id, amount)` | Investor escrows capital at a discount |
| `repay_receivable(farmer, receivable_id, amount)` | Farmer repays principal + yield |
| `mark_defaulted(receivable_id)` | Mark as defaulted after 7-day grace period |
| `get_receivable(id)` | Fetch a single receivable |
| `list_receivables_by_status(status)` | Filter by Created / Funded / Repaid / Defaulted |

## Pages

| Route | Description |
|---|---|
| `/` | Landing — hero, stats, how it works |
| `/dashboard` | Farmer — create receivables + status table |
| `/marketplace` | Investor — browse & fund receivables |
| `/portfolio` | Investor — KPIs, returns chart, positions |

## Design

- Dark background `#0a0f0d`, deep green `#0f3d2e`, amber `#f59e0b`
- Inter for UI text, JetBrains Mono for amounts/addresses
- Status pills: gray (Created) / blue (Funded) / green (Repaid) / red (Defaulted)
- Risk badges: green (≤33) / amber (34–66) / red (>66)
