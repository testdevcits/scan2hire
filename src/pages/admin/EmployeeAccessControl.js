import { useCallback, useEffect, useMemo, useState } from "react";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const EmployeeAccessControl = () => {
  const toast = useToast();
  const { confirm } = useModal();
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
    const ok = await confirm({
      title: allowed ? "Allow System Access" : "Remove System Access",
      message: `Are you sure you want to ${allowed ? "allow" : "remove"} system allotment access for ${selectedRow?.employee?.name || "this employee"}?`,
      confirmText: allowed ? "Allow" : "Remove",
      tone: allowed ? "primary" : "danger",
    });
    if (!ok) return;
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

  const setTeamLead = async (allowed) => {
    if (!selectedEmployeeId) {
      toast.error("Select an employee first");
      return;
    }
    const ok = await confirm({
      title: allowed ? "Make Team Lead" : "Remove Team Lead",
      message: `Are you sure you want to ${allowed ? "make" : "remove"} ${selectedRow?.employee?.name || "this employee"} ${allowed ? "a Team Lead" : "from Team Lead"}?`,
      confirmText: allowed ? "Make TL" : "Remove TL",
      tone: allowed ? "primary" : "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await hrApi.updateEmployeeAccess(selectedEmployeeId, {
        isTeamLead: allowed,
        modules: { systemAllotment: allowed || Boolean(selectedRow?.modules?.systemAllotment) },
      });
      toast.success(allowed ? "Employee is now Team Lead" : "Team Lead access removed");
      await loadAccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update Team Lead access");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CommonLoader text="Loading Team Lead access..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage TL</h1>
        <p className="text-sm text-gray-500 mt-1">Select an employee and make them Team Lead. Team Leads get the full HR panel access except Manage HR.</p>
      </section>

      <section className="bg-white rounded-sm shadow p-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px] gap-3">
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
        <div className="grid grid-cols-2 gap-2 items-end">
          <Button
            text="Make TL"
            onClick={() => setTeamLead(true)}
            loading={saving}
            disabled={!selectedEmployeeId || selectedRow?.isTeamLead}
            className="w-full"
          />
          <Button
            text="Remove TL"
            variant="secondary"
            onClick={() => setTeamLead(false)}
            loading={saving}
            disabled={!selectedEmployeeId || !selectedRow?.isTeamLead}
            className="w-full"
          />
          <Button
            text="Allow System"
            onClick={() => setSystemAccess(true)}
            loading={saving}
            disabled={!selectedEmployeeId || selectedRow?.modules?.systemAllotment}
            className="w-full"
          />
          <Button
            text="Remove System"
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-gray-50 px-4 py-3 text-xs uppercase font-semibold text-gray-600">
          <span>ID</span><span>Employee</span><span>Department</span><span>Role</span><span>System Allotment</span><span>Updated</span>
        </div>
        {filteredRows.map((row) => (
          <button
            type="button"
            key={row.employee?._id}
            onClick={() => setSelectedEmployeeId(row.employee?._id)}
            className={`grid grid-cols-1 md:grid-cols-6 gap-2 border-t px-4 py-3 text-sm text-left md:items-center hover:bg-gray-50 ${
              selectedEmployeeId === row.employee?._id ? "bg-[#fff5f3]" : "bg-white"
            }`}
          >
            <span>{row.employee?.employeeId || "-"}</span>
            <span className="font-medium">{row.employee?.name || "N/A"}</span>
            <span>{row.employee?.department || "-"}</span>
            <span className={row.isTeamLead ? "text-blue-700 font-semibold" : "text-gray-500 font-semibold"}>
              {row.isTeamLead ? "Team Lead" : "Employee"}
            </span>
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
