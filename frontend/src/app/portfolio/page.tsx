'use client';
import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getWallet, connectWallet } from '@/lib/stellar';
import { fetchPortfolio } from '@/lib/api';
import StatusPill from '@/components/StatusPill';
import RiskBadge from '@/components/RiskBadge';

interface Position {
  id: string;
  crop_type: string;
  harvest_date: string;
  discount_rate_bps: number;
  invested_amount: number;
  expected_return: number;
  status: string;
  risk_score: number;
  farm_location: string | null;
  farmer_name: string;
}

interface Summary {
  total_invested: number;
  total_expected_return: number;
  active_count: number;
  repaid_count: number;
}

export default function PortfolioPage() {
  const [wallet, setWallet]   = useState<string | null>(null);
  const [positions, setPos]   = useState<Position[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const load = useCallback(async (w: string) => {
    const data = await fetchPortfolio(w) as { positions: Position[]; summary: Summary };
    setPos(data.positions);
    setSummary(data.summary);
  }, []);

  useEffect(() => {
    getWallet().then(w => { if (w) { setWallet(w); load(w); } });
  }, [load]);

  const kpis = summary ? [
    { label: 'Total Invested',    value: `${Number(summary.total_invested).toLocaleString()} XLM` },
    { label: 'Expected Returns',  value: `${Number(summary.total_expected_return).toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM` },
    { label: 'Active Positions',  value: String(summary.active_count) },
    { label: 'Repaid',            value: String(summary.repaid_count) },
  ] : [];

  const chartData = [
    { date: 'Now', value: 0 },
    ...positions
      .filter(p => p.invested_amount)
      .sort((a, b) => new Date(a.harvest_date).getTime() - new Date(b.harvest_date).getTime())
      .reduce<{ date: string; value: number }[]>((acc, p) => {
        const prev = acc[acc.length - 1].value;
        const gain = Number(p.invested_amount) * p.discount_rate_bps / 10_000;
        acc.push({
          date: new Date(p.harvest_date).toLocaleDateString('en', { month: 'short', year: '2-digit' }),
          value: +(prev + gain).toFixed(2),
        });
        return acc;
      }, [{ date: 'Now', value: 0 }]).slice(1),
  ];

  if (!wallet) return (
    <div className="text-center py-20 space-y-4">
      <p className="text-[#6b9e7c]">Connect your wallet to view your portfolio.</p>
      <button
        onClick={() => connectWallet().then(w => { if (w) { setWallet(w); load(w); } })}
        className="px-6 py-3 rounded-xl bg-[#f59e0b] text-[#0a0f0d] font-semibold hover:bg-[#b45309] transition-colors">
        Connect Wallet
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Investor Portfolio</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="p-5 rounded-xl bg-[#111a14] border border-[#1e3327]">
            <div className="text-xs text-[#6b9e7c] mb-1">{k.label}</div>
            <div className="text-2xl font-bold mono text-[#f59e0b]">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Returns Chart */}
      {chartData.length > 1 && (
        <div className="p-5 rounded-xl bg-[#111a14] border border-[#1e3327]">
          <h2 className="text-sm font-medium text-[#6b9e7c] mb-4">Expected Returns Over Time (XLM)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#6b9e7c', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b9e7c', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111a14', border: '1px solid #1e3327', borderRadius: 8 }}
                labelStyle={{ color: '#e8f5e9' }}
                itemStyle={{ color: '#f59e0b' }}
              />
              <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Positions Table */}
      <div className="rounded-xl border border-[#1e3327] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#111a14] text-[#6b9e7c] text-xs uppercase">
            <tr>
              {['Crop', 'Farmer', 'Location', 'Invested (XLM)', 'Expected Return', 'Harvest', 'Status', 'Risk'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3327]">
            {positions.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-[#6b9e7c]">No positions yet</td></tr>
            )}
            {positions.map(p => (
              <tr key={p.id} className="hover:bg-[#111a14]/50">
                <td className="px-4 py-3 font-medium">{p.crop_type}</td>
                <td className="px-4 py-3 text-[#6b9e7c]">{p.farmer_name}</td>
                <td className="px-4 py-3 text-[#6b9e7c]">{p.farm_location ?? '—'}</td>
                <td className="px-4 py-3 mono">{Number(p.invested_amount).toLocaleString()}</td>
                <td className="px-4 py-3 mono text-[#f59e0b]">{Number(p.expected_return).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">{new Date(p.harvest_date).toLocaleDateString()}</td>
                <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                <td className="px-4 py-3"><RiskBadge score={p.risk_score ?? 50} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
