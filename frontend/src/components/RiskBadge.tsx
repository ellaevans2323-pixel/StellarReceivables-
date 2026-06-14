export default function RiskBadge({ score }: { score: number }) {
  const [label, cls] =
    score <= 33 ? ['Low Risk',  'bg-green-900 text-green-300'] :
    score <= 66 ? ['Med Risk',  'bg-amber-900 text-amber-300'] :
                  ['High Risk', 'bg-red-900 text-red-300'];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
