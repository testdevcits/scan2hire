/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import TrendAreaChart from "../../components/common/TrendAreaChart";
import { useToast } from "../../contexts/ToastContext";
import { FiBriefcase, FiClock, FiSettings, FiShield, FiUsers } from "react-icons/fi";

const ORANGE = "#f84525";
const ORANGE_SOFT = "#ffa826";
const RED = "#ef4444";

const AdminDashboard = () => {
  const { authApi, hrApi } = useApi();
  const toast = useToast();
  const navigate = useNavigate();
  const [hrs, setHrs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [birthdayReminders, setBirthdayReminders] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setPageLoading(true);
    try {
      const [hrRes, employeeRes, candidateRes, attendanceRes, leavesRes, birthdayRes] =
        await Promise.all([
          authApi.getHrs(),
          hrApi.getEmployees(),
          hrApi.getCandidates(),
          hrApi.getAttendance(new Date().toISOString().slice(0, 7)),
          hrApi.getLeaves(),
          hrApi.getBirthdays(new Date().getMonth() + 1),
        ]);

      setHrs(hrRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
      setCandidates(candidateRes.data.data || []);
      setAttendance(attendanceRes.data.data || []);
      setLeaves(leavesRes.data.data || []);
      setBirthdayReminders(birthdayRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load dashboard data");
    } finally {
      setPageLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const candidateMix = useMemo(
    () => [
      { name: "HR", value: candidates.filter((item) => item.interviewStatus === "hr_round").length, color: ORANGE },
      { name: "Technical", value: candidates.filter((item) => item.interviewStatus === "first_round").length, color: ORANGE_SOFT },
      { name: "Machine Test", value: candidates.filter((item) => item.interviewStatus === "second_round").length, color: "#fb923c" },
      { name: "Final Round", value: candidates.filter((item) => ["final", "third_round"].includes(item.interviewStatus)).length, color: "#f97316" },
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
        icon: <FiClock className="w-5 h-5 text-[#f84525]" />,
      },
      {
        label: "Interviews Running",
        value: candidates.filter((item) => ["hr_round", "first_round", "second_round", "final", "third_round"].includes(item.interviewStatus)).length,
        note: "Candidates currently active in interview rounds",
        icon: <FiUsers className="w-5 h-5 text-[#f84525]" />,
      },
      {
        label: "Inactive Employees",
        value: employees.filter((item) => !item.isActive).length,
        note: "Profiles that may need review or cleanup",
        icon: <FiShield className="w-5 h-5 text-[#f84525]" />,
      },
    ],
    [candidates, employees, leaves]
  );

  const birthdayList = birthdayReminders;
  const todayDay = new Date().getUTCDate();
  const todayBirthdayCount = birthdayList.filter((employee) => employee.day === todayDay).length;

  const formatBirthday = (employee) => {
    if (employee.day === todayDay) return "Today";
    if (employee.day === todayDay + 1) return "Tomorrow";
    return new Date(new Date().getFullYear(), new Date().getMonth(), employee.day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  if (pageLoading) return <CommonLoader text="Loading dashboard..." />;

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-xl border border-[#f1ddd7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="relative overflow-hidden p-4 sm:p-5">
            <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#f84525]/10" />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f84525]">Super Admin</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-950 dark:text-white sm:text-[28px]">Operations Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">One clear view of people, hiring, attendance and approvals.</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <span className="text-[#f84525]">{employees.length}</span> employees
                </span>
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <span className="text-[#f84525]">{candidates.length}</span> candidates
                </span>
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <span className="text-[#f84525]">{leaves.filter((item) => item.status === "pending").length}</span> pending approvals
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-[#f1ddd7] p-3 lg:border-l lg:border-t-0 dark:border-gray-800">
            <Button text="Manage Candidates" onClick={() => navigate("/admin/candidates")} />
            <Button text="Open Reports" variant="secondary" onClick={() => navigate("/admin/reports")} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actionItems.map((item) => (
            <div key={item.label} className="min-h-[118px] rounded-xl border border-[#f1e7e4] bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1ed] dark:bg-orange-950/40">{item.icon}</div>
                <span className="text-2xl font-bold text-gray-950 dark:text-white">{item.value}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{item.note}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#f1e7e4] bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-950 dark:text-white">Quick Actions</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Frequently used areas</p>
            </div>
            <FiBriefcase className="text-[#f84525]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[ 
              ["Employees", "/admin/employees", <FiUsers />],
              ["Credentials", "/admin/credentials", <FiShield />],
              ["Manage HR", "/admin/hrs", <FiUsers />],
              ["Settings", "/admin/settings", <FiSettings />],
            ].map(([label, path, icon]) => (
              <button key={label} type="button" onClick={() => navigate(path)} className="flex min-h-[54px] items-center gap-2 rounded-lg border border-gray-100 px-2.5 text-left text-xs font-semibold text-gray-700 transition hover:border-[#f84525]/40 hover:bg-[#fff8f6] dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">
                <span className="text-[#f84525]">{icon}</span>{label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="rounded-xl border border-[#f1e7e4] bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-950 dark:text-white">Activity Trend</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Hiring and attendance movement</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#f84525]" />Logins</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#ffa826]" />Candidates</span>
            </div>
          </div>
          <div className="h-52">
            <TrendAreaChart
              data={monthlyFlow}
              series={[
                { key: "logins", name: "Logins", color: ORANGE },
                { key: "candidates", name: "Candidates", color: ORANGE_SOFT },
              ]}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#f1e7e4] bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2">
            <h2 className="font-semibold text-gray-950 dark:text-white">Candidate Pipeline</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Current stage distribution</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {candidateMix.map((item) => (
              <button key={item.name} type="button" onClick={() => navigate("/admin/candidates")} className="rounded-lg border border-gray-100 px-2.5 py-2 text-left transition hover:border-[#f84525]/30 dark:border-gray-800">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">{item.name}</span>
                </div>
                <p className="mt-1 text-lg font-bold text-gray-950 dark:text-white">{item.value}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="rounded-xl border border-[#f1e7e4] bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-semibold text-base">Attendance Status</h2>
              <p className="text-xs text-gray-500 mt-0.5">This month attendance distribution</p>
            </div>
            <Button text="Reports" variant="secondary" onClick={() => navigate("/admin/reports")} />
          </div>
          <div className="h-56">
            <TrendAreaChart
              data={attendanceBreakdown}
              series={[{ key: "value", name: "Attendance", color: ORANGE }]}
            />
          </div>
        </div>

        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-3 py-3 border-b flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-base">Upcoming Birthdays</h2>
              <p className="text-xs text-gray-500 mt-0.5">Next 30 days</p>
            </div>
            <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${todayBirthdayCount ? "bg-[#fff5f3] text-[#f84525]" : "bg-gray-100 text-gray-600"}`}>
              {todayBirthdayCount} today
            </span>
          </div>
          {birthdayList.length === 0 ? (
            <p className="p-4 text-center text-xs text-gray-500">No upcoming birthdays</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {birthdayList.map((employee) => (
                <div key={employee._id} className="flex items-center gap-2.5 px-3 py-2.5">
                  {employee.photoUrl ? (
                    <img src={employee.photoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-xs font-bold text-[#f84525]">
                      {employee.name?.charAt(0)?.toUpperCase() || "E"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{employee.name}</p>
                    <p className="truncate text-xs text-gray-500">{employee.department || employee.designation || "Employee"}</p>
                  </div>
                  <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${employee.day === todayDay ? "bg-[#f84525] text-white" : "bg-gray-100 text-gray-600"}`}>
                    {formatBirthday(employee)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#f1e7e4] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-3 dark:border-gray-800">
            <div>
              <h2 className="font-semibold text-base text-gray-950 dark:text-white">Recent HR Accounts</h2>
              <p className="text-xs text-gray-500 mt-0.5">Operations team</p>
            </div>
            <span className="text-xs font-semibold bg-[#fff5f3] text-[#f84525] px-2 py-1 rounded-sm">
              {hrs.length} HR
            </span>
          </div>
          {recentHr.length === 0 ? (
            <p className="p-4 text-center text-xs text-gray-500">No HR users found</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentHr.map((hr) => (
                <button key={hr._id} type="button" onClick={() => navigate("/admin/hrs")} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-[#fff8f6]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-xs font-bold text-[#f84525]">
                    {hr.name?.charAt(0)?.toUpperCase() || "H"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{hr.name}</p>
                    <p className="truncate text-xs text-gray-500">{hr.email}</p>
                  </div>
                  <span className={`text-xs font-medium ${hr.isActive ? "text-emerald-600" : "text-gray-500"}`}>
                    {hr.isActive ? "Active" : "Inactive"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
