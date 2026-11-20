import LeaveReviewDetails from "../../components/common/LeaveReviewDetails";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheckCircle, FiClock, FiEye, FiFileText, FiXCircle } from "react-icons/fi";
import { authApi, hrApi } from "../../api";
import Button from "../../components/common/Button";
import CalendarPicker from "../../components/common/CalendarPicker";
import CommonTable from "../../components/common/CommonTable";
import CustomDropdown from "../../components/common/CustomDropdown";
import { MetricCard, PageHeader, SectionCard } from "../../components/common/ReusableCards";
import TableToolbar from "../../components/common/TableToolbar";
import { AuthContext } from "../../contexts/AuthContext";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const formatDate = (value) => (value ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "-");
const formatDateTime = (value) => (value ? new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value)) : "-");
const labelize = (value = "") => value.replace(/_/g, " ");
const leaveBalanceTypes = [
  { value: "earned_leave", label: "Earned Leave" },
  { value: "sick_leave", label: "Sick Leave" },
  { value: "optional_leave", label: "Optional Leave" },
];

const LeaveReports = () => {
  const toast = useToast();
  const { confirm } = useModal();
  const { user } = useContext(AuthContext);
  const [moduleAccess, setModuleAccess] = useState({});
  const [accessLoaded, setAccessLoaded] = useState(user?.role !== "hr");
  const canView = user?.role === "superadmin" || (user?.role === "hr" && Boolean(moduleAccess.leaveReports?.view));
  const canReview = user?.role === "superadmin" || (user?.role === "hr" && Boolean(moduleAccess.leaveActions?.edit));
  const canAdjust = user?.role === "superadmin" || (user?.role === "hr" && accessLoaded && moduleAccess.leaveActions?.adjust === true);
  const canDelete = user?.role === "superadmin" || (user?.role === "hr" && accessLoaded && moduleAccess.leaveActions?.delete === true);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalItems: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const requestId = useRef(0);
  const [balanceEmployeeId, setBalanceEmployeeId] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [balanceDrawerOpen, setBalanceDrawerOpen] = useState(false);
  const [balanceData, setBalanceData] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("earned_leave");
  const [adjustmentDays, setAdjustmentDays] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentSaving, setAdjustmentSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== "hr") return undefined;
    let active = true;
    setAccessLoaded(false);
    authApi.getProfile().then((response) => {
      if (active) {
        setModuleAccess(response.data.data?.moduleAccess || {});
        setAccessLoaded(true);
      }
    }).catch(() => {
      if (active) {
        setModuleAccess({});
        setAccessLoaded(true);
      }
    });
    return () => { active = false; };
  }, [user?.role]);

  const loadData = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const leavesRes = await hrApi.getLeaves({
        date: selectedDate || undefined,
        employeeId: selectedEmployeeId || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: pageSize,
      });
      if (currentRequestId !== requestId.current) return;
      const responseLeaves = leavesRes.data.data || [];
      const term = debouncedSearch.trim().toLowerCase();
      const visibleLeaves = responseLeaves.filter((leave) => {
        const employee = leave.employee || {};
        const matchesEmployee = !selectedEmployeeId || String(employee._id) === String(selectedEmployeeId);
        const matchesStatus = !status || leave.status === status;
        const from = String(leave.fromDate || "").slice(0, 10);
        const to = String(leave.toDate || leave.fromDate || "").slice(0, 10);
        const matchesDate = !selectedDate || (from <= selectedDate && to >= selectedDate);
        const haystack = [employee.name, employee.employeeId, employee.email, leave.type, leave.title, leave.content, leave.reason].filter(Boolean).join(" ").toLowerCase();
        return matchesEmployee && matchesStatus && matchesDate && (!term || haystack.includes(term));
      });
      setLeaves(visibleLeaves);
      const filteredSummary = visibleLeaves.reduce((result, leave) => { result.total += 1; if (leave.status === "pending") result.pending += 1; if (leave.status === "approved") result.approved += 1; if (leave.status === "rejected") result.rejected += 1; return result; }, { total: 0, pending: 0, approved: 0, rejected: 0 });
      setSummary(filteredSummary);
      setPagination(leavesRes.data.pagination || { page: 1, limit: pageSize, totalItems: 0, totalPages: 1 });
    } catch (err) {
      if (currentRequestId !== requestId.current) return;
      const message = err.response?.data?.message || "Unable to load leave reports";
      setLeaves([]);
      setSummary({ total: 0, pending: 0, approved: 0, rejected: 0 });
      setPagination({ page: 1, limit: pageSize, totalItems: 0, totalPages: 1 });
      setError(message);
      toast.error(message);
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, selectedDate, selectedEmployeeId, status, toast]);

  useEffect(() => {
    hrApi.getEmployees()
      .then((response) => setEmployees(response.data.data || []))
      .catch((err) => toast.error(err.response?.data?.message || "Unable to load employees"));
  }, [toast]);

  useEffect(() => {
    if (!balanceEmployeeId) {
      setBalanceData(null);
      return undefined;
    }
    let active = true;
    setBalanceData(null);
    setBalanceLoading(true);
    hrApi.getEmployeeLeaveBalance(balanceEmployeeId)
      .then((response) => {
        if (active) setBalanceData(response.data.data || null);
      })
      .catch((err) => {
        if (active) {
          setBalanceData(null);
          toast.error(err.response?.data?.message || "Unable to load employee leaves");
        }
      })
      .finally(() => {
        if (active) setBalanceLoading(false);
      });
    return () => { active = false; };
  }, [balanceEmployeeId, toast]);

  useEffect(() => {
    if (balanceDrawerOpen || !balanceEmployeeId) return undefined;
    const timer = window.setTimeout(() => setBalanceEmployeeId(""), 300);
    return () => window.clearTimeout(timer);
  }, [balanceDrawerOpen, balanceEmployeeId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [selectedDate, selectedEmployeeId, status, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const leavePagination = useMemo(() => ({
    page: pagination.page,
    pageSize: pagination.limit,
    setPage,
    setPageSize: (nextSize) => {
      setPageSize(Number(nextSize));
      setPage(1);
    },
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  }), [pagination]);

  const reviewLeave = async (leaveId, nextStatus) => {
    const leave = leaves.find((item) => item._id === leaveId);
    if (!leave || leave.status !== "pending") return;

    const approved = nextStatus === "approved";
    const confirmation = await confirm({
      title: `${approved ? "Approve" : "Reject"} leave request?`,
      message: `${leave.employee?.name || "This employee"} · ${labelize(leave.type)} · ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)}. Confirm you want to ${approved ? "approve" : "reject"} this request.`,
      confirmText: approved ? "Approve request" : "Reject request",
      cancelText: "Cancel",
      tone: approved ? "primary" : "danger",
    });
    if (!confirmation) return;

    setUpdatingId(leaveId);
    try {
      await hrApi.reviewLeave(leaveId, { status: nextStatus });
      toast.success(`Leave ${nextStatus}`);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update leave");
    } finally {
      setUpdatingId("");
    }
  };

  const deleteLeave = async () => {
    if (!selectedLeave) return;
    const confirmed = await confirm({ title: "Delete leave request?", message: "This leave request will be permanently deleted.", confirmText: "Delete request", cancelText: "Cancel", tone: "danger" });
    if (!confirmed) return;
    setUpdatingId(selectedLeave._id);
    try { await hrApi.deleteLeave(selectedLeave._id); toast.success("Leave request deleted"); setLeaves((current) => current.filter((item) => item._id !== selectedLeave._id)); setSummary((current) => ({ ...current, total: Math.max(0, current.total - 1), pending: selectedLeave.status === "pending" ? Math.max(0, current.pending - 1) : current.pending, approved: selectedLeave.status === "approved" ? Math.max(0, current.approved - 1) : current.approved, rejected: selectedLeave.status === "rejected" ? Math.max(0, current.rejected - 1) : current.rejected })); closeBalanceModal(); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || "Unable to delete leave"); }
    finally { setUpdatingId(""); }
  };

  const submitBalanceAdjustment = async (event) => {
    event.preventDefault();
    const days = Number(adjustmentDays);
    if (!balanceEmployeeId || !Number.isFinite(days) || days === 0 || !adjustmentReason.trim()) {
      toast.error("Select an employee, enter a non-zero day adjustment, and add a reason.");
      return;
    }
    const employeeName = balanceData?.employee?.name || "the selected employee";
    const typeLabel = leaveBalanceTypes.find((item) => item.value === adjustmentType)?.label || adjustmentType;
    const confirmed = await confirm({
      title: "Confirm leave adjustment",
      message: `${employeeName}: ${days > 0 ? "add" : "deduct"} ${Math.abs(days)} day(s) from ${typeLabel}? Reason: ${adjustmentReason.trim()}`,
      confirmText: "Save adjustment",
      cancelText: "Cancel",
      tone: days < 0 ? "danger" : "primary",
    });
    if (!confirmed) return;

    setAdjustmentSaving(true);
    try {
      const response = await hrApi.adjustEmployeeLeaveBalance(balanceEmployeeId, {
        type: adjustmentType,
        days,
        reason: adjustmentReason.trim(),
      });
      setBalanceData(response.data.data || null);
      setAdjustmentDays("");
      setAdjustmentReason("");
      toast.success("Employee leaves adjusted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to adjust employee leaves");
    } finally {
      setAdjustmentSaving(false);
    }
  };

  const resetFilters = () => {
    setSelectedDate("");
    setSelectedEmployeeId("");
    setStatus("");
    setSearch("");
    setPage(1);
  };

  const openBalanceModal = (leave) => {
    const employeeId = leave.employee?._id || "";
    if (!employeeId) {
      toast.error("Employee information is unavailable for this leave request.");
      return;
    }
    setAdjustmentType("earned_leave");
    setAdjustmentDays("");
    setAdjustmentReason("");
    setBalanceDrawerOpen(false);
    setSelectedLeave(leave);
    setBalanceEmployeeId(employeeId);
    window.requestAnimationFrame(() => setBalanceDrawerOpen(true));
  };

  const closeBalanceModal = () => {
    if (adjustmentSaving) return;
    setBalanceDrawerOpen(false);
    setAdjustmentDays("");
    setAdjustmentReason("");
    setSelectedLeave(null);
  };

  const columns = [
    { accessor: "employeeId", header: "Employee ID", render: (_, leave) => leave.employee?.employeeId || "-" },
    {
      accessor: "employee",
      header: "Employee",
      render: (_, leave) => (
        <div className="min-w-32">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{leave.employee?.name || "N/A"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{leave.employee?.email || "-"}</p>
        </div>
      ),
    },
    { accessor: "type", header: "Leave Type", render: (value) => <span className="capitalize">{labelize(value)}</span> },
    { accessor: "title", header: "Title", render: (value) => value || "Leave Request" },
    { accessor: "fromDate", header: "From", render: formatDate },
    { accessor: "toDate", header: "To", render: formatDate },
    { accessor: "createdAt", header: "Requested", render: formatDateTime },
    { accessor: "content", header: "Reason", render: (value, leave) => <span className="line-clamp-3 min-w-40">{value || leave.reason || "-"}</span> },
    {
      accessor: "attachment",
      header: "Attachment",
      render: (attachment) => attachment?.url ? (
        <button type="button" onClick={() => setAttachmentPreview(attachment)} className="font-medium text-[#f84525] underline">View</button>
      ) : "-",
    },
    {
      accessor: "status",
      header: "Status",
      render: (value) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
          value === "approved" ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" :
            value === "rejected" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" :
              "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        }`}>{value || "Unknown"}</span>
      ),
    },
  ];
  const actions = canView ? [
    { key: "leaves", label: "View employee leaves", icon: <FiEye className="h-4 w-4" />, iconOnly: true, title: "View employee leaves", onClick: openBalanceModal, className: "border border-[#f84525]/30 bg-[#fff5f3] text-[#d93a1e] hover:bg-[#ffebe6] dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300 dark:hover:bg-orange-950/60" },
  ] : undefined;

  return (
    <div className="space-y-3 p-2 sm:space-y-4">
      {attachmentPreview && createPortal(<div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4" onClick={() => setAttachmentPreview(null)}><div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-4 dark:bg-gray-900" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Leave Attachment</h2><button type="button" onClick={() => setAttachmentPreview(null)} className="text-xl">×</button></div>{attachmentPreview.type === "application/pdf" || attachmentPreview.url.toLowerCase().includes(".pdf") ? <iframe title="Leave attachment" src={attachmentPreview.url} className="h-[78vh] w-full rounded border" /> : <img src={attachmentPreview.url} alt={attachmentPreview.name || "Leave attachment"} className="max-h-[78vh] w-full object-contain" />}<a href={attachmentPreview.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-[#f84525] underline">Open in new tab</a></div></div>, document.body)}
      <PageHeader
        title="Leave Reports"
        description="Review employee leave requests by date, employee, and status."
        actions={<Button text="Reset filters" variant="secondary" onClick={resetFilters} className="min-h-10 whitespace-nowrap" />}
      />

      <SectionCard className="overflow-visible">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CalendarPicker value={selectedDate} onChange={setSelectedDate} label="Date" labelClassName="text-sm font-medium text-gray-700 dark:text-gray-200" timeZone="Asia/Kolkata" />
          <CustomDropdown
            label="Employee"
            labelClassName="text-sm font-medium text-gray-700 dark:text-gray-200"
            buttonClassName="min-h-10"
            value={selectedEmployeeId}
            onChange={setSelectedEmployeeId}
            placeholder="All employees"
            options={employees.map((employee) => ({ value: employee._id, label: `${employee.employeeId || "-"} - ${employee.name || "Unnamed employee"}` }))}
            searchable
          />
          <CustomDropdown
            label="Status"
            labelClassName="text-sm font-medium text-gray-700 dark:text-gray-200"
            buttonClassName="min-h-10"
            value={status}
            onChange={setStatus}
            placeholder="All statuses"
            options={[{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]}
          />
          <div className="flex items-end">
            <Button text="Clear date" variant="secondary" onClick={() => setSelectedDate("")} disabled={!selectedDate} className="min-h-10 w-full" />
          </div>
        </div>
      </SectionCard>

      {balanceEmployeeId && createPortal((
        <div className={`fixed inset-0 z-[120] bg-gray-950/45 transition-opacity duration-300 ease-in-out ${balanceDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onMouseDown={closeBalanceModal}>
          <section role="dialog" aria-modal="true" aria-labelledby="employee-leaves-title" onMouseDown={(event) => event.stopPropagation()} className={`absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900 ${balanceDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div>
                <h2 id="employee-leaves-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Employee Leaves</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{balanceData?.employee?.name || leaves.find((leave) => leave.employee?._id === balanceEmployeeId)?.employee?.name || "Loading employee leaves..."} · Used and available leave by type.</p>
              </div>
              <button type="button" onClick={closeBalanceModal} disabled={adjustmentSaving} aria-label="Close employee leaves" className="rounded-md px-2 py-1 text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-white">×</button>

            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {selectedLeave && <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800"><h3 className="font-semibold text-gray-900 dark:text-gray-100">Leave request details</h3><div className="mt-3 grid grid-cols-2 gap-3"><p><span className="text-gray-500">Type</span><br /><b>{labelize(selectedLeave.type)}</b></p><p><span className="text-gray-500">Status</span><br /><b className="capitalize">{selectedLeave.status}</b></p><p><span className="text-gray-500">From</span><br /><b>{formatDate(selectedLeave.fromDate)}</b></p><p><span className="text-gray-500">To</span><br /><b>{formatDate(selectedLeave.toDate)}</b></p></div>{(selectedLeave.reason || selectedLeave.content) && <p className="mt-3"><span className="text-gray-500">Reason</span><br />{selectedLeave.reason || selectedLeave.content}</p>}</div>}
        {balanceLoading && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading employee leaves...</p>}
        {!balanceLoading && !balanceData && <p className="py-8 text-center text-sm text-gray-500">Employee leaves could not be loaded.</p>}
        {balanceData && !balanceLoading && (
          <>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {leaveBalanceTypes.map(({ value, label }) => {
                const item = balanceData.balance?.[value] || { total: 0, used: 0, remaining: 0 };
                const usagePercent = item.total > 0 ? Math.min(100, Math.max(0, (item.used / item.total) * 100)) : 0;
                return (
                  <article key={value} className="min-w-0 rounded-sm border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{item.remaining}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                    <p className="mt-3 text-xs tabular-nums text-gray-500 dark:text-gray-400">{item.used} / {item.total} used</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"><div className="h-full rounded-full bg-[#f84525]" style={{ width: `${usagePercent}%` }} /></div>
                  </article>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Urgent Leave, Half Day (0.5 day), and Full Day requests are deducted from Earned Leave.</p>

            {canAdjust && (
              <form onSubmit={submitBalanceAdjustment} className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 md:grid-cols-2 xl:grid-cols-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Leave type
                  <CustomDropdown
                    className="mt-1"
                    buttonClassName="min-h-10"
                    value={adjustmentType}
                    onChange={setAdjustmentType}
                    options={leaveBalanceTypes}
                    searchable={false}
                    showPlaceholder={false}
                    portalMenu
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Adjust days
                  <input
                    type="number"
                    step="0.5"
                    min="-365"
                    max="365"
                    value={adjustmentDays}
                    onChange={(event) => setAdjustmentDays(event.target.value)}
                    placeholder="e.g. 2 or -1"
                    className="mt-1 min-h-10 w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 xl:col-span-1">
                  Reason
                  <input
                    value={adjustmentReason}
                    onChange={(event) => setAdjustmentReason(event.target.value)}
                    maxLength={500}
                    placeholder="Why are you adjusting these leaves?"
                    className="mt-1 min-h-10 w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                </label>
                <div className="flex items-end">
                  <Button
                    text="Adjust leaves"
                    type="submit"
                    loading={adjustmentSaving}
                    disabled={!balanceEmployeeId || balanceLoading}
                    className="min-h-10 w-full whitespace-nowrap"
                  />
                </div>
              </form>
            )}

            {canAdjust && <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800"><h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Leave adjustments</h3>{balanceData.adjustments?.length > 0 ? <div className="mt-2 space-y-2">{balanceData.adjustments.map((item, index) => <div key={`${item._id || item.adjustedAt}-${index}`} className="flex flex-col gap-1 rounded-sm border border-gray-100 px-3 py-2 text-xs dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"><span className="font-medium capitalize text-gray-800 dark:text-gray-100">{item.days > 0 ? "+" : ""}{item.days} days · {labelize(item.type)}</span><span className="text-gray-500 dark:text-gray-400">{item.adjustedBy?.name || item.adjustedBy?.email || "HR"} · {item.reason} · {formatDateTime(item.adjustedAt)}</span></div>)}</div> : <p className="mt-2 text-sm text-gray-500">No leave adjustments yet.</p>}</div>}
            <LeaveReviewDetails leave={selectedLeave} />

            {false && (
              <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Recent leave adjustments</h3>
                <div className="mt-2 space-y-2">
                  {balanceData.adjustments.map((item, index) => (
                    <div key={`${item._id || item.adjustedAt}-${index}`} className="flex flex-col gap-1 rounded-sm border border-gray-100 px-3 py-2 text-xs dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium capitalize text-gray-800 dark:text-gray-100">{item.days > 0 ? "+" : ""}{item.days} days · {labelize(item.type)}</span>
                      <span className="text-gray-500 dark:text-gray-400">{item.adjustedBy?.name || item.adjustedBy?.email || "HR"} · {item.reason} · {formatDateTime(item.adjustedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
            </div>
            {((canReview && selectedLeave?.status === "pending") || canDelete) && <footer className="flex shrink-0 justify-end border-t border-gray-100 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900"><div className="flex gap-2">{canReview && selectedLeave?.status === "pending" && <><Button text="Approve" onClick={() => reviewLeave(selectedLeave._id, "approved")} disabled={updatingId === selectedLeave._id} className="!bg-green-600 hover:!bg-green-700" /><Button text="Reject" onClick={() => reviewLeave(selectedLeave._id, "rejected")} disabled={updatingId === selectedLeave._id} className="!bg-red-600 hover:!bg-red-700" /></>}{canDelete && <Button text="Delete" onClick={deleteLeave} disabled={updatingId === selectedLeave?._id} className="!bg-red-700 hover:!bg-red-800" />}</div></footer>}
          </section>
        </div>
      ), document.body)}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Requests", value: summary.total, icon: <FiFileText /> },
          { label: "Pending", value: summary.pending, icon: <FiClock />, iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300" },
          { label: "Approved", value: summary.approved, icon: <FiCheckCircle />, iconClassName: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300" },
          { label: "Rejected", value: summary.rejected, icon: <FiXCircle />, iconClassName: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300" },
        ].map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <SectionCard title="Leave Requests" subtitle={selectedDate ? `Requests overlapping ${formatDate(selectedDate)}.` : "All leave requests matching the selected filters."}>
        <CommonTable
          columns={columns}
          data={leaves}
          actions={actions}
          actionsLayout="stack"
          pagination={leavePagination}
          loading={loading}
          error={error}
          errorAction={<Button text="Retry" onClick={loadData} className="!py-1.5" />}
          emptyText="No leave requests match the selected filters."
          toolbar={(
            <TableToolbar
              value={search}
              onChange={setSearch}
              label="Search leave requests"
              placeholder="Employee, ID, leave type, title..."
              summary={`${pagination.totalItems} request${pagination.totalItems === 1 ? "" : "s"}`}
              loading={loading}
              loadingText="Updating..."
            />
          )}
        />
      </SectionCard>
    </div>
  );
};

export default LeaveReports;
