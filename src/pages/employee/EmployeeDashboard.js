import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import { useToast } from "../../contexts/ToastContext";

const docFields = [
  ["photo", "Photo URL"],
  ["aadhaarCard", "Aadhaar Card URL"],
  ["panCard", "PAN Card URL"],
  ["passbook", "Passbook URL"],
  ["degree", "Degree URL"],
  ["resume", "Resume URL"],
];

const minutesToHours = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const EmployeeDashboard = ({ section = "all" }) => {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
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
    setLeaves(leavesRes.data.data || []);
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

  const show = (name) => section === "all" || section === name;

  return (
    <div className="space-y-5">
        {show("attendance") && (
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
          </div>
        </section>
        )}

        {(show("documents") || show("leaves")) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {show("documents") && (
          <form onSubmit={saveDocuments} className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <h2 className="font-semibold md:col-span-2">Documents</h2>
            {docFields.map(([name, label]) => (
              <label key={name} className="text-sm font-medium text-gray-700">
                {label}
                <input
                  name={name}
                  value={docs[name] || ""}
                  onChange={(e) => setDocs((prev) => ({ ...prev, [name]: e.target.value }))}
                  placeholder="Paste uploaded file URL"
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                />
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
                <option value="full_day">Full Day</option>
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

        {(show("attendance") || show("leaves") || show("all")) && (
          <section className="bg-white rounded-sm shadow p-4">
            <h2 className="font-semibold mb-3">Company Leave Calendar</h2>
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
