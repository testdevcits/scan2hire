/* eslint-disable */
import { useApi } from "../../../contexts/ApiContext";
import { useCallback, useEffect, useState } from "react";

import CommonLoader from "../../../components/ui/CommonLoader";
import DateRangePicker from "../../../components/ui/DateRangePicker/DateRangePicker";
import { FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";
import { useModal } from "../../../contexts/ModalContext";
import { useToast } from "../../../contexts/ToastContext";

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
  const { authApi } = useApi();
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
    [authApi, from, to, page, limit, search, actionFilter]
  );

  const clearRange = () => {
    setFrom("");
    setTo("");
    setPage(1);
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
      const resources = {
        me: "their own profile",
        "me/access": "their access permissions",
        attendance: "their attendance",
        leaves: "their leave requests and balance",
        "leave-drafts": "their saved leave drafts",
        candidates: "their assigned interviews",
        "interview-logs": "their interview history",
        birthdays: "birthday reminders",
      };
      if (resources[resource]) return `${actorName} loaded ${resources[resource]}.`;
    }

    const selfPath = lowerPath.split("?")[0];
    if (/^\/api\/(employees|users)\/me\/documents\/request\/?$/.test(selfPath))
      return `${actorName} requested an update to their own documents.`;
    if (/^\/api\/(employees|users)\/me\/documents\/?$/.test(selfPath))
      return `${actorName} updated their own documents.`;
    if (/^\/api\/employees\/me\/profile-image\/?$/.test(selfPath))
      return `${actorName} updated their own profile photo.`;
    if (/^\/api\/(employees|users)\/me\/account-credentials/.test(selfPath))
      return `${actorName} ${log.action === "delete" ? "deleted" : ["create", "add"].includes(log.action) ? "added" : "viewed"} their own saved credential.`;
    if (/^\/api\/(employees|users)\/me\/change-password\/?$/.test(selfPath))
      return `${actorName} changed their own password.`;
    if (/^\/api\/(employees|users)\/me\/?$/.test(selfPath))
      return `${actorName} ${log.method === "GET" ? "viewed" : "updated"} their own profile.`;

    let subject = "a record";
    if (
      lowerPath.includes("/password") ||
      lowerDescription.includes("employee login password") ||
      lowerDescription.includes("password verification") ||
      lowerDescription.includes("password setup") ||
      lowerDescription.includes("password")
    ) {
      subject = "the employee login password";
    } else if (
      lowerDescription.includes("module access") ||
      lowerDescription.includes("mobile access")
    ) {
      subject = "module and mobile access settings";
    } else if (
      lowerDescription.includes("employee profile") ||
      (lowerDescription.includes("employee") &&
        !lowerDescription.includes("document") &&
        !lowerDescription.includes("credential"))
    ) {
      subject = "the employee profile";
    } else if (
      lowerDescription.includes("candidate profile") ||
      lowerDescription.includes("candidate")
    ) {
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

    const action =
      log.action === "create" || log.action === "add"
        ? "created"
        : log.action === "delete"
          ? "deleted"
          : log.action === "view"
            ? "viewed"
            : "updated";

    const employeeContext = log.targetName
      ? ` for ${log.targetName}`
      : log.entityId
        ? ` (record ${log.entityId})`
        : "";

    return `${actorName} ${action} ${subject}${employeeContext}.`;
  };

  const renderActivitySentence = (log) => {
    const actorName = log.actorName || log.actor?.name || log.actor?.email || "Unknown user";
    const role = log.actorRole || log.actor?.role || "";
    const sentence = getActivitySentence(log);
    const remainder = sentence.startsWith(actorName) ? sentence.slice(actorName.length) : sentence;
    const targetIndex = log.targetName ? remainder.indexOf(log.targetName) : -1;
    const actorColor =
      role === "hr"
        ? "text-blue-700 dark:text-blue-300"
        : role === "superadmin"
          ? "text-purple-700 dark:text-purple-300"
          : "text-amber-700 dark:text-amber-300";
    return (
      <>
        <span
          className={`font-semibold ${actorColor}`}
          title={`Action by: ${actorName} (${role || "user"})`}
        >
          {actorName}
        </span>
        {targetIndex >= 0 ? (
          <>
            {remainder.slice(0, targetIndex)}
            <span
              className="font-semibold text-emerald-700 dark:text-emerald-300"
              title={`Affected employee: ${log.targetName}`}
            >
              {log.targetName}
            </span>
            {remainder.slice(targetIndex + log.targetName.length)}
          </>
        ) : (
          remainder
        )}
      </>
    );
  };

  const toggleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSelectPage = () => {
    const pageIds = logs.map((log) => log._id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !pageIds.includes(id))
        : [...new Set([...current, ...pageIds])]
    );
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
      toast.success(
        `${selectedIds.length} activity log${selectedIds.length === 1 ? "" : "s"} deleted`
      );
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
    const scopeMessage =
      from || to
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
    const actionMatches =
      actionFilter === "all" ||
      (actionFilter === "update"
        ? ["update", "edit"].includes(log.action)
        : log.action === actionFilter);
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
    ]
      .join(" ")
      .toLowerCase();
    return actionMatches && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  });

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(date, today))
      return `Today, ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
    if (sameDay(date, yesterday))
      return `Yesterday, ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
    return date
      .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase();
  };

  const getActionStyle = (action) => {
    if (action === "create" || action === "add") return "bg-emerald-500";
    if (action === "delete") return "bg-[#ef5b46]";
    if (action === "view") return "bg-gray-400";
    return "bg-blue-400";
  };

  const groupedLogs = visibleLogs.reduce((groups, log) => {
    const label = getDateLabel(log.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
    return groups;
  }, {});

  return (
    <div className="activity-logs-page space-y-5 rounded-2xl bg-[#f0f0f0] p-4 dark:bg-gray-950 sm:p-6">
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activity Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A readable history of who viewed, created, updated or deleted information.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => load(page)}
            disabled={loading}
            className="inline-flex h-10 flex-none items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-600 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800"
            >
              <FiTrash2 className={deleting ? "animate-pulse" : ""} />
              {deleting ? "Deleting..." : `Delete selected (${selectedIds.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={deleteAll}
            disabled={loading || deleting || pagination.total === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-600 dark:bg-gray-800 dark:text-red-300 dark:hover:bg-red-900/30"
            title="Delete all matching activity logs"
          >
            <FiTrash2 className={deleting ? "animate-pulse" : ""} />
            {deleting ? "Deleting..." : "Delete all"}
          </button>
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-4">
          <div className="flex items-center justify-between border-b border-r border-gray-200 px-5 py-5 sm:border-b-0 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
            <div>
              <span className="text-3xl font-medium">{pagination.total}</span>
              <p className="mt-1 text-xs text-gray-500">Total activities</p>
            </div>
          </div>
          {[
            { key: "create", label: "Created · this page", color: "text-emerald-600" },
            { key: "update", label: "Updated · this page", color: "text-blue-600" },
            { key: "delete", label: "Deleted · this page", color: "text-[#c55344]" },
          ].map((item) => {
            const count = logs.filter((log) =>
              item.key === "update"
                ? ["update", "edit"].includes(log.action)
                : log.action === item.key
            ).length;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between border-b border-r border-gray-200 px-5 py-5 sm:border-b-0 dark:border-gray-800 dark:bg-gray-900"
              >
                <div>
                  <span className={`text-3xl font-medium ${item.color}`}>{count}</span>
                  <p className="mt-1 text-xs text-gray-500">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1">
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

          <div className="flex shrink-0 items-end gap-3">
            <div className="min-w-0 flex-1 lg:w-80 lg:flex-none">
              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Date range
              </p>
              <DateRangePicker
                value={{ start: from, end: to }}
                onApply={({ start, end }) => {
                  setPage(1);
                  setFrom(start);
                  setTo(end);
                }}
                className="w-full [&>button]:!h-12 [&>button]:!w-full"
              />
            </div>
            <button
              type="button"
              onClick={clearRange}
              disabled={!from && !to}
              className="h-12 shrink-0 rounded-xl border border-gray-300 px-4 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              Clear dates
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="mt-2 flex w-full flex-wrap gap-2">
            {[
              ["all", "All"],
              ["create", "Created"],
              ["update", "Updated"],
              ["delete", "Deleted"],
              ["view", "Viewed"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActionFilter(value)}
                className={`h-11 shrink-0 rounded-xl border px-5 text-sm font-semibold ${actionFilter === value ? "border-[#f84525]/40 bg-[#fff5f2] text-[#d93a1e] dark:bg-orange-950/20 dark:text-orange-300" : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <CommonLoader
            text={deleting ? "Deleting activity logs..." : "Loading activity logs..."}
          />
        ) : visibleLogs.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No activity found for this date range.
          </p>
        ) : (
          <div className="p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{pagination.total} activities</span>
                <span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">HR</span> /{" "}
                  <span className="font-semibold text-purple-700 dark:text-purple-300">Admin</span>{" "}
                  = action by;{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    Employee / Team Lead
                  </span>{" "}
                  = action by
                </span>
                <span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Employee name
                  </span>{" "}
                  = action on
                </span>
              </div>
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
                <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                  {label}
                </h2>
                <div className="ml-3 space-y-4 border-l border-gray-200 dark:border-gray-700 sm:ml-4">
                  {grouped.map((log) => {
                    const action = log.action || "update";
                    const actorName =
                      log.actorName || log.actor?.name || log.actor?.email || "Unknown user";
                    const actorRole = log.actorRole || log.actor?.role || "Super admin";
                    const time = new Date(log.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <article key={log._id} className="relative flex gap-3 pl-6 sm:pl-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(log._id)}
                          onChange={() => toggleSelect(log._id)}
                          className="absolute -left-2 top-6 z-10 h-4 w-4 cursor-pointer rounded-full border-gray-300 bg-white accent-[#f84525] opacity-70 hover:opacity-100"
                          aria-label={`Select log from ${actorName}`}
                        />
                        <div
                          className={`pointer-events-none absolute -left-4 top-4 h-8 w-8 rounded-full ${getActionStyle(action)} opacity-20`}
                        />
                        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-none dark:border-gray-700 dark:bg-gray-800 sm:px-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 sm:text-base">
                                {renderActivitySentence(log)}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  {actionNames[action] || action}
                                </span>
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-orange-950/30 dark:text-orange-300">
                                  {(log.path || "").includes("/documents")
                                    ? "Documents"
                                    : (log.path || "").includes("/account-credentials")
                                      ? "Credentials"
                                      : moduleNames[log.module] || log.module || "System"}
                                </span>
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                  {actorRole}
                                </span>
                              </div>
                            </div>
                            <time className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                              {time}
                            </time>
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

      {!loading && (
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start gap-3 text-gray-600 dark:text-gray-400">
            <span>
              Showing {pagination.total === 0 ? 0 : (page - 1) * limit + 1}–
              {Math.min(page * limit, pagination.total)} of {pagination.total} activities
            </span>
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="w-full min-w-48 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#f84525] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-gray-600 dark:text-gray-400 sm:justify-end">
            <button
              type="button"
              onClick={() => changePage(page - 1)}
              disabled={page <= 1}
              className="rounded-xl border border-gray-300 px-3 py-1.5 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-400"
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
              .filter(
                (pageNumber) =>
                  pageNumber === 1 ||
                  pageNumber === pagination.totalPages ||
                  Math.abs(pageNumber - page) <= 1
              )
              .map((pageNumber, index, visiblePages) => (
                <span key={pageNumber} className="flex items-center">
                  {index > 0 && pageNumber - visiblePages[index - 1] > 1 && (
                    <span className="px-1 text-gray-400 dark:text-gray-500">…</span>
                  )}
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
              className="rounded-xl border border-gray-300 px-3 py-1.5 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
