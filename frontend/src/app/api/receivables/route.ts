import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const farmer   = searchParams.get('farmer');
  const investor = searchParams.get('investor');

  const conditions: string[] = [];
  const params: string[] = [];

  if (status)   { conditions.push(`status = $${params.push(status)}`); }
  if (farmer)   { conditions.push(`farmer_wallet = $${params.push(farmer)}`); }
  if (investor) { conditions.push(`investor_wallet = $${params.push(investor)}`); }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT * FROM receivables${where} ORDER BY created_at DESC`,
    params
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const {
    farmer_wallet, crop_type, estimated_yield_kg, estimated_value,
    harvest_date, discount_rate_bps, risk_score, location, crop_photo_url,
  } = await req.json();

  const { rows } = await pool.query(
    `INSERT INTO receivables
       (farmer_wallet, crop_type, estimated_yield_kg, estimated_value,
        harvest_date, discount_rate_bps, risk_score, location, crop_photo_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [farmer_wallet, crop_type, estimated_yield_kg, estimated_value,
     harvest_date, discount_rate_bps, risk_score ?? null, location ?? null, crop_photo_url ?? null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
