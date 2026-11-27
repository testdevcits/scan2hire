/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiActivity, FiCalendar, FiCamera, FiDownload, FiRefreshCw, FiUsers } from "react-icons/fi";

import { createSocket } from "../../services/socket";
import Button from "../../components/ui/Button";
import CalendarPicker from "../../components/ui/CalendarPicker/CalendarPicker";
import CommonTable from "../../components/ui/Table/CommonTable";
import FilePreviewModal from "../../components/ui/Modal/FilePreviewModal";
import { MetricCard, PageHeader } from "../../components/ui/ReusableCards";
import TableToolbar from "../../components/ui/Table/TableToolbar";
import { Link } from "react-router-dom";

const getDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const formatTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

const formatDateLabel = (dateKey) => {
  if (!dateKey) return "-";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateKey}T00:00:00+05:30`));
};

const minutesToHours = (minutes = 0) => {
  const total = Number(minutes) || 0;
  return `${Math.floor(total / 60)}h ${total % 60}m`;
};

const csvCell = (value) => {
  const text = String(value ?? "");
  const safeText = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
};

const TodayCheckIns = () => {
  const { hrApi } = useApi();
  const todayKey = getDateKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ checkedIn: 0, running: 0, withSelfie: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const hasLoaded = useRef(false);
  const requestId = useRef(0);
  const loadRef = useRef(null);

  const loadCheckIns = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    if (hasLoaded.current) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await hrApi.getAttendance({
        date: selectedDate,
        page,
        limit: pageSize,
        search: search.trim(),
      });
      if (currentRequestId !== requestId.current) return;

      setAttendance(response.data?.data || []);
      setSummary(response.data?.summary || { checkedIn: 0, running: 0, withSelfie: 0 });
      const nextPagination = response.data?.pagination;
      if (nextPagination) {
        setPagination({
          page: nextPagination.page || page,
          limit: nextPagination.limit || pageSize,
          totalItems: nextPagination.totalItems || 0,
          totalPages: nextPagination.totalPages || 1,
        });
      }
      setError("");
    } catch (err) {
      if (currentRequestId !== requestId.current) return;
      setError(err.response?.data?.message || `Unable to load check-ins for ${selectedDate}.`);
    } finally {
      if (currentRequestId === requestId.current) {
        hasLoaded.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [hrApi, selectedDate, page, pageSize, search]);

  const exportCheckIns = useCallback(async () => {
    setExporting(true);
    setExportProgress(null);
    try {
      const firstResponse = await hrApi.getAttendance({
        date: selectedDate,
        page: 1,
        limit: 100,
        search: search.trim(),
      });
      const allRecords = firstResponse.data?.data || [];
      const pageInfo = firstResponse.data?.pagination;
      const totalPages = pageInfo?.totalPages || 1;
      const totalItems = pageInfo?.totalItems ?? allRecords.length;
      setExportProgress({ loaded: allRecords.length, total: totalItems });
      for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
        const response = await hrApi.getAttendance({
          date: selectedDate,
          page: currentPage,
          limit: 100,
          search: search.trim(),
        });
        allRecords.push(...(response.data?.data || []));
        setExportProgress({ loaded: allRecords.length, total: totalItems });
      }

      const headers = [
        "Employee ID",
        "Employee",
        "Department",
        "Date",
        "Login",
        "Logout",
        "Mode",
        "Distance (m)",
        "Work",
        "Status",
      ];
      const rows = allRecords.map((item) => [
        item.employee?.employeeId,
        item.employee?.name,
        item.employee?.department,
        item.dateKey,
        formatTime(item.loginAt),
        formatTime(item.logoutAt),
        item.attendanceMode === "work_from_home" ? "WFH" : "Office",
        item.loginLocation?.distanceFromOfficeMeters,
        minutesToHours(item.totalWorkMinutes),
        item.status,
      ]);
      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
      const fileUrl = URL.createObjectURL(
        new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
      );
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `check-ins-${selectedDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to export check-ins. Please try again.");
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  }, [hrApi, selectedDate, search]);

  loadRef.current = loadCheckIns;

  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  useEffect(() => {
    requestId.current += 1;
    const timer = window.setTimeout(() => loadCheckIns(), search.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadCheckIns, search]);

  useEffect(() => {
    const socket = createSocket();
    let refreshTimer;
    let fallbackPoll;
    let fallbackInterval = null;
    const startFallbackPoll = (interval = 30000) => {
      if (fallbackPoll && fallbackInterval === interval) return;
      if (fallbackPoll) window.clearInterval(fallbackPoll);
      fallbackInterval = interval;
      fallbackPoll = window.setInterval(() => loadRef.current?.(), interval);
    };

    // REST remains the safety net if sockets fail, and periodically reconciles missed events.
    startFallbackPoll();
    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("attendance:join");
      startFallbackPoll(60000);
      loadRef.current?.();
    });
    socket.on("disconnect", () => {
      setSocketConnected(false);
      startFallbackPoll();
    });
    socket.on("connect_error", () => {
      setSocketConnected(false);
      startFallbackPoll();
    });
    socket.on("attendance:update", (payload) => {
      if (payload?.attendance?.dateKey !== selectedDateRef.current) return;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => loadRef.current?.(), 150);
    });

    return () => {
      window.clearTimeout(refreshTimer);
      window.clearInterval(fallbackPoll);
      fallbackInterval = null;
      socket.disconnect();
    };
  }, []);

  const paginationControls = useMemo(
    () => ({
      page: pagination.page || page,
      pageSize: pagination.limit || pageSize,
      setPage,
      setPageSize: (nextSize) => {
        setPageSize(Number(nextSize));
        setPage(1);
      },
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
    }),
    [pagination, page, pageSize]
  );

  const columns = useMemo(
    () => [
      {
        accessor: "employee",
        header: "Employee",
        render: (employee) => (
          <div className="min-w-36">
            {employee?._id ? (
              <Link
                to={`/hr/employees/${employee._id}`}
                className="font-semibold text-[#f84525] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f84525]"
              >
                {employee.name || "N/A"}
              </Link>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {employee?.name || "N/A"}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {employee?.employeeId || "-"} · {employee?.department || "-"}
            </p>
          </div>
        ),
      },
      {
        accessor: "loginSelfie",
        header: "Selfie",
        render: (selfie, record) =>
          selfie?.url ? (
            <button
              type="button"
              onClick={() =>
                setPreview({
                  title: `${record.employee?.name || "Employee"} check-in selfie`,
                  url: selfie.url,
                })
              }
              aria-label={`Preview ${record.employee?.name || "employee"} selfie`}
              className="inline-flex rounded-sm text-[#f84525] hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f84525]"
            >
              <img
                src={selfie.url}
                alt="Preview check-in selfie"
                title="Click to preview selfie"
                className="h-10 w-10 rounded-sm border border-gray-200 object-cover dark:border-gray-700"
              />
            </button>
          ) : (
            <span className="text-gray-400">No selfie</span>
          ),
      },
      { accessor: "loginAt", header: "Login", render: formatTime },
      { accessor: "logoutAt", header: "Logout", render: formatTime },
      {
        accessor: "attendanceMode",
        header: "Mode",
        render: (mode) => (mode === "work_from_home" ? "WFH" : mode === "office" ? "Office" : "-"),
      },
      {
        accessor: "loginLocation",
        header: "Distance",
        render: (location) => {
          const distance = location?.distanceFromOfficeMeters;
          if (distance === null || distance === undefined || !Number.isFinite(Number(distance)))
            return "-";
          return (
            <div>
              <p
                className={
                  location.withinRadius === false
                    ? "font-semibold text-red-600"
                    : "font-medium text-gray-900 dark:text-gray-100"
                }
              >
                {Math.round(Number(distance))}m
              </p>
              {location.withinRadius === false && (
                <span className="text-xs text-red-600">Outside</span>
              )}
            </div>
          );
        },
      },
      { accessor: "totalWorkMinutes", header: "Work", render: minutesToHours },
      {
        accessor: "status",
        header: "Status",
        render: (status) => {
          const running = status === "running";
          return (
            <span
              className={`inline-flex rounded-sm px-2 py-1 text-xs font-medium ${running ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
            >
              {running ? "Running" : String(status || "Unknown").replaceAll("_", " ")}
            </span>
          );
        },
      },
    ],
    []
  );

  const toolbar = (
    <TableToolbar
      value={search}
      onChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      label="Search today's check-ins"
      placeholder="Employee, ID, department, mode..."
      summary={`${pagination.totalItems} check-ins`}
      loading={refreshing}
      loadingText="Updating..."
    />
  );

  const metrics = [
    {
      label: "Date",
      value: formatDateLabel(selectedDate),
      icon: <FiActivity />,
      iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    },
    { label: "Checked In", value: summary.checkedIn, icon: <FiUsers /> },
    {
      label: "Running",
      value: summary.running,
      icon: <FiActivity />,
      iconClassName: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300",
    },
    {
      label: "With Selfie",
      value: summary.withSelfie,
      icon: <FiCamera />,
      iconClassName: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300",
    },
  ];

  return (
    <div className="space-y-4 p-2">
      <PageHeader
        title={selectedDate === todayKey ? "Today Check-ins" : "Check-ins"}
        description={
          selectedDate === todayKey
            ? "Employees who checked in today from app or desktop. App check-ins include selfie proof."
            : "Employees who checked in on the selected date. App check-ins include selfie proof."
        }
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <span
              className={`inline-flex items-center gap-2 self-start rounded-sm border px-2.5 py-2 text-xs font-medium sm:self-end ${socketConnected ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300" : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-gray-400"}`}
              />
              {socketConnected ? "Live" : "API auto-refresh"}
            </span>
            <CalendarPicker
              value={selectedDate}
              onChange={(value) => {
                if (!value) return;
                setSelectedDate(value);
                setPage(1);
              }}
              timeZone="Asia/Kolkata"
              className="min-w-[190px]"
            />
            <div className="flex flex-wrap gap-2">
              {selectedDate !== todayKey && (
                <Button
                  onClick={() => {
                    setSelectedDate(todayKey);
                    setPage(1);
                  }}
                  variant="secondary"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <FiCalendar aria-hidden="true" /> Today
                </Button>
              )}
              <Button
                onClick={exportCheckIns}
                loading={exporting}
                text={
                  exportProgress
                    ? `Exporting ${exportProgress.loaded} / ${exportProgress.total}`
                    : "Preparing export..."
                }
                disabled={loading}
                variant="secondary"
                className="inline-flex items-center justify-center gap-2"
              >
                <FiDownload aria-hidden="true" /> Export CSV
              </Button>
              <Button
                onClick={() => loadCheckIns()}
                loading={refreshing}
                disabled={loading}
                variant="secondary"
                className="inline-flex items-center justify-center gap-2"
              >
                <FiRefreshCw aria-hidden="true" /> Refresh
              </Button>
            </div>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <CommonTable
        columns={columns}
        data={attendance}
        toolbar={toolbar}
        pagination={paginationControls}
        loading={loading}
        error={error}
        errorAction={
          <Button onClick={() => loadCheckIns()} loading={refreshing} variant="secondary">
            Retry
          </Button>
        }
        emptyText={`No check-ins found for ${selectedDate === todayKey ? "today" : selectedDate}.`}
        loadingText={`Loading check-ins for ${selectedDate}...`}
      />

      {preview && (
        <FilePreviewModal
          title={preview.title}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

export default TodayCheckIns;
