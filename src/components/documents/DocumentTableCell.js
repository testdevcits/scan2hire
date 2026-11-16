import { FiEye } from 'react-icons/fi';
import Button from '../common/Button';

export default function DocumentTableCell({ document, onView, busy }) {
  if (!document) return <span className="text-xs text-gray-400">Not uploaded</span>;
  const status = document.status;
  return <div className="flex items-center gap-2">
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status === 'done' ? 'bg-green-100 text-green-800' : status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>{status === 'done' ? 'Done' : status === 'pending' ? 'Pending' : 'Cancelled'}</span>
    <Button disabled={busy} title="View document" variant="secondary" onClick={onView} className="inline-flex h-7 w-7 items-center justify-center !p-0"><FiEye size={15} /><span className="sr-only">View document</span></Button>
  </div>;
}
