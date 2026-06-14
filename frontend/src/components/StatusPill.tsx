const map: Record<string, string> = {
  Created:   'bg-gray-700 text-gray-300',
  Funded:    'bg-blue-900 text-blue-300',
  Repaid:    'bg-green-900 text-green-300',
  Defaulted: 'bg-red-900 text-red-300',
};

export default function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? map.Created}`}>
      {status}
    </span>
  );
}
