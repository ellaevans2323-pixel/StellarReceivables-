import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { rows } = await pool.query('SELECT * FROM receivables WHERE id = $1', [id]);
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action, investor_wallet, amount } = await req.json();

  if (action !== 'fund') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE receivables
     SET status = 'Funded', investor_wallet = $1, funded_amount = $2, updated_at = NOW()
     WHERE id = $3 AND status = 'Created'
     RETURNING *`,
    [investor_wallet, amount, id]
  );
  if (!rows.length) return NextResponse.json({ error: 'Cannot fund' }, { status: 400 });

  const r = rows[0];
  await pool.query(
    `INSERT INTO investments (receivable_id, investor_wallet, amount, expected_return)
     VALUES ($1,$2,$3,$4)`,
    [id, investor_wallet, amount, amount * (1 + r.discount_rate_bps / 10_000)]
  );
  return NextResponse.json(r);
}
