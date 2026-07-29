import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiCopy, FiEye, FiEyeOff, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import TrendAreaChart from "../../components/common/TrendAreaChart";
import { useToast } from "../../contexts/ToastContext";

const minutesToHours = (minutes = 0) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const secondsToClock = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
  const remainingSeconds = String(safeSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${remainingSeconds}`;
};

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const fileToDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatChartDate = (dateKey) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

const roundLabels = {
  hr_round: "HR Round",
  first_round: "Technical Round",
  second_round: "Machine Test",
  final: "Final Round",
  selected: "Selected",
  rejected: "Rejected",
};

const formatRound = (round) => roundLabels[round] || String(round || "").replace("_", " ");

const getMyCurrentRoundReview = (candidate, employeeId) =>
  candidate.interviewRounds?.find(
    (round) =>
      round.round === candidate.interviewStatus &&
      String(round.interviewerEmployee || "") === String(employeeId || "")
  );

const canEmployeeEditReview = (round) =>
  !round?.date || toDateKey(new Date(round.date)) === toDateKey();

const calculateLiveAttendance = (attendanceRecord, currentTime = new Date()) => {
  if (!attendanceRecord?.loginAt) {
    return { totalSeconds: 0, workSeconds: 0, breakSeconds: 0 };
  }

  const endTime = attendanceRecord.logoutAt
    ? new Date(attendanceRecord.logoutAt)
    : currentTime;
  const loginTime = new Date(attendanceRecord.loginAt);
  const totalSeconds = Math.max(0, Math.floor((endTime - loginTime) / 1000));
  const breakSeconds = (attendanceRecord.breaks || []).reduce((sum, item) => {
    if (!item.startAt) return sum;
    const breakStart = new Date(item.startAt);
    const breakEnd = item.endAt ? new Date(item.endAt) : endTime;
    return sum + Math.max(0, Math.floor((breakEnd - breakStart) / 1000));
  }, 0);

  return {
    totalSeconds,
    breakSeconds,
    workSeconds: Math.max(0, totalSeconds - breakSeconds),
  };
};

const EmployeeDashboard = ({ section = "all" }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [interviewLogs, setInterviewLogs] = useState([]);
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
    attachment: null,
  });
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const todayKey = toDateKey();
  const yesterdayKey = toDateKey(addDays(new Date(), -1));
  const currentMonthKey = todayKey.slice(0, 7);
  const [attendanceDate, setAttendanceDate] = useState(yesterdayKey);
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
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [roundForm, setRoundForm] = useState({
    score: "",
    comments: "",
  });
  const [clockNow, setClockNow] = useState(new Date());

  const todayAttendance = useMemo(
    () =>
      attendance.find(
        (item) => item.dateKey === todayKey
      ),
    [attendance, todayKey]
  );
  const dayStarted = Boolean(todayAttendance?.loginAt);
  const dayEnded = Boolean(todayAttendance?.logoutAt);
  const runningBreak = todayAttendance?.breaks?.some((item) => !item.endAt);
  const liveAttendance = useMemo(
    () => calculateLiveAttendance(todayAttendance, clockNow),
    [clockNow, todayAttendance]
  );

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [
        profileRes,
        candidatesRes,
        interviewLogsRes,
        attendanceRes,
        leavesRes,
        ,
        credentialsRes,
      ] = await Promise.all([
        employeeApi.getProfile(),
        employeeApi.getAssignedCandidates(),
        employeeApi.getInterviewLogs(),
        employeeApi.getAttendance(),
        employeeApi.getLeaves(),
        employeeApi.getCalendar(null, new Date().getFullYear()),
        employeeApi.getMyAccountCredentials(),
      ]);
      setProfile(profileRes.data.data);
      setCandidates(candidatesRes.data.data || []);
      setInterviewLogs(interviewLogsRes.data.data?.logs || []);
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

  const getCurrentLocationPayload = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Location is not supported in this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
          }),
        () => reject(new Error("Please allow location access to start work")),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });

  const startWork = async () => {
    let payload;
    try {
      payload = await getCurrentLocationPayload();
    } catch (err) {
      if (profile?.attendanceMode !== "work_from_home") {
        toast.error(err.message || "Please allow location access to start work");
        return;
      }
    }

    await runAttendanceAction(employeeApi.startDay, "Work started", payload, "start");
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
        attachment: null,
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

  const handleLeaveAttachment = async (file) => {
    if (!file) {
      setLeaveForm((prev) => ({ ...prev, attachment: null }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    const dataUri = await fileToDataUri(file);
    setLeaveForm((prev) => ({
      ...prev,
      attachment: { dataUri, name: file.name, type: file.type },
    }));
  };

  const handleLeaveAttachmentPaste = async (event) => {
    const file = Array.from(event.clipboardData?.items || [])
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();
    if (!file) return;
    event.preventDefault();
    await handleLeaveAttachment(file);
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

  const openReview = (candidate) => {
    const existingRound = getMyCurrentRoundReview(candidate, profile?._id);

    if (existingRound && !canEmployeeEditReview(existingRound)) {
      toast.error("Review can be edited only on the same day. Contact HR or Admin.");
      return;
    }

    setRoundForm({
      score: existingRound?.score ?? "",
      comments: existingRound?.comments || "",
    });
    setSelected(candidate);
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

  const currentMonthAttendance = useMemo(
    () => attendance.filter((item) => item.dateKey?.startsWith(currentMonthKey)),
    [attendance, currentMonthKey]
  );

  const monthlySummary = useMemo(() => {
    return currentMonthAttendance.reduce(
      (acc, item) => {
        acc.work += item.totalWorkMinutes || 0;
        acc.breaks += item.totalBreakMinutes || 0;
        acc.present += item.status === "present" ? 1 : 0;
        acc.halfDay += item.status === "half_day" ? 1 : 0;
        acc.running += item.status === "running" ? 1 : 0;
        return acc;
      },
      { work: 0, breaks: 0, present: 0, halfDay: 0, running: 0 }
    );
  }, [currentMonthAttendance]);

  const pendingInterviews = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          !candidate.interviewRounds?.some(
            (round) =>
              round.round === candidate.interviewStatus &&
              String(round.interviewerEmployee || "") === String(profile?._id || "")
          )
      ),
    [candidates, profile?._id]
  );

  const monthlyChartData = useMemo(
    () =>
      currentMonthAttendance
        .slice()
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .map((item) => ({
          date: formatChartDate(item.dateKey),
          workHours: Number(((item.totalWorkMinutes || 0) / 60).toFixed(1)),
          breakHours: Number(((item.totalBreakMinutes || 0) / 60).toFixed(1)),
        })),
    [currentMonthAttendance]
  );
  const filteredAttendance = useMemo(() => {
    if (!attendanceDate) return attendance.slice(0, 8);
    const matched = attendance.filter(
      (item) => item.dateKey === attendanceDate
    );
    return matched;
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
              <div className="mb-3">
                <h2 className="font-semibold">Monthly Work & Break Hours</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Daily hours for {currentMonthKey}. Orange is work time, gray is break time.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 items-center">
                <div className="h-64">
                  {monthlyChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center rounded-sm border border-dashed text-sm text-gray-500">
                      No attendance recorded this month.
                    </div>
                  ) : (
                    <TrendAreaChart
                      data={monthlyChartData}
                      xKey="date"
                      yLabel="Hours"
                      tooltipFormatter={(value, name) => [`${value}h`, name]}
                      series={[
                        { key: "workHours", name: "Work Hours", color: "#f84525" },
                        { key: "breakHours", name: "Break Hours", color: "#ffa826" },
                      ]}
                    />
                  )}
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
                      {monthlySummary.halfDay} | Running {monthlySummary.running}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      )}

      {(show("attendance") || isDashboard) && (
        <>
        <section className="bg-white rounded-sm shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">Attendance Timer</h2>
              <p className="text-xs text-gray-500 mt-1">
                Live counter for today's total time, work time, and break time.
              </p>
            </div>
            <span className={`px-3 py-2 rounded-sm text-xs font-semibold capitalize w-fit ${
              runningBreak
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : dayStarted && !dayEnded
                ? "bg-green-50 text-green-700 border border-green-200"
                : dayEnded
                ? "bg-gray-100 text-gray-700 border border-gray-200"
                : "bg-[#fff5f3] text-[#f84525] border border-[#ffd8cf]"
            }`}>
              {runningBreak
                ? "On Break"
                : dayStarted && !dayEnded
                ? "Working"
                : dayEnded
                ? "Work Ended"
                : "Not Started"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
            {[
              ["Total Time", secondsToClock(liveAttendance.totalSeconds), "Login to now/end"],
              ["Work Time", secondsToClock(liveAttendance.workSeconds), "Total minus breaks"],
              ["Break Time", secondsToClock(liveAttendance.breakSeconds), runningBreak ? "Break running now" : "Total break used"],
            ].map(([label, value, hint]) => (
              <div key={label} className="border border-gray-100 rounded-sm p-4 bg-white">
                <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-[#f84525] mt-2 tabular-nums">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{hint}</p>
              </div>
            ))}
          </div>
        </section>
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
              {secondsToClock(liveAttendance.workSeconds)}
            </p>
            <p className="text-sm">
              <b>Break:</b>{" "}
              {secondsToClock(liveAttendance.breakSeconds)}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                text="Start Work"
                loading={actionLoading === "start"}
                disabled={dayStarted}
                onClick={startWork}
              />
              <Button
                text="End Work"
                variant="danger"
                loading={actionLoading === "end"}
                disabled={!dayStarted || dayEnded}
                onClick={() =>
                  runAttendanceAction(
                    employeeApi.endDay,
                    "Work ended",
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
                disabled={!dayStarted || dayEnded || runningBreak}
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
                disabled={!dayStarted || dayEnded || runningBreak}
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
                text="End Break"
                variant="success"
                loading={actionLoading === "breakEnd"}
                disabled={!runningBreak}
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
        </>
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
                  <label className="text-sm font-medium md:col-span-2">
                    Attachment Image
                    <div
                      tabIndex={0}
                      onPaste={handleLeaveAttachmentPaste}
                      className="mt-1 rounded-md border border-dashed border-gray-300 bg-gray-50 p-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLeaveAttachment(e.target.files?.[0])}
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                      <p className="mt-1 text-xs text-gray-500">Paste copied image here or choose file.</p>
                    </div>
                    {leaveForm.attachment?.name && (
                      <span className="mt-1 block text-xs text-gray-500">
                        Selected: {leaveForm.attachment.name}
                      </span>
                    )}
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
              <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Attendance History</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Default view shows yesterday's attendance.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAttendanceDate(yesterdayKey)}
                    className={`px-3 py-2 rounded-sm border text-sm ${
                      attendanceDate === yesterdayKey
                        ? "bg-[#f84525] text-white border-[#f84525]"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceDate(todayKey)}
                    className={`px-3 py-2 rounded-sm border text-sm ${
                      attendanceDate === todayKey
                        ? "bg-[#f84525] text-white border-[#f84525]"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    Today
                  </button>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="border rounded-sm px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                <span>Date</span>
                <span>Status</span>
                <span>Work</span>
                <span>Break</span>
              </div>
              {filteredAttendance.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">
                  No attendance found for {attendanceDate || "selected date"}.
                </p>
              ) : (
                filteredAttendance.slice(0, 8).map((item) => (
                  <div
                    key={item._id}
                    className="grid grid-cols-4 gap-2 border-t px-4 py-3 text-sm"
                  >
                    <span>{item.dateKey}</span>
                    <span className="capitalize">{item.status?.replace("_", " ")}</span>
                    <span>{minutesToHours(item.totalWorkMinutes)}</span>
                    <span>{minutesToHours(item.totalBreakMinutes)}</span>
                  </div>
                ))
              )}
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
                  <button
                    type="button"
                    key={leave._id}
                    onClick={() => setSelectedLeave(leave)}
                    className="w-full text-left grid grid-cols-4 gap-2 border-t px-4 py-3 text-sm hover:bg-[#fff8f6] transition-colors"
                  >
                    <span>{leave.title || leave.type.replace("_", " ")}</span>
                    <span>{new Date(leave.fromDate).toLocaleDateString()}</span>
                    <span>{leave.status}</span>
                    <span>{leave.hrComment || "-"}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </section>
      )}

      {show("candidates") && (
        <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-sm shadow p-4">
            <p className="text-sm text-gray-500">Interviews Taken</p>
            <p className="text-2xl font-bold text-[#f84525] mt-1">{interviewLogs.length}</p>
          </div>
          <div className="bg-white rounded-sm shadow p-4">
            <p className="text-sm text-gray-500">Pending Interviews</p>
            <p className="text-2xl font-bold text-[#f84525] mt-1">{pendingInterviews.length}</p>
          </div>
          <div className="bg-white rounded-sm shadow p-4">
            <p className="text-sm text-gray-500">Assigned Candidates</p>
            <p className="text-2xl font-bold text-[#f84525] mt-1">{candidates.length}</p>
          </div>
        </div>
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
            candidates.map((candidate) => {
                const existingRound = getMyCurrentRoundReview(candidate, profile?._id);
                const canEdit = canEmployeeEditReview(existingRound);

                return (
                  <div
                    key={candidate._id}
                    className="grid grid-cols-1 md:grid-cols-6 gap-2 border-t px-4 py-3 text-sm md:items-center"
                  >
                    <span className="font-medium">{candidate.name}</span>
                    <span className="break-all">{candidate.email}</span>
                    <span>{candidate.jobRole}</span>
                    <span className="px-2 py-1 bg-[#fff5f3] text-[#f84525] rounded-sm font-semibold w-fit">
                      {formatRound(candidate.interviewStatus)}
                    </span>
                    <span>
                      {existingRound
                        ? canEdit
                          ? "Submitted today"
                          : "Review locked"
                        : candidate.experienceType === "fresher"
                        ? "Fresher"
                        : `${candidate.experience || 0} yrs`}
                    </span>
                    <Button
                      text={existingRound ? (canEdit ? "Edit Review" : "Locked") : "Add Review"}
                      disabled={Boolean(existingRound && !canEdit)}
                      onClick={() => openReview(candidate)}
                    />
                  </div>
                );
              }
            )
          )}
        </section>
        <section className="bg-white rounded-sm shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">Interview Logs</h2>
            <p className="text-xs text-gray-500 mt-1">Completed interview reports submitted by you.</p>
          </div>
          {interviewLogs.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No interview logs yet</p>
          ) : (
            interviewLogs.slice(0, 12).map((item) => (
              <div key={item._id} className="grid grid-cols-1 md:grid-cols-6 gap-2 border-t px-4 py-3 text-sm md:items-center">
                <span className="font-medium">{item.candidateName}</span>
                <span>{item.jobRole || "-"}</span>
                <span>{formatRound(item.round)}</span>
                <span className="capitalize">{item.roundType?.replace("_", " ")}</span>
                <span>Score {item.score}/10</span>
                <span>{item.date ? new Date(item.date).toLocaleDateString() : "-"}</span>
              </div>
            ))
          )}
        </section>
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
              Current assigned round: <b>{formatRound(selected.interviewStatus)}</b>
              {selected.currentRoundType
                ? ` (${selected.currentRoundType.replace("_", " ")})`
                : ""}
              . HR will move this candidate to the next round after reviewing
              your report.
            </div>
            <label className="block text-sm font-medium">
              Score /10
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={roundForm.score}
                onChange={(e) =>
                  setRoundForm((prev) => ({ ...prev, score: e.target.value }))
                }
                className="mt-1 w-full border rounded-md px-3 py-2"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Decision / Comments
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

      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[#f84525]">
                  {selectedLeave.type?.replace("_", " ")}
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {selectedLeave.title || "Leave Request"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="text-gray-500 hover:text-[#f84525] text-lg px-2"
                aria-label="Close leave detail"
              >
                x
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="border rounded-sm p-3">
                  <p className="text-xs text-gray-500">From</p>
                  <p className="font-semibold mt-1">
                    {new Date(selectedLeave.fromDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="border rounded-sm p-3">
                  <p className="text-xs text-gray-500">To</p>
                  <p className="font-semibold mt-1">
                    {new Date(selectedLeave.toDate || selectedLeave.fromDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="border rounded-sm p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-semibold capitalize mt-1">{selectedLeave.status}</p>
                </div>
                <div className="border rounded-sm p-3">
                  <p className="text-xs text-gray-500">HR Comment</p>
                  <p className="font-semibold mt-1">{selectedLeave.hrComment || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Reason / Content</p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                  {selectedLeave.content || selectedLeave.reason || "No reason added."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
