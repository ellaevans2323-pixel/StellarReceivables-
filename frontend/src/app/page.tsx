import Link from 'next/link';

const stats = [
  { label: 'Farmers Financed',    value: '2,847' },
  { label: 'Capital Deployed',    value: '$4.2M' },
  { label: 'Avg Investor Yield',  value: '8.4%' },
  { label: 'Repayment Rate',      value: '96.2%' },
];

const steps = [
  {
    n: '01',
    title: 'Farmer Creates Receivable',
    desc: 'Tokenize your future harvest as an on-chain receivable with crop details, yield estimate, and discount rate.',
  },
  {
    n: '02',
    title: 'Investor Funds Receivable',
    desc: 'Liquidity providers browse the marketplace and fund receivables at a discount, earning yield at repayment.',
  },
  {
    n: '03',
    title: 'Harvest & Repayment',
    desc: 'After harvest, farmers repay principal + yield. The Soroban contract releases funds to the investor.',
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="text-center py-20 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1e3327] bg-[#111a14] text-xs text-[#6b9e7c]">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          Live on Stellar Testnet
        </div>
        <h1 className="text-5xl font-bold leading-tight">
          Harvest Invoice Financing<br />
          <span className="text-[#f59e0b]">Powered by Stellar</span>
        </h1>
        <p className="max-w-xl mx-auto text-[#6b9e7c] text-lg">
          Smallholder farmers tokenize future crop yields as receivables and access
          instant working capital from DeFi liquidity providers via Soroban smart contracts.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard"
            className="px-6 py-3 rounded-xl bg-[#f59e0b] text-[#0a0f0d] font-semibold hover:bg-[#b45309] transition-colors">
            Create Receivable
          </Link>
          <Link href="/marketplace"
            className="px-6 py-3 rounded-xl border border-[#1e3327] text-[#e8f5e9] hover:border-[#16a34a] transition-colors">
            Browse Marketplace
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-6 rounded-xl bg-[#111a14] border border-[#1e3327] text-center">
            <div className="text-3xl font-bold text-[#f59e0b] mono">{s.value}</div>
            <div className="text-sm text-[#6b9e7c] mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(s => (
            <div key={s.n} className="p-6 rounded-xl bg-[#111a14] border border-[#1e3327] space-y-3">
              <div className="text-4xl font-bold text-[#0f3d2e] mono">{s.n}</div>
              <h3 className="font-semibold text-[#e8f5e9]">{s.title}</h3>
              <p className="text-sm text-[#6b9e7c]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
