import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  const [investorRes, positionsRes] = await Promise.all([
    pool.query(
      'SELECT * FROM investors WHERE wallet_address = $1',
      [address]
    ),
    pool.query(
      `SELECT rm.*, inv.amount AS invested_amount, inv.expected_return, inv.invested_at,
              f.full_name AS farmer_name, f.location AS farmer_location
       FROM investments inv
       JOIN receivables_metadata rm ON rm.id = inv.receivable_id
       JOIN farmers f ON f.id = rm.farmer_id
       WHERE inv.investor_wallet = $1
       ORDER BY inv.invested_at DESC`,
      [address]
    ),
  ]);

  const investor = investorRes.rows[0] ?? { wallet_address: address, total_invested: 0 };
  const positions = positionsRes.rows;

  const totalExpectedReturn = positions.reduce(
    (s: number, p: { expected_return: string }) => s + Number(p.expected_return ?? 0), 0
  );
  const totalInvested = positions.reduce(
    (s: number, p: { invested_amount: string }) => s + Number(p.invested_amount ?? 0), 0
  );

  return NextResponse.json({
    investor,
    positions,
    summary: {
      total_invested: totalInvested,
      total_expected_return: totalExpectedReturn,
      active_count: positions.filter((p: { status: string }) => p.status === 'Funded').length,
      repaid_count: positions.filter((p: { status: string }) => p.status === 'Repaid').length,
    },
  });
}
