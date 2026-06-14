import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const wallet = new URL(req.url).searchParams.get('wallet');
  if (wallet) {
    const { rows } = await pool.query('SELECT * FROM farmers WHERE wallet = $1', [wallet]);
    return NextResponse.json(rows[0] ?? null);
  }
  const { rows } = await pool.query('SELECT * FROM farmers ORDER BY created_at DESC');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { wallet, name, location, bio, photo_url } = await req.json();
  const { rows } = await pool.query(
    `INSERT INTO farmers (wallet, name, location, bio, photo_url)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (wallet) DO UPDATE
       SET name = EXCLUDED.name, location = EXCLUDED.location,
           bio  = EXCLUDED.bio,  photo_url = EXCLUDED.photo_url
     RETURNING *`,
    [wallet, name, location ?? null, bio ?? null, photo_url ?? null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
