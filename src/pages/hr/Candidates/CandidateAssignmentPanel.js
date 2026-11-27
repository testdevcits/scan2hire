import Button from "../../../components/common/Button";
import CustomDropdown from "../../../components/common/CustomDropdown";
import EmailConsentCheckbox from "../../../components/common/EmailConsentCheckbox";
import InputField from "../../../components/common/InputField";
import SectionHeader from "../../../components/common/SectionHeader";
import { getDefaultRoundType, roundLabels, roundOrder } from "../../../utils/candidateInterview";

const roundTypeOptions = [
  { value: "final", label: "Final Round" },
  { value: "technical", label: "Technical Round" },
  { value: "machine_test", label: "Machine Test" },
  { value: "ui_ux", label: "UI/UX Review" },
  { value: "testing", label: "Testing Round" },
  { value: "hr", label: "HR Round" },
  { value: "project_coordinator", label: "Project Coordinator" },
  { value: "other", label: "Other" },
];

const hrStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const CandidateAssignmentPanel = ({
  candidate,
  statusForm,
  setStatusForm,
  canManage,
  employees,
  allowedStatuses,
  completedRounds,
  savingAction,
  onSubmit,
  onConvert,
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-5"
  >
    <SectionHeader title="Assign & Status" />
    <CustomDropdown
      label="Interview Status"
      value={statusForm.interviewStatus}
      showPlaceholder={false}
      options={[...roundOrder, "selected", "rejected"]
        .filter((status) => allowedStatuses.includes(status))
        .map((status) => ({ value: status, label: roundLabels[status] }))}
      onChange={(value) =>
        setStatusForm((prev) => ({
          ...prev,
          interviewStatus: value,
          roundType: getDefaultRoundType(value),
          assignedTo: value === "hr_round" ? "" : prev.assignedTo,
          sendCandidateEmail: false,
        }))
      }
    />

    {canManage && (
      <EmailConsentCheckbox
        checked={statusForm.sendCandidateEmail}
        onChange={(checked) => setStatusForm((prev) => ({ ...prev, sendCandidateEmail: checked }))}
        recipient={candidate.email}
        disabled={Boolean(savingAction)}
        description={
          statusForm.interviewStatus === "selected"
            ? `Send selection confirmation to ${candidate.email}. No offer letter will be attached.`
            : statusForm.interviewStatus === "rejected"
              ? `Send rejection update to ${candidate.email}.`
              : `Send the ${roundLabels[statusForm.interviewStatus] || "status"} update to ${candidate.email}.`
        }
      />
    )}

    <CustomDropdown
      label="Round Type"
      value={statusForm.roundType}
      disabled
      showPlaceholder={false}
      options={roundTypeOptions}
    />
    <CustomDropdown
      label="Assign Employee"
      value={statusForm.assignedTo}
      searchable
      placeholder={
        statusForm.interviewStatus === "hr_round" ? "HR will complete this round" : "Unassigned"
      }
      disabled={
        statusForm.interviewStatus === "hr_round" ||
        ["selected", "rejected"].includes(statusForm.interviewStatus)
      }
      options={employees.map((employee) => ({
        value: employee._id,
        label: `${employee.name} - ${employee.designation || employee.employeeId}`,
      }))}
      onChange={(value) => setStatusForm((prev) => ({ ...prev, assignedTo: value }))}
    />

    {candidate.interviewStatus === "hr_round" && !completedRounds.has("hr_round") && (
      <div className="grid grid-cols-1 gap-3 border-t pt-3">
        <InputField
          label="HR Round Score /10"
          name="score"
          type="number"
          min="0"
          max="10"
          value={statusForm.score}
          onChange={(event) => setStatusForm((prev) => ({ ...prev, score: event.target.value }))}
          placeholder="Add score to complete HR Round"
        />
        <label className="block text-sm font-medium">
          HR Round Comments
          <textarea
            value={statusForm.comments}
            onChange={(event) =>
              setStatusForm((prev) => ({ ...prev, comments: event.target.value }))
            }
            className="mt-1 min-h-24 w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#f84525] focus:ring-2 focus:ring-[#f84525]/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="HR screening notes"
          />
        </label>
      </div>
    )}

    {canManage && (
      <CustomDropdown
        label="HR Status"
        value={statusForm.hrStatus}
        showPlaceholder={false}
        options={hrStatusOptions}
        onChange={(value) => setStatusForm((prev) => ({ ...prev, hrStatus: value }))}
      />
    )}
    <label className="block text-sm font-medium">
      Remarks
      <textarea
        value={statusForm.remarks}
        onChange={(event) => setStatusForm((prev) => ({ ...prev, remarks: event.target.value }))}
        className="mt-1 min-h-24 w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#f84525] focus:ring-2 focus:ring-[#f84525]/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        placeholder={
          statusForm.interviewStatus === "rejected"
            ? "Required. This reply will be sent in rejection email."
            : "Internal HR remarks"
        }
      />
    </label>
    <Button
      text="Save Assignment"
      type="submit"
      className="w-full"
      loading={savingAction === "status"}
      disabled={Boolean(savingAction)}
    />
    <p className="text-xs text-gray-500">
      Selected/Rejected can be marked anytime; round movement still follows the process bar order.
    </p>
    {candidate.interviewStatus === "selected" && !candidate.convertedEmployee && (
      <Button
        text="Add as Employee"
        variant="success"
        onClick={onConvert}
        className="w-full"
        loading={savingAction === "convert"}
        disabled={Boolean(savingAction)}
      />
    )}
  </form>
);

export default CandidateAssignmentPanel;
