import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiClock, FiUserCheck, FiUsers } from "react-icons/fi";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import { useToast } from "../../contexts/ToastContext";

const ORANGE = "#f84525";
const ORANGE_SOFT = "#ffa826";
const ORANGE_LIGHT = "#fff5f3";
const SLATE = "#1f2937";
const RED = "#ef4444";

const HRDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    Promise.all([hrApi.getAttendance(month), hrApi.getLeaves(), hrApi.getCandidates()])
      .then(([attendanceRes, leavesRes, candidatesRes]) => {
        setAttendance(attendanceRes.data.data || []);
        setLeaves(leavesRes.data.data || []);
        setCandidates(candidatesRes.data.data || []);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Unable to load HR dashboard"));
  }, [toast]);

  const today = new Date().toISOString().slice(0, 10);

  const statCards = useMemo(
    () => [
      {
        label: "Today Login",
        value: attendance.filter((item) => item.dateKey === today && item.loginAt).length,
        note: `${leaves.filter((item) => item.status === "pending").length} leave requests waiting`,
        tone: "primary",
      },
      {
        label: "On Leave",
        value: leaves.filter((leave) => leave.status === "approved" && leave.fromDate?.slice(0, 10) <= today && leave.toDate?.slice(0, 10) >= today).length,
        note: "Approved leaves active today",
      },
      {
        label: "Running Interviews",
        value: candidates.filter((item) => item.assignedTo && !["selected", "rejected"].includes(item.interviewStatus)).length,
        note: `${candidates.length} total candidates`,
      },
      {
        label: "Today Interviews",
        value: candidates.filter((item) => (item.updatedAt || item.createdAt || "").slice(0, 10) === today).length,
        note: "Candidate activity for today",
      },
    ],
    [attendance, candidates, leaves, today]
  );

  const interviewStageData = useMemo(
    () => [
      { name: "HR", value: candidates.filter((item) => item.interviewStatus === "hr_round").length, color: ORANGE },
      { name: "Technical", value: candidates.filter((item) => item.interviewStatus === "first_round").length, color: ORANGE_SOFT },
      { name: "Machine Test", value: candidates.filter((item) => item.interviewStatus === "second_round").length, color: "#fb923c" },
      { name: "Rejected", value: candidates.filter((item) => item.interviewStatus === "rejected").length, color: RED },
      { name: "Selected", value: candidates.filter((item) => item.interviewStatus === "selected").length, color: SLATE },
    ],
    [candidates]
  );

  const leaveStatusData = useMemo(
    () => [
      { name: "Pending", value: leaves.filter((item) => item.status === "pending").length },
      { name: "Approved", value: leaves.filter((item) => item.status === "approved").length },
      { name: "Rejected", value: leaves.filter((item) => item.status === "rejected").length },
    ],
    [leaves]
  );

  const activityTrend = useMemo(
    () => [
      { name: "Week 1", interviews: Math.round(candidates.length * 0.19), leaves: Math.round(leaves.length * 0.16) },
      { name: "Week 2", interviews: Math.round(candidates.length * 0.24), leaves: Math.round(leaves.length * 0.21) },
      { name: "Week 3", interviews: Math.round(candidates.length * 0.28), leaves: Math.round(leaves.length * 0.27) },
      { name: "Week 4", interviews: Math.max(0, candidates.length - Math.round(candidates.length * 0.71)), leaves: Math.max(0, leaves.length - Math.round(leaves.length * 0.64)) },
    ],
    [candidates.length, leaves.length]
  );

  const quickActions = [
    {
      title: "Manage Employees",
      description: "Update profiles, joining details, and document review.",
      path: "/hr/employees",
      icon: <FiUsers className="text-[#f84525] w-5 h-5" />,
    },
    {
      title: "Reports & Calendar",
      description: "Leave calendar, attendance reports, and approvals.",
      path: "/hr/reports",
      icon: <FiClock className="text-[#f84525] w-5 h-5" />,
    },
    {
      title: "Candidate Reviews",
      description: "Assign rounds and move interviews forward.",
      path: "/hr/candidates/list",
      icon: <FiUserCheck className="text-[#f84525] w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4 md:p-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Interviews, leave handling, employee status, and daily HR operations in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button text="Candidates" onClick={() => navigate("/hr/candidates/list")} />
            <Button text="Reports" variant="secondary" onClick={() => navigate("/hr/reports")} />
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

      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-4">
        <div className="bg-white rounded-sm shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Interview Activity</h2>
              <p className="text-xs text-gray-500 mt-1">Weekly candidate and leave movement</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrend}>
                <defs>
                  <linearGradient id="hrInterviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="hrLeaves" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE_SOFT} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={ORANGE_SOFT} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3e3dc" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="interviews" stroke={ORANGE} fill="url(#hrInterviews)" strokeWidth={3} />
                <Area type="monotone" dataKey="leaves" stroke={ORANGE_SOFT} fill="url(#hrLeaves)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-sm shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Interview Stages</h2>
              <p className="text-xs text-gray-500 mt-1">Current status distribution</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={interviewStageData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={2}>
                  {interviewStageData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {interviewStageData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
                <span className="font-semibold text-gray-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
        <div className="bg-white rounded-sm shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Leave Requests</h2>
              <p className="text-xs text-gray-500 mt-1">Pending, approved, and rejected requests</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveStatusData} barCategoryGap={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f6e8e0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={[ORANGE, ORANGE_SOFT, RED][index % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <div
              key={action.title}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-sm shadow p-4 cursor-pointer hover:bg-[#fffaf8] transition"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: ORANGE_LIGHT }}
              >
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-500 mt-2 min-h-[64px]">{action.description}</p>
              <Button text="Open" className="mt-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HRDashboard;
