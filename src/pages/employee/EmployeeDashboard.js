import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import { useToast } from "../../contexts/ToastContext";

const docFields = [
  ["photo", "Photo"],
  ["aadhaarCard", "Aadhaar Card"],
  ["panCard", "PAN Card"],
  ["passbook", "Passbook"],
  ["degree", "Degree"],
  ["resume", "Resume"],
];

const minutesToHours = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const EmployeeDashboard = ({ section = "all" }) => {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [docs, setDocs] = useState({});
  const [breakType, setBreakType] = useState("lunch");
  const [leaveForm, setLeaveForm] = useState({
    type: "full_day",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [selected, setSelected] = useState(null);
  const [roundForm, setRoundForm] = useState({
    interviewStatus: "second_round",
    roundType: "technical",
    score: "",
    comments: "",
  });

  const todayAttendance = useMemo(
    () => attendance.find((item) => item.dateKey === new Date().toISOString().slice(0, 10)),
    [attendance]
  );

  const fetchData = useCallback(async () => {
    const [profileRes, candidatesRes, attendanceRes, leavesRes, calendarRes] = await Promise.all([
      employeeApi.getProfile(),
      employeeApi.getAssignedCandidates(),
      employeeApi.getAttendance(),
      employeeApi.getLeaves(),
      employeeApi.getCalendar(new Date().toISOString().slice(0, 7)),
    ]);
    setProfile(profileRes.data.data);
    setCandidates(candidatesRes.data.data || []);
    setAttendance(attendanceRes.data.data || []);
    setLeaves(leavesRes.data.data?.leaves || leavesRes.data.data || []);
    setLeaveBalance(leavesRes.data.data?.balance || null);
    setCalendar(calendarRes.data.data || []);
  }, []);

  useEffect(() => {
    fetchData().catch((err) =>
      toast.error(err.response?.data?.message || "Unable to load employee dashboard")
    );
  }, [fetchData, toast]);

  const runAttendanceAction = async (action, successMessage, payload) => {
    try {
      await action(payload);
      await fetchData();
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Attendance action failed");
    }
  };

  const saveDocuments = async (e) => {
    e.preventDefault();
    try {
      const res = await employeeApi.updateDocuments(docs);
      setProfile(res.data.data);
      toast.success("Documents updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update documents");
    }
  };

  const fileToDataUri = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleDocumentFile = async (docKey, file) => {
    if (!file) return;
    const dataUri = await fileToDataUri(file);
    setDocs((prev) => ({
      ...prev,
      [docKey]: {
        dataUri,
        name: file.name,
        type: file.type,
      },
    }));
  };

  const applyLeave = async (e) => {
    e.preventDefault();
    try {
      await employeeApi.applyLeave({
        ...leaveForm,
        toDate: leaveForm.toDate || leaveForm.fromDate,
      });
      setLeaveForm({ type: "full_day", fromDate: "", toDate: "", reason: "" });
      await fetchData();
      toast.success("Leave request submitted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to apply leave");
    }
  };

  const updateRound = async (e) => {
    e.preventDefault();
    try {
      await employeeApi.updateRound(selected._id, roundForm);
      setSelected(null);
      await fetchData();
      toast.success("Round updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update round");
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
      if (item.endAt) items.push({ label: `${item.type} break end`, time: item.endAt });
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

  return (
    <div className="space-y-5">
        {isDashboard && (
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[
              ["Work Time", minutesToHours(monthlySummary.work)],
              ["Break Time", minutesToHours(monthlySummary.breaks)],
              ["Present Days", monthlySummary.present],
              ["Half Days", monthlySummary.halfDay],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-sm shadow p-4">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-[#f84525] mt-1">{value}</p>
              </div>
            ))}
            <div className="bg-white rounded-sm shadow p-4 lg:col-span-4">
              <h2 className="font-semibold mb-3">Monthly Report Chart</h2>
              {[
                ["Work", monthlySummary.work, 9600],
                ["Break", monthlySummary.breaks, 1200],
                ["Present", monthlySummary.present, 26],
                ["Half Day", monthlySummary.halfDay, 26],
              ].map(([label, value, max]) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span>{typeof value === "number" && label.includes("Time") ? minutesToHours(value) : value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-sm overflow-hidden">
                    <div className="h-full bg-[#f84525]" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(show("attendance") || isDashboard) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
            <h2 className="font-semibold mb-3">My Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <p><b>Employee ID:</b> {profile?.employeeId || "N/A"}</p>
              <p><b>Email:</b> {profile?.email || "N/A"}</p>
              <p><b>Mobile:</b> {profile?.mobile || "N/A"}</p>
              <p><b>Department:</b> {profile?.department || "N/A"}</p>
              <p><b>Designation:</b> {profile?.designation || "N/A"}</p>
              <p><b>Joining:</b> {profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Today Attendance</h2>
            <p className="text-sm"><b>Status:</b> {todayAttendance?.status || "Not started"}</p>
            <p className="text-sm"><b>Work:</b> {minutesToHours(todayAttendance?.totalWorkMinutes || 0)}</p>
            <p className="text-sm"><b>Break:</b> {minutesToHours(todayAttendance?.totalBreakMinutes || 0)}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button text="Start Day" onClick={() => runAttendanceAction(employeeApi.startDay, "Day started")} />
              <Button text="End Day" variant="danger" onClick={() => runAttendanceAction(employeeApi.endDay, "Day ended")} />
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
              <Button text="Start Break" variant="secondary" onClick={() => runAttendanceAction(employeeApi.startBreak, "Break started", { type: breakType })} />
              <Button text="End" variant="success" onClick={() => runAttendanceAction(employeeApi.endBreak, "Break ended")} />
            </div>
            <div className="mt-4 border-t pt-3">
              <h3 className="font-semibold text-sm mb-2">Today Timeline</h3>
              {todayTimeline.length === 0 ? (
                <p className="text-xs text-gray-500">No timeline yet</p>
              ) : (
                <div className="space-y-2">
                  {todayTimeline.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex justify-between text-xs bg-gray-50 p-2 rounded-sm">
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
              <p><b>Employee ID:</b> {profile?.employeeId || "N/A"}</p>
              <p><b>Email:</b> {profile?.email || "N/A"}</p>
              <p><b>Mobile:</b> {profile?.mobile || "N/A"}</p>
              <p><b>Department:</b> {profile?.department || "N/A"}</p>
              <p><b>Designation:</b> {profile?.designation || "N/A"}</p>
              <p><b>Joining:</b> {profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
          )}
          {show("profile") && (
          <form onSubmit={saveDocuments} className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <h2 className="font-semibold md:col-span-2">Documents</h2>
            {docFields.map(([name, label]) => (
              <label key={name} className="text-sm font-medium text-gray-700">
                {label}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentFile(name, e.target.files?.[0])}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                />
                {docs[name]?.name && <span className="text-xs text-gray-500">{docs[name].name}</span>}
                {profile?.documents?.[name]?.url && (
                  <a href={profile.documents[name].url} target="_blank" rel="noreferrer" className="block text-xs text-[#f84525] underline mt-1">
                    View uploaded
                  </a>
                )}
              </label>
            ))}
            <Button text="Save Documents" type="submit" className="md:col-span-2" />
          </form>
          )}

          {show("leaves") && (
          <form onSubmit={applyLeave} className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <h2 className="font-semibold md:col-span-2">Apply Leave</h2>
            <label className="text-sm font-medium">
              Leave Type
              <select
                value={leaveForm.type}
                onChange={(e) => setLeaveForm((prev) => ({ ...prev, type: e.target.value }))}
                className="mt-1 w-full border rounded-md px-3 py-2"
              >
                <option value="earned_leave">EL - Earned Leave</option>
                <option value="sick_leave">SK - Sick Leave</option>
                <option value="urgent_leave">Urgent Leave</option>
                <option value="optional_leave">Optional Leave</option>
                <option value="half_day">Half Day</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              From Date
              <input type="date" value={leaveForm.fromDate} onChange={(e) => setLeaveForm((prev) => ({ ...prev, fromDate: e.target.value }))} className="mt-1 w-full border rounded-md px-3 py-2" required />
            </label>
            <label className="text-sm font-medium">
              To Date
              <input type="date" value={leaveForm.toDate} onChange={(e) => setLeaveForm((prev) => ({ ...prev, toDate: e.target.value }))} className="mt-1 w-full border rounded-md px-3 py-2" />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Reason
              <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))} className="mt-1 w-full border rounded-md px-3 py-2" required />
            </label>
            <Button text="Submit Leave" type="submit" className="md:col-span-2" />
          </form>
          )}
        </section>
        )}

        {(show("attendance") || show("leaves")) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {show("attendance") && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b"><h2 className="font-semibold">Attendance History</h2></div>
            {attendance.slice(0, 8).map((item) => (
              <div key={item._id} className="grid grid-cols-4 gap-2 border-t px-4 py-3 text-sm">
                <span>{item.dateKey}</span>
                <span>{item.status}</span>
                <span>{minutesToHours(item.totalWorkMinutes)}</span>
                <span>{minutesToHours(item.totalBreakMinutes)}</span>
              </div>
            ))}
          </div>
          )}

          {show("leaves") && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b"><h2 className="font-semibold">My Leaves</h2></div>
            {leaves.length === 0 ? <p className="p-4 text-sm text-gray-500">No leaves applied</p> : leaves.slice(0, 8).map((leave) => (
              <div key={leave._id} className="grid grid-cols-4 gap-2 border-t px-4 py-3 text-sm">
                <span>{leave.type.replace("_", " ")}</span>
                <span>{new Date(leave.fromDate).toLocaleDateString()}</span>
                <span>{leave.status}</span>
                <span>{leave.hrComment || "-"}</span>
              </div>
            ))}
          </div>
          )}
        </section>
        )}

        {show("leaves") && leaveBalance && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              ["EL", leaveBalance.earned_leave],
              ["SK", leaveBalance.sick_leave],
              ["Urgent", leaveBalance.urgent_leave],
            ].map(([label, item]) => (
              <div key={label} className="bg-white rounded-sm shadow p-4">
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-gray-500">
                  Used {item.used} / {item.total} | Remaining {item.remaining}
                </p>
              </div>
            ))}
          </section>
        )}

        {show("leaves") && (
          <section className="bg-white rounded-sm shadow p-4">
            <h2 className="font-semibold mb-3">Company Leave Calendar</h2>
            {calendar.length === 0 ? (
              <p className="text-sm text-gray-500">No HR uploaded calendar available.</p>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {calendar.map((day) => (
                <div
                  key={day.dateKey}
                  className={`border rounded-sm p-2 text-xs ${
                    day.type === "holiday"
                      ? "bg-red-50 border-red-200"
                      : day.type === "working_saturday"
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50"
                  }`}
                >
                  <p className="font-semibold">{day.dateKey}</p>
                  <p>{day.day}</p>
                  <p className="capitalize">{day.title}</p>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {show("candidates") && (
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-semibold">Assigned Candidates</h2></div>
          {candidates.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No assigned candidates</p>
          ) : (
            candidates.map((candidate) => (
              <div key={candidate._id} className="grid grid-cols-1 md:grid-cols-5 gap-2 border-t px-4 py-3 text-sm md:items-center">
                <span className="font-medium">{candidate.name}</span>
                <span>{candidate.email}</span>
                <span>{candidate.jobRole}</span>
                <span>{candidate.interviewStatus}</span>
                <Button text="Update Round" onClick={() => setSelected(candidate)} />
              </div>
            ))
          )}
        </section>
        )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={updateRound} className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-semibold">{selected.name}</h2>
              <button type="button" onClick={() => setSelected(null)}>x</button>
            </div>
            <label className="block text-sm font-medium">
              Status
              <select value={roundForm.interviewStatus} onChange={(e) => setRoundForm((prev) => ({ ...prev, interviewStatus: e.target.value }))} className="mt-1 w-full border rounded-md px-3 py-2">
                <option value="second_round">Second Round</option>
                <option value="third_round">Third Round</option>
                <option value="final">Final Round</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Round Type
              <select value={roundForm.roundType} onChange={(e) => setRoundForm((prev) => ({ ...prev, roundType: e.target.value }))} className="mt-1 w-full border rounded-md px-3 py-2">
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
              <input type="number" value={roundForm.score} onChange={(e) => setRoundForm((prev) => ({ ...prev, score: e.target.value }))} className="mt-1 w-full border rounded-md px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">
              Comments
              <textarea value={roundForm.comments} onChange={(e) => setRoundForm((prev) => ({ ...prev, comments: e.target.value }))} className="mt-1 w-full border rounded-md px-3 py-2" />
            </label>
            <Button text="Save Round" type="submit" className="w-full" />
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
