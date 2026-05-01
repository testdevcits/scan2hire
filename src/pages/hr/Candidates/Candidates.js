import { useEffect } from "react";
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
    <div className="relative">
      <h1 className="text-xl font-bold mb-4">Candidates List</h1>
      <CommonTable columns={columns} data={candidates} actions={actions} />
    </div>
  );
}

export default Candidates;
