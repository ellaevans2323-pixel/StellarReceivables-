import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const wallet = new URL(req.url).searchParams.get('wallet');
  if (wallet) {
    const { rows } = await pool.query(
      'SELECT * FROM farmers WHERE wallet_address = $1',
      [wallet]
    );
    return NextResponse.json(rows[0] ?? null);
  }
  const { rows } = await pool.query('SELECT * FROM farmers ORDER BY created_at DESC');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { wallet_address, full_name, location, phone_number, verification_status } = await req.json();
  const { rows } = await pool.query(
    `INSERT INTO farmers (wallet_address, full_name, location, phone_number, verification_status)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (wallet_address) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           location = EXCLUDED.location,
           phone_number = EXCLUDED.phone_number,
           verification_status = COALESCE(EXCLUDED.verification_status, farmers.verification_status)
     RETURNING *`,
    [wallet_address, full_name, location ?? null, phone_number ?? null, verification_status ?? 'unverified']
  );
  return NextResponse.json(rows[0], { status: 201 });
}
