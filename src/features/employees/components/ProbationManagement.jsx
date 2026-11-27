import { useState } from "react";
import { useApi } from "../../../contexts/ApiContext";
import { useToast } from "../../../contexts/ToastContext";
import Button from "../../../components/ui/Button";
import CommonModal from "../../../components/ui/Modal/CommonModal";
export default function ProbationManagement({ employee, canManage, onChanged }) {
  const { API } = useApi();
  const toast = useToast();
  const [action, setAction] = useState(""),
    [date, setDate] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  const probation = employee.probation;
  if (!probation?.required) return null;
  const open = (action) => {
    setAction(action);
    setReason("");
    setDate(
      action === "confirm"
        ? new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date())
        : ""
    );
  };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await API.patch(`/hr/employees/${employee._id}/probation`, {
        action,
        effectiveDate: date,
        reason,
      });
      await onChanged();
      setAction("");
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update probation");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="my-3 rounded border border-orange-200 bg-orange-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold">Probation & Leave Eligibility</h4>
          <p className="mt-1 text-sm capitalize">{probation.status.replace(/_/g, " ")}</p>
        </div>
        {canManage && !probation.confirmationDate && probation.expectedEndDate && (
          <div className="flex gap-2">
            <Button text="Confirm Employee" className="text-xs" onClick={() => open("confirm")} />
            <Button
              text="Extend Probation"
              variant="secondary"
              className="text-xs"
              onClick={() => open("extend")}
            />
          </div>
        )}
      </div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-gray-500">Probation End / Earliest Confirmation</dt>
          <dd>{probation.expectedEndDate || "Set joining date and probation duration"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Actual Confirmation Date</dt>
          <dd>{probation.confirmationDate || "Pending HR confirmation"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Leave Accrual Starts</dt>
          <dd>{probation.eligibleFrom || "After confirmation"}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-gray-500">
        No paid leave accrues during probation. The first monthly credit is earned after one
        completed month from confirmation. Unpaid leave requires approval.
      </p>
      {action && (
        <CommonModal
          title={action === "confirm" ? "Confirm Employee" : "Extend Probation"}
          as="form"
          onSubmit={save}
          onClose={() => {
            if (!busy) setAction("");
          }}
          className="max-w-lg"
          footer={
            <>
              <Button
                text="Cancel"
                variant="secondary"
                disabled={busy}
                onClick={() => setAction("")}
              />
              <Button text="Save" type="submit" loading={busy} disabled={!date || !reason.trim()} />
            </>
          }
        >
          <label className="block text-sm font-medium">
            {action === "confirm" ? "Actual confirmation date" : "New probation end date"}
            <input
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded border p-2"
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Reason
            <textarea
              required
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 w-full rounded border p-2"
            />
          </label>
        </CommonModal>
      )}
    </div>
  );
}
