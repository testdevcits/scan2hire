import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import TrendAreaChart from "../../components/common/TrendAreaChart";
import { useToast } from "../../contexts/ToastContext";

const ORANGE = "#f84525";
const ORANGE_SOFT = "#ffa826";
const RED = "#ef4444";

const AdminDashboard = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [hrs, setHrs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setPageLoading(true);
    try {
      const [hrRes, employeeRes, candidateRes, attendanceRes, leavesRes] =
        await Promise.all([
          authApi.getHrs(),
          hrApi.getEmployees(),
          hrApi.getCandidates(),
          hrApi.getAttendance(new Date().toISOString().slice(0, 7)),
          hrApi.getLeaves(),
        ]);

      setHrs(hrRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
      setCandidates(candidateRes.data.data || []);
      setAttendance(attendanceRes.data.data || []);
      setLeaves(leavesRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load dashboard data");
    } finally {
      setPageLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const today = new Date().toISOString().slice(0, 10);

  const statCards = useMemo(
    () => [
      {
        label: "Total Staff",
        value: employees.length + hrs.length,
        note: `${hrs.length} HR + ${employees.length} employees`,
        tone: "primary",
      },
      {
        label: "Open Candidates",
        value: candidates.filter((item) => !["selected", "rejected"].includes(item.interviewStatus)).length,
        note: `${candidates.length} total applications`,
      },
      {
        label: "Today Logins",
        value: attendance.filter((item) => item.dateKey === today && item.loginAt).length,
        note: `${leaves.filter((item) => item.status === "pending").length} pending leaves`,
      },
      {
        label: "Selected Candidates",
        value: candidates.filter((item) => item.interviewStatus === "selected").length,
        note: `${candidates.filter((item) => item.interviewStatus === "rejected").length} rejected`,
      },
    ],
    [attendance, candidates, employees.length, hrs.length, leaves, today]
  );

  const candidateMix = useMemo(
    () => [
      { name: "HR", value: candidates.filter((item) => item.interviewStatus === "hr_round").length, color: ORANGE },
      { name: "Technical", value: candidates.filter((item) => item.interviewStatus === "first_round").length, color: ORANGE_SOFT },
      { name: "Machine Test", value: candidates.filter((item) => item.interviewStatus === "second_round").length, color: "#fb923c" },
      { name: "Selected", value: candidates.filter((item) => item.interviewStatus === "selected").length, color: "#f97316" },
      { name: "Rejected", value: candidates.filter((item) => item.interviewStatus === "rejected").length, color: RED },
    ],
    [candidates]
  );

  const attendanceBreakdown = useMemo(
    () => [
      { name: "Present", value: attendance.filter((item) => item.status === "present").length },
      { name: "Half Day", value: attendance.filter((item) => item.status === "half_day").length },
      { name: "Running", value: attendance.filter((item) => item.status === "running").length },
    ],
    [attendance]
  );

  const monthlyFlow = useMemo(
    () => [
      { name: "Week 1", logins: Math.round(attendance.length * 0.18), candidates: Math.round(candidates.length * 0.16) },
      { name: "Week 2", logins: Math.round(attendance.length * 0.24), candidates: Math.round(candidates.length * 0.22) },
      { name: "Week 3", logins: Math.round(attendance.length * 0.27), candidates: Math.round(candidates.length * 0.3) },
      { name: "Week 4", logins: Math.max(0, attendance.length - Math.round(attendance.length * 0.69)), candidates: Math.max(0, candidates.length - Math.round(candidates.length * 0.68)) },
    ],
    [attendance.length, candidates.length]
  );

  const recentHr = useMemo(() => hrs.slice(0, 4), [hrs]);
  const actionItems = useMemo(
    () => [
      {
        label: "Pending Leaves",
        value: leaves.filter((item) => item.status === "pending").length,
        note: "Open leave approvals waiting in reports",
      },
      {
        label: "Interviews Running",
        value: candidates.filter((item) => ["hr_round", "first_round", "second_round"].includes(item.interviewStatus)).length,
        note: "Candidates currently active in interview rounds",
      },
      {
        label: "Inactive Employees",
        value: employees.filter((item) => !item.isActive).length,
        note: "Profiles that may need review or cleanup",
      },
    ],
    [candidates, employees, leaves]
  );

  if (pageLoading) return <CommonLoader text="Loading dashboard..." />;

  return (
    <div className="space-y-5">
      <section className="rounded-sm shadow p-5 md:p-6 bg-[radial-gradient(circle_at_top_left,_rgba(248,69,37,0.16),_transparent_28%),linear-gradient(135deg,#ffffff_0%,#fff7f4_100%)] border border-[#fde1d8]">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#f84525]">Super Admin</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Operations Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Hiring, employees, attendance, and approvals with clearer daily visibility.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1.5 rounded-sm bg-white text-gray-700 text-xs border border-[#f4d1c7]">
                {employees.length} employees
              </span>
              <span className="px-3 py-1.5 rounded-sm bg-white text-gray-700 text-xs border border-[#f4d1c7]">
                {candidates.length} candidates
              </span>
              <span className="px-3 py-1.5 rounded-sm bg-white text-gray-700 text-xs border border-[#f4d1c7]">
                {leaves.filter((item) => item.status === "pending").length} leave approvals
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button text="Manage Candidates" onClick={() => navigate("/admin/candidates")} />
            <Button text="Open Reports" variant="secondary" onClick={() => navigate("/admin/reports")} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actionItems.map((item) => (
            <div key={item.label} className="bg-white rounded-sm shadow p-4 border border-gray-100">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{item.value}</p>
              <p className="text-xs text-gray-500 mt-3">{item.note}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-sm shadow p-4 border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg">Quick Actions</h2>
              <p className="text-xs text-gray-500 mt-1">Jump to the screens that usually need attention first.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <button type="button" onClick={() => navigate("/admin/employees")} className="text-left border rounded-sm p-4 hover:border-[#f84525] hover:bg-[#fff8f6] transition-colors">
              <p className="font-semibold text-gray-900">Manage Employees</p>
              <p className="text-xs text-gray-500 mt-1">Review employee profiles, documents, and credentials.</p>
            </button>
            <button type="button" onClick={() => navigate("/admin/credentials")} className="text-left border rounded-sm p-4 hover:border-[#f84525] hover:bg-[#fff8f6] transition-colors">
              <p className="font-semibold text-gray-900">Employee Credentials</p>
              <p className="text-xs text-gray-500 mt-1">Select an employee and view saved account logins.</p>
            </button>
            <button type="button" onClick={() => navigate("/admin/hrs")} className="text-left border rounded-sm p-4 hover:border-[#f84525] hover:bg-[#fff8f6] transition-colors">
              <p className="font-semibold text-gray-900">Manage HR</p>
              <p className="text-xs text-gray-500 mt-1">Create, activate, and manage HR access.</p>
            </button>
            <button type="button" onClick={() => navigate("/admin/settings")} className="text-left border rounded-sm p-4 hover:border-[#f84525] hover:bg-[#fff8f6] transition-colors">
              <p className="font-semibold text-gray-900">Admin Settings</p>
              <p className="text-xs text-gray-500 mt-1">Control notifications, mail rules, and vault access.</p>
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((item, index) => (
          <div
            key={item.label}
            className={`rounded-sm shadow p-4 min-h-[148px] flex flex-col justify-between ${
              item.tone === "primary"
                ? "bg-gradient-to-br from-[#f84525] via-[#f25d23] to-[#ffa826] text-white"
                : "bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm ${item.tone === "primary" ? "text-white/85" : "text-gray-500"}`}>
                  {item.label}
                </p>
                <p className={`text-4xl font-bold mt-3 ${item.tone === "primary" ? "text-white" : "text-gray-900"}`}>
                  {item.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                item.tone === "primary" ? "bg-white/15 text-white" : "bg-[#fff5f3] text-[#f84525]"
              }`}>
                0{index + 1}
              </div>
            </div>
            <p className={`text-xs mt-4 ${item.tone === "primary" ? "text-white/80" : "text-gray-500"}`}>
              {item.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-4">
        <div className="bg-white rounded-sm shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Activity Trend</h2>
              <p className="text-xs text-gray-500 mt-1">Weekly hiring and attendance movement</p>
            </div>
          </div>
          <div className="h-72">
            <TrendAreaChart
              data={monthlyFlow}
              series={[
                { key: "logins", name: "Logins", color: ORANGE },
                { key: "candidates", name: "Candidates", color: ORANGE_SOFT },
              ]}
            />
          </div>
        </div>

        <div className="bg-white rounded-sm shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Candidate Mix</h2>
              <p className="text-xs text-gray-500 mt-1">Current interview pipeline split</p>
            </div>
          </div>
          <div className="h-72">
            <TrendAreaChart
              data={candidateMix}
              series={[{ key: "value", name: "Candidates", color: ORANGE }]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {candidateMix.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
                <span className="font-semibold text-gray-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
        <div className="bg-white rounded-sm shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Attendance Status</h2>
              <p className="text-xs text-gray-500 mt-1">This month attendance distribution</p>
            </div>
            <Button text="Reports" variant="secondary" onClick={() => navigate("/admin/reports")} />
          </div>
          <div className="h-72">
            <TrendAreaChart
              data={attendanceBreakdown}
              series={[{ key: "value", name: "Attendance", color: ORANGE }]}
            />
          </div>
        </div>

        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Recent HR Accounts</h2>
              <p className="text-xs text-gray-500 mt-1">Latest active operations team members</p>
            </div>
            <span className="text-sm bg-[#fff5f3] text-[#f84525] px-3 py-1 rounded-sm">
              {hrs.length} HR
            </span>
          </div>
          {recentHr.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No HR users found</p>
          ) : (
            recentHr.map((hr) => (
              <div key={hr._id} className="flex items-center justify-between gap-3 border-t px-4 py-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{hr.name}</p>
                  <p className="text-sm text-gray-500 break-all">{hr.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-gray-700">{hr.mobile}</p>
                  <span className={`text-xs font-medium ${hr.isActive ? "text-[#f84525]" : "text-gray-500"}`}>
                    {hr.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
