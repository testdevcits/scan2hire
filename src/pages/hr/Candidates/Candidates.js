import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { useCandidate } from "../../../contexts/Hr/CandidateContext";
import CommonTable from "../../../components/common/CommonTable";
import EmptyState from "../../../components/common/EmptyState";
import Pagination from "../../../components/common/Pagination";
import TableToolbar from "../../../components/common/TableToolbar";
import ViewSwitcher from "../../../components/common/ViewSwitcher";
import { AuthContext } from "../../../contexts/AuthContext";
import { useContext } from "react";
import { roundLabels } from "../../../utils/candidateInterview";

const formatDayKey = (candidate) => {
  const value = candidate.updatedAt || candidate.createdAt;
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Candidates() {
  const { candidates, loading, error, pagination, fetchCandidates } = useCandidate();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState("day");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchCandidates({ page, limit: pageSize, search });
    }, search.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [fetchCandidates, page, pageSize, search]);

  const columns = useMemo(() => [
    {
      header: "Name",
      accessor: "name",
      render: (value, row) => (
        <span className="inline-flex items-center gap-1.5">
          {row.otpVerified && <FiCheckCircle aria-label="Verified" className="h-4 w-4 shrink-0 text-[#f84525]" />}
          {value || "N/A"}
        </span>
      ),
    },
    { header: "Email", accessor: "email", render: (value) => <span className="break-all">{value || "N/A"}</span> },
    { header: "Mobile", accessor: "mobile" },
    { header: "Role", accessor: "jobRole" },
    { header: "Assigned To", accessor: "assignedTo", render: (value) => value?.name || "Unassigned" },
    {
      header: "Status",
      accessor: "interviewStatus",
      render: (value) => (
        <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
          {roundLabels[value] || value || "N/A"}
        </span>
      ),
    },
    {
      header: "Experience",
      accessor: "experience",
      render: (value, row) => row.experienceType === "fresher" ? "Fresher" : value == null ? "N/A" : `${value} yrs`,
    },
  ], []);

  const filteredCandidates = candidates;

  const paginationControls = useMemo(() => ({
    page: pagination.page || page,
    pageSize: pagination.limit || pageSize,
    setPage,
    setPageSize: (nextSize) => {
      setPageSize(Number(nextSize));
      setPage(1);
    },
    totalItems: pagination.totalItems || 0,
    totalPages: pagination.totalPages || 1,
  }), [pagination, page, pageSize]);

  const groupedCandidates = useMemo(() => filteredCandidates.reduce((groups, candidate) => {
    const key = formatDayKey(candidate);
    (groups[key] ||= []).push(candidate);
    return groups;
  }, {}), [filteredCandidates]);

  const sortedDays = useMemo(
    () => Object.keys(groupedCandidates).sort((a, b) => b.localeCompare(a)),
    [groupedCandidates]
  );

  const actions = useMemo(() => [{
    label: "View",
    className: "bg-[#f84525] text-white hover:bg-[#e93d20]",
    onClick: (row) => navigate(
      user?.role === "superadmin" ? `/admin/candidates/${row._id}` : `/hr/candidates/${row._id}`
    ),
  }], [navigate, user?.role]);

  const toolbar = (
    <TableToolbar
      value={search}
      onChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      label="Search candidates"
      placeholder="Name, email, mobile, role, interviewer, status..."
      summary={`Showing ${filteredCandidates.length} of ${pagination.totalItems || 0} candidates`}
      loading={loading}
      loadingText="Refreshing candidates…"
    />
  );

  return (
    <div className="space-y-4 p-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interview Candidates</h1>
          <p className="text-sm text-gray-500">Candidates are grouped by interview/update day for easy interview handling.</p>
        </div>
        <ViewSwitcher
          value={viewMode}
          onChange={setViewMode}
          options={[{ value: "day", label: "Day Wise" }, { value: "table", label: "Table" }]}
        />
      </div>

      {error && (
        <EmptyState
          variant="error"
          text={error}
          className="rounded-sm"
          action={(
            <button type="button" onClick={() => fetchCandidates({ page, limit: pageSize, search })} className="rounded-sm border border-red-200 bg-white px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50">
              Retry
            </button>
          )}
        />
      )}

      {viewMode === "table" ? (
        <CommonTable columns={columns} data={filteredCandidates} actions={actions} toolbar={toolbar} loading={loading} pagination={paginationControls} emptyText={error && candidates.length === 0 ? "Candidate list unavailable." : "No candidates match your search."} loadingText="Fetching candidates..." />
      ) : (
        <>
          <div className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {toolbar}
            {loading ? (
              <div className="py-6 text-center text-sm text-gray-500" role="status">Fetching candidates...</div>
            ) : sortedDays.length === 0 ? (
              <EmptyState text={error && candidates.length === 0 ? "Candidate list unavailable." : candidates.length ? "No candidates match your search." : "No candidates found."} />
            ) : (
              <div className="space-y-4 p-3">
                {sortedDays.map((day) => (
                  <section key={day} className="overflow-hidden rounded-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800">
                      <h2 className="font-semibold">
                        {day === "unknown" ? "Date unavailable" : new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                      </h2>
                      <span className="rounded-sm bg-[#fff5f3] px-2 py-1 text-xs font-semibold text-[#f84525] dark:bg-[#f84525]/10">
                        {groupedCandidates[day].length} Candidates
                      </span>
                    </div>
                    <CommonTable columns={columns} data={groupedCandidates[day]} actions={actions} showPagination={false} />
                  </section>
                ))}
              </div>
            )}
            {!loading && !error && sortedDays.length > 0 && <Pagination {...paginationControls} />}
          </div>
        </>
      )}
    </div>
  );
}

export default Candidates;
