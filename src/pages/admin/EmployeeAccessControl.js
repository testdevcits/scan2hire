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
  const [roleFilter, setRoleFilter] = useState("all");
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
    return rows.filter((row) => {
      if (roleFilter === "tl" && !row.isTeamLead) return false;
      if (roleFilter === "system" && !row.modules?.systemAllotment) return false;
      if (roleFilter === "employee" && (row.isTeamLead || row.modules?.systemAllotment)) return false;
      if (!term) return true;
      return [row.employee?.name, row.employee?.employeeId, row.employee?.email, row.employee?.department, row.employee?.designation]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [roleFilter, rows, search]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      teamLeads: rows.filter((row) => row.isTeamLead).length,
      systemAccess: rows.filter((row) => row.modules?.systemAllotment).length,
      employees: rows.filter((row) => !row.isTeamLead && !row.modules?.systemAllotment).length,
    }),
    [rows]
  );

  const selectedName = selectedRow?.employee?.name || "Selected employee";

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
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage TL</h1>
            <p className="text-sm text-gray-500 mt-1">Make any employee a Team Lead, or give only system allotment access without making them TL.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ["Employees", stats.total, "bg-gray-900 text-white"],
              ["Team Leads", stats.teamLeads, "bg-blue-50 text-blue-700 border border-blue-200"],
              ["System Access", stats.systemAccess, "bg-green-50 text-green-700 border border-green-200"],
              ["Normal", stats.employees, "bg-gray-100 text-gray-700 border border-gray-200"],
            ].map(([label, value, className]) => (
              <div key={label} className={`px-3 py-2 rounded-sm text-sm font-semibold ${className}`}>
                <span className="block text-xs opacity-80">{label}</span>
                <span className="text-lg leading-5">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4">
        <div className="bg-white rounded-sm shadow p-4 space-y-4">
          <label className="text-sm font-medium text-gray-700">
            Select Employee
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

          <div className="border border-gray-200 rounded-sm p-4 bg-gray-50 min-h-[142px]">
            {selectedRow ? (
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedName}</h2>
                    <p className="text-sm text-gray-500">{selectedRow.employee?.employeeId || "-"} | {selectedRow.employee?.email || "-"}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedRow.employee?.department || "No department"} | {selectedRow.employee?.designation || "No designation"}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold border ${selectedRow.isTeamLead ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {selectedRow.isTeamLead ? "Team Lead" : "Employee"}
                    </span>
                    <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold border ${selectedRow.modules?.systemAllotment ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      System {selectedRow.modules?.systemAllotment ? "Allowed" : "Blocked"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {selectedRow.isTeamLead
                    ? "This employee can use the Team Lead panel with HR-style access."
                    : selectedRow.modules?.systemAllotment
                    ? "This employee can access system allotments only."
                    : "This employee has normal employee access."}
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center">
                <h2 className="font-semibold text-gray-900">No employee selected</h2>
                <p className="text-sm text-gray-500 mt-1">Choose an employee from dropdown or click a row from the list.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Actions</h2>
            <p className="text-xs text-gray-500 mt-1">TL access is full. System access is only for allotment work.</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Team Lead Access</h3>
              <div className="grid grid-cols-2 gap-2">
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
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">System Allotment Access</h3>
              <div className="grid grid-cols-2 gap-2">
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
                  disabled={!selectedEmployeeId || !selectedRow?.modules?.systemAllotment || selectedRow?.isTeamLead}
                  className="w-full"
                />
              </div>
              {selectedRow?.isTeamLead && (
                <p className="text-xs text-gray-500 mt-2">System access stays enabled while employee is Team Lead.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee by name, ID, email"
            className="w-full border border-gray-300 rounded-sm px-3 py-2"
          />
          <div className="grid grid-cols-4 gap-1 bg-white border border-gray-200 p-1 rounded-sm">
            {[
              ["all", "All"],
              ["tl", "TL"],
              ["system", "System"],
              ["employee", "Normal"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRoleFilter(value)}
                className={`px-3 py-2 text-xs font-semibold rounded-sm ${roleFilter === value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[120px_minmax(0,1.4fr)_minmax(0,1fr)_220px_160px] gap-2 bg-gray-100 px-4 py-3 text-xs uppercase font-semibold text-gray-600">
          <span>ID</span><span>Employee</span><span>Department</span><span>Access</span><span>Updated</span>
        </div>
        {filteredRows.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No employees found.</p>
        ) : filteredRows.map((row) => (
          <button
            type="button"
            key={row.employee?._id}
            onClick={() => setSelectedEmployeeId(row.employee?._id)}
            className={`grid grid-cols-1 lg:grid-cols-[120px_minmax(0,1.4fr)_minmax(0,1fr)_220px_160px] gap-2 border-t px-4 py-3 text-sm text-left lg:items-center hover:bg-gray-50 ${
              selectedEmployeeId === row.employee?._id ? "bg-[#fff5f3]" : "bg-white"
            }`}
          >
            <span>{row.employee?.employeeId || "-"}</span>
            <span>
              <span className="block font-medium">{row.employee?.name || "N/A"}</span>
              <span className="block text-xs text-gray-500 break-all">{row.employee?.email || "-"}</span>
            </span>
            <span>
              <span className="block">{row.employee?.department || "-"}</span>
              <span className="block text-xs text-gray-500">{row.employee?.designation || "-"}</span>
            </span>
            <span className="flex gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold border ${row.isTeamLead ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                {row.isTeamLead ? "TL" : "Employee"}
              </span>
              <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold border ${row.modules?.systemAllotment ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                System {row.modules?.systemAllotment ? "Allowed" : "Blocked"}
              </span>
            </span>
            <span>{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"}</span>
          </button>
        ))}
      </section>
    </div>
  );
};

export default EmployeeAccessControl;
