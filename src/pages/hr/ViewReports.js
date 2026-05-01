import { useCallback, useEffect, useMemo, useState } from "react";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const minutesToHours = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const ViewReports = () => {
  const toast = useToast();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [leaveUpdating, setLeaveUpdating] = useState("");
  const [holidayForm, setHolidayForm] = useState({
    date: "",
    title: "",
    type: "holiday",
    description: "",
  });

  const loadReports = useCallback(async () => {
    setPageLoading(true);
    try {
      const [attendanceRes, leavesRes, calendarRes] = await Promise.all([
        hrApi.getAttendance(month),
        hrApi.getLeaves(),
        hrApi.getCalendar(month),
      ]);
      setAttendance(attendanceRes.data.data || []);
      setLeaves(leavesRes.data.data || []);
      setCalendar(calendarRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load reports");
    } finally {
      setPageLoading(false);
    }
  }, [month, toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = useMemo(() => {
    return attendance.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.present += item.status === "present" ? 1 : 0;
        acc.halfDay += item.status === "half_day" ? 1 : 0;
        acc.running += item.status === "running" ? 1 : 0;
        return acc;
      },
      { total: 0, present: 0, halfDay: 0, running: 0 }
    );
  }, [attendance]);

  const reviewLeave = async (leaveId, status) => {
    setLeaveUpdating(leaveId);
    try {
      await hrApi.reviewLeave(leaveId, { status });
      await loadReports();
      toast.success(`Leave ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update leave");
    } finally {
      setLeaveUpdating("");
    }
  };

  const saveCalendar = async (e) => {
    e.preventDefault();
    setCalendarSaving(true);
    try {
      await hrApi.upsertCalendar(holidayForm);
      setHolidayForm({ date: "", title: "", type: "holiday", description: "" });
      await loadReports();
      toast.success("Calendar updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update calendar");
    } finally {
      setCalendarSaving(false);
    }
  };

  const calendarMap = useMemo(() => {
    return calendar.reduce((acc, item) => ({ ...acc, [item.dateKey]: item }), {});
  }, [calendar]);

  const monthDays = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const first = new Date(year, monthNumber - 1, 1);
    const last = new Date(year, monthNumber, 0);
    const blanks = Array.from({ length: first.getDay() }, (_, index) => ({ blank: true, key: `blank-${index}` }));
    const days = Array.from({ length: last.getDate() }, (_, index) => {
      const date = new Date(year, monthNumber - 1, index + 1);
      const dateKey = date.toISOString().slice(0, 10);
      return {
        date,
        dateKey,
        dayNumber: index + 1,
        saved: calendarMap[dateKey],
      };
    });
    return [...blanks, ...days];
  }, [calendarMap, month]);

  const selectCalendarDay = (dateKey) => {
    const existing = calendarMap[dateKey];
    setHolidayForm({
      date: dateKey,
      title: existing?.title || "",
      type: existing?.type || "holiday",
      description: existing?.description || "",
    });
  };

  if (pageLoading) return <CommonLoader text="Loading reports..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Attendance & Leave Reports</h1>
          <p className="text-sm text-gray-500">Monthly work hours, breaks, half days, and leave approvals.</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-sm px-3 py-2" />
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Records", summary.total],
          ["Present", summary.present],
          ["Half Day", summary.halfDay],
          ["Running", summary.running],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-sm shadow p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-[#f84525]">{value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Monthly Attendance</h2>
        </div>
        <div className="hidden md:grid grid-cols-7 bg-gray-100 text-xs uppercase text-gray-600 font-semibold">
          {["Date", "Employee", "Login", "Logout", "Work", "Break", "Status"].map((item) => (
            <div key={item} className="px-4 py-3">{item}</div>
          ))}
        </div>
        {attendance.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No attendance found</p>
        ) : (
          attendance.map((item) => (
            <div key={item._id} className="grid grid-cols-1 md:grid-cols-7 gap-2 border-t px-4 py-3 text-sm">
              <span>{item.dateKey}</span>
              <span>{item.employee?.name || "N/A"}</span>
              <span>{item.loginAt ? new Date(item.loginAt).toLocaleTimeString() : "-"}</span>
              <span>{item.logoutAt ? new Date(item.logoutAt).toLocaleTimeString() : "-"}</span>
              <span>{minutesToHours(item.totalWorkMinutes)}</span>
              <span>{minutesToHours(item.totalBreakMinutes)}</span>
              <span className={item.status === "half_day" ? "text-orange-600 font-medium" : "font-medium"}>
                {item.status}
              </span>
            </div>
          ))
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={saveCalendar} className="bg-white rounded-sm shadow p-4 space-y-3">
          <h2 className="font-semibold">HR Leave Calendar</h2>
          <p className="text-xs text-gray-500">Click any date in the month grid, add title/type, then save.</p>
          <input
            type="date"
            value={holidayForm.date}
            onChange={(e) => setHolidayForm((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full border rounded-sm px-3 py-2"
            required
          />
          <input
            value={holidayForm.title}
            onChange={(e) => setHolidayForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            className="w-full border rounded-sm px-3 py-2"
            required
          />
          <select
            value={holidayForm.type}
            onChange={(e) => setHolidayForm((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full border rounded-sm px-3 py-2"
          >
            <option value="holiday">Holiday</option>
            <option value="working_saturday">Working Saturday</option>
            <option value="event">Event</option>
            <option value="notice">Notice</option>
          </select>
          <textarea
            value={holidayForm.description}
            onChange={(e) => setHolidayForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className="w-full border rounded-sm px-3 py-2"
          />
          <Button text={calendarSaving ? "Saving..." : "Save Calendar Day"} loading={calendarSaving} type="submit" className="w-full" />
        </form>

        <div className="bg-white rounded-sm shadow p-4 lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <h2 className="font-semibold">Monthly Calendar</h2>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-sm">Holiday</span>
              <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-sm">Working Sat</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-sm">Event/Notice</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              if (day.blank) return <div key={day.key} className="min-h-20" />;
              const saved = day.saved;
              const className = saved?.type === "holiday"
                ? "bg-red-50 border-red-200"
                : saved?.type === "working_saturday"
                ? "bg-green-50 border-green-200"
                : saved
                ? "bg-blue-50 border-blue-200"
                : "bg-white hover:bg-gray-50";
              return (
                <button
                  type="button"
                  key={day.dateKey}
                  onClick={() => selectCalendarDay(day.dateKey)}
                  className={`min-h-20 border rounded-sm p-2 text-left text-xs transition ${className}`}
                >
                  <span className="font-bold text-gray-900">{day.dayNumber}</span>
                  {saved && (
                    <>
                      <p className="mt-1 font-semibold truncate">{saved.title}</p>
                      <p className="capitalize text-gray-500 truncate">{saved.type.replace("_", " ")}</p>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Leave Requests</h2>
        </div>
        {leaves.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No leave requests</p>
        ) : (
          leaves.map((leave) => (
            <div key={leave._id} className="grid grid-cols-1 md:grid-cols-7 gap-2 border-t px-4 py-3 text-sm md:items-center">
              <span>{leave.employee?.name || "N/A"}</span>
              <span>{leave.type.replace("_", " ")}</span>
              <span>{new Date(leave.fromDate).toLocaleDateString()}</span>
              <span>{new Date(leave.toDate).toLocaleDateString()}</span>
              <span>{leave.reason}</span>
              <span className="font-medium">{leave.status}</span>
              <div className="flex gap-2">
                <Button text="Approve" variant="success" onClick={() => reviewLeave(leave._id, "approved")} loading={leaveUpdating === leave._id} disabled={leave.status !== "pending"} />
                <Button text="Reject" variant="danger" onClick={() => reviewLeave(leave._id, "rejected")} loading={leaveUpdating === leave._id} disabled={leave.status !== "pending"} />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default ViewReports;
