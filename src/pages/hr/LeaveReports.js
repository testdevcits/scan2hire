import { useCallback, useEffect, useMemo, useState } from "react";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const getYesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");
const labelize = (value = "") => value.replace(/_/g, " ");

const LeaveReports = () => {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(getYesterdayKey());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [employeesRes, leavesRes] = await Promise.all([
        hrApi.getEmployees(),
        hrApi.getLeaves({
          date: selectedDate,
          employeeId: selectedEmployeeId || undefined,
          status: status || undefined,
          search: search.trim() || undefined,
        }),
      ]);
      setEmployees(employeesRes.data.data || []);
      setLeaves(leavesRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load leave reports");
    } finally {
      setLoading(false);
    }
  }, [search, selectedDate, selectedEmployeeId, status, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(
    () => ({
      total: leaves.length,
      pending: leaves.filter((leave) => leave.status === "pending").length,
      approved: leaves.filter((leave) => leave.status === "approved").length,
      rejected: leaves.filter((leave) => leave.status === "rejected").length,
    }),
    [leaves]
  );

  const reviewLeave = async (leaveId, nextStatus) => {
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

  const resetFilters = () => {
    setSelectedDate(getYesterdayKey());
    setSelectedEmployeeId("");
    setStatus("");
    setSearch("");
  };

  if (loading) return <CommonLoader text="Loading leave reports..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leave Reports</h1>
            <p className="text-sm text-gray-500 mt-1">
              Default view shows only last day. Select a date to see that day&apos;s leave report.
            </p>
          </div>
          <Button text="Reset Filters" variant="secondary" onClick={resetFilters} />
        </div>
      </section>

      <section className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <label className="text-sm font-medium text-gray-700">
          Date
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium text-gray-700 md:col-span-2">
          Employee
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.employeeId || "-"} - {employee.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
          >
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, ID, type"
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
          />
        </label>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Total", summary.total],
          ["Pending", summary.pending],
          ["Approved", summary.approved],
          ["Rejected", summary.rejected],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-sm shadow p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-[#f84525]">{value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="hidden md:grid grid-cols-9 bg-gray-100 text-xs uppercase text-gray-600 font-semibold">
          {["ID", "Employee", "Type", "Title", "From", "To", "Reason", "Status", "Actions"].map((item) => (
            <div key={item} className="px-4 py-3">{item}</div>
          ))}
        </div>
        {leaves.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No leave requests found for selected date.</p>
        ) : (
          leaves.map((leave) => (
            <div key={leave._id} className="grid grid-cols-1 md:grid-cols-9 gap-2 border-t px-4 py-3 text-sm md:items-center">
              <span>{leave.employee?.employeeId || "-"}</span>
              <span className="font-medium">{leave.employee?.name || "N/A"}</span>
              <span className="capitalize">{labelize(leave.type)}</span>
              <span>{leave.title || "Leave Request"}</span>
              <span>{formatDate(leave.fromDate)}</span>
              <span>{formatDate(leave.toDate)}</span>
              <span className="break-words">{leave.content || leave.reason || "-"}</span>
              <span className="font-semibold capitalize">{leave.status}</span>
              <span className="flex gap-2 flex-wrap">
                <Button
                  text="Approve"
                  variant="success"
                  onClick={() => reviewLeave(leave._id, "approved")}
                  loading={updatingId === leave._id}
                  disabled={leave.status !== "pending"}
                  className="text-xs px-3 py-1.5"
                />
                <Button
                  text="Reject"
                  variant="danger"
                  onClick={() => reviewLeave(leave._id, "rejected")}
                  loading={updatingId === leave._id}
                  disabled={leave.status !== "pending"}
                  className="text-xs px-3 py-1.5"
                />
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default LeaveReports;
