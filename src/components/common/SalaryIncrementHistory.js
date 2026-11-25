import { useState } from 'react';
import { useApi } from '../../contexts/ApiContext';
import { useToast } from '../../contexts/ToastContext';
import Button from './Button';
import InputField from './InputField';
import CalendarPicker from './CalendarPicker';
export default function SalaryIncrementHistory({ employee, canEdit, onChanged }) {
  const { API } = useApi(); const toast = useToast();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ effectiveDate: '', incrementAmount: '', nextIncrementDate: '', reason: '' });
  const current = employee.employeeRecords?.current || {};
  const history = employee.salaryReviewHistory || [];
  const lastIncrementDate = history.length ? String(history[history.length - 1].effectiveDate).slice(0, 10) : '';
  const joiningDate = employee.dateOfJoining ? String(employee.dateOfJoining).slice(0, 10) : '';
  const save = async event => {
    event.preventDefault();
    const nextErrors = {};
    const minimumDate = lastIncrementDate || joiningDate;
    if (!form.effectiveDate) nextErrors.effectiveDate = 'Select the effective date.';
    else if (minimumDate && form.effectiveDate < minimumDate) nextErrors.effectiveDate = `Select a date on or after ${minimumDate}.`;
    else if (lastIncrementDate && form.effectiveDate <= lastIncrementDate) nextErrors.effectiveDate = `Select a date after the last increment (${lastIncrementDate}).`;
    if (!form.nextIncrementDate) nextErrors.nextIncrementDate = 'Select the next review date.';
    else if (form.effectiveDate && form.nextIncrementDate <= form.effectiveDate) nextErrors.nextIncrementDate = 'Next review must be after the effective date.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try { const res = await API.post(`/hr/employees/${employee._id}/salary-increments`, form); await onChanged(); setOpen(false); setErrors({}); setForm({ effectiveDate: '', incrementAmount: '', nextIncrementDate: '', reason: '' }); toast.success(res.data.message); }
    catch (err) { toast.error(err.response?.data?.message || 'Unable to apply increment'); }
    finally { setBusy(false); }
  };
  return <section className="mt-5 rounded border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Salary Increments & Review History</h3><p className="mt-1 text-sm text-gray-500">Current salary: ₹{employee.salary || 'Not added'} · Next review: {current.nextIncrementDate || 'Not scheduled'}</p></div>{canEdit && <Button text="Add Increment" onClick={() => { setErrors({}); setOpen(true); }} />}</div><p className="mt-3 text-xs text-gray-500">Each increment is saved separately. Bond details are managed independently in the employee record.</p>
    {open && <form onSubmit={save} className="mt-4 grid gap-4 rounded border bg-gray-50 p-4 md:grid-cols-3"><InputField label="Current Salary" name="currentSalary" type="text" value={employee.salary ? `₹${employee.salary}` : 'Not added'} disabled /><InputField label="Increment Amount" name="incrementAmount" type="number" min="0.01" step="0.01" value={form.incrementAmount} disabled={busy} onChange={event => setForm(current => ({ ...current, incrementAmount: event.target.value }))} required /><InputField label="New Current Salary" name="calculatedSalary" type="text" value={employee.salary && form.incrementAmount ? `₹${(Number(employee.salary) + Number(form.incrementAmount)).toFixed(2)}` : 'Enter increment amount'} disabled />{[['effectiveDate', 'Increment Effective Date'], ['nextIncrementDate', 'Next Review Date']].map(([key, label]) => <CalendarPicker key={key} label={label} mode="date" value={form[key]} error={errors[key]} disabled={busy} onChange={value => { setErrors(current => ({ ...current, [key]: '' })); setForm(current => ({ ...current, [key]: value })); }} />)}<label className="text-sm font-medium md:col-span-3">Review remarks<textarea required maxLength={1000} disabled={busy} value={form.reason} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} className="mt-1 min-h-24 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f84525]" /></label><div className="flex gap-2 md:col-span-3"><Button text="Apply Increment" type="submit" loading={busy} /><Button text="Cancel" variant="secondary" disabled={busy} onClick={() => setOpen(false)} /></div></form>}
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-gray-500">{['Effective Date', 'Previous Salary', 'Increase', 'New Salary', 'Status', 'Next Review', 'Remarks'].map(label => <th key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead><tbody>{(employee.salaryReviewHistory || []).slice().reverse().map((item, index) => <tr key={item._id || index} className="border-b"><td className="p-3">{String(item.effectiveDate).slice(0, 10)}</td><td className="p-3">₹{item.oldSalary}</td><td className="p-3">₹{item.incrementAmount}</td><td className="p-3">₹{item.newSalary}</td><td className="p-3"><span className={item.status === 'scheduled' ? 'text-amber-600' : 'text-green-600'}>{item.status === 'scheduled' ? 'Scheduled' : 'Applied'}</span></td><td className="p-3">{String(item.nextIncrementDate).slice(0, 10)}</td><td className="p-3">{item.reason}</td></tr>)}</tbody></table>{!employee.salaryReviewHistory?.length && <p className="p-3 text-sm text-gray-500">No increments applied yet.</p>}</div>
  </section>;
}
