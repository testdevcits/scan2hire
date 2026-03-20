import { useEffect } from "react";
import { useCandidate } from "../../../contexts/Hr/CandidateContext";
import CommonTable from "../CommonTable.js";
import CommonLoader from "../../../components/common/CommonLoader.js";

function Candidates() {
  const { candidates, loading, error, fetchCandidates } = useCandidate();

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
        console.log("View Candidate:", row);
      },
    },
    {
      label: "Delete",
      className: "bg-red-500 text-white",
      onClick: (row) => {
        console.log("Delete Candidate:", row);
      },
    },
  ];

  if (loading) return <CommonLoader text="Fetching candidates..." />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Candidates List</h1>

      <CommonTable columns={columns} data={candidates} actions={actions} />
    </div>
  );
}

export default Candidates;
