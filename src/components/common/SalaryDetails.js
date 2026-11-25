import { useEffect, useRef, useState } from 'react';
import { useApi } from '../../contexts/ApiContext';
import CommonModal from './CommonModal';
import Button from './Button';
export default function SalaryDetails() {
  const { API } = useApi();
  const generation = useRef({ value: 0 });
  const [details, setDetails] = useState(null), [open, setOpen] = useState(false), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const hide = () => { generation.current.value++; setDetails(null); setPassword(''); setOpen(false); setError(''); };
  useEffect(() => {
    const requestGeneration = generation.current;
    const conceal = () => { if (document.hidden) hide(); };
    document.addEventListener('visibilitychange', conceal);
    return () => { requestGeneration.value++; document.removeEventListener('visibilitychange', conceal); };
  }, []);
  useEffect(() => { if (!details) return; const timer = setTimeout(hide, 60000); return () => clearTimeout(timer); }, [details]);
  const reveal = async event => {
    event.preventDefault(); const request = ++generation.current.value; setBusy(true); setError('');
    try { const res = await API.post('/employees/me/salary/reveal', { password }); if (request === generation.current.value) { setDetails(res.data.data); setOpen(false); } }
    catch (err) { setError(err.response?.data?.message || 'Unable to verify your password'); }
    finally { setPassword(''); setBusy(false); }
  };
  return <section className="rounded-lg border  bg-white"><div className="flex items-center justify-between gap-3 border-b px-5 py-4"><h2 className="text-lg font-semibold">Salary Details</h2><Button text={details ? 'Hide' : 'View'} variant="secondary" className="!py-1.5 text-sm" onClick={() => details ? hide() : (setError(''), setOpen(true))} /></div>
    <dl className="grid gap-5 p-5 sm:grid-cols-2 ">{[['Salary', details?.salary ?? 'Not provided'], ['Salary on Hold', details?.salaryOnHold === undefined ? 'Not provided' : details.salaryOnHold ? 'Yes' : 'No']].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt><dd className="mt-1 text-sm text-gray-900">{details ? value : '****'}</dd></div>)}</dl>
    {open && <CommonModal title="View Salary Details" subtitle="Enter your login password to view your salary." className="max-w-md" as="form" onSubmit={reveal} onClose={() => { if (!busy) hide(); }} footer={<><Button text="Cancel" variant="secondary" disabled={busy} onClick={hide} /><Button text="Verify & View" type="submit" loading={busy} disabled={!password} /></>}><label className="block text-sm font-medium">Login password<input autoFocus type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} required className="mt-2 w-full rounded border px-3 py-2" /></label>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}</CommonModal>}
  </section>;
}
