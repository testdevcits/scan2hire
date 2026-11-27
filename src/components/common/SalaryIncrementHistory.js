import { useState } from "react";
import { useApi } from "../../contexts/ApiContext";
import { useToast } from "../../contexts/ToastContext";
import Button from "./Button";
import InputField from "./InputField";
import CalendarPicker from "./CalendarPicker";
export default function SalaryIncrementHistory({ employee, canEdit, onChanged }) {
  const { API } = useApi();
  const toast = useToast();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [editingId, setEditingId] = useState(null);
  const [autoEffectiveDate, setAutoEffectiveDate] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    effectiveDate: "",
    incrementAmount: "",
    nextIncrementDate: "",
    reason: "",
  });
  const current = employee.employeeRecords?.current || {};
  const history = employee.salaryReviewHistory || [];
  const scheduledHistory = history
    .filter((item) => item.status === "scheduled")
    .slice()
    .sort((left, right) =>
      String(left.effectiveDate)
        .slice(0, 10)
        .localeCompare(String(right.effectiveDate).slice(0, 10))
    );
  const lastIncrementDate = history.length
    ? String(history[history.length - 1].effectiveDate).slice(0, 10)
    : "";
  const plannedSalary = Number(
    scheduledHistory[scheduledHistory.length - 1]?.newSalary ?? employee.salary
  );
  const previousReview =
    scheduledHistory[scheduledHistory.length - 1] ||
    history
      .slice()
      .sort((left, right) =>
        String(left.effectiveDate)
          .slice(0, 10)
          .localeCompare(String(right.effectiveDate).slice(0, 10))
      )[history.length - 1];
  const previousReviewDate = previousReview?.nextIncrementDate
    ? String(previousReview.nextIncrementDate).slice(0, 10)
    : "";
  const joiningDate = employee.dateOfJoining ? String(employee.dateOfJoining).slice(0, 10) : "";
  const today = new Date().toISOString().slice(0, 10);
  const completeReview = async (item) => {
    setBusy(true);
    try {
      const res = await API.post(
        `/hr/employees/${employee._id}/salary-increments/${item._id}/complete`
      );
      await onChanged();
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to complete salary review");
    } finally {
      setBusy(false);
    }
  };
  const editReview = (item) => {
    setAutoEffectiveDate(false);
    setEditingId(item._id);
    setErrors({});
    setForm({
      effectiveDate: String(item.effectiveDate).slice(0, 10),
      newSalary: String(item.newSalary),
      nextIncrementDate: String(item.nextIncrementDate).slice(0, 10),
      reason: item.reason || "",
    });
    setOpen(true);
  };
  const openAddForm = () => {
    setEditingId(null);
    setErrors({});
    setAutoEffectiveDate(Boolean(previousReviewDate));
    setForm({
      effectiveDate: previousReviewDate,
      incrementAmount: "",
      newSalary: "",
      nextIncrementDate: "",
      reason: "",
    });
    setOpen(true);
  };
  const save = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const minimumDate = lastIncrementDate || joiningDate;
    if (!form.effectiveDate) nextErrors.effectiveDate = "Select the effective date.";
    else if (!editingId && minimumDate && form.effectiveDate < minimumDate)
      nextErrors.effectiveDate = `Select a date on or after ${minimumDate}.`;
    else if (!editingId && lastIncrementDate && form.effectiveDate <= lastIncrementDate)
      nextErrors.effectiveDate = `Select a date after the last increment (${lastIncrementDate}).`;
    if (
      editingId &&
      (!form.newSalary ||
        Number(form.newSalary) <= Number(history.find((item) => item._id === editingId)?.oldSalary))
    )
      nextErrors.newSalary = "Enter a new salary greater than the previous planned salary.";
    if (!form.nextIncrementDate) nextErrors.nextIncrementDate = "Select the next review date.";
    else if (form.effectiveDate && form.nextIncrementDate <= form.effectiveDate)
      nextErrors.nextIncrementDate = "Next review must be after the effective date.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      const res = editingId
        ? await API.patch(`/hr/employees/${employee._id}/salary-increments/${editingId}`, form)
        : await API.post(`/hr/employees/${employee._id}/salary-increments`, form);
      await onChanged();
      setOpen(false);
      setEditingId(null);
      setErrors({});
      setForm({
        effectiveDate: "",
        incrementAmount: "",
        newSalary: "",
        nextIncrementDate: "",
        reason: "",
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to apply increment");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="mt-5 rounded border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Appraisal Review & Salary History</h3>
          <p className="mt-1 text-sm text-gray-500">
            Current salary: ₹{employee.salary || "Not added"} · Next review:{" "}
            {current.nextIncrementDate || "Not scheduled"}
          </p>
        </div>
        {canEdit && <Button text="Add Increment" onClick={openAddForm} />}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Each increment is saved separately. Bond details are managed independently in the employee
        record.
      </p>
      {open && (
        <form
          onSubmit={save}
          className="mt-4 grid gap-4 rounded border bg-gray-50 p-4 md:grid-cols-3"
        >
          <InputField
            label="Current Salary"
            name="currentSalary"
            type="text"
            value={employee.salary ? `₹${employee.salary}` : "Not added"}
            disabled
          />
          <InputField
            label="Salary Before This Review"
            name="plannedSalary"
            type="text"
            value={`₹${editingId ? history.find((item) => item._id === editingId)?.oldSalary : plannedSalary}`}
            disabled
          />
          {editingId ? (
            <InputField
              label="New Planned Salary"
              name="newSalary"
              type="number"
              min={Number(history.find((item) => item._id === editingId)?.oldSalary) + 0.01}
              step="0.01"
              value={form.newSalary}
              error={errors.newSalary}
              disabled={busy}
              onChange={(event) =>
                setForm((current) => ({ ...current, newSalary: event.target.value }))
              }
              required
            />
          ) : (
            <>
              <InputField
                label="Increment Amount"
                name="incrementAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.incrementAmount}
                disabled={busy}
                onChange={(event) =>
                  setForm((current) => ({ ...current, incrementAmount: event.target.value }))
                }
                required
              />
              <InputField
                label="New Planned Salary"
                name="calculatedSalary"
                type="text"
                value={
                  form.incrementAmount
                    ? `₹${(plannedSalary + Number(form.incrementAmount)).toFixed(2)}`
                    : "Enter increment amount"
                }
                disabled
              />
            </>
          )}
          {!editingId && previousReviewDate && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 md:col-span-3">
              <input
                type="checkbox"
                checked={autoEffectiveDate}
                disabled={busy}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setAutoEffectiveDate(checked);
                  if (checked) {
                    setErrors((current) => ({ ...current, effectiveDate: "" }));
                    setForm((current) => ({ ...current, effectiveDate: previousReviewDate }));
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-[#f84525] focus:ring-[#f84525]"
              />
              Set effective date to the previous review's next review date ({previousReviewDate})
            </label>
          )}
          {[
            ["effectiveDate", "Increment Effective Date"],
            ["nextIncrementDate", "Next Review Date"],
          ].map(([key, label]) => (
            <CalendarPicker
              key={key}
              label={label}
              mode="date"
              value={form[key]}
              error={errors[key]}
              disabled={busy}
              onChange={(value) => {
                setErrors((current) => ({ ...current, [key]: "" }));
                setForm((current) => ({ ...current, [key]: value }));
              }}
            />
          ))}
          <label className="text-sm font-medium md:col-span-3">
            Review remarks
            <textarea
              required
              maxLength={1000}
              disabled={busy}
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({ ...current, reason: event.target.value }))
              }
              className="mt-1 min-h-24 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f84525]"
            />
          </label>
          <div className="flex gap-2 md:col-span-3">
            <Button
              text={editingId ? "Update Review" : "Schedule Increment"}
              type="submit"
              loading={busy}
            />
            <Button
              text="Cancel"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
            />
          </div>
        </form>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              {[
                "Effective Date",
                "Previous Salary",
                "Increase",
                "New Salary",
                "Status",
                "Next Review",
                "Remarks",
                ...(canEdit ? ["Action"] : []),
              ].map((label) => (
                <th key={label} className="whitespace-nowrap p-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employee.salaryReviewHistory?.length ? (
              employee.salaryReviewHistory
                .slice()
                .sort((left, right) =>
                  String(left.effectiveDate)
                    .slice(0, 10)
                    .localeCompare(String(right.effectiveDate).slice(0, 10))
                )
                .map((item, index) => {
                  const effectiveDate = String(item.effectiveDate).slice(0, 10);
                  const canComplete =
                    canEdit && item.status === "scheduled" && effectiveDate <= today;
                  const canUpdate = canEdit && item.status === "scheduled";
                  return (
                    <tr key={item._id || index} className="border-b">
                      <td className="p-3">{effectiveDate}</td>
                      <td className="p-3">₹{item.oldSalary}</td>
                      <td className="p-3">₹{item.incrementAmount}</td>
                      <td className="p-3 font-medium">₹{item.newSalary}</td>
                      <td className="p-3">
                        <span
                          className={
                            item.status === "scheduled" ? "text-amber-600" : "text-green-600"
                          }
                        >
                          {item.status === "scheduled" ? "Scheduled" : "Done"}
                        </span>
                        {item.completedAt && (
                          <span className="mt-1 block text-xs text-gray-500">
                            Completed {String(item.completedAt).slice(0, 10)}
                          </span>
                        )}
                      </td>
                      <td className="p-3">{String(item.nextIncrementDate).slice(0, 10)}</td>
                      <td className="p-3">{item.reason}</td>
                      {canEdit && (
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {canUpdate && (
                              <Button
                                text="Update"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => editReview(item)}
                              />
                            )}
                            {canComplete ? (
                              <Button
                                text="Mark Done"
                                disabled={busy}
                                onClick={() => completeReview(item)}
                              />
                            ) : (
                              item.status === "scheduled" && (
                                <span className="text-xs text-gray-500">
                                  Available on {effectiveDate}
                                </span>
                              )
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={canEdit ? 8 : 7} className="p-3 text-sm text-gray-500">
                  The starting salary is already saved in Salary Record. Add an increment above to
                  schedule a review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
