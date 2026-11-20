import { useCallback, useEffect, useState } from "react";
import { authApi } from "../../api";
import CommonLoader from "../../components/common/CommonLoader";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import { FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const moduleNames = {
  users: "User Management",
  hr: "Employees & HR",
  employees: "Employees",
  candidates: "Candidates",
  documents: "Documents",
  ownDocuments: "My Documents",
  attendance: "Attendance",
  checkins: "Check-ins",
  attendanceReports: "Attendance Reports",
  leaves: "Leaves",
  leaveCalendar: "Leave Calendar",
  leaveReports: "Leave Reports",
  credentials: "Credentials",
  rolesAccess: "Role & Access",
  systemAllotments: "System Allotments",
  departments: "Departments",
  system: "System",
};

const actionNames = {
  create: "Created",
  add: "Added",
  update: "Updated",
  edit: "Updated",
  delete: "Deleted",
  view: "Viewed",
};

export default function AuditLogs() {
  const { confirm } = useModal();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      authApi
        .getAuditLogs({
          from: from || undefined,
          to: to || undefined,
          page: targetPage,
          limit,
        })
        .then((response) => {
          setLogs(response.data.data || []);
          setPagination(response.data.pagination || { total: 0, totalPages: 1 });
        })
        .finally(() => setLoading(false));
    },
    [from, to, page, limit]
  );

  const clearRange = () => {
    setFrom("");
    setTo("");
    setPage(1);
    setLoading(true);
    authApi
      .getAuditLogs({ page: 1, limit })
      .then((response) => {
        setLogs(response.data.data || []);
        setPagination(response.data.pagination || { total: 0, totalPages: 1 });
      })
      .finally(() => setLoading(false));
  };

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPage(nextPage);
    load(nextPage);
  };

  useEffect(() => {
    setPage(1);
  }, [from, to, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const getActivitySentence = (log) => {
    const actorName = log.actorName || log.actor?.name || log.actor?.email || "Unknown user";
    const description = log.description || "";
    const lowerDescription = description.toLowerCase();
    const lowerPath = (log.path || "").toLowerCase();

    let subject = "a record";
    if (lowerPath.includes("/password") || lowerDescription.includes("employee login password") || lowerDescription.includes("password verification") || lowerDescription.includes("password setup") || lowerDescription.includes("password")) {
      subject = "the employee login password";
    } else if (lowerDescription.includes("module access") || lowerDescription.includes("mobile access") ) {
      subject = "module and mobile access settings";
    } else if (lowerDescription.includes("employee profile") || lowerDescription.includes("employee")) {
      subject = "the employee profile";
    } else if (lowerDescription.includes("candidate profile") || lowerDescription.includes("candidate")) {
      subject = "the candidate profile";
    } else if (lowerDescription.includes("document")) {
      subject = "an employee document";
    } else if (lowerDescription.includes("department")) {
      subject = "the department";
    } else if (lowerDescription.includes("leave")) {
      subject = "the leave request";
    } else if (lowerDescription.includes("attendance") || lowerDescription.includes("check-in")) {
      subject = "the attendance record";
    } else if (lowerDescription.includes("role")) {
      subject = "role and module access";
    }

    const action = log.action === "create" || log.action === "add"
      ? "created"
      : log.action === "delete"
        ? "deleted"
        : log.action === "view"
          ? "viewed"
          : "updated";

    const employeeContext = log.targetName
      ? ` for ${log.targetName}`
      : log.module === "employees" || log.entityId
        ? " for this employee"
        : "";

    return `${actorName} ${action} ${subject}${employeeContext}.`;
  };

  const toggleSelect = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleSelectPage = () => {
    const pageIds = logs.map((log) => log._id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected
      ? current.filter((id) => !pageIds.includes(id))
      : [...new Set([...current, ...pageIds])]);
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    const confirmed = await confirm({
      title: "Delete selected activity logs?",
      message: `${selectedIds.length} selected activity log${selectedIds.length === 1 ? "" : "s"} will be permanently deleted.`,
      confirmText: "Delete selected",
      tone: "danger",
    });
    if (!confirmed) return;
    setDeleting(true);
    setLoading(true);
    try {
      await authApi.deleteSelectedAuditLogs(selectedIds);
      toast.success(`${selectedIds.length} activity log${selectedIds.length === 1 ? "" : "s"} deleted`);
      setSelectedIds([]);
      await load(page);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete activity logs");
    } finally {
      setDeleting(false);
      setLoading(false);
    }
  };

  const deleteAll = async () => {
    const scopeMessage = from || to
      ? "All activity logs in the selected date range will be permanently deleted."
      : "All activity logs will be permanently deleted.";
    const confirmed = await confirm({
      title: "Delete activity logs?",
      message: scopeMessage,
      confirmText: "Delete all",
      tone: "danger",
    });
    if (!confirmed) return;
    setDeleting(true);
    setLoading(true);
    try {
      await authApi.deleteAllAuditLogs({ from: from || undefined, to: to || undefined });
      toast.success("Activity logs deleted");
      setSelectedIds([]);
      setPage(1);
      await load(1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete activity logs");
    } finally {
      setDeleting(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activity Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">A readable history of who viewed, created, updated or deleted information.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(page)}
            disabled={loading}
            className="inline-flex h-10 flex-none items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            title="Refresh latest activity logs"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              disabled={loading || deleting}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-600 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800"
            >
              <FiTrash2 className={deleting ? "animate-pulse" : ""} />
              {deleting ? "Deleting..." : `Delete selected (${selectedIds.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={deleteAll}
            disabled={loading || deleting || pagination.total === 0}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-600 dark:bg-gray-800 dark:text-red-300 dark:hover:bg-red-900/30"
            title="Delete all matching activity logs"
          >
            <FiTrash2 className={deleting ? "animate-pulse" : ""} />
            {deleting ? "Deleting..." : "Delete all"}
          </button>
        </div>
      </div>

      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onApply={load} onClear={clearRange} />

      {!loading && (
        <div className="grid gap-3 sm:grid-cols-3">
          {["create", "update", "delete"].map((summaryAction) => {
            const count = logs.filter((log) => log.action === summaryAction || (summaryAction === "update" && log.action === "edit")).length;
            const labels = { create: "Created", update: "Updated", delete: "Deleted" };
            const styles = {
              create: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
              update: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
              delete: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
            };
            return (
              <div key={summaryAction} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${styles[summaryAction]}`}>
                <span className="text-sm font-semibold">{labels[summaryAction]} this page</span>
                <span className="text-xl font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <CommonLoader text={deleting ? "Deleting activity logs..." : "Loading activity logs..."} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={logs.length > 0 && logs.every((log) => selectedIds.includes(log._id))}
                      onChange={toggleSelectPage}
                      className="h-4 w-4 rounded-md border-gray-300 text-[#f84525] focus:ring-[#f84525] dark:border-gray-600 dark:bg-gray-700"
                      aria-label="Select all logs on this page"
                    />
                    <span>This page</span>
                    <span>· Date & time</span>
                  </div>
                </th>
                {["User", "Role", "Action", "Module", "What happened"].map((heading) => (
                  <th key={heading} className="p-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">No activity found for this date range.</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const action = log.action || "update";
                  const actorName = log.actorName || log.actor?.name || log.actor?.email || "Unknown user";
                  const actorRole = log.actorRole || log.actor?.role || "-";
                  const isSuccess = !log.statusCode || log.statusCode < 400;

                  return (
                    <tr className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-600" key={log._id}>
                      <td className="whitespace-nowrap p-3 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(log._id)}
                            onChange={() => toggleSelect(log._id)}
                            className="h-4 w-4 rounded-md border-gray-300 text-[#f84525] focus:ring-[#f84525] dark:border-gray-600 dark:bg-gray-700"
                            aria-label={`Select log from ${actorName} on ${new Date(log.createdAt).toLocaleString()}`}
                          />
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{actorName}</div>
                        {log.actor?.email && <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{log.actor.email}</div>}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{actorRole}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{actionNames[action] || action}</div>
                      </td>
                      <td className="whitespace-nowrap p-3 font-medium text-gray-700 dark:text-gray-300">
                        {moduleNames[log.module] || log.module || "System"}
                      </td>
                      <td className="max-w-md p-3">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{getActivitySentence(log)}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          {log.statusCode && (
                            <span className={isSuccess ? "text-emerald-600" : "text-red-600"}>
                              {isSuccess ? "Successful" : "Failed"} · {log.statusCode}
                            </span>
                          )}
                          {log.entityId && <span className="text-gray-400 dark:text-gray-500">Record ID: {log.entityId}</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && logs.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/30">
          <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-[#f84525]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              Latest activity{from || to ? " in selected date range" : ""}
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
              {getActivitySentence(logs[0])}
            </p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <span>
              Showing {pagination.total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of {pagination.total} activities
            </span>
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-[#f84525] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} per page</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changePage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-400"
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
              .filter((pageNumber) => pageNumber === 1 || pageNumber === pagination.totalPages || Math.abs(pageNumber - page) <= 1)
              .map((pageNumber, index, visiblePages) => (
                <span key={pageNumber} className="flex items-center">
                  {index > 0 && pageNumber - visiblePages[index - 1] > 1 && <span className="px-1 text-gray-400 dark:text-gray-500">…</span>}
                  <button
                    type="button"
                    onClick={() => changePage(pageNumber)}
                    className={`min-w-9 rounded-md px-2 py-1.5 ${pageNumber === page ? "bg-[#f84525] font-semibold text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"}`}
                  >
                    {pageNumber}
                  </button>
                </span>
              ))}

            <button
              type="button"
              onClick={() => changePage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
