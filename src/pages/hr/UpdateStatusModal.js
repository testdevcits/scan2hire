import { useState } from "react";
import API from "../../api/axios";

function UpdateStatusModal({ candidate, onClose, refresh }) {
  const [status, setStatus] = useState("");
  const [hrStatus, setHrStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setLoading(true);

      await API.put(`/candidates/${candidate._id}/status`, {
        interviewStatus: status,
        hrStatus: hrStatus,
        assignedTo: assignedTo,
        remarks: remarks,
      });

      alert("Status Updated");
      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error updating status");
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
            <option value="First Round">First Round</option>
            <option value="Second Round">Second Round</option>
            <option value="Final Round">Final Round</option>
            <option value="Rejected">Rejected</option>
            <option value="Selected">Selected</option>
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
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Shortlisted">Shortlisted</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">
            Assign Interviewer (Second Round)
          </label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Enter interviewer name"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Remarks</label>
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Add notes..."
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
