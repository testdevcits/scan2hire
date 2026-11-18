import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import * as XLSX from "xlsx";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CalendarPicker from "../../components/common/CalendarPicker";
import CommonTable from "../../components/common/CommonTable";
import CustomDropdown from "../../components/common/CustomDropdown";
import { usePagination } from "../../components/common/Pagination";
import { MetricCard, PageHeader, SectionCard } from "../../components/common/ReusableCards";
import TableToolbar from "../../components/common/TableToolbar";
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

const statusLabel = (status = "") => status.replace(/_/g, " ") || "-";
const getMonthCursor = (date = new Date()) => date.getFullYear() * 12 + date.getMonth();
const getMonthFromCursor = (cursor) => {
  const year = Math.floor(cursor / 12);
  const monthIndex = cursor % 12;
  return {
    year,
    monthIndex,
    monthNumber: monthIndex + 1,
    label: new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
};
const getLocalDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const ViewReports = () => {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const { mode } = useContext(ThemeContext);
  const [month, setMonth] = useState(() => getLocalDateKey().slice(0, 7));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const currentMonthCursor = useMemo(() => getMonthCursor(), []);
  const [monthCursor, setMonthCursor] = useState(() => getMonthCursor());
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarDeleting, setCalendarDeleting] = useState(false);
  const [calendarPdf, setCalendarPdf] = useState(null);
  const [calendarPdfDocument, setCalendarPdfDocument] = useState(null);
  const [calendarPdfSaving, setCalendarPdfSaving] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [reportError, setReportError] = useState("");
  const reportRequestId = useRef(0);
  const [holidayForm, setHolidayForm] = useState({
    date: "",
    title: "",
    type: "holiday",
    description: "",
  });

  const loadReports = useCallback(async () => {
    const requestId = ++reportRequestId.current;
    setPageLoading(true);
    setReportError("");
    try {
      const [attendanceRes, leavesRes, employeesRes] = await Promise.all([
        hrApi.getAttendance(month),
        hrApi.getLeaves({ month, status: "approved" }),
        hrApi.getEmployees(),
      ]);
      if (requestId !== reportRequestId.current) return;
      setAttendance(attendanceRes.data.data || []);
      setLeaves(leavesRes.data.data || []);
      setEmployees(employeesRes.data.data || []);
    } catch (err) {
      if (requestId !== reportRequestId.current) return;
      const message = err.response?.data?.message || "Unable to load reports";
      setAttendance([]);
      setLeaves([]);
      setEmployees([]);
      setReportError(message);
      toast.error(message);
    } finally {
      if (requestId === reportRequestId.current) setPageLoading(false);
    }
  }, [month, toast]);

  useEffect(() => {
    loadReports();
    return () => {
      reportRequestId.current += 1;
    };
  }, [loadReports]);

  const employeeMonthlySummary = useMemo(() => {
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

    // The API already returns approved leave requests overlapping this month.
    // Do not re-filter by fromDate: that would drop requests that began last month.
    leaves
      .filter((leave) => leave.status === "approved")
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
  }, [attendance, employees, leaves]);

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
      const matchesDate = !selectedDate || item.dateKey === selectedDate;
      const matchesSearch =
        !term ||
        [employee.name, employee.employeeId, employee.email, item.status, item.dateKey]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      return matchesEmployee && matchesDate && matchesSearch;
    });
  }, [attendance, search, selectedDate, selectedEmployeeId]);
  const summaryPagination = usePagination(filteredEmployeeSummary, [month, selectedEmployeeId, search]);

  const visibleCalendarMonths = useMemo(
    () => [getMonthFromCursor(monthCursor), getMonthFromCursor(monthCursor + 1)],
    [monthCursor]
  );
  const calendarYear = String(visibleCalendarMonths[0]?.year || new Date().getFullYear());
  const visibleCalendarMonthKeys = useMemo(
    () =>
      visibleCalendarMonths.map(
        (item) => `${item.year}-${String(item.monthNumber).padStart(2, "0")}`
      ),
    [visibleCalendarMonths]
  );
  const visibleCalendarRange = `${visibleCalendarMonths[0]?.label || ""} - ${visibleCalendarMonths[1]?.label || ""}`;

  const loadCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const responses = await Promise.all(visibleCalendarMonthKeys.map((monthKey) => hrApi.getCalendar(monthKey)));
      setCalendar(responses.flatMap((res) => res.data.data || []));
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load leave calendar");
    } finally {
      setCalendarLoading(false);
    }
  }, [toast, visibleCalendarMonthKeys]);

  useEffect(() => {
    if (calendarModalOpen) loadCalendar();
  }, [calendarModalOpen, loadCalendar]);

  const loadCalendarPdf = useCallback(async () => {
    try {
      const res = await hrApi.getCalendarDocument(calendarYear);
      setCalendarPdfDocument(res.data.data || null);
    } catch (err) {
      setCalendarPdfDocument(null);
    }
  }, [calendarYear]);

  useEffect(() => {
    if (calendarModalOpen) loadCalendarPdf();
  }, [calendarModalOpen, loadCalendarPdf]);

  const uploadCalendarPdf = async () => {
    if (!calendarPdf) return;
    if (calendarPdf.type !== "application/pdf" && !calendarPdf.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF calendar files are allowed.");
      return;
    }
    if (calendarPdf.size > 5 * 1024 * 1024) {
      toast.error("Calendar PDF must be 5 MB or smaller.");
      return;
    }
    setCalendarPdfSaving(true);
    try {
      const dataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(calendarPdf);
      });
      await hrApi.uploadCalendarDocument({
        year: Number(calendarYear),
        title: `Company Calendar ${calendarYear}`,
        file: { dataUri, name: calendarPdf.name, type: calendarPdf.type || "application/pdf" },
      });
      setCalendarPdf(null);
      await loadCalendarPdf();
      toast.success("Calendar PDF uploaded successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to upload calendar PDF");
    } finally {
      setCalendarPdfSaving(false);
    }
  };

  const saveCalendar = async (e) => {
    e.preventDefault();
    if (user?.role !== "superadmin" && holidayForm.date < todayKey) {
      toast.error("Only super admin can update previous calendar dates.");
      return;
    }
    setCalendarSaving(true);
    try {
      const res = await hrApi.upsertCalendar(holidayForm);
      const responseMessage = res.data.message || "Calendar updated";
      setHolidayForm({ date: "", title: "", type: "holiday", description: "" });
      await loadCalendar();
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
    return visibleCalendarMonths.map((monthBlock) => ({
      ...monthBlock,
      days: buildMonthDays(monthBlock.year, monthBlock.monthNumber),
    }));
  }, [buildMonthDays, visibleCalendarMonths]);

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
    if (user?.role !== "superadmin" && holidayForm.date < todayKey) {
      toast.error("Only super admin can delete previous calendar dates.");
      return;
    }
    setCalendarDeleting(true);
    try {
      await hrApi.deleteCalendar(holidayForm.date);
      setHolidayForm({ date: "", title: "", type: "holiday", description: "" });
      await loadCalendar();
      toast.success("Calendar event deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete calendar event");
    } finally {
      setCalendarDeleting(false);
    }
  };

  const downloadMonthlyPdf = () => {
    const reportTotals = filteredAttendance.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.present += item.status === "present" ? 1 : 0;
        acc.halfDay += item.status === "half_day" ? 1 : 0;
        acc.running += item.status === "running" ? 1 : 0;
        return acc;
      },
      { total: 0, present: 0, halfDay: 0, running: 0 }
    );
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
            <td>${item.otherLeave}</td>
            <td>${minutesToHours(item.workMinutes)}</td>
            <td>${minutesToHours(item.breakMinutes)}</td>
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
    if (!win) {
      toast.error("Allow pop-ups to open the attendance report.");
      return;
    }
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
            <div class="box">Records: ${reportTotals.total}</div>
            <div class="box">Present: ${reportTotals.present}</div>
            <div class="box">Half Day: ${reportTotals.halfDay}</div>
            <div class="box">Running: ${reportTotals.running}</div>
          </div>
          <h2>Employee Monthly Summary</h2>
          <table>
            <thead><tr><th>ID</th><th>Employee</th><th>Present</th><th>Half Day</th><th>EL Requests</th><th>SL Requests</th><th>Urgent Requests</th><th>Other Leave Requests</th><th>Work</th><th>Break</th></tr></thead>
            <tbody>${summaryRows || "<tr><td colspan='10'>No employee data found</td></tr>"}</tbody>
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

  const exportExcel = () => {
    try {
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["Employee ID", "Employee", "Department", "Present", "Half Day", "Earned Leave Requests", "Sick Leave Requests", "Urgent Leave Requests", "Other Leave Requests", "Work Minutes", "Break Minutes"],
        ...filteredEmployeeSummary.map((item) => [
          item.employee?.employeeId || "",
          item.employee?.name || "",
          item.employee?.department || "",
          item.present,
          item.halfDay,
          item.earnedLeave,
          item.sickLeave,
          item.urgentLeave,
          item.otherLeave,
          item.workMinutes,
          item.breakMinutes,
        ]),
      ]);
      const attendanceSheet = XLSX.utils.aoa_to_sheet([
        ["Date", "Employee ID", "Employee", "Login", "Logout", "Work Minutes", "Break Minutes", "Mode", "Status", "Selfie URL"],
        ...filteredAttendance.map((item) => [
          item.dateKey || "",
          item.employee?.employeeId || "",
          item.employee?.name || "",
          item.loginAt ? new Date(item.loginAt) : "",
          item.logoutAt ? new Date(item.logoutAt) : "",
          item.totalWorkMinutes || 0,
          item.totalBreakMinutes || 0,
          item.attendanceMode === "work_from_home" ? "Work from home" : "Office",
          statusLabel(item.status),
          item.loginSelfie?.url || "",
        ]),
      ]);
      summarySheet["!cols"] = [
        { wch: 16 }, { wch: 26 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
        { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 16 },
      ];
      attendanceSheet["!cols"] = [
        { wch: 14 }, { wch: 16 }, { wch: 26 }, { wch: 22 }, { wch: 22 },
        { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 48 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Employee Summary");
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance Records");
      const suffix = selectedDate ? `-${selectedDate}` : "";
      XLSX.writeFile(workbook, `attendance-report-${month}${suffix}.xlsx`);
      toast.success("Excel report exported");
    } catch (err) {
      toast.error("Unable to export the Excel report");
    }
  };

  const downloadEmployeeMonthlyPdf = async () => {
    if (!selectedEmployeeId) {
      toast.error("Select an employee first");
      return;
    }
    // Open the tab synchronously from the click event so browsers do not block it
    // while the employee report request is in flight.
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Allow pop-ups to open the employee report.");
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
      win.close();
      toast.error(err.response?.data?.message || "Unable to download employee report");
    }
  };

  const summaryColumns = [
    { accessor: "employeeId", header: "ID", render: (_, item) => item.employee?.employeeId || "-" },
    {
      accessor: "employee",
      header: "Employee",
      render: (_, item) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{item.employee?.name || "N/A"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.employee?.department || item.employee?.email || "-"}</p>
        </div>
      ),
    },
    { accessor: "present", header: "Present" },
    { accessor: "halfDay", header: "Half Day" },
    { accessor: "earnedLeave", header: "EL Requests" },
    { accessor: "sickLeave", header: "SL Requests" },
    { accessor: "urgentLeave", header: "Urgent Requests" },
    { accessor: "otherLeave", header: "Other Leave" },
    { accessor: "workMinutes", header: "Work", render: (value) => minutesToHours(value) },
    { accessor: "breakMinutes", header: "Break", render: (value) => minutesToHours(value) },
  ];
  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance Reports"
        description="Monthly work hours, breaks, half days, and approved leave totals."
        actions={(
          <div className="flex w-full flex-wrap items-end gap-2 xl:w-auto xl:flex-nowrap">
            <div className="w-full min-w-[180px] sm:w-[190px] sm:flex-none">
              <CalendarPicker
                value={month}
                onChange={(value) => {
                  if (!value) return;
                  setMonth(value);
                  if (selectedDate && !selectedDate.startsWith(value)) setSelectedDate("");
                }}
                mode="month"
                label="Report month"
              />
            </div>
            <Button text="Export Excel" variant="secondary" onClick={exportExcel} className="min-h-10 whitespace-nowrap" />
            <Button text="Download View" onClick={downloadMonthlyPdf} className="min-h-10 whitespace-nowrap" />
            <Button
              text="Employee PDF"
              variant="secondary"
              onClick={downloadEmployeeMonthlyPdf}
              disabled={!selectedEmployeeId}
              title={selectedEmployeeId ? "Download this employee's monthly report" : "Select an employee first"}
              className="min-h-10 whitespace-nowrap disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-100"
            />
            <Button text="View Leave Calendar" variant="secondary" onClick={() => setCalendarModalOpen(true)} className="min-h-10 whitespace-nowrap" />
          </div>
        )}
      />
      <SectionCard className="overflow-visible">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CustomDropdown
            label="Employee"
            value={selectedEmployeeId}
            onChange={(value) => {
              setSelectedEmployeeId(value);
              setSelectedDate("");
            }}
            placeholder="All employees"
            options={employees.map((employee) => ({
              value: employee._id,
              label: `${employee.employeeId || "-"} - ${employee.name || "Unnamed employee"}`,
            }))}
          />
          <CalendarPicker
            value={selectedDate}
            onChange={(value) => {
              setSelectedDate(value);
              if (value) setMonth(value.slice(0, 7));
            }}
            label="Day"
            className="mt-1"
            timeZone="Asia/Kolkata"
          />
          <div className="flex items-end">
            <Button
              text="Clear filters"
              variant="secondary"
              onClick={() => {
                setSelectedEmployeeId("");
                setSelectedDate("");
                setSearch("");
              }}
              className="min-h-10 w-full"
            />
          </div>
        </div>
      </SectionCard>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Employees", value: filteredEmployeeSummary.length },
          { label: selectedDate ? "Day Records" : "Monthly Records", value: filteredAttendance.length },
          { label: selectedDate ? "Day Present" : "Present", value: filteredAttendance.filter((item) => item.status === "present").length },
          { label: selectedDate ? "Day Half Day" : "Half Day", value: filteredAttendance.filter((item) => item.status === "half_day").length },
        ].map(({ label, value }, index) => (
          <MetricCard key={label} label={label} value={value} index={index + 1} />
        ))}
      </section>

      <SectionCard
        title="Employee Monthly Summary"
        subtitle="Attendance totals and approved leave request counts for each employee, including break time."
      >
        <CommonTable
          columns={summaryColumns}
          data={summaryPagination.pageItems}
          pagination={summaryPagination}
          loading={pageLoading}
          error={reportError}
          errorAction={<Button text="Retry" onClick={loadReports} className="!py-1.5" />}
          emptyText="No employee data found for this month."
          toolbar={(
            <TableToolbar
              value={search}
              onChange={setSearch}
              label="Search employees"
              placeholder="Employee name, ID, email, department..."
              summary={`${filteredEmployeeSummary.length} employees`}
            />
          )}
        />
      </SectionCard>

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
	          <div className="rounded-sm border border-[#ffd8cf] bg-[#fffaf8] p-3 space-y-2">
	            <div className="flex items-center justify-between gap-2">
	              <p className="text-sm font-semibold">Company calendar PDF</p>
	              {calendarPdfDocument?.url && <a href={calendarPdfDocument.url} target="_blank" rel="noreferrer" className="text-xs text-[#f84525] font-semibold">View current</a>}
	            </div>
	            <input type="file" accept="application/pdf,.pdf" onChange={(e) => setCalendarPdf(e.target.files?.[0] || null)} className="w-full text-xs" />
	            <p className="text-[11px] text-gray-500">PDF only, maximum 5 MB. Upload for {calendarYear}.</p>
	            <Button text={calendarPdfSaving ? "Uploading..." : "Upload Calendar PDF"} loading={calendarPdfSaving} type="button" onClick={uploadCalendarPdf} className="w-full" disabled={!calendarPdf} />
	          </div>
	          <input
	            type="number"
	            min="2000"
	            max="2100"
	            value={calendarYear}
	            onChange={(e) => {
	              const year = Number(e.target.value);
	              if (year >= 2000 && year <= 2100) setMonthCursor(year * 12);
	            }}
	            className="w-full border rounded-sm px-3 py-2"
	          />
	          <input
	            type="date"
	            value={holidayForm.date}
	            onChange={(e) => {
	              setHolidayForm((prev) => ({ ...prev, date: e.target.value }));
	              if (e.target.value) setMonthCursor(getMonthCursor(new Date(`${e.target.value}T00:00:00`)));
	            }}
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
          {holidayForm.type === "optional_leave" && (
            <p className="text-xs text-gray-500">
              Employees can request Optional Leave only on dates marked this way. The annual allowance is configured in Admin Settings.
            </p>
          )}
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
	            <div>
	              <h2 className="font-semibold">Calendar - {visibleCalendarRange}</h2>
	              <p className="text-xs text-gray-500 mt-1">Showing 2 months at a time.</p>
	            </div>
		            <div className="flex w-full flex-wrap items-center justify-center gap-2 md:w-auto">
		              <button
		                type="button"
		                onClick={() => setMonthCursor((current) => current - 2)}
		                className="inline-flex min-h-9 items-center justify-center rounded-sm border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:border-[#f84525] hover:text-[#f84525]"
		                title="Previous months"
		              >
		                <FiChevronLeft />
		              </button>
		              <span className="inline-flex min-h-9 min-w-[230px] items-center justify-center gap-2 rounded-sm bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-gray-900">
		                <FiCalendar className="text-[#f84525]" /> {visibleCalendarRange}
		              </span>
		              <button
		                type="button"
		                onClick={() => setMonthCursor((current) => current + 2)}
		                className="inline-flex min-h-9 items-center justify-center rounded-sm border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:border-[#f84525] hover:text-[#f84525]"
		                title="Next months"
		              >
		                <FiChevronRight />
		              </button>
	              <button
	                type="button"
	                onClick={() => setMonthCursor(currentMonthCursor)}
	                disabled={monthCursor === currentMonthCursor}
	                className="rounded-sm bg-[#f84525] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
	              >
	                Today
	              </button>
	            </div>
	          </div>
	          <div className="flex gap-2 text-xs flex-wrap mb-3">
	            <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-sm">Holiday</span>
	            <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-sm">Working Sat</span>
	            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-sm">Optional Leave</span>
	            <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-sm">Event/Notice</span>
	            <span className="px-2 py-1 bg-[#fff5f3] text-[#f84525] border border-[#f84525] rounded-sm">Today</span>
	          </div>
	          {calendarLoading ? (
	            <div className="py-12 text-center text-sm text-gray-500">Loading calendar...</div>
	          ) : (
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
	                    const isToday = todayKey === day.dateKey;
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
	                        className={`min-h-14 border rounded-sm p-1 text-left text-[11px] transition ${
	                          isToday ? "ring-2 ring-[#f84525] ring-offset-1" : ""
	                        } ${className}`}
	                      >
	                        <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1 font-bold ${
	                          isToday ? "bg-[#f84525] text-white" : mode === "dark" && !saved && !selected ? "text-white" : "text-gray-950"
	                        }`}>{day.dayNumber}</span>
	                      </button>
                    );
                  })}
                </div>
              </div>
	            ))}
	          </div>
	          )}
	        </div>
          </div>
        </section>
      </div>
      )}

    </div>
  );
};

export default ViewReports;
