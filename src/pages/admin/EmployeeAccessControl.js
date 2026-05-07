import { useCallback, useEffect, useMemo, useState } from "react";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const EmployeeAccessControl = () => {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAccess = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.getEmployeeAccess();
      setRows(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load access");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  const selectedRow = rows.find((row) => row.employee?._id === selectedEmployeeId);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.employee?.name, row.employee?.employeeId, row.employee?.email, row.employee?.department, row.employee?.designation]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [rows, search]);

  const setSystemAccess = async (allowed) => {
    if (!selectedEmployeeId) {
      toast.error("Select an employee first");
      return;
    }
    setSaving(true);
    try {
      await hrApi.updateEmployeeAccess(selectedEmployeeId, {
        modules: { systemAllotment: allowed },
      });
      toast.success(allowed ? "System allotment access allowed" : "System allotment access removed");
      await loadAccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update access");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CommonLoader text="Loading access control..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <h1 className="text-2xl font-bold text-gray-900">Employee Access Control</h1>
        <p className="text-sm text-gray-500 mt-1">Select employee and allow access for system allotment work.</p>
      </section>

      <section className="bg-white rounded-sm shadow p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3">
        <label className="text-sm font-medium text-gray-700">
          Employee
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
          >
            <option value="">Select employee</option>
            {rows.map((row) => (
              <option key={row.employee?._id} value={row.employee?._id}>
                {row.employee?.employeeId || "-"} - {row.employee?.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button
            text="Allow Access"
            onClick={() => setSystemAccess(true)}
            loading={saving}
            disabled={!selectedEmployeeId || selectedRow?.modules?.systemAllotment}
            className="w-full"
          />
          <Button
            text="Remove"
            variant="secondary"
            onClick={() => setSystemAccess(false)}
            loading={saving}
            disabled={!selectedEmployeeId || !selectedRow?.modules?.systemAllotment}
          />
        </div>
      </section>

      <section className="bg-white rounded-sm shadow p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee by name, ID, email"
          className="w-full border border-gray-300 rounded-sm px-3 py-2"
        />
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 px-4 py-3 text-xs uppercase font-semibold text-gray-600">
          <span>ID</span><span>Employee</span><span>Department</span><span>System Allotment</span><span>Updated</span>
        </div>
        {filteredRows.map((row) => (
          <button
            type="button"
            key={row.employee?._id}
            onClick={() => setSelectedEmployeeId(row.employee?._id)}
            className={`grid grid-cols-1 md:grid-cols-5 gap-2 border-t px-4 py-3 text-sm text-left md:items-center hover:bg-gray-50 ${
              selectedEmployeeId === row.employee?._id ? "bg-[#fff5f3]" : "bg-white"
            }`}
          >
            <span>{row.employee?.employeeId || "-"}</span>
            <span className="font-medium">{row.employee?.name || "N/A"}</span>
            <span>{row.employee?.department || "-"}</span>
            <span className={row.modules?.systemAllotment ? "text-green-600 font-semibold" : "text-gray-500 font-semibold"}>
              {row.modules?.systemAllotment ? "Allowed" : "Not allowed"}
            </span>
            <span>{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"}</span>
          </button>
        ))}
      </section>
    </div>
  );
};

export default EmployeeAccessControl;
