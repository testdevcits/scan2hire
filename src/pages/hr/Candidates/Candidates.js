import { useEffect, useState } from "react";
import { useCandidate } from "../../../contexts/Hr/CandidateContext";
import CommonTable from "../CommonTable.js";
import CommonLoader from "../../../components/common/CommonLoader.js";
import UpdateStatusModal from "../UpdateStatusModal.js";

function Candidates() {
  const { candidates, loading, error, fetchCandidates } = useCandidate();

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line
  }, []);

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Mobile", accessor: "mobile" },
    { header: "Role", accessor: "jobRole" },
    {
      header: "Status",
      accessor: "interviewStatus",
      render: (value) => (
        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
          {value}
        </span>
      ),
    },
    {
      header: "Experience",
      accessor: "experience",
      render: (val) => `${val} yrs`,
    },
  ];

  const actions = [
    {
      label: "View",
      className: "bg-green-500 text-white",
      onClick: (row) => {
        setSelectedCandidate(row);
        setIsDrawerOpen(true);
      },
    },
  ];

  const formatValue = (val) => {
    if (!val) return "N/A";
    if (Array.isArray(val)) return val.join(", ");
    return val;
  };

  if (loading) return <CommonLoader text="Fetching candidates..." />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="relative p-3 md:p-6">
      <h1 className="text-xl font-bold mb-4">Candidates List</h1>

      <CommonTable columns={columns} data={candidates} actions={actions} />

      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-xl transform transition-transform duration-300 z-50 ${
          isDrawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Drag line */}
        <div
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2"
          onClick={() => setIsDrawerOpen(false)}
        ></div>

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Candidate Details</h2>
          <button onClick={() => setIsDrawerOpen(false)}>✖</button>
        </div>

        {/* Content */}
        {selectedCandidate && (
          <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh] text-sm">
            {/* Basic */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <h3 className="font-semibold mb-2">Basic Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <p>
                  <strong>Name:</strong> {formatValue(selectedCandidate.name)}
                </p>
                <p>
                  <strong>Email:</strong> {formatValue(selectedCandidate.email)}
                </p>
                <p>
                  <strong>Mobile:</strong>{" "}
                  {formatValue(selectedCandidate.mobile)}
                </p>
                <p>
                  <strong>Alt Mobile:</strong>{" "}
                  {formatValue(selectedCandidate.altMobile)}
                </p>
              </div>
            </div>
            {/* Professional */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <h3 className="font-semibold mb-2">Professional</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <p>
                  <strong>Role:</strong>{" "}
                  {formatValue(selectedCandidate.jobRole)}
                </p>
                <p>
                  <strong>Experience:</strong>{" "}
                  {formatValue(selectedCandidate.experience)} yrs
                </p>
                <p>
                  <strong>Company:</strong>{" "}
                  {formatValue(selectedCandidate.currentCompany)}
                </p>
                <p>
                  <strong>Night Shift:</strong>{" "}
                  {formatValue(selectedCandidate.nightShift)}
                </p>
                <p>
                  <strong>Current Salary:</strong> ₹
                  {formatValue(selectedCandidate.currentSalary)}
                </p>
                <p>
                  <strong>Expected Salary:</strong> ₹
                  {formatValue(selectedCandidate.expectedSalary)}
                </p>
              </div>
            </div>
            {/* Skills */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <h3 className="font-semibold mb-2">Skills</h3>
              <p>
                <strong>Main:</strong> {formatValue(selectedCandidate.skills)}
              </p>
              <p>
                <strong>Frameworks:</strong>{" "}
                {formatValue(selectedCandidate.framework)}
              </p>
              <p>
                <strong>CMS:</strong> {formatValue(selectedCandidate.cms)}
              </p>
            </div>
            {/* HR */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <h3 className="font-semibold mb-2">HR Info</h3>

              <p>
                <strong>HR Status:</strong>{" "}
                {formatValue(selectedCandidate.hrReview?.hrStatus)}
              </p>

              <p>
                <strong>Interview Status:</strong>{" "}
                {formatValue(selectedCandidate.interviewStatus)}
              </p>
            </div>
            {/* Other */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <h3 className="font-semibold mb-2">Other Info</h3>
              <p>
                <strong>Qualification:</strong>{" "}
                {formatValue(selectedCandidate.qualification)}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(selectedCandidate.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="border-2 border-[#f84525] rounded-lg p-3 bg-blue-50">
              <h3 className="font-semibold mb-2 text-[#f84525]">
                Reference Details
              </h3>
              <p>
                <strong>Name:</strong>{" "}
                {formatValue(selectedCandidate.referenceName)}
              </p>
              <p>
                <strong>Mobile:</strong>{" "}
                {formatValue(selectedCandidate.referenceMobile)}
              </p>
            </div>{" "}
            <button
              className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white font-medium py-3 px-2 mt-2 rounded-xl transition-all duration-300 w-full justify-center"
              onClick={() => setIsStatusModalOpen(true)}
            >
              Update Status
            </button>
          </div>
        )}
      </div>
      {isStatusModalOpen && (
        <UpdateStatusModal
          candidate={selectedCandidate}
          onClose={() => setIsStatusModalOpen(false)}
          refresh={fetchCandidates}
        />
      )}
    </div>
  );
}

export default Candidates;
