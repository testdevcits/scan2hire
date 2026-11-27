/* eslint-disable */
import { useApi } from "../../../contexts/ApiContext";
import { useContext, useEffect, useRef, useState } from "react";
import {
  FiBarChart2,
  FiFileText,
  FiUser,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import CommonLoader from "../../../components/common/CommonLoader";
import EmptyState from "../../../components/common/EmptyState";
import FilePreviewModal from "../../../components/common/FilePreviewModal";
import SectionHeader from "../../../components/common/SectionHeader";
import Tabs from "../../../components/common/Tabs";
import { AuthContext } from "../../../contexts/AuthContext";
import { useEmployee } from "../../../contexts/Hr/EmployeeContext";
import { useModal } from "../../../contexts/ModalContext";
import { useToast } from "../../../contexts/ToastContext";
import CandidateAssignmentPanel from "./CandidateAssignmentPanel";
import CandidateInfoPanels from "./CandidateInfoPanels";
import CandidateInterviewProgress from "./CandidateInterviewProgress";
import { getAllowedStatuses, getCompletedRounds, getDefaultRoundType, roundLabels, roundOrder } from "../../../utils/candidateInterview";

const CandidateDetail = () => {
  const { authApi, hrApi } = useApi();
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
          options: ["Permanent", "Probation", "Intern"],
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
        employeeType: "Probation",
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
          <CandidateInterviewProgress candidate={candidate} />
        </div>
        <Tabs tabs={detailTabs} value={activeTab} onChange={setActiveTab} label="Candidate information" />
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CandidateInfoPanels candidate={candidate} activeTab={activeTab} onPreview={setPreview} />
        </div>
        {canReviewCandidate ? (
          <CandidateAssignmentPanel
            candidate={candidate}
            statusForm={statusForm}
            setStatusForm={setStatusForm}
            canManage={canManage}
            employees={employees}
            allowedStatuses={allowedStatuses}
            completedRounds={completedRounds}
            savingAction={savingAction}
            onSubmit={updateAssignment}
            onConvert={convertToEmployee}
          />
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
