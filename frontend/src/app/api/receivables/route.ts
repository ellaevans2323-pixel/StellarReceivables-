import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const farmer   = searchParams.get('farmer');   // wallet_address
  const investor = searchParams.get('investor'); // wallet_address

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status)   { conditions.push(`rm.status = $${params.push(status)}`); }
  if (farmer)   { conditions.push(`f.wallet_address = $${params.push(farmer)}`); }
  if (investor) { conditions.push(`rm.investor_wallet = $${params.push(investor)}`); }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT rm.*, f.wallet_address AS farmer_wallet, f.full_name AS farmer_name, f.verification_status
     FROM receivables_metadata rm
     JOIN farmers f ON f.id = rm.farmer_id${where}
     ORDER BY rm.created_at DESC`,
    params
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const {
    farmer_wallet, crop_type, estimated_yield_kg, estimated_value,
    harvest_date, discount_rate_bps, risk_score, farm_location, photo_urls,
  } = await req.json();

  // Resolve farmer_id from wallet_address
  const { rows: fr } = await pool.query(
    'SELECT id FROM farmers WHERE wallet_address = $1',
    [farmer_wallet]
  );
  if (!fr.length) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

  const { rows } = await pool.query(
    `INSERT INTO receivables_metadata
       (farmer_id, crop_type, estimated_yield_kg, estimated_value,
        harvest_date, discount_rate_bps, risk_score, farm_location, photo_urls)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [fr[0].id, crop_type, estimated_yield_kg, estimated_value,
     harvest_date, discount_rate_bps, risk_score ?? null,
     farm_location ?? null, photo_urls ?? null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
