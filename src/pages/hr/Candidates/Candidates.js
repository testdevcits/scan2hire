import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { useCandidate } from "../../../contexts/Hr/CandidateContext";
import { useEmployee } from "../../../contexts/Hr/EmployeeContext";
import CommonTable from "../CommonTable.js";
import CommonLoader from "../../../components/common/CommonLoader.js";
import { AuthContext } from "../../../contexts/AuthContext";

function Candidates() {
  const { candidates, loading, error, fetchCandidates } = useCandidate();
  const { fetchEmployees } = useEmployee();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState("day");

  useEffect(() => {
    fetchCandidates();
    fetchEmployees();
    // eslint-disable-next-line
  }, []);

  const InstaBlueTick = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
      {/* Star-like background */}
      <path
        fill="#f84525"
        d="M12 2.5l2.2 1.3 2.5-.2 1.3 2.2 2.2 1.3-.2 2.5 1.3 2.2-1.3 2.2.2 2.5-2.2 1.3-1.3 2.2-2.5-.2L12 21.5l-2.2-1.3-2.5.2-1.3-2.2-2.2-1.3.2-2.5-1.3-2.2 1.3-2.2-.2-2.5 2.2-1.3 1.3-2.2 2.5.2L12 2.5z"
      />

      {/* White check */}
      <path fill="#fff" d="M10 14.2l-2.2-2.2-1.2 1.2L10 16.6l6-6-1.2-1.2z" />
    </svg>
  );

  const columns = [
    {
      header: "Name",
      accessor: "name",
      render: (value, row) => (
        <div className="flex items-center gap-1">
          {row.otpVerified && <InstaBlueTick />}
          <span>{value}</span>
        </div>
      ),
    },
    { header: "Email", accessor: "email", render: (value) => <span className="break-all">{value}</span> },
    { header: "Mobile", accessor: "mobile" },
    { header: "Role", accessor: "jobRole" },
    {
      header: "Assigned To",
      accessor: "assignedTo",
      render: (value) => value?.name || "Unassigned",
    },
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

  const groupedCandidates = useMemo(() => {
    return candidates.reduce((acc, candidate) => {
      const dateKey = new Date(candidate.updatedAt || candidate.createdAt).toISOString().slice(0, 10);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(candidate);
      return acc;
    }, {});
  }, [candidates]);

  const sortedDays = useMemo(
    () => Object.keys(groupedCandidates).sort((a, b) => new Date(b) - new Date(a)),
    [groupedCandidates]
  );

  const actions = [
    {
      label: "View",
      className: "bg-[#f84525] text-white",
      onClick: (row) => {
        navigate(
          user?.role === "superadmin"
            ? `/admin/candidates/${row._id}`
            : `/hr/candidates/${row._id}`
        );
      },
    },
  ];

  if (loading) return <CommonLoader text="Fetching candidates..." />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="relative space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Interview Candidates</h1>
          <p className="text-sm text-gray-500">Candidates are grouped by interview/update day for easy interview handling.</p>
        </div>
        <div className="bg-white border rounded-sm p-1 flex">
          <button
            className={`px-3 py-2 text-sm font-semibold rounded-sm ${viewMode === "day" ? "bg-[#f84525] text-white" : "text-gray-600"}`}
            onClick={() => setViewMode("day")}
          >
            Day Wise
          </button>
          <button
            className={`px-3 py-2 text-sm font-semibold rounded-sm ${viewMode === "table" ? "bg-[#f84525] text-white" : "text-gray-600"}`}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
        </div>
      </div>
      {viewMode === "table" ? (
        <CommonTable columns={columns} data={candidates} actions={actions} />
      ) : sortedDays.length === 0 ? (
        <div className="bg-white rounded-sm shadow p-6 text-center text-gray-500">No candidates found</div>
      ) : (
        <div className="space-y-4">
          {sortedDays.map((day) => (
            <section key={day} className="bg-white rounded-sm shadow overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold">{new Date(day).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</h2>
                <span className="text-xs bg-[#fff5f3] text-[#f84525] px-2 py-1 rounded-sm font-semibold">
                  {groupedCandidates[day].length} Candidates
                </span>
              </div>
              <CommonTable columns={columns} data={groupedCandidates[day]} actions={actions} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default Candidates;
