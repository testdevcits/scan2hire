import React, { useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiGift, FiUserCheck, FiUsers } from "react-icons/fi";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import DateRangePicker from "../../components/common/DateRangePicker";
import { ActionCard, ChartMetric, CompactInfoRow, MetricCard, PageHeader, SectionCard } from "../../components/common/ReusableCards";
import TrendAreaChart from "../../components/common/TrendAreaChart";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const ORANGE = "#f84525";
const AMBER = "#ffa826";
const getLocalDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const getMonthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const getRangeBucketIndex = (value, startDate, endDate) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const dateKey = getLocalDateKey(date);
  if (dateKey < startDate || dateKey > endDate) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const elapsedDays = Math.floor((new Date(year, month - 1, day) - new Date(startYear, startMonth - 1, startDay)) / 86400000);
  return Math.floor(elapsedDays / 7);
};
const getRangeBucketLabel = (startDate, weekIndex) => {
  const [year, month, day] = startDate.split("-").map(Number);
  return new Date(year, month - 1, day + weekIndex * 7).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const currentMonth = useMemo(() => getMonthKey(), []);
  const [dateRange, setDateRange] = useState(() => ({ start: `${getMonthKey()}-01`, end: getLocalDateKey() }));
  const roleClaims = [user?.role, user?.workRole, user?.effectiveRole].filter(Boolean);
  const isTeamLead = roleClaims.includes("teamlead");
  const isProjectCoordinator = roleClaims.includes("project_coordinator");
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (isProjectCoordinator) return undefined;
    Promise.all([hrApi.getAttendance(currentMonth), hrApi.getLeaves(), hrApi.getCandidates(), hrApi.getEmployees()])
      .then(([attendanceRes, leavesRes, candidatesRes, employeeRes]) => {
        setAttendance(attendanceRes.data.data || []);
        setLeaves(leavesRes.data.data || []);
        setCandidates(candidatesRes.data.data || []);
        setEmployees(employeeRes.data.data || []);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Unable to load HR dashboard"));
  }, [currentMonth, isProjectCoordinator, toast]);

  const today = getLocalDateKey();
  const birthdayReminders = useMemo(
    () =>
      employees
        .filter((employee) => {
          if (!employee.isActive || !employee.dob) return false;
          const dob = new Date(employee.dob);
          return dob.getMonth() === new Date().getMonth();
        })
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [employees]
  );
  const todayBirthdays = useMemo(() => employees.filter((employee) => { if (!employee.isActive || !employee.dob) return false; const dob = new Date(employee.dob); const now = new Date(); return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate(); }), [employees]);
  const [birthdaySplash, setBirthdaySplash] = useState(false);
  useEffect(() => { if (!todayBirthdays.length) return undefined; setBirthdaySplash(true); const timer = setTimeout(() => setBirthdaySplash(false), 5000); return () => clearTimeout(timer); }, [todayBirthdays.length]);

  const statCards = useMemo(
    () => [
      {
        label: "Today Login",
        value: attendance.filter((item) => item.dateKey === today && item.loginAt).length,
        note: isTeamLead
          ? `${employees.length} team member${employees.length === 1 ? "" : "s"} in your scope`
          : `${leaves.filter((item) => item.status === "pending").length} leave requests waiting`,
        icon: <FiClock />,
        iconClassName: "bg-orange-50 text-[#f84525] dark:bg-orange-950/50 dark:text-orange-300",
      },
      {
        label: "On Leave",
        value: leaves.filter((leave) => leave.status === "approved" && leave.fromDate?.slice(0, 10) <= today && leave.toDate?.slice(0, 10) >= today).length,
        note: "Approved leaves active today",
        icon: <FiCalendar />,
        iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
      },
      {
        label: "Running Interviews",
        value: candidates.filter((item) => item.assignedTo && !["selected", "rejected"].includes(item.interviewStatus)).length,
        note: isTeamLead ? `${candidates.length} team candidates` : `${candidates.length} total candidates`,
        icon: <FiUserCheck />,
        iconClassName: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300",
      },
      {
        label: "Pending Leaves",
        value: leaves.filter((item) => item.status === "pending").length,
        note: "Requests waiting for HR review",
        icon: <FiCalendar />,
        iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
      },
    ],
    [attendance, candidates, employees.length, isTeamLead, leaves, today]
  );

  const rangeIsValid = Boolean(dateRange.start && dateRange.end && dateRange.start <= dateRange.end);
  const rangeBucketCount = rangeIsValid
    ? Math.ceil((new Date(`${dateRange.end}T00:00:00`) - new Date(`${dateRange.start}T00:00:00`) + 86400000) / (7 * 86400000))
    : 0;
  const interviewActivityTrend = useMemo(() => Array.from({ length: rangeBucketCount }, (_, index) => {
    const week = index;
    const count = candidates.reduce((total, candidate) => total + (candidate.interviewRounds || []).filter(
      (round) => getRangeBucketIndex(round.date, dateRange.start, dateRange.end) === week
    ).length, 0);
    return { label: getRangeBucketLabel(dateRange.start, week), value: count };
  }), [candidates, dateRange.end, dateRange.start, rangeBucketCount]);

  const leaveActivityTrend = useMemo(() => Array.from({ length: rangeBucketCount }, (_, index) => ({
    label: getRangeBucketLabel(dateRange.start, index),
    value: leaves.filter((leave) => getRangeBucketIndex(leave.createdAt, dateRange.start, dateRange.end) === index).length,
  })), [dateRange.end, dateRange.start, leaves, rangeBucketCount]);

  const interviewTotal = interviewActivityTrend.reduce((total, point) => total + point.value, 0);
  const leaveTotal = leaveActivityTrend.reduce((total, point) => total + point.value, 0);
  const chartRangeLabel = rangeIsValid
    ? `${new Date(`${dateRange.start}T12:00:00`).toLocaleDateString()} – ${new Date(`${dateRange.end}T12:00:00`).toLocaleDateString()}`
    : "Select a valid date range";

  const quickActions = [
    {
      title: isTeamLead ? "Your Team" : "Manage Employees",
      description: isTeamLead ? "View employees assigned under your team." : "Update profiles, joining details, and document review.",
      path: "/hr/employees",
      icon: <FiUsers className="h-4 w-4" />,
    },
    {
      title: "Reports & Calendar",
      description: isTeamLead ? "Review team attendance and calendar reports." : "Leave calendar, attendance reports, and approvals.",
      path: "/hr/reports",
      icon: <FiClock className="h-4 w-4" />,
    },
    {
      title: "Candidate Reviews",
      description: isTeamLead ? "Review and move your assigned candidate interviews." : "Assign rounds and move interviews forward.",
      path: "/hr/candidates/list",
      icon: <FiUserCheck className="h-4 w-4" />,
    },
  ];

  if (isProjectCoordinator) {
    return <Navigate to="/hr/profile" replace />;
  }

  return (
    <div className="min-h-full space-y-4  p-3 dark:bg-gray-950 sm:p-4">
      {birthdaySplash && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"><div className="rounded-2xl bg-white p-8 text-center shadow-2xl"><div className="mx-auto mb-3 h-14 w-14 animate-bounce rounded-full bg-orange-100 p-3 text-3xl">🎂</div><h2 className="text-xl font-bold text-[#f84525]">Happy Birthday!</h2><p className="mt-1 text-sm text-gray-600">Wishing {todayBirthdays.map((item) => item.name).join(", ")} a wonderful day.</p><div className="mt-4 h-1 w-48 overflow-hidden rounded bg-orange-100"><div className="h-full w-full animate-pulse bg-[#f84525]" /></div></div></div>}
      <PageHeader
        title={isTeamLead ? "Team Lead Dashboard" : "HR Dashboard"}
        description={isTeamLead
          ? "Team attendance, leaves, candidates, and daily activity in one place."
          : "Interviews, leave handling, employee status, and daily HR operations in one place."}
        actions={[
          <DateRangePicker key="date-range" value={dateRange} onApply={setDateRange} />,
          <Button key="candidates" text="Candidates" onClick={() => navigate("/hr/candidates/list")} />,
          <Button key="reports" text="Reports" variant="secondary" onClick={() => navigate("/hr/reports")} />,
        ]}
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      {birthdayReminders.length > 0 && (
        <section className="rounded-sm border border-gray-100 border-l-4 border-l-[#f84525] bg-white p-3 shadow-sm dark:border-gray-800 dark:border-l-[#f84525] dark:bg-gray-900 sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[#fff5f3] text-[#f84525] flex items-center justify-center">
                <FiGift className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Birthday Reminder</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Birthdays in the current month.</p>
              </div>
            </div>
            <Button text="Employees" variant="secondary" onClick={() => navigate("/hr/employees")} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {birthdayReminders.map((employee) => (
              <CompactInfoRow
                key={employee._id}
                title={employee.name}
                subtitle={`${employee.employeeId || "-"} | ${employee.department || "No department"} | ${employee.designation || "No designation"}`}
                className="border-red-100 bg-[#fff8f6] dark:border-red-950 dark:bg-red-950/20"
              />
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <SectionCard title="Interview Activity" subtitle="Interview rounds scheduled in selected range" contentClassName="pt-3">
          <ChartMetric icon={<FiUserCheck className="h-4 w-4" />} label="Interview rounds in range" value={interviewTotal} />
          {rangeIsValid && interviewTotal > 0 ? (
            <div className="h-36 sm:h-40">
              <TrendAreaChart
                data={interviewActivityTrend}
                xKey="label"
                series={[{ key: "value", name: "Interview rounds", color: ORANGE }]}
                showYAxis={false}
                showLatestDot
                strokeWidth={2.5}
                gradientOpacity={0.18}
                variant="sparkline"
              />
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-sm border border-dashed border-gray-200 bg-white px-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 sm:h-40">
              {chartRangeLabel}: no interview rounds recorded
            </div>
          )}
        </SectionCard>

        <SectionCard title="Leave Requests" subtitle="Requests submitted in selected range" contentClassName="pt-3">
          <ChartMetric icon={<FiCalendar className="h-4 w-4" />} label="Leave requests in range" value={leaveTotal} iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300" />
          {rangeIsValid && leaveTotal > 0 ? (
              <div className="h-36 sm:h-40">
              <TrendAreaChart
                data={leaveActivityTrend}
                xKey="label"
                series={[{ key: "value", name: "Leave requests", color: AMBER }]}
                showYAxis={false}
                showLatestDot
                strokeWidth={2.5}
                gradientOpacity={0.2}
                variant="sparkline"
              />
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-sm border border-dashed border-gray-200 bg-white px-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 sm:h-40">
              {chartRangeLabel}: no leave requests found
            </div>
          )}
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {quickActions.map((action) => (
            <ActionCard
              key={action.title}
              to={action.path}
              title={action.title}
              description={action.description}
              icon={action.icon}
            />
          ))}
      </section>
    </div>
  );
};

export default HRDashboard;
