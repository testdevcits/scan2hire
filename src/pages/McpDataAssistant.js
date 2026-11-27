import { useMemo, useState } from "react";
import { FiBriefcase, FiCalendar, FiSearch, FiUsers } from "react-icons/fi";
import { mcpApi } from "../api/mcpApi";

const todayMonth = () => new Date().toISOString().slice(0, 7);

const emptyState = { loading: false, error: "", data: null };

const AssistantCard = ({ icon, title, description, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start gap-3">
      <span className="rounded-xl bg-[#fff1ed] p-3 text-xl text-[#f84525]">{icon}</span>
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const Status = ({ state, emptyMessage, children }) => {
  if (state.loading) return <p className="py-6 text-center text-sm text-gray-500">Searching secure data…</p>;
  if (state.error) return <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>;
  if (state.data && !children) return <p className="py-6 text-center text-sm text-gray-500">{emptyMessage}</p>;
  return children || null;
};

const SearchInput = ({ value, onChange, onSubmit, placeholder, disabled }) => (
  <form onSubmit={onSubmit} className="flex gap-2">
    <label className="sr-only">Search</label>
    <div className="relative min-w-0 flex-1">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#f84525] focus:ring-2 focus:ring-[#f84525]/15"
      />
    </div>
    <button disabled={disabled || !value.trim()} className="rounded-lg bg-[#f84525] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
      Search
    </button>
  </form>
);

export default function McpDataAssistant() {
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [candidateQuery, setCandidateQuery] = useState("");
  const [month, setMonth] = useState(todayMonth);
  const [employeeState, setEmployeeState] = useState(emptyState);
  const [candidateState, setCandidateState] = useState(emptyState);
  const [leaveState, setLeaveState] = useState(emptyState);

  const leaveTotal = useMemo(() => Object.values(leaveState.data?.counts || {}).reduce((total, count) => total + count, 0), [leaveState.data]);

  const load = async (setState, request) => {
    setState({ loading: true, error: "", data: null });
    try {
      setState({ loading: false, error: "", data: await request() });
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.message || error.message || "Unable to load data.", data: null });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-2 pb-8 sm:px-3">
      <header className="mb-5 rounded-2xl border border-[#ffd8cf] bg-gradient-to-r from-white to-[#fff5f2] px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f84525]">Secure workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">HR Data Assistant</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">Search employee and candidate data, or check leave totals. Results use your existing HR/Admin permissions and this page does not change any records.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <AssistantCard icon={<FiUsers />} title="Find employees" description="Search name, ID, email, mobile, department or designation.">
          <SearchInput value={employeeQuery} onChange={setEmployeeQuery} disabled={employeeState.loading} placeholder="Example: Ganesh or Graphic Designer" onSubmit={(event) => { event.preventDefault(); load(setEmployeeState, () => mcpApi.searchEmployees(employeeQuery.trim())); }} />
          <Status state={employeeState} emptyMessage="No employees match this search.">
            {employeeState.data && (employeeState.data.employees || []).length > 0 && <div className="mt-4 divide-y rounded-xl border border-gray-100">{employeeState.data.employees.map((employee) => <div key={employee._id} className="px-4 py-3 text-sm"><p className="font-semibold text-gray-900">{employee.name} <span className="font-normal text-gray-500">· {employee.employeeId}</span></p><p className="mt-1 text-gray-500">{[employee.designation, employee.department, employee.email, employee.mobile].filter(Boolean).join(" · ")}</p></div>)}</div>}
          </Status>
        </AssistantCard>

        <AssistantCard icon={<FiBriefcase />} title="Find candidates" description="Search candidate name, ID or job role and see their interview status.">
          <SearchInput value={candidateQuery} onChange={setCandidateQuery} disabled={candidateState.loading} placeholder="Example: React developer" onSubmit={(event) => { event.preventDefault(); load(setCandidateState, () => mcpApi.searchCandidates(candidateQuery.trim())); }} />
          <Status state={candidateState} emptyMessage="No candidates match this search.">
            {candidateState.data && (candidateState.data.candidates || []).length > 0 && <div className="mt-4 divide-y rounded-xl border border-gray-100">{candidateState.data.candidates.map((candidate) => <div key={candidate._id} className="px-4 py-3 text-sm"><p className="font-semibold text-gray-900">{candidate.name} <span className="font-normal text-gray-500">· {candidate.candidateId || "No ID"}</span></p><p className="mt-1 text-gray-500">{[candidate.jobRole, candidate.interviewStatus || "Status unavailable"].filter(Boolean).join(" · ")}</p></div>)}</div>}
          </Status>
        </AssistantCard>

        <AssistantCard icon={<FiCalendar />} title="Leave summary" description="Pending, approved and rejected requests for a selected month.">
          <form onSubmit={(event) => { event.preventDefault(); load(setLeaveState, () => mcpApi.getLeaveSummary(month)); }} className="flex gap-2">
            <label className="sr-only" htmlFor="leave-summary-month">Month</label>
            <input id="leave-summary-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#f84525] focus:ring-2 focus:ring-[#f84525]/15" />
            <button disabled={leaveState.loading} className="rounded-lg bg-[#f84525] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">View</button>
          </form>
          <Status state={leaveState}>
            {leaveState.data && <div className="mt-4 grid grid-cols-3 gap-3"><div className="rounded-xl bg-amber-50 p-3 text-center"><p className="text-xs text-amber-700">Pending</p><p className="mt-1 text-xl font-bold text-amber-800">{leaveState.data.counts?.pending || 0}</p></div><div className="rounded-xl bg-green-50 p-3 text-center"><p className="text-xs text-green-700">Approved</p><p className="mt-1 text-xl font-bold text-green-800">{leaveState.data.counts?.approved || 0}</p></div><div className="rounded-xl bg-red-50 p-3 text-center"><p className="text-xs text-red-700">Rejected</p><p className="mt-1 text-xl font-bold text-red-800">{leaveState.data.counts?.rejected || 0}</p></div><p className="col-span-3 text-center text-xs text-gray-500">{leaveTotal} total leave request{leaveTotal === 1 ? "" : "s"}</p></div>}
          </Status>
        </AssistantCard>
      </div>
    </div>
  );
}
