import { useCallback, useEffect, useState } from "react";
import { authApi } from "../../api";
import CommonLoader from "../../components/common/CommonLoader";
import { FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";
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
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      authApi
        .getAuditLogs({
          from: from || undefined,
          to: to || undefined,
          page: targetPage,
          limit,
          search: search || undefined,
          action: actionFilter === "all" ? undefined : actionFilter,
        })
        .then((response) => {
          setLogs(response.data.data || []);
          setPagination(response.data.pagination || { total: 0, totalPages: 1 });
        })
        .finally(() => setLoading(false));
    },
    [from, to, page, limit, search, actionFilter]
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

    if (log.method === "GET" && /^\/api\/employees\//.test(lowerPath)) {
      const resource = lowerPath.split("?")[0].replace("/api/employees/", "");
      const resources = { me: "their own profile", "me/access": "their access permissions", attendance: "their attendance", leaves: "their leave requests and balance", "leave-drafts": "their saved leave drafts", candidates: "their assigned interviews", "interview-logs": "their interview history", birthdays: "birthday reminders" };
      if (resources[resource]) return `${actorName} loaded ${resources[resource]}.`;
    }

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
      : log.entityId ? ` (record ${log.entityId})` : "";

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

  const visibleLogs = logs.filter((log) => {
    const actionMatches = actionFilter === "all"
      || (actionFilter === "update" ? ["update", "edit"].includes(log.action) : log.action === actionFilter);
    const haystack = [
      log.actorName,
      log.actor?.name,
      log.actor?.email,
      log.actorRole,
      log.actor?.role,
      log.module,
      moduleNames[log.module],
      log.description,
      log.targetName,
      getActivitySentence(log),
    ].join(" ").toLowerCase();
    return actionMatches && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  });

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(date, today)) return "Today";
    if (sameDay(date, yesterday)) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  };

  const getActionStyle = (action) => {
    if (action === "create" || action === "add") return "bg-emerald-500";
    if (action === "delete") return "bg-[#ef5b46]";
    if (action === "view") return "bg-sky-500";
    return "bg-[#9fb5cc]";
  };

  const groupedLogs = visibleLogs.reduce((groups, log) => {
    const label = getDateLabel(log.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
    return groups;
  }, {});

  return (
    <div className="space-y-4 p-1 sm:p-2">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activity Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">A readable history of who viewed, created, updated or deleted information.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 w-full rounded-xl border border-gray-300 pl-11 pr-4 text-sm outline-none focus:border-[#f84525] focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Search user, module or action"
            aria-label="Search activity logs"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            From
            <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-[#f84525] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
          </label>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            To
            <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-[#f84525] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
        </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => load(1)} disabled={Boolean(from && to && from > to)} className="h-10 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200">Apply filter</button>
          <button type="button" onClick={clearRange} className="h-10 rounded-xl border border-gray-300 px-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">Clear dates</button>
          <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto">
            {[["all", "All"], ["create", "Created"], ["update", "Updated"], ["delete", "Deleted"], ["view", "Viewed"]].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setActionFilter(value)} className={`h-9 shrink-0 rounded-lg border px-4 text-sm font-semibold ${actionFilter === value ? "border-[#f84525]/40 bg-[#fff5f2] text-[#d93a1e] dark:bg-orange-950/20 dark:text-orange-300" : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
            <div><span className="text-2xl font-bold">{pagination.total}</span><p className="mt-1 text-xs text-gray-500">Total activities</p></div>
          </div>
          {[{ key: "create", label: "Created", color: "text-emerald-600" }, { key: "update", label: "Updated", color: "text-blue-600" }, { key: "delete", label: "Deleted", color: "text-[#c55344]" }].map((item) => {
            const count = logs.filter((log) => item.key === "update" ? ["update", "edit"].includes(log.action) : log.action === item.key).length;
            return <div key={item.key} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900"><div><span className={`text-2xl font-bold ${item.color}`}>{count}</span><p className="mt-1 text-xs text-gray-500">{item.label}</p></div></div>;
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <CommonLoader text={deleting ? "Deleting activity logs..." : "Loading activity logs..."} />
        ) : visibleLogs.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No activity found for this date range.</p>
        ) : (
          <div className="p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">{pagination.total} activities</span>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={logs.length > 0 && logs.every((log) => selectedIds.includes(log._id))}
                  onChange={toggleSelectPage}
                  className="h-4 w-4 rounded border-gray-300 text-[#f84525] focus:ring-[#f84525]"
                  aria-label="Select all logs on this page"
                />
                Select page
              </label>
            </div>

            {Object.entries(groupedLogs).map(([label, grouped]) => (
              <section key={label} className="mb-5 last:mb-0">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">{label}</h2>
                <div className="space-y-3">
                  {grouped.map((log) => {
                    const action = log.action || "update";
                    const actorName = log.actorName || log.actor?.name || log.actor?.email || "Unknown user";
                    const actorRole = log.actorRole || log.actor?.role || "Super admin";
                    const time = new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

                    return (
                      <article key={log._id} className="relative ml-2 flex gap-3 border-l-2 border-[#cfe2fb] pl-3 sm:ml-4 sm:gap-4 sm:pl-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(log._id)}
                          onChange={() => toggleSelect(log._id)}
                          className="absolute -left-[9px] top-5 h-4 w-4 rounded-full border-0 bg-white text-[#f84525] shadow-sm ring-2 ring-[#dceafa]"
                          aria-label={`Select log from ${actorName}`}
                        />
                        <div className={`absolute -left-[13px] top-3 h-6 w-6 rounded-full ${getActionStyle(action)} opacity-20`} />
                        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-gray-700 dark:bg-gray-800 sm:px-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-5 text-gray-900 dark:text-gray-100 sm:text-base">{getActivitySentence(log)}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{actionNames[action] || action}</span>
                                <span className="rounded-md bg-[#fff5f2] px-2 py-1 text-xs text-[#d84a2f] dark:bg-orange-950/30 dark:text-orange-300">
                                  {moduleNames[log.module] || log.module || "System"}
                                </span>
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                  {actorRole}
                                </span>
                              </div>
                            </div>
                            <time className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{time}</time>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
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
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center">
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

          <div className="flex flex-wrap items-center justify-between gap-3 text-gray-600 dark:text-gray-400 sm:justify-end">
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
