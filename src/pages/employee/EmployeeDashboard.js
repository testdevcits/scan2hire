import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiClock,
  FiCoffee,
  FiUsers,
  FiBriefcase,
  FiKey,
  FiGift,
} from "react-icons/fi";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import DateRangePicker from "../../components/common/DateRangePicker";
import CustomDropdown from "../../components/common/CustomDropdown";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../contexts/ToastContext";
import { isTeamLeadUser } from "../../utils/roleUtils";

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

const roundLabels = {
  hr_round: "HR Round",
  first_round: "Technical Round",
  second_round: "Machine Test",
  final: "Final Round",
  third_round: "Final Round",
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

// ---- shared dashboard shell pieces --------------------------------------

const Card = ({ className = "", children }) => (
  <div
    className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, action }) => (
  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 flex-shrink-0">
    <div>
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h2>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);

// KPI tile with an icon chip — the "dashboard" look
const Kpi = ({ icon, label, value, tone = "brand" }) => {
  const tones = {
    brand: "bg-[#fff5f3] text-[#f84525] dark:bg-[#2a1712]",
    dark: "bg-gray-900 text-white dark:bg-black",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  };
  return (
    <Card className="p-4 flex items-center gap-3 min-w-0 flex-1">
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${tones[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums truncate">
          {value}
        </p>
      </div>
    </Card>
  );
};

// A card whose body scrolls internally so the page shell never has to
const ScrollCard = ({ title, subtitle, action, children, className = "" }) => (
  <Card className={`flex flex-col min-h-0 ${className}`}>
    <CardHeader title={title} subtitle={subtitle} action={action} />
    <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
  </Card>
);

const StatusPill = ({ runningBreak, dayStarted, dayEnded }) => {
  const cls = runningBreak
    ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
    : dayStarted && !dayEnded
    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
    : dayEnded
    ? "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    : "bg-[#fff5f3] text-[#f84525] border-[#ffd8cf] dark:bg-[#2a1712] dark:border-[#5c2c1f]";
  const label = runningBreak
    ? "On Break"
    : dayStarted && !dayEnded
    ? "Working"
    : dayEnded
    ? "Work Ended"
    : "Not Started";
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize w-fit border ${cls}`}>
      {label}
    </span>
  );
};

const EmployeeDashboard = ({ section = "all" }) => {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [moduleAccess, setModuleAccess] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [interviewLogs, setInterviewLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [roundSaving, setRoundSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "earned_leave",
    title: "",
    fromDate: "",
    toDate: "",
    content: "",
    attachment: null,
  });
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [includeLeaveAttachment, setIncludeLeaveAttachment] = useState(false);
  const todayKey = toDateKey();
  const yesterdayKey = toDateKey(addDays(new Date(), -1));
  const currentMonthKey = todayKey.slice(0, 7);
  const [attendanceDate, setAttendanceDate] = useState(yesterdayKey);
  const [accountCredentials] = useState([]);
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
  const [interviewTab, setInterviewTab] = useState("current");
  const [clockNow, setClockNow] = useState(new Date());
  const [birthdaySplash, setBirthdaySplash] = useState(false);
  const [birthdayTheme, setBirthdayTheme] = useState(0);
  const isBirthday = useMemo(() => { if (!profile?.dob) return false; const dob = new Date(profile.dob); const now = new Date(); return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate(); }, [profile?.dob]);
  useEffect(() => { if (!isBirthday) return undefined; setBirthdayTheme(Math.floor(Math.random() * 5)); setBirthdaySplash(true); const timer = setTimeout(() => setBirthdaySplash(false), 5000); return () => clearTimeout(timer); }, [isBirthday]);
  const isTeamLead = useMemo(() => isTeamLeadUser(profile), [profile]);

  const todayAttendance = useMemo(
    () => attendance.find((item) => item.dateKey === todayKey),
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
      const [profileRes, attendanceRes, leavesRes, candidatesRes, logsRes, accessRes] = await Promise.all([
        employeeApi.getProfile(),
        employeeApi.getAttendance(),
        employeeApi.getLeaves(),
        employeeApi.getAssignedCandidates(),
        employeeApi.getInterviewLogs(),
        employeeApi.getMyAccess(),
      ]);
      setProfile(profileRes.data.data);
      setModuleAccess(accessRes.data.data?.moduleAccess || {});
      setAttendance(attendanceRes.data.data || []);
      setLeaves(leavesRes.data.data?.leaves || leavesRes.data.data || []);
      setLeaveBalance(leavesRes.data.data?.balance || null);
      setCandidates(candidatesRes.data.data || []);
      setInterviewLogs(logsRes.data.data?.logs || []);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData().catch((err) =>
      toast.error(err.response?.data?.message || "Unable to load employee dashboard")
    );
  }, [fetchData, toast]);

  const applyLeave = async (e) => {
    e.preventDefault();
    const minimumDate = ["earned_leave", "optional_leave"].includes(leaveForm.type) ? toDateKey(addDays(new Date(), 1)) : "";
    if (minimumDate && leaveForm.fromDate < minimumDate) { toast.error("Earned and optional leave must start from a future date."); return; }
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
      setIncludeLeaveAttachment(false);
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
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload an image or PDF file.");
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
    if (!isTeamLead) {
      toast.error("Only Team Leads can submit interview review results.");
      return;
    }
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
    if (!isTeamLead) {
      toast.error("Only Team Leads can submit interview review results.");
      return;
    }

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
  const effectiveModuleAccess = moduleAccess || profile?.user?.moduleAccess || profile?.moduleAccess || {};
  const canApplyLeave = Boolean(effectiveModuleAccess.leaves?.add || effectiveModuleAccess.leaves?.edit);
  const leaveMinDate = ["earned_leave", "optional_leave"].includes(leaveForm.type) ? toDateKey(addDays(new Date(), 1)) : "";

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

  const currentAssignedInterviews = useMemo(
    () => {
      if (!isTeamLead) return [];
      return candidates.filter(
        (candidate) =>
          !["selected", "rejected"].includes(candidate.interviewStatus) &&
          !getMyCurrentRoundReview(candidate, profile?._id)
      );
    },
    [candidates, isTeamLead, profile?._id]
  );

  const formatDateTime = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const filteredAttendance = useMemo(() => {
    if (!attendanceDate) return attendance.slice(0, 8);
    return attendance.filter((item) => item.dateKey === attendanceDate);
  }, [attendance, attendanceDate]);

  const missingDocuments = useMemo(() => {
    const required = ["photo", "aadhaarCard", "panCard", "passbook", "degree", "resume"];
    return required.filter((key) => !profile?.documents?.[key]?.url);
  }, [profile]);

  if (pageLoading) return <CommonLoader text="Loading employee dashboard..." />;

  return (
    <>
    {birthdaySplash && <div className={`birthday-overlay birthday-theme-${birthdayTheme} fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f84525]/95 via-[#ff8a65]/95 to-[#ffcf70]/95 p-6`}><div className="birthday-balloons" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} className="birthday-balloon" style={{ left: `${5 + index * 8}%`, animationDelay: `${index * 0.18}s` }}>🎈</span>)}</div><div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #fff 0 3px, transparent 4px), radial-gradient(circle at 80% 30%, #fff 0 4px, transparent 5px), radial-gradient(circle at 35% 75%, #fff 0 3px, transparent 4px)", backgroundSize: "90px 90px, 130px 130px, 110px 110px" }} /><div className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-8 text-center shadow-2xl backdrop-blur birthday-card"><div className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#f84525] text-2xl text-white shadow-lg">🎉</div>{profile?.documents?.photo?.url ? <img src={profile.documents.photo.url} alt={profile.name || "Employee"} className="mx-auto mb-4 mt-2 h-28 w-28 rounded-full border-4 border-[#ffd1c5] object-cover shadow-lg" /> : <div className="mx-auto mb-4 mt-2 flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#ffd1c5] bg-[#fff1ed] text-3xl font-bold text-[#f84525]">{String(profile?.name || "You").split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>}<FiGift className="mx-auto mb-2 h-8 w-8 text-[#f84525]" /><p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#f84525]">Today is your day</p><h2 className="mt-2 text-3xl font-extrabold text-gray-900">Happy Birthday!</h2><p className="mt-2 text-gray-600">Wishing you a wonderful year ahead.</p><div className="mx-auto mt-6 h-2 w-full overflow-hidden rounded-full bg-orange-100"><div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-[#f84525] via-[#ffb347] to-[#f84525]" /></div></div></div>}
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {missingDocuments.length > 0 && (
        <div className="flex-shrink-0 flex items-start gap-3 bg-[#fff5f3] dark:bg-[#2a1712] border border-[#ffd8cf] dark:border-[#5c2c1f] rounded-2xl px-4 py-3">
          <span className="mt-1 w-2 h-2 rounded-full bg-[#f84525] flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-[#f84525]">Documents pending — </span>
            {missingDocuments.join(", ")}.
          </p>
        </div>
      )}

      {isDashboard && (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* header row */}
          <Card className="flex-shrink-0 px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {profile?.name ? `Welcome, ${profile.name}` : "My Dashboard"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {profile?.designation || "Employee"} &middot; {profile?.department || "N/A"}
              </p>
            </div>
            <StatusPill runningBreak={runningBreak} dayStarted={dayStarted} dayEnded={dayEnded} />
          </Card>

          {/* KPI row */}
          <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={<FiClock />} label="Live Work Time" value={secondsToClock(liveAttendance.workSeconds)} />
            <Kpi icon={<FiCoffee />} label="Live Break Time" value={secondsToClock(liveAttendance.breakSeconds)} />
            <Kpi icon={<FiCalendar />} label="Present Days" value={monthlySummary.present} tone="dark" />
            <Kpi icon={<FiCalendar />} label="Half Days" value={monthlySummary.halfDay} tone="neutral" />
          </div>

          {/* main widget row */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 flex flex-col min-h-0">
              <CardHeader title="This Month's Birthdays" subtitle={`Birthdays in ${new Date().toLocaleDateString(undefined, { month: "long" })}`} />
              <div className="flex-1 min-h-0 p-4">
                {profile?.dob && new Date(profile.dob).getMonth() === new Date().getMonth() ? (
                  <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-[#fff8f6] px-4 py-3 dark:border-orange-950 dark:bg-orange-950/20">
                    <div><p className="font-semibold text-gray-900 dark:text-gray-100">{profile.name || "You"}</p><p className="text-sm text-gray-500">{new Date(profile.dob).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</p></div>
                    <span className="text-2xl" aria-hidden="true">🎂</span>
                  </div>
                ) : <div className="relative flex h-full min-h-56 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"><img src="/2025-3_2025-1_Conative_Wall.jpg" alt="Conative" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm dark:bg-gray-900/95 dark:text-gray-300">No birthdays this month.</span></div></div>}
              </div>
            </Card>

            <div className="flex flex-col gap-4 min-h-0">
              <Card className="relative flex-1 min-h-0 overflow-hidden border-0 bg-gradient-to-br from-[#fff7f3] via-white to-[#fff1ed] p-0 shadow-sm dark:from-orange-950/40 dark:via-gray-900 dark:to-gray-900">
                <div className="h-2 bg-gradient-to-r from-[#f84525] via-[#ff9b73] to-[#f84525]" />
                <div className="flex h-full flex-col p-5">
                  <div className="flex items-center gap-3 border-b border-orange-100 pb-4 dark:border-orange-950">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full"><img src="/logo512.png" alt="Conative" className="absolute inset-0 h-full w-full object-contain" />{profile?.documents?.photo?.url && <img src={profile.documents.photo.url} alt={profile.name || "Employee"} className="relative h-14 w-14 rounded-full border-4 border-white object-cover shadow-md" />}</div>
                    <div className="min-w-0"><p className="text-lg font-bold text-gray-900 dark:text-white">{profile?.name || "Employee"}</p><p className="text-sm text-[#f84525]">{profile?.designation || "Employee"}</p><p className="mt-1 text-xs text-gray-500">{profile?.department || "Conative IT Solutions"}</p></div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                    {[["Employee ID", profile?.employeeId], ["Email", profile?.email], ["Mobile", profile?.mobile], ["Joining", profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : null]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 dark:bg-gray-800/60"><span className="text-xs text-gray-500 dark:text-gray-400">{label}</span><span className="max-w-[65%] truncate text-right text-sm font-semibold text-gray-900 dark:text-gray-100">{value || "N/A"}</span></div>)}
                  </div>
                  <div className="mt-auto border-t border-orange-200 pt-3 text-center dark:border-orange-950"><p className="text-xs font-bold uppercase tracking-wide text-[#f84525]">Conative IT Solutions Pvt. Ltd.</p><p className="mt-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300">Ph. +91-826-978-8173</p><p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-gray-400">Office no. 608, Airen Heights, behind Pakiza Mall,<br />Opp. C21 Mall, Indore, M.P. 452010</p></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {show("attendance") && (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <Card className="flex-shrink-0">
            <CardHeader
              title="Attendance Timer"
              subtitle="Live counter for today's total time, work time, and break time."
              action={
                <StatusPill runningBreak={runningBreak} dayStarted={dayStarted} dayEnded={dayEnded} />
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
              {[
                ["Total Time", secondsToClock(liveAttendance.totalSeconds), "Login to now/end"],
                ["Work Time", secondsToClock(liveAttendance.workSeconds), "Total minus breaks"],
                [
                  "Break Time",
                  secondsToClock(liveAttendance.breakSeconds),
                  runningBreak ? "Break running now" : "Total break used",
                ],
              ].map(([label, value, hint]) => (
                <div
                  key={label}
                  className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-50/60 dark:bg-gray-800/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {label}
                  </p>
                  <p className="text-3xl font-bold text-[#f84525] mt-2 tabular-nums">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
                </div>
              ))}
            </div>
          </Card>

          <ScrollCard
            className="flex-1"
            title="Attendance History"
            subtitle="Default view shows yesterday's attendance."
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAttendanceDate(yesterdayKey)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    attendanceDate === yesterdayKey
                      ? "bg-[#f84525] text-white border-[#f84525]"
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceDate(todayKey)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    attendanceDate === todayKey
                      ? "bg-[#f84525] text-white border-[#f84525]"
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                  }`}
                >
                  Today
                </button>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            }
          >
            <div className="grid grid-cols-4 gap-2 px-5 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
              <span>Date</span>
              <span>Status</span>
              <span>Work</span>
              <span>Break</span>
            </div>
            {filteredAttendance.length === 0 ? (
              <EmptyState text={`No attendance found for ${attendanceDate || "selected date"}.`} />
            ) : (
              filteredAttendance.map((item) => (
                <div
                  key={item._id}
                  className="grid grid-cols-4 gap-2 border-t border-gray-100 dark:border-gray-800 px-5 py-3 text-sm text-gray-800 dark:text-gray-200"
                >
                  <span>{item.dateKey}</span>
                  <span className="capitalize">{item.status?.replace("_", " ")}</span>
                  <span>{minutesToHours(item.totalWorkMinutes)}</span>
                  <span>{minutesToHours(item.totalBreakMinutes)}</span>
                </div>
              ))
            )}
          </ScrollCard>
        </div>
      )}

      {show("profile") && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5 lg:col-span-2 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">My Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                ["Employee ID", profile?.employeeId],
                ["Email", profile?.email],
                ["Mobile", profile?.mobile],
                ["Department", profile?.department],
                ["Designation", profile?.designation],
                [
                  "Joining",
                  profile?.dateOfJoining
                    ? new Date(profile.dateOfJoining).toLocaleDateString()
                    : null,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                    {value || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <ScrollCard
            title="Saved Account Credentials"
            action={<FiKey className="text-[#f84525]" />}
          >
            <form onSubmit={saveAccountCredential} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Type
                <select
                  value={credentialForm.accountType}
                  onChange={(e) =>
                    setCredentialForm((prev) => ({ ...prev, accountType: e.target.value }))
                  }
                  className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                >
                  <option>Email</option>
                  <option>Hosting</option>
                  <option>Social</option>
                  <option>Client Panel</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
                <input
                  value={credentialForm.title}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Login / Email
                <input
                  value={credentialForm.loginId}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, loginId: e.target.value }))}
                  className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
                <input
                  type="password"
                  value={credentialForm.password}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Notes
                <textarea
                  value={credentialForm.notes}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                />
              </label>
              <Button
                text="Save Credential"
                type="submit"
                loading={credentialSaving}
                className="md:col-span-2 justify-self-start"
              />
              <div className="md:col-span-2 space-y-2.5">
                {accountCredentials.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No saved credentials yet.</p>
                ) : (
                  accountCredentials.map((item) => (
                    <div
                      key={item._id}
                      className="border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.accountType}</p>
                        <p className="text-sm break-all mt-1 text-gray-800 dark:text-gray-200">
                          {item.loginId}
                        </p>
                        <p className="text-sm mt-1 tabular-nums text-gray-800 dark:text-gray-200">
                          {revealedPasswords[item._id] ? item.password : "••••••••"}
                        </p>
                        {item.notes ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedPasswords((prev) => ({ ...prev, [item._id]: !prev[item._id] }))
                          }
                          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {revealedPasswords[item._id] ? <FiEyeOff /> : <FiEye />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyValue(item.loginId, "Login")}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <FiCopy />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyValue(item.password, "Password")}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <FiCopy />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAccountCredential(item._id)}
                          className="border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </form>
          </ScrollCard>

          <Card className="p-5">
            <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 md:col-span-2">
                Update Password
              </h2>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
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
          </Card>
        </div>
      )}

      {show("leaves") && (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {leaveBalance && (
            <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                ["Earned Leave", leaveBalance.earned_leave],
                ["Sick Leave", leaveBalance.sick_leave],
                ["Urgent Leave", leaveBalance.urgent_leave],
                ["Optional Leave", leaveBalance.optional_leave],
                ["Half Day", leaveBalance.half_day],
                ["Full Day", leaveBalance.full_day],
              ].map(([label, item]) => (
                <Card key={label} className="p-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Used {item.used} / {item.total} &middot; Available{" "}
                    <span className="text-[#f84525] font-semibold">{item.remaining}</span>
                  </p>
                </Card>
              ))}
            </div>
          )}

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ScrollCard
              title="Apply Leave"
              subtitle="Open the form only when you want to send a leave mail and request."
              action={canApplyLeave ? (
                <div className="flex items-center gap-2">
                  <Button
                    text={showLeaveForm ? "Close Form" : "Open Leave Form"}
                    type="button"
                    onClick={() => setShowLeaveForm((prev) => !prev)}
                  />
                </div>
              ) : null}
            >
              {showLeaveForm ? (
                <form onSubmit={applyLeave} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <CustomDropdown label="Leave Type" value={leaveForm.type} showPlaceholder={false} options={[{ value: "earned_leave", label: "EL - Earned Leave" }, { value: "sick_leave", label: "SL - Sick Leave" }, { value: "urgent_leave", label: "Urgent Leave" }, { value: "optional_leave", label: "Optional Leave" }, { value: "half_day", label: "Half Day" }, { value: "full_day", label: "Full Day" }]} onChange={(value) => setLeaveForm((prev) => ({ ...prev, type: value, fromDate: "", toDate: "" }))} buttonClassName="h-10" portalMenu placement="bottom" />
                    {leaveBalance?.[leaveForm.type] && (
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        Available for this leave type: {leaveBalance[leaveForm.type].remaining} day(s).
                      </span>
                    )}
                  </div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mail Subject / Title
                    <input
                      value={leaveForm.title}
                      onChange={(e) => setLeaveForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="mt-1.5 h-10 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                      required
                    />
                  </label>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Leave Date Range</p>
                    <DateRangePicker value={{ start: leaveForm.fromDate, end: leaveForm.toDate }} minDate={leaveMinDate} onApply={({ start, end }) => { if (leaveMinDate && (start < leaveMinDate || end < leaveMinDate)) { toast.error("Please select a future date."); return; } setLeaveForm((prev) => ({ ...prev, fromDate: start, toDate: end })); }} className="mt-1.5" />
                    {leaveMinDate && <p className="mt-1 text-xs text-gray-500">{leaveForm.type === "optional_leave" ? "Optional leave can be selected only for future calendar dates." : "Earned leave can be selected from tomorrow onward."}</p>}
                  </div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                    Mail Content
                    <textarea
                      value={leaveForm.content}
                      onChange={(e) => setLeaveForm((prev) => ({ ...prev, content: e.target.value }))}
                      className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                    <span className="flex items-center gap-2"><input type="checkbox" checked={includeLeaveAttachment} onChange={(e) => { setIncludeLeaveAttachment(e.target.checked); if (!e.target.checked) setLeaveForm((prev) => ({ ...prev, attachment: null })); }} className="accent-[#f84525]" /> Add attachment image</span>
                    {includeLeaveAttachment && <div
                      tabIndex={0}
                      onPaste={handleLeaveAttachmentPaste}
                      className="mt-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40"
                    >
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleLeaveAttachment(e.target.files?.[0])}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 dark:text-gray-100 text-sm"
                      />
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Paste copied image here or choose file.
                      </p>
                    </div>}
                    {leaveForm.attachment?.name && (
                      <span className="mt-1.5 block text-xs text-gray-500 dark:text-gray-400">
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
              ) : (
                <EmptyState text="Open the form to apply for leave." />
              )}
            </ScrollCard>

            <ScrollCard title="My Leaves">
              {leaves.length === 0 ? (
                <EmptyState text="No leaves applied." />
              ) : (
                leaves.map((leave) => (
                  <button
                    type="button"
                    key={leave._id}
                    onClick={() => setSelectedLeave(leave)}
                    className="w-full text-left grid grid-cols-4 gap-2 border-t border-gray-100 dark:border-gray-800 px-5 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-[#fff8f6] dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <span className="font-medium">{leave.title || leave.type.replace("_", " ")}</span>
                    <span>{new Date(leave.fromDate).toLocaleDateString()}</span>
                    <span className="capitalize">{leave.status}</span>
                    <span className="truncate">{leave.hrComment || "-"}</span>
                  </button>
                ))
              )}
            </ScrollCard>
          </div>
        </div>
      )}

      {show("candidates") && (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Kpi icon={<FiBriefcase />} label="Interviews Taken" value={interviewLogs.length} />
            <Kpi icon={<FiUsers />} label="Pending Interviews" value={currentAssignedInterviews.length} />
            <Kpi icon={<FiUsers />} label="Assigned Candidates" value={candidates.length} tone="neutral" />
          </div>

          <div className="flex-shrink-0 flex gap-2">
            {[
              ["current", "Current"],
              ["history", "History"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setInterviewTab(key)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  interviewTab === key
                    ? "border-[#f84525] bg-[#fff5f3] text-[#f84525] dark:bg-[#2a1712]"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            {interviewTab === "current" ? (
              <ScrollCard
                title="Assigned Interviews"
                subtitle="HR assigns the current round. You only add the review after taking the interview."
              >
                {currentAssignedInterviews.length === 0 ? (
                  <EmptyState text="No assigned candidates." />
                ) : (
                  currentAssignedInterviews.map((candidate) => {
                    const existingRound = getMyCurrentRoundReview(candidate, profile?._id);
                    const canEdit = canEmployeeEditReview(existingRound);

                    return (
                      <div
                        key={candidate._id}
                        className="border-t border-gray-100 dark:border-gray-800 px-5 py-3.5 text-sm text-gray-800 dark:text-gray-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{candidate.name}</span>
                          <span className="px-2.5 py-1 bg-[#fff5f3] dark:bg-[#2a1712] text-[#f84525] rounded-full font-semibold text-xs">
                            {formatRound(candidate.interviewStatus)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                          {candidate.email} &middot; {candidate.jobRole}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
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
                      </div>
                    );
                  })
                )}
              </ScrollCard>
            ) : (
              <ScrollCard title="Interview History" subtitle="All completed old interviews with date and time.">
                {interviewLogs.length === 0 ? (
                  <EmptyState text="No interview logs yet." />
                ) : (
                  interviewLogs.map((item) => (
                    <div
                      key={item._id}
                      className="border-t border-gray-100 dark:border-gray-800 px-5 py-3.5 text-sm text-gray-800 dark:text-gray-200 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{item.candidateName}</span>
                        <span>Score {item.score}/10</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.jobRole || "-"} &middot; {formatRound(item.round)} &middot;{" "}
                        {item.roundType?.replace("_", " ")} &middot; {formatDateTime(item.date)}
                      </p>
                    </div>
                  ))
                )}
              </ScrollCard>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={updateRound}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-5 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{selected.name}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                aria-label="Close review form"
              >
                &times;
              </button>
            </div>
            <div className="text-sm bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3.5 text-gray-700 dark:text-gray-300">
              Current assigned round: <b>{formatRound(selected.interviewStatus)}</b>
              {selected.currentRoundType ? ` (${selected.currentRoundType.replace("_", " ")})` : ""}. HR
              will move this candidate to the next round after reviewing your report.
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Score /10
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={roundForm.score}
                onChange={(e) => setRoundForm((prev) => ({ ...prev, score: e.target.value }))}
                className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                required
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Decision / Comments
              <textarea
                value={roundForm.comments}
                onChange={(e) => setRoundForm((prev) => ({ ...prev, comments: e.target.value }))}
                className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525]"
                required
              />
            </label>
            <Button text="Save Review" type="submit" loading={roundSaving} className="justify-self-start" />
          </form>
        </div>
      )}

      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 flex-shrink-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#f84525]">
                  {selectedLeave.type?.replace("_", " ")}
                </p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {selectedLeave.title || "Leave Request"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 text-lg"
                aria-label="Close leave detail"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">From</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {new Date(selectedLeave.fromDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">To</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {new Date(selectedLeave.toDate || selectedLeave.fromDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-semibold capitalize text-gray-900 dark:text-gray-100 mt-1">
                    {selectedLeave.status}
                  </p>
                </div>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">HR Comment</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {selectedLeave.hrComment || "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Reason / Content</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                  {selectedLeave.content || selectedLeave.reason || "No reason added."}
                </p>
              </div>
              {selectedLeave.attachment?.url && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Attachment</p>
                  {selectedLeave.attachment.type === "application/pdf" || selectedLeave.attachment.url.toLowerCase().includes(".pdf") ? (
                    <iframe title="Leave attachment PDF" src={selectedLeave.attachment.url} className="mt-2 h-72 w-full rounded-lg border border-gray-200" />
                  ) : (
                    <img src={selectedLeave.attachment.url} alt={selectedLeave.attachment.name || "Leave attachment"} className="mt-2 max-h-72 w-full rounded-lg border border-gray-200 object-contain" />
                  )}
                  <a href={selectedLeave.attachment.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-[#f84525] hover:underline">Open attachment</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default EmployeeDashboard;
