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
    interviewStatus: "first_round",
    roundType: "technical",
    hrStatus: "pending",
    assignedTo: "",
    remarks: "",
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
        interviewStatus: data.interviewStatus || "first_round",
        roundType: "technical",
        hrStatus: data.hrReview?.hrStatus || "pending",
        assignedTo: data.assignedTo?._id || "",
        remarks: data.remarks || "",
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
    try {
      await hrApi.updateCandidateStatus(candidateId, {
        ...statusForm,
      });
      toast.success("Candidate updated. Assigned employee will receive email.");
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-sm text-gray-500">
            {candidate.candidateId} • {candidate.jobRole || "No role"} • {candidate.interviewStatus}
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-sm shadow p-4 lg:col-span-2">
          <h2 className="font-semibold mb-3">Candidate Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><b>Email:</b> {formatValue(candidate.email)}</p>
            <p><b>Mobile:</b> {formatValue(candidate.mobile)}</p>
            <p><b>Qualification:</b> {formatValue(candidate.qualification)}</p>
            <p><b>Experience:</b> {candidate.experienceType === "fresher" ? "Fresher" : `${formatValue(candidate.experience)} yrs`}</p>
            <p><b>Company:</b> {formatValue(candidate.currentCompany)}</p>
            <p><b>Expected Salary:</b> {formatValue(candidate.expectedSalary)}</p>
            <p><b>Skills:</b> {formatValue(candidate.skills)}</p>
            <p><b>Framework:</b> {formatValue(candidate.framework)}</p>
            <p><b>CMS:</b> {formatValue(candidate.cms)}</p>
            <p><b>Certificate:</b> {candidate.certificateName || (candidate.certificate ? "Uploaded" : "N/A")}</p>
          </div>
        </div>

        <form onSubmit={updateAssignment} className="bg-white rounded-sm shadow p-4 space-y-3">
          <h2 className="font-semibold">Assign & Status</h2>
          <label className="block text-sm font-medium">
            Interview Status
            <select
              value={statusForm.interviewStatus}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, interviewStatus: e.target.value }))}
              className="mt-1 w-full border rounded-sm px-3 py-2"
            >
              <option value="first_round">First Round</option>
              <option value="second_round">Second Round</option>
              <option value="third_round">Third Round</option>
              <option value="final">Final</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Round Type
            <select
              value={statusForm.roundType}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, roundType: e.target.value }))}
              className="mt-1 w-full border rounded-sm px-3 py-2"
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
            >
              <option value="">Unassigned</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} - {employee.designation || employee.employeeId}
                </option>
              ))}
            </select>
          </label>
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
            />
          </label>
          <Button text="Save Assignment" type="submit" className="w-full" />
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
              <span>{round.round}</span>
              <span>{round.roundType || "technical"}</span>
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
