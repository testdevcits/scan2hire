import { FiFileText, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import Button from '../common/Button';
import CommonLoader from '../common/CommonLoader';
import EmptyState from '../common/EmptyState';

const types = { appointment_letter: 'Appointment Letter', hr_policy: 'HR Policy' };

export default function EmployeeSigningDocuments({ documents, loading, error, busy, onRefresh, onOpen, onDownload }) {
  const signed = Object.keys(types).filter(type => documents.some(doc => doc.type === type && doc.status === 'done')).length;
  return <section className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <div><h2 className="font-semibold text-gray-900 dark:text-white">Appointment Letter & HR Policy</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Read each PDF and sign to complete your documents.</p></div>
      <div className="flex items-center gap-3"><span className="text-xs font-medium text-gray-500 dark:text-gray-400">{signed}/2 signed</span><Button title="Refresh documents" variant="secondary" disabled={busy || loading} onClick={onRefresh} className="inline-flex !p-2"><FiRefreshCw /><span className="sr-only">Refresh documents</span></Button></div>
    </div>
    {loading ? <CommonLoader compact text="Loading your documents…" /> : error ? <EmptyState variant="error" text={error} action={<Button text="Try again" onClick={onRefresh} />} /> : <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Object.entries(types).map(([type, title]) => {
        const doc = documents.find(item => item.type === type);
        const done = doc?.status === 'done';
        const pending = doc?.status === 'pending';
        return <div key={type} className="flex flex-wrap items-center gap-3 px-4 py-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-green-50 text-green-600 dark:bg-green-950/30' : 'bg-orange-50 text-[#f84525] dark:bg-orange-950/30'}`}>{done ? <FiCheckCircle size={19} /> : <FiFileText size={19} />}</div>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p><p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{done ? `Signed on ${new Date(doc.signedAt).toLocaleDateString()}` : pending ? 'Your signature is required' : doc ? 'Request cancelled by HR' : 'HR has not uploaded this document yet'}</p></div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${done ? 'bg-green-100 text-green-800' : pending ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{done ? 'Done' : pending ? 'Pending' : doc ? 'Cancelled' : 'Not uploaded'}</span>
          {doc && <div className="flex w-full gap-2 pl-[52px] sm:w-auto sm:pl-0"><Button text={pending ? 'View & Sign' : 'View PDF'} variant={pending ? 'primary' : 'secondary'} disabled={busy} onClick={() => onOpen(doc, done)} className="text-xs" />{done && <Button text="Download PDF" variant="secondary" disabled={busy} onClick={() => onDownload(doc)} className="text-xs" />}</div>}
        </div>;
      })}
    </div>}
  </section>;
}
