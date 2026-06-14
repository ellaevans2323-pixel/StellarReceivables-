import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { rows } = await pool.query(
    `SELECT rm.*, f.wallet_address AS farmer_wallet, f.full_name AS farmer_name
     FROM receivables_metadata rm
     JOIN farmers f ON f.id = rm.farmer_id
     WHERE rm.id = $1`,
    [id]
  );
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action, investor_wallet, amount, farmer_wallet } = await req.json();

  if (action === 'fund') {
    const { rows } = await pool.query(
      `UPDATE receivables_metadata
       SET status = 'Funded', investor_wallet = $1, funded_amount = $2, updated_at = NOW()
       WHERE id = $3 AND status = 'Created'
       RETURNING *`,
      [investor_wallet, amount, id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Cannot fund' }, { status: 400 });

    const r = rows[0];
    const expected = amount * (1 + r.discount_rate_bps / 10_000);
    await pool.query(
      `INSERT INTO investments (receivable_id, investor_wallet, amount, expected_return)
       VALUES ($1,$2,$3,$4)`,
      [id, investor_wallet, amount, expected]
    );
    // Upsert investor aggregate
    await pool.query(
      `INSERT INTO investors (wallet_address, total_invested)
       VALUES ($1, $2)
       ON CONFLICT (wallet_address) DO UPDATE
         SET total_invested = investors.total_invested + EXCLUDED.total_invested`,
      [investor_wallet, amount]
    );
    return NextResponse.json(r);
  }

  if (action === 'repay') {
    const { rows } = await pool.query(
      `UPDATE receivables_metadata
       SET status = 'Repaid', updated_at = NOW()
       WHERE id = $1 AND status = 'Funded'
         AND farmer_id = (SELECT id FROM farmers WHERE wallet_address = $2)
       RETURNING *`,
      [id, farmer_wallet]
    );
    if (!rows.length) return NextResponse.json({ error: 'Cannot repay' }, { status: 400 });
    return NextResponse.json(rows[0]);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
