import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const res = await fetch(
    new URL(`/api/receivables/${id}`, req.url),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'repay', ...body }),
    }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
