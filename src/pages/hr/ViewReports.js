import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FiEye } from "react-icons/fi";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import FilePreviewModal from "../../components/common/FilePreviewModal";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";

const minutesToHours = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const statusClasses = {
  present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  half_day: "bg-orange-50 text-orange-700 border-orange-200",
  running: "bg-blue-50 text-blue-700 border-blue-200",
  absent: "bg-red-50 text-red-700 border-red-200",
  leave: "bg-violet-50 text-violet-700 border-violet-200",
};

const statusLabel = (status = "") => status.replace(/_/g, " ") || "-";

const ViewReports = () => {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const { mode } = useContext(ThemeContext);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportView, setReportView] = useState("employee");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [calendarYear, setCalendarYear] = useState(String(new Date().getFullYear()));
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarDeleting, setCalendarDeleting] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [holidayForm, setHolidayForm] = useState({
    date: "",
    title: "",
    type: "holiday",
    description: "",
  });

  const loadReports = useCallback(async () => {
    setPageLoading(true);
    try {
      const [attendanceRes, leavesRes, calendarRes, employeesRes] = await Promise.all([
        hrApi.getAttendance(month),
        hrApi.getLeaves({ month, status: "approved" }),
        hrApi.getCalendar(null, calendarYear),
        hrApi.getEmployees(),
      ]);
      setAttendance(attendanceRes.data.data || []);
      setLeaves(leavesRes.data.data || []);
      setCalendar(calendarRes.data.data || []);
      setEmployees(employeesRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load reports");
    } finally {
      setPageLoading(false);
    }
  }, [calendarYear, month, toast]);

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

  const employeeMonthlySummary = useMemo(() => {
    const monthKey = month;
    const map = {};

    employees.forEach((employee) => {
      map[employee._id] = {
        employee,
        records: 0,
        present: 0,
        halfDay: 0,
        running: 0,
        workMinutes: 0,
        breakMinutes: 0,
        earnedLeave: 0,
        sickLeave: 0,
        urgentLeave: 0,
        otherLeave: 0,
      };
    });

    attendance.forEach((item) => {
      const employeeId = item.employee?._id;
      if (!employeeId) return;
      if (!map[employeeId]) {
        map[employeeId] = {
          employee: item.employee,
          records: 0,
          present: 0,
          halfDay: 0,
          running: 0,
          workMinutes: 0,
          breakMinutes: 0,
          earnedLeave: 0,
          sickLeave: 0,
          urgentLeave: 0,
          otherLeave: 0,
        };
      }
      map[employeeId].records += 1;
      map[employeeId].present += item.status === "present" ? 1 : 0;
      map[employeeId].halfDay += item.status === "half_day" ? 1 : 0;
      map[employeeId].running += item.status === "running" ? 1 : 0;
      map[employeeId].workMinutes += item.totalWorkMinutes || 0;
      map[employeeId].breakMinutes += item.totalBreakMinutes || 0;
    });

    leaves
      .filter((leave) => leave.status === "approved" && new Date(leave.fromDate).toISOString().startsWith(monthKey))
      .forEach((leave) => {
        const employeeId = leave.employee?._id;
        if (!employeeId) return;
        if (!map[employeeId]) {
          map[employeeId] = {
            employee: leave.employee,
            records: 0,
            present: 0,
            halfDay: 0,
            running: 0,
            workMinutes: 0,
            breakMinutes: 0,
            earnedLeave: 0,
            sickLeave: 0,
            urgentLeave: 0,
            otherLeave: 0,
          };
        }
        if (leave.type === "earned_leave") map[employeeId].earnedLeave += 1;
        else if (leave.type === "sick_leave") map[employeeId].sickLeave += 1;
        else if (leave.type === "urgent_leave") map[employeeId].urgentLeave += 1;
        else map[employeeId].otherLeave += 1;
      });

    return Object.values(map).sort((a, b) =>
      (a.employee?.name || "").localeCompare(b.employee?.name || "")
    );
  }, [attendance, employees, leaves, month]);

  const filteredEmployeeSummary = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employeeMonthlySummary.filter((item) => {
      const employee = item.employee || {};
      const matchesEmployee = !selectedEmployeeId || employee._id === selectedEmployeeId;
      const matchesSearch =
        !term ||
        [employee.name, employee.employeeId, employee.email, employee.department, employee.designation]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      return matchesEmployee && matchesSearch;
    });
  }, [employeeMonthlySummary, search, selectedEmployeeId]);

  const filteredAttendance = useMemo(() => {
    const term = search.trim().toLowerCase();
    return attendance.filter((item) => {
      const employee = item.employee || {};
      const matchesEmployee = !selectedEmployeeId || employee._id === selectedEmployeeId;
      const matchesDate = reportView !== "day" || !selectedDate || item.dateKey === selectedDate;
      const matchesSearch =
        !term ||
        [employee.name, employee.employeeId, employee.email, item.status, item.dateKey]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      return matchesEmployee && matchesDate && matchesSearch;
    });
  }, [attendance, reportView, search, selectedDate, selectedEmployeeId]);

  const saveCalendar = async (e) => {
    e.preventDefault();
    const todayKey = new Date().toISOString().slice(0, 10);
    if (user?.role !== "superadmin" && holidayForm.date < todayKey) {
      toast.error("Only super admin can update previous calendar dates.");
      return;
    }
    setCalendarSaving(true);
    try {
      const res = await hrApi.upsertCalendar(holidayForm);
      const responseMessage = res.data.message || "Calendar updated";
      setHolidayForm({ date: "", title: "", type: "holiday", description: "" });
      await loadReports();
      toast.success(responseMessage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update calendar");
    } finally {
      setCalendarSaving(false);
    }
  };

  const calendarMap = useMemo(() => {
    return calendar.reduce((acc, item) => ({ ...acc, [item.dateKey]: item }), {});
  }, [calendar]);

  const buildMonthDays = useCallback((year, monthNumber) => {
    const first = new Date(year, monthNumber - 1, 1);
    const last = new Date(year, monthNumber, 0);
    const blanks = Array.from({ length: first.getDay() }, (_, index) => ({ blank: true, key: `blank-${index}` }));
    const days = Array.from({ length: last.getDate() }, (_, index) => {
      const dayNumber = index + 1;
      const dateKey = `${year}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
      return {
        date: new Date(year, monthNumber - 1, dayNumber),
        dateKey,
        dayNumber,
        saved: calendarMap[dateKey],
      };
    });
    return [...blanks, ...days];
  }, [calendarMap]);

  const calendarMonths = useMemo(() => {
    const year = Number(calendarYear);
    return Array.from({ length: 12 }, (_, index) => ({
      label: new Date(year, index, 1).toLocaleDateString("en-US", { month: "long" }),
      days: buildMonthDays(year, index + 1),
    }));
  }, [buildMonthDays, calendarYear]);

  const selectCalendarDay = (dateKey) => {
    const existing = calendarMap[dateKey];
    setHolidayForm({
      date: dateKey,
      title: existing?.title || "",
      type: existing?.type || "holiday",
      description: existing?.description || "",
    });
  };

  const deleteCalendarDay = async () => {
    if (!holidayForm.date || !calendarMap[holidayForm.date]) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    if (user?.role !== "superadmin" && holidayForm.date < todayKey) {
      toast.error("Only super admin can delete previous calendar dates.");
      return;
    }
    setCalendarDeleting(true);
    try {
      await hrApi.deleteCalendar(holidayForm.date);
      setHolidayForm({ date: "", title: "", type: "holiday", description: "" });
      await loadReports();
      toast.success("Calendar event deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete calendar event");
    } finally {
      setCalendarDeleting(false);
    }
  };

  const downloadMonthlyPdf = () => {
    const summaryRows = filteredEmployeeSummary
      .map(
        (item) => `
          <tr>
            <td>${item.employee?.employeeId || "-"}</td>
            <td>${item.employee?.name || "N/A"}</td>
            <td>${item.present}</td>
            <td>${item.halfDay}</td>
            <td>${item.earnedLeave}</td>
            <td>${item.sickLeave}</td>
            <td>${item.urgentLeave}</td>
            <td>${minutesToHours(item.workMinutes)}</td>
          </tr>
        `
      )
      .join("");
    const rows = filteredAttendance
      .map(
        (item) => `
          <tr>
            <td>${item.dateKey}</td>
            <td>${item.employee?.name || "N/A"}</td>
            <td>${item.loginSelfie?.url ? `<img src="${item.loginSelfie.url}" alt="Selfie" style="width:44px;height:44px;object-fit:cover;border-radius:4px;border:1px solid #ddd" />` : "-"}</td>
            <td>${formatTime(item.loginAt)}</td>
            <td>${formatTime(item.logoutAt)}</td>
            <td>${minutesToHours(item.totalWorkMinutes)}</td>
            <td>${minutesToHours(item.totalBreakMinutes)}</td>
            <td>${statusLabel(item.status)}</td>
          </tr>
        `
      )
      .join("");
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Monthly Attendance Report ${month}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:24px;color:#111}
            h1{font-size:22px;margin-bottom:8px}
            table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left}
            th{background:#f5f5f5}
            .summary{display:flex;gap:12px;margin:16px 0}
            .box{border:1px solid #ddd;padding:10px}
          </style>
        </head>
        <body>
          <h1>Monthly Attendance Report - ${month}</h1>
          <div class="summary">
            <div class="box">Records: ${summary.total}</div>
            <div class="box">Present: ${summary.present}</div>
            <div class="box">Half Day: ${summary.halfDay}</div>
            <div class="box">Running: ${summary.running}</div>
          </div>
          <h2>Employee Monthly Summary</h2>
          <table>
            <thead><tr><th>ID</th><th>Employee</th><th>Present</th><th>Half Day</th><th>EL</th><th>SL</th><th>Urgent</th><th>Work</th></tr></thead>
            <tbody>${summaryRows || "<tr><td colspan='8'>No employee data found</td></tr>"}</tbody>
          </table>
          <table>
            <thead><tr><th>Date</th><th>Employee</th><th>Selfie</th><th>Login</th><th>Logout</th><th>Work</th><th>Break</th><th>Status</th></tr></thead>
            <tbody>${rows || "<tr><td colspan='8'>No attendance found</td></tr>"}</tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const downloadEmployeeMonthlyPdf = async () => {
    if (!selectedEmployeeId) {
      toast.error("Select an employee first");
      return;
    }
    try {
      const res = await hrApi.getEmployeeMonthlyReport(selectedEmployeeId, month);
      const data = res.data.data || {};
      const employee = data.employee || employees.find((item) => item._id === selectedEmployeeId) || {};
      const records = data.records || [];
      const summaryData = data.summary || {};
      const rows = records
        .map(
          (item) => `
            <tr>
              <td>${item.dateKey}</td>
              <td>${item.loginSelfie?.url ? `<img src="${item.loginSelfie.url}" alt="Selfie" style="width:44px;height:44px;object-fit:cover;border-radius:4px;border:1px solid #ddd" />` : "-"}</td>
              <td>${formatTime(item.loginAt)}</td>
              <td>${formatTime(item.logoutAt)}</td>
              <td>${minutesToHours(item.totalWorkMinutes)}</td>
              <td>${minutesToHours(item.totalBreakMinutes)}</td>
              <td>${statusLabel(item.status)}</td>
            </tr>
          `
        )
        .join("");
      const win = window.open("", "_blank");
      win.document.write(`
        <html>
          <head>
            <title>${employee.name || "Employee"} Attendance ${month}</title>
            <style>
              body{font-family:Arial,sans-serif;padding:24px;color:#111}
              table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
              th,td{border:1px solid #ddd;padding:8px;text-align:left}
              th{background:#f5f5f5}
              .summary{display:flex;gap:12px;margin:16px 0;flex-wrap:wrap}
              .box{border:1px solid #ddd;padding:10px}
            </style>
          </head>
          <body>
            <h1>${employee.name || "Employee"} - Monthly Attendance</h1>
            <p>${employee.employeeId || ""} | ${employee.department || ""} | ${month}</p>
            <div class="summary">
              <div class="box">Days: ${summaryData.days || 0}</div>
              <div class="box">Present: ${summaryData.present || 0}</div>
              <div class="box">Half Day: ${summaryData.halfDay || 0}</div>
              <div class="box">Work: ${minutesToHours(summaryData.workMinutes || 0)}</div>
              <div class="box">Break: ${minutesToHours(summaryData.breakMinutes || 0)}</div>
            </div>
            <table>
              <thead><tr><th>Date</th><th>Selfie</th><th>Login</th><th>Logout</th><th>Work</th><th>Break</th><th>Status</th></tr></thead>
              <tbody>${rows || "<tr><td colspan='7'>No attendance found</td></tr>"}</tbody>
            </table>
            <script>window.onload = () => window.print();</script>
          </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to download employee report");
    }
  };

  if (pageLoading) return <CommonLoader text="Loading reports..." />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-sm shadow p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-sm text-gray-500">Monthly work hours, breaks, half days, and approved leave totals.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-sm px-3 py-2 min-h-10" />
          <Button text="Download View" onClick={downloadMonthlyPdf} className="min-h-10" />
          <Button text="Employee PDF" variant="secondary" onClick={downloadEmployeeMonthlyPdf} disabled={!selectedEmployeeId} className="min-h-10" />
          <Button text="View Leave Calendar" variant="secondary" onClick={() => setCalendarModalOpen(true)} className="min-h-10" />
        </div>
      </div>

      <section className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <label className="text-sm font-medium">
          View
          <select value={reportView} onChange={(e) => setReportView(e.target.value)} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-10">
            <option value="employee">Employee View</option>
            <option value="day">Day View</option>
            <option value="records">All Records</option>
          </select>
        </label>
        <label className="text-sm font-medium xl:col-span-2">
          Employee
          <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-10">
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.employeeId || "-"} - {employee.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Day
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} disabled={reportView !== "day"} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-10 disabled:bg-gray-50" />
        </label>
        <label className="text-sm font-medium">
          Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, ID, status" className="mt-1 w-full border rounded-sm px-3 py-2 min-h-10" />
        </label>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Employees", filteredEmployeeSummary.length],
          ["Records", filteredAttendance.length],
          ["Present", filteredAttendance.filter((item) => item.status === "present").length],
          ["Half Day", filteredAttendance.filter((item) => item.status === "half_day").length],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-sm shadow p-4 border-l-4 border-[#f84525]">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Employee Monthly Summary</h2>
          <p className="text-xs text-gray-500 mt-1">Approved EL, SL, urgent leave and attendance totals for every employee.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                {["ID", "Employee", "Present", "Half Day", "EL", "SL", "Urgent", "Work"].map((item) => (
                  <th key={item} className="px-4 py-3 text-left font-semibold">{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployeeSummary.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">No employee data found</td>
                </tr>
              ) : (
                filteredEmployeeSummary.map((item) => (
                  <tr key={item.employee?._id || item.employee?.email} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.employee?.employeeId || "-"}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{item.employee?.name || "N/A"}</p>
                      <p className="text-xs text-gray-500">{item.employee?.department || item.employee?.email || "-"}</p>
                    </td>
                    <td className="px-4 py-3">{item.present}</td>
                    <td className="px-4 py-3">{item.halfDay}</td>
                    <td className="px-4 py-3">{item.earnedLeave}</td>
                    <td className="px-4 py-3">{item.sickLeave}</td>
                    <td className="px-4 py-3">{item.urgentLeave}</td>
                    <td className="px-4 py-3 font-medium">{minutesToHours(item.workMinutes)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="font-semibold">Monthly Attendance</h2>
            <p className="text-xs text-gray-500 mt-1">App work-start selfies appear here when employees checked in with an image.</p>
          </div>
          <span className="text-xs text-gray-500">
            {filteredAttendance.filter((item) => item.loginSelfie?.url).length} selfie records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                {["Date", "Employee", "Selfie", "Login", "Logout", "Work", "Break", "Mode", "Status"].map((item) => (
                  <th key={item} className="px-4 py-3 text-left font-semibold">{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-4 text-center text-gray-500">No attendance found</td>
                </tr>
              ) : (
                filteredAttendance.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-gray-50 align-middle">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{item.dateKey}</td>
                    <td className="px-4 py-3 min-w-44">
                      <p className="font-semibold text-gray-900">{item.employee?.name || "N/A"}</p>
                      <p className="text-xs text-gray-500">{item.employee?.employeeId || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {item.loginSelfie?.url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreview({
                              title: `${item.employee?.name || "Employee"} work-start selfie - ${item.dateKey}`,
                              url: item.loginSelfie.url,
                            })
                          }
                          className="inline-flex items-center gap-2 text-[#f84525] hover:text-[#d93a1e]"
                        >
                          <img
                            src={item.loginSelfie.url}
                            alt="Work start selfie"
                            className="w-11 h-11 object-cover rounded-sm border bg-gray-50"
                          />
                          <FiEye aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTime(item.loginAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTime(item.logoutAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{minutesToHours(item.totalWorkMinutes)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{minutesToHours(item.totalBreakMinutes)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.attendanceMode === "work_from_home" ? "WFH" : "Office"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 border rounded-sm text-xs font-semibold capitalize ${statusClasses[item.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {preview && (
        <FilePreviewModal
          title={preview.title}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}

      {calendarModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-3 sm:p-4">
        <section className="bg-white rounded-sm shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Leave Calendar</h2>
              <p className="text-xs text-gray-500">Add holidays, working Saturdays, events and notices from one place.</p>
            </div>
            <button type="button" onClick={() => setCalendarModalOpen(false)} className="text-[#f84525] font-semibold px-2 py-1">Close</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 p-4 min-h-0 flex-1 overflow-hidden">
        <form onSubmit={saveCalendar} className="bg-white rounded-sm border p-4 space-y-3 self-start">
          <h2 className="font-semibold">HR Leave Calendar</h2>
          <p className="text-xs text-gray-500">Click any date in the year grid, add title/type, then save.</p>
          <input
            type="number"
            min="2000"
            max="2100"
            value={calendarYear}
            onChange={(e) => setCalendarYear(e.target.value)}
            className="w-full border rounded-sm px-3 py-2"
          />
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
            <option value="optional_leave">Optional Leave</option>
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
          {holidayForm.date && calendarMap[holidayForm.date] && (
            <Button
              text={calendarDeleting ? "Deleting..." : "Delete Calendar Event"}
              loading={calendarDeleting}
              type="button"
              variant="danger"
              onClick={deleteCalendarDay}
              className="w-full"
            />
          )}
        </form>

        <div className="bg-white rounded-sm border p-4 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <h2 className="font-semibold">Year Calendar - {calendarYear}</h2>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-sm">Holiday</span>
              <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-sm">Working Sat</span>
              <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-sm">Optional Leave</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-sm">Event/Notice</span>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {calendarMonths.map((monthBlock) => (
              <div key={monthBlock.label} className="border rounded-sm p-3">
                <h3 className="font-semibold text-sm mb-2">{monthBlock.label}</h3>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-500 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthBlock.days.map((day) => {
                    if (day.blank) return <div key={`${monthBlock.label}-${day.key}`} className="min-h-14" />;
                    const saved = day.saved;
                    const selected = holidayForm.date === day.dateKey;
                    const className = selected
                      ? "bg-[#fff5f3] border-[#f84525] ring-2 ring-[#f84525] text-gray-950"
                      : saved?.type === "holiday"
                      ? "bg-red-50 border-red-200 text-gray-950"
                      : saved?.type === "working_saturday"
                      ? "bg-green-50 border-green-200 text-gray-950"
                      : saved?.type === "optional_leave"
                      ? "bg-yellow-50 border-yellow-200 text-gray-950"
                      : saved
                      ? "bg-blue-50 border-blue-200 text-gray-950"
                      : mode === "dark"
                      ? "bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
                      : "bg-white hover:bg-gray-50 text-gray-950";
                    return (
                      <button
                        type="button"
                        key={day.dateKey}
                        onClick={() => selectCalendarDay(day.dateKey)}
                        className={`min-h-14 border rounded-sm p-1 text-left text-[11px] transition ${className}`}
                      >
                        <span className={`font-bold ${mode === "dark" && !saved && !selected ? "text-white" : "text-gray-950"}`}>{day.dayNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>
        </section>
      </div>
      )}

    </div>
  );
};

export default ViewReports;
