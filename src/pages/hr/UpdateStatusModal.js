import { useState } from "react";
import { hrApi } from "../../api";
import { useEmployee } from "../../contexts/Hr/EmployeeContext";
import { useToast } from "../../contexts/ToastContext";

function UpdateStatusModal({ candidate, onClose, refresh }) {
  const { employees } = useEmployee();
  const toast = useToast();
  const [status, setStatus] = useState(candidate?.interviewStatus || "");
  const [hrStatus, setHrStatus] = useState(candidate?.hrReview?.hrStatus || "");
  const [assignedTo, setAssignedTo] = useState(candidate?.assignedTo?._id || "");
  const [assignedRoundType, setAssignedRoundType] = useState(
    candidate?.currentRoundType || "technical"
  );
  const [reviewRoundType, setReviewRoundType] = useState("hr");
  const [reviewComments, setReviewComments] = useState("");
  const [remarks, setRemarks] = useState("");
  const [score, setScore] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const payload = {
        interviewStatus: status,
        hrStatus,
        assignedTo,
        assignedRoundType,
        remarks,
      };

      if (score !== "" || reviewComments.trim()) {
        payload.score = score;
        payload.comments = reviewComments;
        payload.round = candidate?.interviewStatus || status;
        payload.roundType = reviewRoundType;
      }

      await hrApi.updateCandidateStatus(candidate._id, payload);

      toast.success("Status updated");
      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 ">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg border-2 border-[#f84525]">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-lg font-semibold">Update Status</h2>
          <p className="text-lg font-semibold">{candidate?.name}</p>
        </div>

        {/* Interview Status */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Interview Status</label>
          <select
            className="w-full border p-2 rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Select</option>
            <option value="first_round">First Round</option>
            <option value="second_round">Second Round</option>
            <option value="third_round">Third Round</option>
            <option value="final">Final Round</option>
            <option value="rejected">Rejected</option>
            <option value="selected">Selected</option>
          </select>
        </div>

        {/* HR Status */}
        <div className="mb-3">
          <label className="block text-sm mb-1">HR Status</label>
          <select
            className="w-full border p-2 rounded"
            value={hrStatus}
            onChange={(e) => setHrStatus(e.target.value)}
          >
            <option value="">Select</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">
            Assign Interviewer
          </label>
          <select
            className="w-full border p-2 rounded"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Unassigned</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name} - {employee.designation || employee.employeeId}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Assigned Round Type</label>
          <select
            className="w-full border p-2 rounded"
            value={assignedRoundType}
            onChange={(e) => setAssignedRoundType(e.target.value)}
          >
            <option value="technical">Technical Round</option>
            <option value="machine_test">Machine Test</option>
            <option value="ui_ux">UI/UX Review</option>
            <option value="testing">Testing Round</option>
            <option value="hr">HR Round</option>
            <option value="project_coordinator">Project Coordinator</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-sm">
            HR Review Type
            <select
              className="mt-1 w-full border p-2 rounded"
              value={reviewRoundType}
              onChange={(e) => setReviewRoundType(e.target.value)}
            >
              <option value="hr">HR Round</option>
              <option value="technical">Technical Round</option>
              <option value="machine_test">Machine Test</option>
              <option value="ui_ux">UI/UX Review</option>
              <option value="testing">Testing Round</option>
              <option value="project_coordinator">Project Coordinator</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm">
            Score /10
            <input
              type="number"
              min="0"
              max="10"
              className="mt-1 w-full border p-2 rounded"
              placeholder="0-10"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </label>
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">HR Review Comments</label>
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Add HR review only when completing a round..."
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Remarks / Assignment Notes</label>
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Add assignment notes..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="flex items-center space-x-2 bg-gray-600 hover:bg-primary/80 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 w-full justify-center"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 w-full justify-center"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateStatusModal;
