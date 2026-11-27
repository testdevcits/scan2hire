import { useState } from 'react';
import { useApi } from '../../contexts/ApiContext';
import { useToast } from '../../contexts/ToastContext';
import Button from './Button';
import InputField from './InputField';
import CalendarPicker from './CalendarPicker';
export default function SalaryIncrementHistory({ employee, canEdit, onChanged }) {
  const { API } = useApi(); const toast = useToast();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ effectiveDate: '', incrementAmount: '', nextIncrementDate: '', reason: '' });
  const current = employee.employeeRecords?.current || {};
  const history = employee.salaryReviewHistory || [];
  const scheduledHistory = history.filter(item => item.status === 'scheduled').slice().sort((left, right) => String(left.effectiveDate).slice(0, 10).localeCompare(String(right.effectiveDate).slice(0, 10)));
  const plannedSalary = Number(scheduledHistory[scheduledHistory.length - 1]?.newSalary ?? employee.salary);
  const today = new Date().toISOString().slice(0, 10);
  const completeReview = async item => {
    setBusy(true);
    try {
      const res = await API.post(`/hr/employees/${employee._id}/salary-increments/${item._id}/complete`);
      await onChanged();
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to complete salary review'); }
    finally { setBusy(false); }
  };
  const editReview = item => {
    setEditingId(item._id);
    setErrors({});
    setForm({ effectiveDate: String(item.effectiveDate).slice(0, 10), newSalary: String(item.newSalary), nextIncrementDate: String(item.nextIncrementDate).slice(0, 10), reason: item.reason || '' });
    setOpen(true);
  };
  const openAddForm = () => {
    setEditingId(null);
    setErrors({});
    setForm({ effectiveDate: '', incrementAmount: '', newSalary: '', nextIncrementDate: '', reason: '' });
    setOpen(true);
  };
  const save = async event => {
    event.preventDefault();
    const nextErrors = {};
    if (editingId && (!form.newSalary || Number(form.newSalary) <= Number(history.find(item => item._id === editingId)?.oldSalary))) nextErrors.newSalary = 'Enter a new salary greater than the previous planned salary.';
    if (!form.nextIncrementDate) nextErrors.nextIncrementDate = 'Select the next review date.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try { const payload = { ...(editingId ? { newSalary: form.newSalary } : { incrementAmount: form.incrementAmount }), nextIncrementDate: form.nextIncrementDate, reason: form.reason }; const res = editingId ? await API.patch(`/hr/employees/${employee._id}/salary-increments/${editingId}`, payload) : await API.post(`/hr/employees/${employee._id}/salary-increments`, payload); await onChanged(); setOpen(false); setEditingId(null); setErrors({}); setForm({ effectiveDate: '', incrementAmount: '', newSalary: '', nextIncrementDate: '', reason: '' }); toast.success(res.data.message); }
    catch (err) { toast.error(err.response?.data?.message || 'Unable to apply increment'); }
    finally { setBusy(false); }
  };
  return <section className="mt-5 rounded border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Appraisal Review & Salary History</h3><p className="mt-1 text-sm text-gray-500">Current salary: ₹{employee.salary || 'Not added'} · Next review: {current.nextIncrementDate || 'Not scheduled'}</p></div>{canEdit && <Button text="Add Increment" onClick={openAddForm} />}</div><p className="mt-3 text-xs text-gray-500">Each increment is saved separately. Bond details are managed independently in the employee record.</p>
    {open && <form onSubmit={save} className="mt-4 grid gap-4 rounded border bg-gray-50 p-4 md:grid-cols-3"><InputField label="Current Salary" name="currentSalary" type="text" value={employee.salary ? `₹${employee.salary}` : 'Not added'} disabled /><InputField label="Salary Before This Review" name="plannedSalary" type="text" value={`₹${editingId ? history.find(item => item._id === editingId)?.oldSalary : plannedSalary}`} disabled />{editingId ? <InputField label="New Planned Salary" name="newSalary" type="number" min={Number(history.find(item => item._id === editingId)?.oldSalary) + 0.01} step="0.01" value={form.newSalary} error={errors.newSalary} disabled={busy} onChange={event => setForm(current => ({ ...current, newSalary: event.target.value }))} required /> : <><InputField label="Increment Amount" name="incrementAmount" type="number" min="0.01" step="0.01" value={form.incrementAmount} disabled={busy} onChange={event => setForm(current => ({ ...current, incrementAmount: event.target.value }))} required /><InputField label="New Planned Salary" name="calculatedSalary" type="text" value={form.incrementAmount ? `₹${(plannedSalary + Number(form.incrementAmount)).toFixed(2)}` : 'Enter increment amount'} disabled /></>}<CalendarPicker label="Next Review Date" mode="date" value={form.nextIncrementDate} error={errors.nextIncrementDate} disabled={busy} onChange={value => { setErrors(current => ({ ...current, nextIncrementDate: '' })); setForm(current => ({ ...current, nextIncrementDate: value })); }} /><label className="text-sm font-medium md:col-span-3">Review remarks<textarea required maxLength={1000} disabled={busy} value={form.reason} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} className="mt-1 min-h-24 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f84525]" /></label><div className="flex gap-2 md:col-span-3"><Button text={editingId ? 'Update Review' : 'Schedule Increment'} type="submit" loading={busy} /><Button text="Cancel" variant="secondary" disabled={busy} onClick={() => { setOpen(false); setEditingId(null); }} /></div></form>}
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-gray-500">{['Previous Salary', 'Increase', 'New Salary', 'Status', 'Next Review', 'Remarks', ...(canEdit ? ['Action'] : [])].map(label => <th key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead><tbody>{employee.salaryReviewHistory?.length ? employee.salaryReviewHistory.slice().sort((left, right) => String(left.nextIncrementDate).slice(0, 10).localeCompare(String(right.nextIncrementDate).slice(0, 10))).map((item, index) => { const effectiveDate = String(item.effectiveDate || '').slice(0, 10); const canComplete = canEdit && item.status === 'scheduled' && effectiveDate <= today; const canUpdate = canEdit && item.status === 'scheduled'; return <tr key={item._id || index} className="border-b"><td className="p-3">₹{item.oldSalary}</td><td className="p-3">₹{item.incrementAmount}</td><td className="p-3 font-medium">₹{item.newSalary}</td><td className="p-3"><span className={item.status === 'scheduled' ? 'text-amber-600' : 'text-green-600'}>{item.status === 'scheduled' ? 'Scheduled' : 'Done'}</span></td><td className="p-3">{String(item.nextIncrementDate || '').slice(0, 10)}</td><td className="p-3">{item.reason}</td>{canEdit && <td className="p-3"><div className="flex items-center gap-2">{canUpdate && <Button text="Update" variant="secondary" disabled={busy} onClick={() => editReview(item)} />}{canComplete ? <Button text="Mark Done" disabled={busy} onClick={() => completeReview(item)} /> : item.status === 'scheduled' && <span className="text-xs text-gray-500">Available on {effectiveDate}</span>}</div></td>}</tr>; }) : <tr><td colSpan={canEdit ? 7 : 6} className="p-3 text-sm text-gray-500">The starting salary is already saved in Salary Record. Add an increment above to schedule a review.</td></tr>}</tbody></table></div>
  </section>;
}
