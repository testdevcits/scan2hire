import EmployeeSigningDocuments from './EmployeeSigningDocuments';
import { FiDownload, FiEdit2, FiClock, FiX } from 'react-icons/fi';
import DocumentTableCell from './DocumentTableCell';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import CommonModal from '../common/CommonModal';
import CommonTable from '../common/CommonTable';
import CustomDropdown from '../common/CustomDropdown';
import InputField from '../common/InputField';
import FileUploadField from '../common/FileUploadField';
import Button from '../common/Button';

const labels = { appointment_letter: 'Appointment Letter', hr_policy: 'HR Policy' };
const consent = 'I have read this document and agree to its contents. I consent to signing it electronically.';
const fileData = file => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
});

export default function DocumentSigningList({ managed = false }) {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const isHr = user?.role === 'hr';
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('appointment_letter');
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState({});
  const [preview, setPreview] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const canvas = useRef(null);
  const drawing = useRef(false);
  const previewUrl = useRef(null);
  const [editTarget, setEditTarget] = useState(null);
  const [history, setHistory] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await API.get('/documents');
      setDocuments(result.data.data || []);
    } catch (err) { setError(err.response?.data?.message || 'Unable to load documents'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!managed || !isHr) return;
    API.get('/hr/employees').then(res => setEmployees(res.data.data || [])).catch(() => setError('Unable to load employees. Please refresh.'));
  }, [managed, isHr]);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);

  const close = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null; setPreview(null); setAccepted(false); setDrawn(false); drawing.current = false;
  };
  const open = async (doc, signed = false, version = null) => {
    setBusy(true);
    try {
      const res = await API.get(`/documents/${doc._id}/file`, { params: { signed, ...(version ? { version: version._id } : {}) }, responseType: 'blob' });
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      previewUrl.current = url; setAccepted(false); setDrawn(false); setHistory(null); setPreview({ doc: version ? { ...doc, ...version, status: 'archived' } : doc, signed, url });
    } catch { toast.error('Unable to open document'); }
    finally { setBusy(false); }
  };
  const downloadSigned = async doc => {
    setBusy(true);
    try {
      const res = await API.get(`/documents/${doc._id}/file`, { params: { signed: true }, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      const employee = String(doc.employee?.employeeId || doc.employee?.name || 'employee').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.download = `${employee}-${doc.type}-signed.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error('Unable to download signed PDF. Please try again.'); }
    finally { setBusy(false); }
  };
  const upload = async e => {
    e.preventDefault();
    if (!employeeId) return toast.error('Select an employee');
    const selected = editTarget ? [[type, file]] : Object.keys(labels).filter(key => !employeeDocuments.some(doc => doc.type === key)).map(key => [key, files[key]]);
    if (!selected.length) return toast.error('Both documents already exist. Use Update on the existing entry.');
    if (selected.some(([, pdf]) => !pdf || pdf.size > 5 * 1024 * 1024 || !pdf.name.toLowerCase().endsWith('.pdf'))) return toast.error('Select both required PDFs, each up to 5 MB');
    setBusy(true);
    let saved = 0;
    try {
      // Read all files before sending so a local read failure cannot partially submit the form.
      const payloads = await Promise.all(selected.map(async ([documentType, pdf]) => ({ employeeId, type: documentType, filename: pdf.name, dataUri: await fileData(pdf), updatedAt: editTarget?.updatedAt })));
      for (const payload of payloads) {
        if (editTarget) await API.patch(`/documents/${editTarget._id}`, payload);
        else await API.post('/documents', payload);
        saved += 1;
      }
      setFile(null); setFiles({}); setUploadOpen(false); setEmployeeId('');
      toast.success(editTarget ? 'Document updated and sent for signature' : 'Documents sent to employee for signature');
    } catch (err) {
      toast.error(saved ? 'One document was saved. Submit again to send the remaining PDF.' : err.response?.data?.message || 'Upload failed');
    } finally { await load(); setBusy(false); }
  };
  const position = e => {
    const rect = canvas.current.getBoundingClientRect();
    return [(e.clientX - rect.left) * canvas.current.width / rect.width, (e.clientY - rect.top) * canvas.current.height / rect.height];
  };
  const start = e => {
    if (busy) return;
    e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true;
    const ctx = canvas.current.getContext('2d'); const [x, y] = position(e);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.strokeStyle = '#111827'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  };
  const move = e => {
    if (!drawing.current) return;
    const ctx = canvas.current.getContext('2d'); ctx.lineTo(...position(e)); ctx.stroke(); setDrawn(true);
  };
  const sign = async () => {
    if (!accepted || !drawn) return;
    setBusy(true);
    try {
      await API.post(`/documents/${preview.doc._id}/sign`, { accepted, signature: canvas.current.toDataURL('image/png'), originalHash: preview.doc.originalHash, revision: preview.doc.revision || 1 });
      close(); toast.success('Document signed successfully'); await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to sign'); }
    finally { setBusy(false); }
  };
  const cancel = async doc => {
    setBusy(true);
    try { await API.post(`/documents/${doc._id}/cancel`); setCancelTarget(null); toast.success('Request cancelled'); await load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Unable to cancel'); }
    finally { setBusy(false); }
  };
  const employeeDocuments = documents.filter(doc => String(doc.employee?._id || doc.employee) === employeeId);
  const edit = doc => { setEditTarget(doc); setEmployeeId(String(doc.employee?._id || doc.employee)); setType(doc.type); setFile(null); setUploadOpen(true); };
  const showHistory = async doc => {
    setBusy(true);
    try { const res = await API.get(`/documents/${doc._id}/history`); setHistory({ doc, rows: res.data.data || [] }); }
    catch { toast.error('Unable to load document history'); }
    finally { setBusy(false); }
  };
  const groups = Object.values(documents.reduce((result, doc) => {
    const key = String(doc.employee?._id || doc.employee || doc._id);
    if (!result[key]) result[key] = { _id: key, employee: doc.employee, documents: [] };
    result[key].documents.push(doc);
    return result;
  }, {})).map(group => ({ ...group, status: Object.keys(labels).every(key => group.documents.some(doc => doc.type === key && doc.status === 'done')) ? 'done' : group.documents.every(doc => doc.status === 'cancelled') ? 'cancelled' : 'pending' }));
  const visible = groups.filter(group => (filter === 'all' || group.status === filter) && `${group.employee?.name || ''} ${group.employee?.employeeId || ''} ${group.documents.map(doc => `${labels[doc.type]} ${doc.filename}`).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const canSign = preview && !managed && preview.doc.status === 'pending' && !preview.signed;
  const documentCell = (row, documentType) => {
    const doc = row.documents.find(item => item.type === documentType);
    return <DocumentTableCell document={doc} onView={() => open(doc, doc.status === 'done')} busy={busy} />;
  };
  const columns = [
    ...(managed ? [{ accessor: 'employee', header: 'Employee', headerClassName: 'w-[28%]', cellClassName: '!py-2 !align-middle', render: (_, row) => <div className="min-w-0"><p className="truncate text-sm font-semibold" title={row.employee?.name}>{row.employee?.name || 'Employee unavailable'}</p><p className="text-[11px] text-gray-500">{row.employee?.employeeId}</p></div> }] : []),
    ...Object.entries(labels).map(([key, label]) => ({ accessor: key, header: label, headerClassName: managed ? 'w-[26%]' : 'w-[36%]', cellClassName: '!py-2 !align-middle', render: (_, row) => documentCell(row, key) })),
    { accessor: 'status', header: 'Overall Status', headerClassName: managed ? 'w-[20%]' : 'w-[28%]', cellClassName: '!py-2 !align-middle', render: value => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${value === 'done' ? 'bg-green-100 text-green-800' : value === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>{value === 'done' ? 'Done' : value === 'pending' ? 'Pending' : 'Cancelled'}</span> },
  ];
  return <section className="space-y-5 dark:text-white">
    {managed && <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm bg-white p-5 shadow-sm dark:bg-gray-900">
      <div><h1 className="text-xl font-bold">{managed ? 'Documents & Signatures' : 'Documents to Sign'}</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{managed ? 'Send appointment letters and HR policies. Track employee signatures here.' : 'Open your document, read it and sign. Completed copies stay available here.'}</p></div>
      {managed && isHr && <Button text="+ Add Employee Documents" onClick={() => { setEditTarget(null); setEmployeeId(''); setFile(null); setFiles({}); setUploadOpen(true); }} disabled={busy} />}
    </div>}
    {!managed && <EmployeeSigningDocuments documents={documents} loading={loading} error={error} busy={busy} onRefresh={load} onOpen={open} onDownload={downloadSigned} />}
    {managed && <CommonTable tableClassName="table-fixed min-w-[640px]" mobileLayout="stack" columns={columns} data={visible} loading={loading} loadingText="Loading documents…" error={error} errorAction={<Button text="Try again" onClick={load} variant="secondary" />} emptyText={filter === 'pending' ? 'No pending signatures. You are all caught up.' : 'No documents found.'}
      toolbar={<div className="space-y-2 border-b border-gray-100 p-3 dark:border-gray-800">
        <div className="flex flex-wrap gap-2">{[['all', 'All'], ['pending', 'Pending'], ['done', 'Done'], ['cancelled', 'Cancelled']].map(([key, label]) => <Button key={key} text={`${label} (${key === 'all' ? groups.length : groups.filter(group => group.status === key).length})`} variant={filter === key ? 'primary' : 'secondary'} onClick={() => setFilter(key)} className="text-sm" />)}</div>
        <div className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1 sm:max-w-md"><InputField label="Search documents" name="documentSearch" placeholder={managed ? 'Employee name, ID or document…' : 'Document name…'} value={search} onChange={e => setSearch(e.target.value)} /></div><Button text="Refresh" variant="secondary" disabled={loading || busy} onClick={load} /></div>
      </div>}
    />}
    {uploadOpen && <CommonModal title={editTarget ? `Update ${labels[type]}` : 'Add employee documents'} subtitle={editTarget ? 'Upload a replacement PDF. The previous copy stays in history.' : 'Select an employee once and upload both PDFs together.'} className="max-w-2xl" as="form" onSubmit={upload} onClose={() => { if (!busy) setUploadOpen(false); }} footer={<><Button text="Back" variant="secondary" disabled={busy} onClick={() => setUploadOpen(false)} /><Button text={editTarget ? 'Update & Request Signature' : 'Send Documents'} type="submit" loading={busy} disabled={!employeeId || (editTarget ? !file : !Object.keys(labels).some(key => !employeeDocuments.some(doc => doc.type === key)) || Object.keys(labels).some(key => !employeeDocuments.some(doc => doc.type === key) && !files[key]))} /></>}>
      <div className="space-y-5">
        <CustomDropdown label="Employee" searchable required disabled={busy || Boolean(editTarget)} value={employeeId} onChange={value => { setEmployeeId(value); setFiles({}); }} placeholder="Search and select an employee" options={employees.map(emp => ({ value: emp._id, label: `${emp.name} (${emp.employeeId || emp.email})` }))} portalMenu />
        {editTarget ? <FileUploadField label={labels[type]} name="replacementDocument" accept=".pdf,application/pdf" hint="PDF only · Maximum 5 MB" required disabled={busy} fileName={file?.name} onChange={e => setFile(e.target.files?.[0] || null)} /> : <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(labels).map(([key, label]) => {
            const current = employeeDocuments.find(doc => doc.type === key);
            return current ? <div key={key} className="rounded-sm border border-gray-200 p-4 dark:border-gray-700"><p className="font-semibold">{label}</p><p className="my-2 text-sm text-gray-500">Already added for this employee.</p><Button text="Update PDF" variant="secondary" onClick={() => edit(current)} disabled={busy} /></div> : <FileUploadField key={`${employeeId}-${key}`} label={label} name={key} accept=".pdf,application/pdf" hint="PDF only · Maximum 5 MB" required disabled={busy || !employeeId} fileName={files[key]?.name} onChange={e => setFiles(currentFiles => ({ ...currentFiles, [key]: e.target.files?.[0] || null }))} />;
          })}
        </div>}
        <p className="rounded-sm bg-orange-50 p-3 text-sm text-orange-900 dark:bg-orange-950/30 dark:text-orange-200">{editTarget ? 'Only this document returns to Pending. Previous signed copies stay in History.' : 'One employee, one entry. Each PDF is signed separately. Overall status becomes Done when both are signed.'}</p>
      </div>
    </CommonModal>}
    {history && <CommonModal title="Document history" subtitle={labels[history.doc.type]} className="max-w-2xl" onClose={() => setHistory(null)}>
      <CommonTable data={history.rows} columns={[
        { accessor: 'revision', header: 'Version', render: value => value || 1 },
        { accessor: 'filename', header: 'File' },
        { accessor: 'status', header: 'Status' },
        { accessor: 'signedAt', header: 'Signed on', render: value => value ? new Date(value).toLocaleString() : '—' },
        { accessor: '_id', header: 'Copies', render: (_, version) => <div className="flex flex-wrap gap-2"><Button text="Original" variant="secondary" disabled={busy} onClick={() => open(history.doc, false, version)} />{version.status === 'done' && <Button text="Signed Copy" variant="success" disabled={busy} onClick={() => open(history.doc, true, version)} />}</div> },
      ]} emptyText="No previous versions." />
    </CommonModal>}
    {cancelTarget && <CommonModal title="Cancel signature request?" className="max-w-md" onClose={() => { if (!busy) setCancelTarget(null); }} footer={<><Button text="Keep Request" variant="secondary" disabled={busy} onClick={() => setCancelTarget(null)} /><Button text="Cancel Request" variant="danger" loading={busy} onClick={() => cancel(cancelTarget)} /></>}>
      <p className="text-sm text-gray-600 dark:text-gray-300">{labels[cancelTarget.type]} for {cancelTarget.employee?.name || 'this employee'} will no longer be available for signing. You can send a new document later.</p>
    </CommonModal>}
    {preview && <CommonModal title={`${labels[preview.doc.type]}${preview.signed ? ' · Signed copy' : ''}`} subtitle={canSign ? '1. Read the document → 2. Draw your signature → 3. Confirm' : preview.doc.filename} className="max-w-4xl" bodyClassName="space-y-4" onClose={() => { if (!busy) close(); }} footer={<>
      <a href={preview.url} download={`${preview.signed ? 'signed-' : ''}${preview.doc.filename}`} className="mr-auto inline-flex items-center rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200">Download PDF</a>
      <Button text="Close" variant="secondary" disabled={busy} onClick={close} />
      {canSign && <Button text="Confirm & Sign" loading={busy} disabled={!accepted || !drawn} onClick={sign} />}
    </>}>
      {preview.doc.status !== 'archived' && <div className="flex flex-wrap items-center gap-2">
        {preview.doc.status === 'done' && <Button text={preview.signed ? 'View Original' : 'View Signed PDF'} variant="secondary" disabled={busy} onClick={() => open(preview.doc, !preview.signed)} className="text-xs" />}
        {managed && preview.doc.status === 'done' && <Button disabled={busy} onClick={() => downloadSigned(preview.doc)} className="inline-flex items-center gap-1.5 text-xs"><FiDownload />Download Signed PDF</Button>}
        {managed && isHr && <Button variant="secondary" disabled={busy} onClick={() => { const doc = preview.doc; close(); edit(doc); }} className="inline-flex items-center gap-1.5 text-xs"><FiEdit2 />Update PDF</Button>}
        {(preview.doc.revision || 1) > 1 && <Button variant="secondary" disabled={busy} onClick={() => { const doc = preview.doc; close(); showHistory(doc); }} className="inline-flex items-center gap-1.5 text-xs"><FiClock />History</Button>}
        {managed && isHr && preview.doc.status === 'pending' && <Button variant="secondary" disabled={busy} onClick={() => { const doc = preview.doc; close(); setCancelTarget(doc); }} className="inline-flex items-center gap-1.5 text-xs !text-red-600"><FiX />Cancel Request</Button>}
      </div>}
      <iframe title="Document PDF" src={preview.url} className="h-[45vh] w-full rounded-sm border bg-white dark:border-gray-700" />
      {canSign && <div className="space-y-3 rounded-sm border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Your signature</h3><p className="text-xs text-gray-500 dark:text-gray-400">Draw with your mouse or finger inside the box.</p></div><Button text="Clear" variant="secondary" disabled={busy} onClick={() => { canvas.current.getContext('2d').clearRect(0, 0, 700, 180); setDrawn(false); }} className="text-xs" /></div>
        <canvas ref={canvas} width={700} height={180} aria-label="Draw your signature" onPointerDown={start} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} className="signature-pad w-full touch-none rounded-sm border-2 border-dashed border-gray-300" />
        <label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={accepted} disabled={busy} onChange={e => setAccepted(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#f84525]" />{consent}</label>
        <p className="text-xs text-gray-500 dark:text-gray-400">Your signature and signing date will be attached to the PDF. Signing cannot be undone.</p>
      </div>}
    </CommonModal>}
  </section>;
}
