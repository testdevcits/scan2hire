import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { hrApi } from "../../../api";
import Button from "../../../components/common/Button";
import CommonLoader from "../../../components/common/CommonLoader";
import { AuthContext } from "../../../contexts/AuthContext";
import { useEmployee } from "../../../contexts/Hr/EmployeeContext";
import { useModal } from "../../../contexts/ModalContext";
import { useToast } from "../../../contexts/ToastContext";

const formatValue = (value) => {
  if (!value) return "N/A";
  if (Array.isArray(value)) return value.join(", ");
  return value;
};

const roundOrder = ["hr_round", "first_round", "second_round"];
const roundLabels = {
  hr_round: "HR Round",
  first_round: "Technical Round",
  second_round: "Machine Test",
  selected: "Selected",
  rejected: "Rejected",
};

const getAllowedStatuses = (candidate) => {
  const completed = new Set(
    (candidate?.interviewRounds || [])
      .filter((round) => round.status === "completed")
      .map((round) => round.round)
  );
  const allowed = ["selected", "rejected"];
  for (const status of roundOrder) {
    if (status === "hr_round") {
      allowed.push(status);
      if (!completed.has(status)) break;
      continue;
    }
    const previous = roundOrder[roundOrder.indexOf(status) - 1];
    if (!completed.has(previous)) break;
    allowed.push(status);
    if (!completed.has(status)) break;
  }

  return allowed;
};

const getDefaultRoundType = (status) => {
  if (status === "hr_round") return "hr";
  if (status === "second_round") return "machine_test";
  return "technical";
};

const getCompletedRounds = (candidate) =>
  new Set(
    (candidate?.interviewRounds || [])
      .filter((round) => round.status === "completed")
      .map((round) => round.round)
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
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusForm, setStatusForm] = useState({
    interviewStatus: "hr_round",
    roundType: "hr",
    hrStatus: "pending",
    assignedTo: "",
    remarks: "",
    score: "",
    comments: "",
  });

  const loadCandidate = async () => {
    setLoading(true);
    try {
      const [candidateRes] = await Promise.all([
        hrApi.getCandidate(candidateId),
        fetchEmployees(),
      ]);
      const data = candidateRes.data.data;
      setCandidate(data);
      setStatusForm({
        interviewStatus: data.interviewStatus || "hr_round",
        roundType: data.currentRoundType || (data.interviewStatus === "hr_round" ? "hr" : "technical"),
        hrStatus: data.hrReview?.hrStatus || "pending",
        assignedTo: data.assignedTo?._id || "",
        remarks: data.remarks || "",
        score: "",
        comments: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load candidate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidate();
    // eslint-disable-next-line
  }, [candidateId]);

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

    if (["first_round", "second_round"].includes(statusForm.interviewStatus) && !statusForm.assignedTo) {
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

      await hrApi.updateCandidateStatus(candidateId, payload);
      toast.success("Candidate updated");
      await loadCandidate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update candidate");
    }
  };

  const convertToEmployee = async () => {
    const values = await confirm({
      title: "Add Candidate as Employee",
      message: `Create employee login for ${candidate?.name}.`,
      confirmText: "Create Employee",
      fields: [
        { name: "designation", label: "Designation", required: true },
        { name: "department", label: "Department", required: true },
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
        department: "Technology",
        employeeType: "Permanent",
      },
    });

    if (!values) return;

    try {
      await hrApi.convertCandidateToEmployee(candidateId, values);
      toast.success("Candidate converted to employee");
      await loadCandidate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to convert candidate");
    }
  };

  const deactivateCandidate = async () => {
    const ok = await confirm({
      title: "Deactivate Candidate",
      message: "This will mark candidate inactive and rejected.",
      confirmText: "Deactivate",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await hrApi.deactivateCandidate(candidateId);
      toast.success("Candidate deactivated");
      await loadCandidate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to deactivate");
    }
  };

  const activateCandidate = async () => {
    try {
      await hrApi.activateCandidate(candidateId);
      toast.success("Candidate activated");
      await loadCandidate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to activate");
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
      await hrApi.deleteCandidate(candidateId);
      toast.success("Candidate deleted");
      navigate(user?.role === "superadmin" ? "/admin/candidates" : "/hr/candidates/list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete");
    }
  };

  if (loading) return <CommonLoader text="Loading candidate..." />;
  if (!candidate) return <p className="text-red-500">Candidate not found</p>;
  const allowedStatuses = getAllowedStatuses(candidate);
  const completedRounds = getCompletedRounds(candidate);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-sm text-gray-500">
            {candidate.candidateId} • {candidate.jobRole || "No role"} • {roundLabels[candidate.interviewStatus] || candidate.interviewStatus}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button text="Back" variant="secondary" onClick={() => navigate(-1)} />
          {candidate.isActive ? (
            <Button text="Deactivate" variant="danger" onClick={deactivateCandidate} />
          ) : (
            <Button text="Activate" variant="success" onClick={activateCandidate} />
          )}
          {user?.role === "superadmin" && (
            <Button text="Delete" variant="danger" onClick={deleteCandidate} />
          )}
        </div>
      </div>

      <section className="bg-white rounded-sm shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {roundOrder.map((status, index) => {
            const completed = completedRounds.has(status);
            const active = candidate.interviewStatus === status && !completed;
            return (
              <div key={status} className="relative">
                <div className={`h-2 rounded-sm mb-2 ${completed ? "bg-green-500" : active ? "bg-[#f84525]" : "bg-gray-200"}`} />
                <p className={`text-sm font-semibold ${completed ? "text-green-700" : active ? "text-[#f84525]" : "text-gray-500"}`}>
                  {index + 1}. {roundLabels[status]}
                </p>
                <p className="text-xs text-gray-500">
                  {completed ? "Completed" : active ? "Current" : "Pending"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Round flow follows HR Round, Technical Round, then Machine Test. Selected/Rejected can be marked anytime.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-sm shadow p-4 lg:col-span-2">
          <h2 className="font-semibold mb-3">Candidate Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><b>Email:</b> {formatValue(candidate.email)}</p>
            <p><b>Mobile:</b> {formatValue(candidate.mobile)}</p>
            <p><b>Alt Mobile:</b> {formatValue(candidate.altMobile)}</p>
            <p><b>Qualification:</b> {formatValue(candidate.qualification)}</p>
            <p><b>Branch:</b> {formatValue(candidate.branch)}</p>
            <p><b>Experience:</b> {candidate.experienceType === "fresher" ? "Fresher" : `${formatValue(candidate.experience)} yrs`}</p>
            <p><b>Company:</b> {formatValue(candidate.currentCompany)}</p>
            <p><b>Current Salary:</b> {salaryText(candidate.currentSalary, candidate.currentSalaryPeriod)}</p>
            <p><b>Expected Salary:</b> {salaryText(candidate.expectedSalary, candidate.expectedSalaryPeriod)}</p>
            <p><b>Night Shift:</b> {formatValue(candidate.nightShift)}</p>
            <p><b>Reference:</b> {candidate.referenceName ? `${candidate.referenceName} (${candidate.referenceMobile || "N/A"})` : "N/A"}</p>
            <p><b>Skills:</b> {formatValue(candidate.skills)}</p>
            <p><b>Framework:</b> {formatValue(candidate.framework)}</p>
            <p><b>CMS:</b> {formatValue(candidate.cms)}</p>
            <p><b>Certificate:</b> {candidate.certificateName || (candidate.certificate ? "Uploaded" : "N/A")}</p>
            <p><b>Resume:</b> {candidate.resumeName || (candidate.resume ? "Uploaded" : "N/A")}</p>
          </div>
        </div>

        <form onSubmit={updateAssignment} className="bg-white rounded-sm shadow p-4 space-y-3">
          <h2 className="font-semibold">Assign & Status</h2>
          <label className="block text-sm font-medium">
            Interview Status
            <select
              value={statusForm.interviewStatus}
              onChange={(e) =>
                setStatusForm((prev) => ({
                  ...prev,
                  interviewStatus: e.target.value,
                  roundType: getDefaultRoundType(e.target.value),
                  assignedTo: e.target.value === "hr_round" ? "" : prev.assignedTo,
                }))
              }
              className="mt-1 w-full border rounded-sm px-3 py-2"
            >
              {["hr_round", "first_round", "second_round", "selected", "rejected"].map((status) => (
                <option key={status} value={status} disabled={!allowedStatuses.includes(status)}>
                  {roundLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Round Type
            <select
              value={statusForm.roundType}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, roundType: e.target.value }))}
              className="mt-1 w-full border rounded-sm px-3 py-2"
              disabled
            >
              <option value="technical">Technical Round</option>
              <option value="machine_test">Machine Test</option>
              <option value="ui_ux">UI/UX Review</option>
              <option value="testing">Testing Round</option>
              <option value="hr">HR Round</option>
              <option value="project_coordinator">Project Coordinator</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Assign Employee
            <select
              value={statusForm.assignedTo}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
              className="mt-1 w-full border rounded-sm px-3 py-2"
              disabled={statusForm.interviewStatus === "hr_round" || ["selected", "rejected"].includes(statusForm.interviewStatus)}
            >
              <option value="">{statusForm.interviewStatus === "hr_round" ? "HR will complete this round" : "Unassigned"}</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} - {employee.designation || employee.employeeId}
                </option>
              ))}
            </select>
          </label>
          {candidate.interviewStatus === "hr_round" && !completedRounds.has("hr_round") && (
            <div className="grid grid-cols-1 gap-3 border-t pt-3">
              <label className="block text-sm font-medium">
                HR Round Score /10
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={statusForm.score}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, score: e.target.value }))}
                  className="mt-1 w-full border rounded-sm px-3 py-2"
                  placeholder="Add score to complete HR Round"
                />
              </label>
              <label className="block text-sm font-medium">
                HR Round Comments
                <textarea
                  value={statusForm.comments}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, comments: e.target.value }))}
                  className="mt-1 w-full border rounded-sm px-3 py-2"
                  placeholder="HR screening notes"
                />
              </label>
            </div>
          )}
          <label className="block text-sm font-medium">
            HR Status
            <select
              value={statusForm.hrStatus}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, hrStatus: e.target.value }))}
              className="mt-1 w-full border rounded-sm px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Remarks
            <textarea
              value={statusForm.remarks}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, remarks: e.target.value }))}
              className="mt-1 w-full border rounded-sm px-3 py-2"
              placeholder={statusForm.interviewStatus === "rejected" ? "Required. This reply will be sent in rejection email." : "Internal HR remarks"}
            />
          </label>
          <Button text="Save Assignment" type="submit" className="w-full" />
          <p className="text-xs text-gray-500">
            Selected/Rejected can be marked anytime; round movement still follows the process bar order.
          </p>
          {candidate.interviewStatus === "selected" && !candidate.convertedEmployee && (
            <Button text="Add as Employee" variant="success" onClick={convertToEmployee} className="w-full" />
          )}
        </form>
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Interview Reports</h2>
        </div>
        {candidate.interviewRounds?.length ? (
          candidate.interviewRounds.map((round, index) => (
            <div key={`${round.round}-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-2 border-t px-4 py-3 text-sm">
              <span>{roundLabels[round.round] || round.round}</span>
              <span>{round.roundType?.replace("_", " ") || "technical"}</span>
              <span>{round.interviewer || "N/A"}</span>
              <span>Score: {round.score || 0}</span>
              <span>{round.status}</span>
              <span>{round.comments || "-"}</span>
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-gray-500">No interview report added yet.</p>
        )}
      </section>
    </div>
  );
};

export default CandidateDetail;
