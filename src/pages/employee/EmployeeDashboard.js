import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiCopy, FiEye, FiEyeOff, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const minutesToHours = (minutes = 0) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const EmployeeDashboard = ({ section = "all" }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [roundSaving, setRoundSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [breakType, setBreakType] = useState("lunch");
  const [leaveForm, setLeaveForm] = useState({
    type: "earned_leave",
    title: "",
    fromDate: "",
    toDate: "",
    content: "",
  });
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [accountCredentials, setAccountCredentials] = useState([]);
  const [credentialForm, setCredentialForm] = useState({
    accountType: "Email",
    title: "",
    loginId: "",
    password: "",
    notes: "",
  });
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [selected, setSelected] = useState(null);
  const [roundForm, setRoundForm] = useState({
    roundType: "technical",
    score: "",
    comments: "",
  });

  const todayAttendance = useMemo(
    () =>
      attendance.find(
        (item) => item.dateKey === new Date().toISOString().slice(0, 10)
      ),
    [attendance]
  );

  const fetchData = useCallback(async () => {
    try {
      const [
        profileRes,
        candidatesRes,
        attendanceRes,
        leavesRes,
        ,
        credentialsRes,
      ] = await Promise.all([
        employeeApi.getProfile(),
        employeeApi.getAssignedCandidates(),
        employeeApi.getAttendance(),
        employeeApi.getLeaves(),
        employeeApi.getCalendar(null, new Date().getFullYear()),
        employeeApi.getMyAccountCredentials(),
      ]);
      setProfile(profileRes.data.data);
      setCandidates(candidatesRes.data.data || []);
      setAttendance(attendanceRes.data.data || []);
      setLeaves(leavesRes.data.data?.leaves || leavesRes.data.data || []);
      setLeaveBalance(leavesRes.data.data?.balance || null);
      setAccountCredentials(credentialsRes.data.data || []);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData().catch((err) =>
      toast.error(
        err.response?.data?.message || "Unable to load employee dashboard"
      )
    );
  }, [fetchData, toast]);

  const runAttendanceAction = async (action, successMessage, payload, key) => {
    setActionLoading(key);
    try {
      await action(payload);
      await fetchData();
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Attendance action failed");
    } finally {
      setActionLoading("");
    }
  };

  const applyLeave = async (e) => {
    e.preventDefault();
    setLeaveSaving(true);
    try {
      await employeeApi.applyLeave({
        ...leaveForm,
        toDate: leaveForm.toDate || leaveForm.fromDate,
      });
      setLeaveForm({
        type: "earned_leave",
        title: "",
        fromDate: "",
        toDate: "",
        content: "",
      });
      setShowLeaveForm(false);
      await fetchData();
      toast.success("Leave request submitted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to apply leave");
    } finally {
      setLeaveSaving(false);
    }
  };

  const updateRound = async (e) => {
    e.preventDefault();
    if (roundForm.score === "" || !roundForm.comments.trim()) {
      toast.error("Score and comments are required before submitting review");
      return;
    }
    setRoundSaving(true);
    try {
      await employeeApi.updateRound(selected._id, roundForm);
      setSelected(null);
      await fetchData();
      toast.success("Round updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update round");
    } finally {
      setRoundSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    try {
      await employeeApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast.success("Password updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const saveAccountCredential = async (e) => {
    e.preventDefault();
    setCredentialSaving(true);
    try {
      await employeeApi.createMyAccountCredential(credentialForm);
      setCredentialForm({
        accountType: "Email",
        title: "",
        loginId: "",
        password: "",
        notes: "",
      });
      await fetchData();
      toast.success("Credential saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save credential");
    } finally {
      setCredentialSaving(false);
    }
  };

  const deleteAccountCredential = async (credentialId) => {
    try {
      await employeeApi.deleteMyAccountCredential(credentialId);
      await fetchData();
      toast.success("Credential deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete credential");
    }
  };

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Unable to copy");
    }
  };

  const show = (name) => section === name;
  const isDashboard = section === "all";
  const todayTimeline = useMemo(() => {
    if (!todayAttendance) return [];
    const items = [];
    if (todayAttendance.loginAt) {
      items.push({ label: "Login", time: todayAttendance.loginAt });
    }
    todayAttendance.breaks?.forEach((item) => {
      items.push({ label: `${item.type} break start`, time: item.startAt });
      if (item.endAt)
        items.push({ label: `${item.type} break end`, time: item.endAt });
    });
    if (todayAttendance.logoutAt) {
      items.push({ label: "Logout", time: todayAttendance.logoutAt });
    }
    return items.sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [todayAttendance]);

  const monthlySummary = useMemo(() => {
    return attendance.reduce(
      (acc, item) => {
        acc.work += item.totalWorkMinutes || 0;
        acc.breaks += item.totalBreakMinutes || 0;
        acc.present += item.status === "present" ? 1 : 0;
        acc.halfDay += item.status === "half_day" ? 1 : 0;
        return acc;
      },
      { work: 0, breaks: 0, present: 0, halfDay: 0 }
    );
  }, [attendance]);

  const pendingInterviews = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          !candidate.interviewRounds?.some(
            (round) => round.round === candidate.interviewStatus
          )
      ),
    [candidates]
  );

  const monthlyChartData = useMemo(
    () => [
      { name: "Work", value: Math.round(monthlySummary.work / 60) },
      { name: "Break", value: Math.round(monthlySummary.breaks / 60) },
      { name: "Present", value: monthlySummary.present },
      { name: "Half Day", value: monthlySummary.halfDay },
    ],
    [monthlySummary]
  );
  const filteredAttendance = useMemo(() => {
    if (!attendanceDate) return attendance.slice(0, 8);
    const matched = attendance.filter(
      (item) => item.dateKey === attendanceDate
    );
    return matched.length
      ? matched
      : attendance.filter(
          (item) => item.dateKey === new Date().toISOString().slice(0, 10)
        );
  }, [attendance, attendanceDate]);
  const missingDocuments = useMemo(() => {
    const required = [
      "photo",
      "aadhaarCard",
      "panCard",
      "passbook",
      "degree",
      "resume",
    ];
    return required.filter((key) => !profile?.documents?.[key]?.url);
  }, [profile]);

  if (pageLoading) return <CommonLoader text="Loading employee dashboard..." />;

  return (
    <div className="space-y-5">
      {missingDocuments.length > 0 && (
        <section className="bg-[#fff5f3] dark:bg-gray-900 border border-[#ffd8cf] dark:border-gray-800 rounded-sm p-4">
          <h2 className="font-semibold text-[#f84525]">Documents Pending</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            Please upload all required documents. Missing:{" "}
            {missingDocuments.join(", ")}.
          </p>
        </section>
      )}
      {isDashboard && (
        <section className="space-y-4">
          <div className="bg-white rounded-sm shadow p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Today attendance, monthly report, and assigned interview work in
                one place.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-[#fff5f3] text-[#f84525] rounded-sm px-4 py-3">
                <p className="font-bold text-xl">{pendingInterviews.length}</p>
                <p>Pending Interviews</p>
              </div>
              <div className="bg-gray-900 text-white rounded-sm px-4 py-3">
                <p className="font-bold text-xl">
                  {todayAttendance?.status || "Not started"}
                </p>
                <p>Today Status</p>
              </div>
            </div>
          </div>
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[
              ["Work Time", minutesToHours(monthlySummary.work)],
              ["Break Time", minutesToHours(monthlySummary.breaks)],
              ["Present Days", monthlySummary.present],
              ["Half Days", monthlySummary.halfDay],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-sm shadow p-4">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-[#f84525] mt-1">
                  {value}
                </p>
              </div>
            ))}
            <div className="bg-white rounded-sm shadow p-4 lg:col-span-4">
              <h2 className="font-semibold mb-3">Monthly Report Chart</h2>
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} barCategoryGap={28}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f6e8e0"
                      />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        fill="#f84525"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#fff5f3] rounded-sm p-3">
                    <p className="text-xs text-gray-500">Total Work Time</p>
                    <p className="text-xl font-bold text-[#f84525] mt-1">
                      {minutesToHours(monthlySummary.work)}
                    </p>
                  </div>
                  <div className="bg-[#fff5f3] rounded-sm p-3">
                    <p className="text-xs text-gray-500">Total Break Time</p>
                    <p className="text-xl font-bold text-[#f84525] mt-1">
                      {minutesToHours(monthlySummary.breaks)}
                    </p>
                  </div>
                  <div className="bg-[#fff5f3] rounded-sm p-3">
                    <p className="text-xs text-gray-500">Attendance Mix</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Present {monthlySummary.present} | Half Day{" "}
                      {monthlySummary.halfDay}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      )}

      {(show("attendance") || isDashboard) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-sm shadow p-4 lg:col-span-2">
            <h2 className="font-semibold mb-3">My Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[15px]">
              <p>
                <b>Employee ID:</b> {profile?.employeeId || "N/A"}
              </p>
              <p>
                <b>Email:</b> {profile?.email || "N/A"}
              </p>
              <p>
                <b>Mobile:</b> {profile?.mobile || "N/A"}
              </p>
              <p>
                <b>Department:</b> {profile?.department || "N/A"}
              </p>
              <p>
                <b>Designation:</b> {profile?.designation || "N/A"}
              </p>
              <p>
                <b>Joining:</b>{" "}
                {profile?.dateOfJoining
                  ? new Date(profile.dateOfJoining).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-4">
            <h2 className="font-semibold mb-3">Today Attendance</h2>
            <p className="text-sm">
              <b>Status:</b> {todayAttendance?.status || "Not started"}
            </p>
            <p className="text-sm">
              <b>Work:</b>{" "}
              {minutesToHours(todayAttendance?.totalWorkMinutes || 0)}
            </p>
            <p className="text-sm">
              <b>Break:</b>{" "}
              {minutesToHours(todayAttendance?.totalBreakMinutes || 0)}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                text="Start Day"
                loading={actionLoading === "start"}
                onClick={() =>
                  runAttendanceAction(
                    employeeApi.startDay,
                    "Day started",
                    undefined,
                    "start"
                  )
                }
              />
              <Button
                text="End Day"
                variant="danger"
                loading={actionLoading === "end"}
                onClick={() =>
                  runAttendanceAction(
                    employeeApi.endDay,
                    "Day ended",
                    undefined,
                    "end"
                  )
                }
              />
            </div>
            <div className="flex gap-2 mt-3">
              <select
                value={breakType}
                onChange={(e) => setBreakType(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              >
                <option value="lunch">Lunch</option>
                <option value="call">Call</option>
                <option value="tea">Tea</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
              <Button
                text="Start Break"
                variant="secondary"
                loading={actionLoading === "breakStart"}
                onClick={() =>
                  runAttendanceAction(
                    employeeApi.startBreak,
                    "Break started",
                    { type: breakType },
                    "breakStart"
                  )
                }
              />
              <Button
                text="End"
                variant="success"
                loading={actionLoading === "breakEnd"}
                onClick={() =>
                  runAttendanceAction(
                    employeeApi.endBreak,
                    "Break ended",
                    undefined,
                    "breakEnd"
                  )
                }
              />
            </div>
            <div className="mt-4 border-t pt-3">
              <h3 className="font-semibold text-sm mb-2">Today Timeline</h3>
              {todayTimeline.length === 0 ? (
                <p className="text-xs text-gray-500">No timeline yet</p>
              ) : (
                <div className="space-y-2">
                  {todayTimeline.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className="flex justify-between text-xs bg-gray-50 p-2 rounded-sm"
                    >
                      <span>{item.label}</span>
                      <span>{new Date(item.time).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {(show("profile") || show("leaves")) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {show("profile") && (
            <div className="bg-white rounded-sm shadow p-4 lg:col-span-2">
              <h2 className="font-semibold mb-3">My Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <p>
                  <b>Employee ID:</b> {profile?.employeeId || "N/A"}
                </p>
                <p>
                  <b>Email:</b> {profile?.email || "N/A"}
                </p>
                <p>
                  <b>Mobile:</b> {profile?.mobile || "N/A"}
                </p>
                <p>
                  <b>Department:</b> {profile?.department || "N/A"}
                </p>
                <p>
                  <b>Designation:</b> {profile?.designation || "N/A"}
                </p>
                <p>
                  <b>Joining:</b>{" "}
                  {profile?.dateOfJoining
                    ? new Date(profile.dateOfJoining).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
          {show("profile") && (
            <form
              onSubmit={saveAccountCredential}
              className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <div className="md:col-span-2 flex items-center justify-between">
                <h2 className="font-semibold">Saved Account Credentials</h2>
                <FiPlus className="text-[#f84525]" />
              </div>
              <label className="text-sm font-medium text-gray-700">
                Account Type
                <select
                  value={credentialForm.accountType}
                  onChange={(e) =>
                    setCredentialForm((prev) => ({
                      ...prev,
                      accountType: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                >
                  <option>Email</option>
                  <option>Hosting</option>
                  <option>Social</option>
                  <option>Client Panel</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Title
                <input
                  value={credentialForm.title}
                  onChange={(e) =>
                    setCredentialForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Login / Email
                <input
                  value={credentialForm.loginId}
                  onChange={(e) =>
                    setCredentialForm((prev) => ({
                      ...prev,
                      loginId: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Password
                <input
                  type="password"
                  value={credentialForm.password}
                  onChange={(e) =>
                    setCredentialForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                Notes
                <textarea
                  value={credentialForm.notes}
                  onChange={(e) =>
                    setCredentialForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                />
              </label>
              <Button
                text="Save Credential"
                type="submit"
                loading={credentialSaving}
                className="md:col-span-2 justify-self-start"
              />
              <div className="md:col-span-2 space-y-2">
                {accountCredentials.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No saved credentials yet.
                  </p>
                ) : (
                  accountCredentials.map((item) => (
                    <div
                      key={item._id}
                      className="border rounded-sm p-3 flex flex-col md:flex-row md:items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.accountType}
                        </p>
                        <p className="text-sm break-all mt-1">{item.loginId}</p>
                        <p className="text-sm mt-1">
                          {revealedPasswords[item._id]
                            ? item.password
                            : "••••••••"}
                        </p>
                        {item.notes ? (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.notes}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedPasswords((prev) => ({
                              ...prev,
                              [item._id]: !prev[item._id],
                            }))
                          }
                          className="border rounded-sm px-3 py-2 text-sm"
                        >
                          {revealedPasswords[item._id] ? (
                            <FiEyeOff />
                          ) : (
                            <FiEye />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyValue(item.loginId, "Login")}
                          className="border rounded-sm px-3 py-2 text-sm"
                        >
                          <FiCopy />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyValue(item.password, "Password")}
                          className="border rounded-sm px-3 py-2 text-sm"
                        >
                          <FiCopy />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAccountCredential(item._id)}
                          className="border rounded-sm px-3 py-2 text-sm text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </form>
          )}

          {show("profile") && (
            <form
              onSubmit={changePassword}
              className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <h2 className="font-semibold md:col-span-2">Update Password</h2>
              <label className="text-sm font-medium text-gray-700">
                Current Password
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                New Password
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                  required
                />
              </label>
              <Button
                text={passwordSaving ? "Updating..." : "Update Password"}
                loading={passwordSaving}
                type="submit"
                className="md:col-span-2 justify-self-start"
              />
            </form>
          )}

          {show("leaves") && (
            <div className="bg-white rounded-sm shadow p-4 grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Apply Leave</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Open the form only when you want to send a leave mail and
                    request.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/employee/leave-calendar")}
                    className="w-10 h-10 rounded-sm border border-[#ffd8cf] text-[#f84525] flex items-center justify-center"
                    aria-label="Open leave calendar"
                  >
                    <FiCalendar />
                  </button>
                  <Button
                    text={showLeaveForm ? "Close Form" : "Open Leave Form"}
                    type="button"
                    onClick={() => setShowLeaveForm((prev) => !prev)}
                  />
                </div>
              </div>
              {showLeaveForm && (
                <form
                  onSubmit={applyLeave}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <label className="text-sm font-medium">
                    Leave Type
                    <select
                      value={leaveForm.type}
                      onChange={(e) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="mt-1 w-full border rounded-md px-3 py-2"
                    >
                      <option value="earned_leave">EL - Earned Leave</option>
                      <option value="sick_leave">SL - Sick Leave</option>
                      <option value="urgent_leave">Urgent Leave</option>
                      <option value="optional_leave">Optional Leave</option>
                      <option value="half_day">Half Day</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Mail Subject / Title
                    <input
                      value={leaveForm.title}
                      onChange={(e) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="mt-1 w-full border rounded-md px-3 py-2"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium">
                    From Date
                    <input
                      type="date"
                      value={leaveForm.fromDate}
                      onChange={(e) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          fromDate: e.target.value,
                        }))
                      }
                      className="mt-1 w-full border rounded-md px-3 py-2"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium">
                    To Date
                    <input
                      type="date"
                      value={leaveForm.toDate}
                      onChange={(e) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          toDate: e.target.value,
                        }))
                      }
                      className="mt-1 w-full border rounded-md px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium md:col-span-2">
                    Mail Content
                    <textarea
                      value={leaveForm.content}
                      onChange={(e) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      className="mt-1 w-full border rounded-md px-3 py-2"
                      required
                    />
                  </label>
                  <Button
                    text="Submit Leave"
                    type="submit"
                    loading={leaveSaving}
                    className="md:col-span-2 justify-self-start"
                  />
                </form>
              )}
            </div>
          )}
        </section>
      )}

      {(show("attendance") || show("leaves")) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {show("leaves") && leaveBalance && (
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ["EL", leaveBalance.earned_leave],
                ["SL", leaveBalance.sick_leave],
                ["Urgent", leaveBalance.urgent_leave],
              ].map(([label, item]) => (
                <div key={label} className="bg-white rounded-sm shadow p-4">
                  <p className="font-semibold">{label}</p>
                  <p className="text-sm text-gray-500">
                    Used {item.used} / {item.total} | Remaining {item.remaining}
                  </p>
                </div>
              ))}
            </div>
          )}
          {show("attendance") && (
            <div className="bg-white rounded-sm shadow overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between gap-3">
                <h2 className="font-semibold">Attendance History</h2>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="border rounded-sm px-3 py-2 text-sm"
                />
              </div>
              {filteredAttendance.slice(0, 8).map((item) => (
                <div
                  key={item._id}
                  className="grid grid-cols-4 gap-2 border-t px-4 py-3 text-sm"
                >
                  <span>{item.dateKey}</span>
                  <span>{item.status}</span>
                  <span>{minutesToHours(item.totalWorkMinutes)}</span>
                  <span>{minutesToHours(item.totalBreakMinutes)}</span>
                </div>
              ))}
            </div>
          )}

          {show("leaves") && (
            <div className="bg-white rounded-sm shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">My Leaves</h2>
              </div>
              {leaves.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No leaves applied</p>
              ) : (
                leaves.slice(0, 8).map((leave) => (
                  <div
                    key={leave._id}
                    className="grid grid-cols-4 gap-2 border-t px-4 py-3 text-sm"
                  >
                    <span>{leave.title || leave.type.replace("_", " ")}</span>
                    <span>{new Date(leave.fromDate).toLocaleDateString()}</span>
                    <span>{leave.status}</span>
                    <span>{leave.hrComment || "-"}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      )}

      {show("candidates") && (
        <section className="bg-white rounded-sm shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">Assigned Interviews</h2>
            <p className="text-xs text-gray-500 mt-1">
              HR assigns the current round. You only add the review after taking
              the interview.
            </p>
          </div>
          {candidates.length === 0 ? (
            <p className="p-4 text-center text-gray-500">
              No assigned candidates
            </p>
          ) : (
            candidates.map((candidate) => (
              <div
                key={candidate._id}
                className="grid grid-cols-1 md:grid-cols-6 gap-2 border-t px-4 py-3 text-sm md:items-center"
              >
                <span className="font-medium">{candidate.name}</span>
                <span className="break-all">{candidate.email}</span>
                <span>{candidate.jobRole}</span>
                <span className="px-2 py-1 bg-[#fff5f3] text-[#f84525] rounded-sm font-semibold w-fit">
                  {candidate.interviewStatus}
                </span>
                <span>
                  {candidate.experienceType === "fresher"
                    ? "Fresher"
                    : `${candidate.experience || 0} yrs`}
                </span>
                <Button
                  text="Add Review"
                  onClick={() => setSelected(candidate)}
                />
              </div>
            ))
          )}
        </section>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={updateRound}
            className="bg-white rounded-sm shadow-xl w-full max-w-lg p-4 space-y-3"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-semibold">{selected.name}</h2>
              <button type="button" onClick={() => setSelected(null)}>
                x
              </button>
            </div>
            <div className="text-sm bg-gray-50 rounded-sm p-3">
              Current assigned round: <b>{selected.interviewStatus}</b>. HR will
              move this candidate to the next round after reviewing your report.
            </div>
            <label className="block text-sm font-medium">
              Round Type
              <select
                value={roundForm.roundType}
                onChange={(e) =>
                  setRoundForm((prev) => ({
                    ...prev,
                    roundType: e.target.value,
                  }))
                }
                className="mt-1 w-full border rounded-md px-3 py-2"
              >
                <option value="technical">Technical Round</option>
                <option value="machine_test">Machine Test</option>
                <option value="ui_ux">UI/UX Review</option>
                <option value="testing">Testing Round</option>
                <option value="hr">HR Round</option>
                <option value="project_coordinator">Project Coordinator</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Score
              <input
                type="number"
                min="0"
                max="10"
                value={roundForm.score}
                onChange={(e) =>
                  setRoundForm((prev) => ({ ...prev, score: e.target.value }))
                }
                className="mt-1 w-full border rounded-md px-3 py-2"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Comments
              <textarea
                value={roundForm.comments}
                onChange={(e) =>
                  setRoundForm((prev) => ({
                    ...prev,
                    comments: e.target.value,
                  }))
                }
                className="mt-1 w-full border rounded-md px-3 py-2"
                required
              />
            </label>
            <Button
              text="Save Review"
              type="submit"
              loading={roundSaving}
              className="justify-self-start"
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
