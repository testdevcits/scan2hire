import { Fragment, useContext, useEffect, useRef, useState } from "react";
import {
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiLayers,
  FiMail,
  FiMapPin,
  FiMoon,
  FiPhone,
  FiStar,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { authApi, hrApi } from "../../../api";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import CommonLoader from "../../../components/common/CommonLoader";
import CommonTable from "../../../components/common/CommonTable";
import CustomDropdown from "../../../components/common/CustomDropdown";
import DetailItem from "../../../components/common/DetailItem";
import EmptyState from "../../../components/common/EmptyState";
import EmailConsentCheckbox from "../../../components/common/EmailConsentCheckbox";
import FilePreviewModal from "../../../components/common/FilePreviewModal";
import InputField from "../../../components/common/InputField";
import SectionHeader from "../../../components/common/SectionHeader";
import Tabs from "../../../components/common/Tabs";
import { AuthContext } from "../../../contexts/AuthContext";
import { useEmployee } from "../../../contexts/Hr/EmployeeContext";
import { useModal } from "../../../contexts/ModalContext";
import { useToast } from "../../../contexts/ToastContext";

const formatValue = (value) => {
  if (!value) return "N/A";
  if (Array.isArray(value)) return value.join(", ");
  return value;
};

const roundOrder = ["hr_round", "first_round", "second_round", "final"];
const roundLabels = {
  hr_round: "HR Round",
  first_round: "Technical Round",
  second_round: "Machine Test",
  final: "Final Round",
  third_round: "Final Round",
  selected: "Selected",
  rejected: "Rejected",
};

const getAllowedStatuses = (candidate) => {
  const completed = new Set(
    (candidate?.interviewRounds || [])
      .filter((round) => round.status === "completed")
      .map((round) => round.round === "third_round" ? "final" : round.round)
  );
  const nextIncompleteRound = roundOrder.find((status) => !completed.has(status));
  const allowed = nextIncompleteRound ? [nextIncompleteRound] : ["selected", "rejected"];
  const currentStatus = candidate?.interviewStatus === "third_round" ? "final" : candidate?.interviewStatus;
  if (roundOrder.includes(currentStatus) && completed.has(currentStatus) && !allowed.includes(currentStatus)) {
    allowed.unshift(currentStatus);
  }
  if (["selected", "rejected"].includes(currentStatus) && !allowed.includes(currentStatus)) allowed.push(currentStatus);

  return allowed;
};

const getDefaultRoundType = (status) => {
  if (status === "hr_round") return "hr";
  if (status === "second_round") return "machine_test";
  if (["final", "third_round"].includes(status)) return "final";
  return "technical";
};

const getCompletedRounds = (candidate) =>
  new Set(
    (candidate?.interviewRounds || [])
      .filter((round) => round.status === "completed")
      .map((round) => round.round === "third_round" ? "final" : round.round)
  );

const salaryText = (amount, period) =>
  amount ? `${amount} / ${period === "monthly" ? "month" : "annum"}` : "N/A";

const CandidateDetail = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useModal();
  const { user } = useContext(AuthContext);
  const { employees, fetchEmployees } = useEmployee();
  const effectiveRole = user?.effectiveRole || user?.role;
  const canReviewCandidate = user?.role === "hr" || effectiveRole === "teamlead";
  const canManage = user?.role === "hr";
  const [candidate, setCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingAction, setSavingAction] = useState("");
  const [preview, setPreview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const loadRequestId = useRef(0);
  const [statusForm, setStatusForm] = useState({
    interviewStatus: "hr_round",
    roundType: "hr",
    hrStatus: "pending",
    assignedTo: "",
    remarks: "",
    score: "",
    comments: "",
    sendCandidateEmail: false,
  });

  const loadCandidate = async ({ quiet = false } = {}) => {
    const requestId = loadRequestId.current + 1;
    loadRequestId.current = requestId;
    if (!quiet) setLoading(true);
    setLoadError("");
    try {
      const [candidateResult, departmentsResult] = await Promise.allSettled([
        hrApi.getCandidate(candidateId),
        canManage ? authApi.getDepartments() : Promise.resolve(null),
      ]);
      if (requestId !== loadRequestId.current) return;
      if (candidateResult.status === "rejected") throw candidateResult.reason;
      if (canReviewCandidate) fetchEmployees();
      const candidateRes = candidateResult.value;
      const data = candidateRes.data.data;
      const normalizedStatus = data.interviewStatus === "third_round" ? "final" : data.interviewStatus || "hr_round";
      setCandidate(data);
      if (departmentsResult.status === "fulfilled") {
        setDepartments(departmentsResult.value?.data?.data || []);
      } else if (canManage) {
        setDepartments([]);
        toast.error(departmentsResult.reason?.response?.data?.message || "Unable to load departments");
      }
      setStatusForm({
        interviewStatus: normalizedStatus,
        roundType: data.currentRoundType || getDefaultRoundType(normalizedStatus),
        hrStatus: data.hrReview?.hrStatus || "pending",
        assignedTo: data.assignedTo?._id || "",
        remarks: data.remarks || "",
        score: "",
        comments: "",
        sendCandidateEmail: false,
      });
    } catch (err) {
      if (requestId !== loadRequestId.current) return;
      const message = err.response?.data?.message || "Unable to load candidate";
      setLoadError(message);
      toast.error(message);
    } finally {
      if (requestId === loadRequestId.current && !quiet) setLoading(false);
    }
  };

  useEffect(() => {
    setCandidate(null);
    setLoading(true);
    loadCandidate();
    return () => {
      loadRequestId.current += 1;
    };
    // eslint-disable-next-line
  }, [candidateId, canManage, canReviewCandidate]);

  const updateAssignment = async (e) => {
    e.preventDefault();
    const completingHrRound =
      candidate.interviewStatus === "hr_round" &&
      statusForm.interviewStatus === "hr_round" &&
      (statusForm.score !== "" || statusForm.comments.trim());

    if (completingHrRound && statusForm.score === "") {
      toast.error("Please add score to complete HR Round.");
      return;
    }

    if (["first_round", "second_round", "final"].includes(statusForm.interviewStatus) && !statusForm.assignedTo) {
      toast.error(`${roundLabels[statusForm.interviewStatus]} must be assigned to an employee.`);
      return;
    }

    if (statusForm.interviewStatus === "rejected" && !statusForm.remarks.trim()) {
      toast.error("Please add HR reply in remarks before rejecting.");
      return;
    }
    try {
      const payload = {
        ...statusForm,
        assignedRoundType: getDefaultRoundType(statusForm.interviewStatus),
      };

      if (completingHrRound) {
        payload.round = "hr_round";
        payload.roundType = "hr";
      } else {
        delete payload.score;
        delete payload.comments;
      }
      if (!canManage) {
        delete payload.hrStatus;
        delete payload.sendCandidateEmail;
      }

      setSavingAction("status");
      const response = await hrApi.updateCandidateStatus(candidateId, payload);
      if (payload.sendCandidateEmail && response.data.candidateEmailSent === false) {
        toast.error("Candidate status updated, but the email could not be sent.");
      } else if (payload.sendCandidateEmail && response.data.candidateEmailSent === true) {
        toast.success("Candidate status updated and email sent.");
      } else {
        toast.success("Candidate updated");
      }
      await loadCandidate({ quiet: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update candidate");
    } finally {
      setSavingAction("");
    }
  };

  const convertToEmployee = async () => {
    const values = await confirm({
      title: "Add Candidate as Employee",
      message: `Create employee login for ${candidate?.name}.`,
      confirmText: "Create Employee",
      fields: [
        { name: "designation", label: "Designation", required: true },
        {
          name: "department",
          label: "Department",
          type: "select",
          options: departments.map((department) => department.name),
          required: true,
        },
        { name: "dateOfJoining", label: "Joining Date", type: "date", required: true },
        {
          name: "employeeType",
          label: "Employee Type",
          type: "select",
          options: ["Permanent", "Contract", "Intern"],
          required: true,
        },
        {
          name: "password",
          label: "Temporary Password",
          type: "password",
          required: true,
        },
      ],
      initialValues: {
        designation: candidate?.jobRole || "",
        department: departments[0]?.name || "",
        employeeType: "Permanent",
      },
    });

    if (!values) return;

    try {
      setSavingAction("convert");
      await hrApi.convertCandidateToEmployee(candidateId, values);
      toast.success("Candidate converted to employee");
      await loadCandidate({ quiet: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to convert candidate");
    } finally {
      setSavingAction("");
    }
  };

  const deactivateCandidate = async () => {
    const ok = await confirm({
      title: "Deactivate Candidate",
      message: "This will mark the candidate inactive. Their interview status will stay unchanged.",
      confirmText: "Deactivate",
      tone: "danger",
    });
    if (!ok) return;

    try {
      setSavingAction("deactivate");
      await hrApi.deactivateCandidate(candidateId);
      toast.success("Candidate deactivated");
      await loadCandidate({ quiet: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to deactivate");
    } finally {
      setSavingAction("");
    }
  };

  const activateCandidate = async () => {
    try {
      setSavingAction("activate");
      await hrApi.activateCandidate(candidateId);
      toast.success("Candidate activated");
      await loadCandidate({ quiet: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to activate");
    } finally {
      setSavingAction("");
    }
  };

  const deleteCandidate = async () => {
    const ok = await confirm({
      title: "Delete Candidate",
      message: "This permanently deletes the candidate.",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;

    try {
      setSavingAction("delete");
      await hrApi.deleteCandidate(candidateId);
      toast.success("Candidate deleted");
      navigate(user?.role === "superadmin" ? "/admin/candidates" : "/hr/candidates/list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete");
    } finally {
      setSavingAction("");
    }
  };

  if (loading) return <CommonLoader text="Loading candidate..." />;
  if (!candidate) {
    return (
      <EmptyState
        variant="error"
        title={loadError || "Candidate not found"}
        action={loadError ? <Button text="Retry" onClick={loadCandidate} /> : null}
      />
    );
  }
  const allowedStatuses = getAllowedStatuses(candidate);
  const completedRounds = getCompletedRounds(candidate);
  const detailTabs = [
    { value: "details", label: <span className="inline-flex items-center gap-2"><FiUser />Candidate Details</span> },
    { value: "documents", label: <span className="inline-flex items-center gap-2"><FiFileText />Documents</span> },
    { value: "reports", label: <span className="inline-flex items-center gap-2"><FiBarChart2 />Interview Reports</span> },
  ];

  return (
    <div className="space-y-4">
      <header className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={candidate.name} size="h-14 w-14" className="text-lg" alt={`${candidate.name} avatar`} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{candidate.name}</h1>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${candidate.isActive ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300" : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"}`}>
                  {candidate.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {candidate.candidateId || "Candidate"} · {candidate.jobRole || "No role"} · {roundLabels[candidate.interviewStatus] || candidate.interviewStatus}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button text="Back" variant="secondary" onClick={() => navigate(-1)} />
            {canManage && (candidate.isActive ? (
              <Button text="Deactivate" variant="danger" onClick={deactivateCandidate} loading={savingAction === "deactivate"} disabled={Boolean(savingAction)} />
            ) : (
              <Button text="Activate" variant="success" onClick={activateCandidate} loading={savingAction === "activate"} disabled={Boolean(savingAction)} />
            ))}
            {canManage && <Button text="Delete" variant="danger" onClick={deleteCandidate} loading={savingAction === "delete"} disabled={Boolean(savingAction)} />}
          </div>
        </div>
        <div className="border-t border-gray-100 px-4 py-5 dark:border-gray-800 md:px-5">
          <div className="grid items-start" style={{ gridTemplateColumns: `repeat(${roundOrder.length * 2 - 1}, minmax(0, 1fr))` }}>
            {roundOrder.map((status, index) => {
              const completed = completedRounds.has(status);
              const active = (candidate.interviewStatus === status || (status === "final" && candidate.interviewStatus === "third_round")) && !completed;
              const stateLabel = completed ? "Completed" : active ? "In progress" : "Pending";
              return (
                <Fragment key={status}>
                  <div className="flex min-w-0 flex-col items-center text-center" aria-current={active ? "step" : undefined}>
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900 ${completed ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300" : active ? "bg-[#fff0ec] text-[#f84525] shadow-sm dark:bg-[#f84525]/15" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {completed ? <FiCheck aria-label="Completed" className="h-4 w-4" /> : active ? <FiClock aria-label="In progress" className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className={`mt-2 text-xs font-semibold leading-tight sm:text-sm ${completed ? "text-green-700 dark:text-green-300" : active ? "text-[#f84525]" : "text-gray-600 dark:text-gray-300"}`}>
                      {roundLabels[status]}
                    </span>
                    <span className={`mt-1 text-[11px] sm:text-xs ${completed ? "text-green-700 dark:text-green-300" : active ? "text-[#f84525]" : "text-gray-500 dark:text-gray-400"}`}>
                      {stateLabel}
                    </span>
                  </div>
                  {index < roundOrder.length - 1 && (
                    <span aria-hidden="true" className={`mt-4 h-0.5 rounded-full ${completed ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
                  )}
                </Fragment>
              );
            })}
          </div>

        </div>
        <Tabs tabs={detailTabs} value={activeTab} onChange={setActiveTab} label="Candidate information" />
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2 md:p-5">
          {activeTab === "details" && <div id="details-panel" role="tabpanel" aria-labelledby="details-tab">
            <SectionHeader title="Candidate Details" subtitle="Candidate contact, experience and role information." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem icon={<FiMail className="text-[#f84525]" />} label="Email" value={formatValue(candidate.email)} />
              <DetailItem icon={<FiPhone className="text-[#f84525]" />} label="Mobile" value={formatValue(candidate.mobile)} />
              <DetailItem icon={<FiPhone className="text-[#f84525]" />} label="Alt Mobile" value={formatValue(candidate.altMobile)} />
              <DetailItem icon={<FiBookOpen className="text-[#f84525]" />} label="Qualification" value={formatValue(candidate.qualification)} />
              <DetailItem icon={<FiMapPin className="text-[#f84525]" />} label="Branch" value={formatValue(candidate.branch)} />
              <DetailItem icon={<FiStar className="text-[#f84525]" />} label="Experience" value={candidate.experienceType === "fresher" ? "Fresher" : `${formatValue(candidate.experience)} yrs`} />
              <DetailItem icon={<FiBriefcase className="text-[#f84525]" />} label="Company" value={formatValue(candidate.currentCompany)} />
              <DetailItem icon={<FiDollarSign className="text-[#f84525]" />} label="Current Salary" value={salaryText(candidate.currentSalary, candidate.currentSalaryPeriod)} />
              <DetailItem icon={<FiDollarSign className="text-[#f84525]" />} label="Expected Salary" value={salaryText(candidate.expectedSalary, candidate.expectedSalaryPeriod)} />
              <DetailItem icon={<FiMoon className="text-[#f84525]" />} label="Night Shift" value={formatValue(candidate.nightShift)} />
              <DetailItem icon={<FiUser className="text-[#f84525]" />} label="Reference" value={candidate.referenceName ? `${candidate.referenceName} (${candidate.referenceMobile || "N/A"})` : "N/A"} />
              <DetailItem icon={<FiUsers className="text-[#f84525]" />} label="Skills" value={formatValue(candidate.skills)} />
              <DetailItem icon={<FiLayers className="text-[#f84525]" />} label="Framework" value={formatValue(candidate.framework)} />
              <DetailItem icon={<FiGrid className="text-[#f84525]" />} label="CMS" value={formatValue(candidate.cms)} />
            </div>
          </div>}

          {activeTab === "documents" && <div id="documents-panel" role="tabpanel" aria-labelledby="documents-tab">
            <SectionHeader title="Documents" subtitle="Candidate resume and certificates." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ["Resume", candidate.resume, candidate.resumeName],
                ["Certificate", candidate.certificate, candidate.certificateName],
              ].map(([label, url, fileName]) => (
                <div key={label} className="border rounded-sm p-3">
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-1 break-all">{fileName || (url ? "Uploaded" : "Not uploaded")}</p>
                  {url ? (
                    <button
                      type="button"
                      onClick={() => setPreview({ title: `${candidate.name} - ${label}`, url })}
                      className="mt-3 text-sm text-[#f84525] underline"
                    >
                      View {label}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>}

          {activeTab === "reports" && <div id="reports-panel" role="tabpanel" aria-labelledby="reports-tab">
            <SectionHeader title="Interview Reports" subtitle="Scores and interviewer feedback for completed rounds." />
            <CommonTable
              columns={[
                { header: "Round", accessor: "round", render: (value) => roundLabels[value] || value || "N/A" },
                { header: "Type", accessor: "roundType", render: (value) => value?.replaceAll("_", " ") || "Technical" },
                { header: "Interviewer", accessor: "interviewer", render: (value) => value || "N/A" },
                { header: "Score", accessor: "score", render: (value) => `${value ?? 0} / 10` },
                { header: "Status", accessor: "status", render: (value) => value || "N/A" },
                { header: "Comments", accessor: "comments", render: (value) => value || "—" },
              ]}
              data={candidate.interviewRounds || []}
              emptyText="No interview report added yet."
            />
          </div>}
        </div>

        {canReviewCandidate ? (
        <form onSubmit={updateAssignment} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-5">
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
              description={statusForm.interviewStatus === "selected"
                ? `Send selection confirmation to ${candidate.email}. No offer letter will be attached.`
                : statusForm.interviewStatus === "rejected"
                  ? `Send rejection update to ${candidate.email}.`
                  : `Send the ${roundLabels[statusForm.interviewStatus] || "status"} update to ${candidate.email}.`}
            />
          )}
          <CustomDropdown
            label="Round Type"
            value={statusForm.roundType}
            disabled
            showPlaceholder={false}
            options={[
              { value: "final", label: "Final Round" },
              { value: "technical", label: "Technical Round" },
              { value: "machine_test", label: "Machine Test" },
              { value: "ui_ux", label: "UI/UX Review" },
              { value: "testing", label: "Testing Round" },
              { value: "hr", label: "HR Round" },
              { value: "project_coordinator", label: "Project Coordinator" },
              { value: "other", label: "Other" },
            ]}
          />
          <CustomDropdown
            label="Assign Employee"
            value={statusForm.assignedTo}
            searchable
            placeholder={statusForm.interviewStatus === "hr_round" ? "HR will complete this round" : "Unassigned"}
            disabled={statusForm.interviewStatus === "hr_round" || ["selected", "rejected"].includes(statusForm.interviewStatus)}
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
                onChange={(e) => setStatusForm((prev) => ({ ...prev, score: e.target.value }))}
                placeholder="Add score to complete HR Round"
              />
              <label className="block text-sm font-medium">
                HR Round Comments
                <textarea
                  value={statusForm.comments}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, comments: e.target.value }))}
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
              options={[{ value: "pending", label: "Pending" }, { value: "completed", label: "Completed" }]}
              onChange={(value) => setStatusForm((prev) => ({ ...prev, hrStatus: value }))}
            />
          )}
          <label className="block text-sm font-medium">
            Remarks
            <textarea
              value={statusForm.remarks}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, remarks: e.target.value }))}
              className="mt-1 min-h-24 w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#f84525] focus:ring-2 focus:ring-[#f84525]/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              placeholder={statusForm.interviewStatus === "rejected" ? "Required. This reply will be sent in rejection email." : "Internal HR remarks"}
            />
          </label>
          <Button text="Save Assignment" type="submit" className="w-full" loading={savingAction === "status"} disabled={Boolean(savingAction)} />
          <p className="text-xs text-gray-500">
            Selected/Rejected can be marked anytime; round movement still follows the process bar order.
          </p>
          {candidate.interviewStatus === "selected" && !candidate.convertedEmployee && (
            <Button text="Add as Employee" variant="success" onClick={convertToEmployee} className="w-full" loading={savingAction === "convert"} disabled={Boolean(savingAction)} />
          )}
        </form>
        ) : (
          <aside className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <SectionHeader title="Status" />
            <p className="text-sm"><b>Current:</b> {roundLabels[candidate.interviewStatus] || candidate.interviewStatus}</p>
            <p className="text-sm"><b>Assigned To:</b> {candidate.assignedTo?.name || "Unassigned"}</p>
            <p className="text-sm"><b>HR Status:</b> {candidate.hrReview?.hrStatus || "pending"}</p>
            <p className="text-xs text-gray-500">Read-only access. HR manages candidate updates.</p>
          </aside>
        )}
      </section>

      {preview && (
        <FilePreviewModal
          title={preview.title}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

export default CandidateDetail;
