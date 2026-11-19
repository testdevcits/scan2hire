import DocumentStatusBadge from './DocumentStatusBadge';
import { FiFileText, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import Button from '../common/Button';
import CommonLoader from '../common/CommonLoader';
import EmptyState from '../common/EmptyState';

const types = { appointment_letter: 'Appointment Letter', hr_policy: 'HR Policy' };

export default function EmployeeSigningDocuments({ documents, loading, error, busy, onRefresh, onOpen, onDownload }) {
  const signed = Object.keys(types).filter(type => documents.some(doc => doc.type === type && ['done', 'awaiting_verification'].includes(doc.status))).length;
  return <section className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <div><h2 className="font-semibold text-gray-900 dark:text-white">Appointment Letter & HR Policy</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Read and sign every page. HR/Admin verifies your submission before Done.</p></div>
      <div className="flex items-center gap-3"><span className="text-xs font-medium text-gray-500 dark:text-gray-400">{signed}/2 signed</span><Button title="Refresh documents" variant="secondary" disabled={busy || loading} onClick={onRefresh} className="inline-flex !p-2"><FiRefreshCw /><span className="sr-only">Refresh documents</span></Button></div>
    </div>
    {loading ? <CommonLoader compact text="Loading your documents…" /> : error ? <EmptyState variant="error" text={error} action={<Button text="Try again" onClick={onRefresh} />} /> : !documents.length ? <EmptyState text="No documents assigned to you yet." action={<Button text="Refresh" variant="secondary" onClick={onRefresh} />} /> : <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Object.entries(types).map(([type, title]) => {
        const doc = documents.find(item => item.type === type);
        const done = doc?.status === 'done';
        const pending = ['pending', 'needs_correction'].includes(doc?.status);
        const submitted = doc?.status === 'awaiting_verification';
        return <div key={type} className="flex flex-wrap items-center gap-3 px-4 py-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-green-50 text-green-600 dark:bg-green-950/30' : 'bg-orange-50 text-[#f84525] dark:bg-orange-950/30'}`}>{done ? <FiCheckCircle size={19} /> : <FiFileText size={19} />}</div>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p><p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{done ? `Signed on ${new Date(doc.signedAt).toLocaleDateString()}` : submitted ? 'All pages signed · Waiting for HR/Admin approval' : pending ? `${doc.signedPages?.length || 0}/${doc.pageCount || '?'} pages signed${doc.status === 'needs_correction' ? ' · Correction requested' : ''}` : doc ? 'Request cancelled by HR' : 'HR has not uploaded this document yet'}</p></div>
          {doc ? <DocumentStatusBadge status={doc.status} /> : <span className="text-xs text-gray-400">Not uploaded</span>}
          {doc && <div className="flex w-full gap-2 pl-[52px] sm:w-auto sm:pl-0"><Button text={pending ? 'View & Sign' : 'View PDF'} variant={pending ? 'primary' : 'secondary'} disabled={busy} onClick={() => onOpen(doc, done)} className="text-xs" />{(done || submitted) && <Button text="Download PDF" variant="secondary" disabled={busy} onClick={() => onDownload(doc)} className="text-xs" />}</div>}
        </div>;
      })}
    </div>}
  </section>;
}
