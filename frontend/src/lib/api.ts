const API = '/api';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchReceivables(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return json(await fetch(`${API}/receivables${qs}`));
}

export async function fetchFarmerReceivables(wallet: string) {
  return json(await fetch(`${API}/receivables?farmer=${encodeURIComponent(wallet)}`));
}

export async function createReceivable(data: Record<string, unknown>) {
  return json(
    await fetch(`${API}/receivables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  );
}

export async function fundReceivable(id: string, investor_wallet: string, amount: number) {
  return json(
    await fetch(`${API}/receivables/${id}/fund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investor_wallet, amount }),
    })
  );
}

export async function repayReceivable(id: string, farmer_wallet: string) {
  return json(
    await fetch(`${API}/receivables/${id}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmer_wallet }),
    })
  );
}

export async function fetchPortfolio(wallet: string) {
  return json(await fetch(`${API}/investors/${encodeURIComponent(wallet)}/portfolio`));
}

export async function upsertFarmer(data: Record<string, unknown>) {
  return json(
    await fetch(`${API}/farmers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  );
}
