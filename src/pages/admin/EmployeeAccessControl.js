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
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState("");
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAccess = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.getEmployeeAccess();
      const list = [...(res.data.data || [])].sort((a, b) =>
        String(a.employee?.name || "").localeCompare(String(b.employee?.name || ""))
      );
      setRows(list);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load Team Lead data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  const teamLeads = useMemo(() => rows.filter((row) => row.isTeamLead), [rows]);
  const employees = useMemo(() => rows.filter((row) => !row.isTeamLead), [rows]);
  const selectedEmployee = rows.find((row) => row.employee?._id === selectedEmployeeId);
  const selectedTeamLead = teamLeads.find((row) => row.employee?._id === selectedTeamLeadId);

  useEffect(() => {
    if (!selectedTeamLeadId) {
      setAssignedEmployeeIds([]);
      return;
    }
    setAssignedEmployeeIds(
      employees
        .filter((row) => String(row.teamLead?._id || row.teamLead) === selectedTeamLeadId)
        .map((row) => row.employee?._id)
        .filter(Boolean)
    );
  }, [employees, selectedTeamLeadId]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((row) => {
      if (!term) return true;
      return [
        row.employee?.name,
        row.employee?.employeeId,
        row.employee?.email,
        row.employee?.department,
        row.employee?.designation,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [employees, search]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      teamLeads: teamLeads.length,
      assigned: employees.filter((row) => row.teamLead).length,
      unassigned: employees.filter((row) => !row.teamLead).length,
    }),
    [employees, rows.length, teamLeads.length]
  );

  const toggleEmployee = (employeeId) => {
    setAssignedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    );
  };

  const selectVisible = () => {
    const visibleIds = filteredEmployees
      .map((row) => row.employee?._id)
      .filter((employeeId) => employeeId && employeeId !== selectedTeamLeadId);
    setAssignedEmployeeIds((current) => [...new Set([...current, ...visibleIds])]);
  };

  const clearVisible = () => {
    const visibleIds = new Set(
      filteredEmployees
        .map((row) => row.employee?._id)
        .filter((employeeId) => employeeId && employeeId !== selectedTeamLeadId)
    );
    setAssignedEmployeeIds((current) => current.filter((id) => !visibleIds.has(id)));
  };

  const saveAssignments = async () => {
    if (!selectedTeamLeadId) {
      toast.error("Select Team Lead first");
      return;
    }

    const ok = await confirm({
      title: "Assign Employees",
      message: `Assign ${assignedEmployeeIds.length} employee(s) to ${
        selectedTeamLead?.employee?.name || "this Team Lead"
      }? Existing employees under this TL will be replaced by this selected list.`,
      confirmText: "Assign",
      tone: "primary",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await hrApi.assignTeamLeadEmployees(selectedTeamLeadId, {
        employeeIds: assignedEmployeeIds,
      });
      toast.success("Employees assigned to Team Lead");
      await loadAccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to assign employees");
    } finally {
      setSaving(false);
    }
  };

  const setTeamLead = async (allowed) => {
    if (!selectedEmployeeId) {
      toast.error("Select employee first");
      return;
    }

    const ok = await confirm({
      title: allowed ? "Make Team Lead" : "Remove Team Lead",
      message: `Are you sure you want to ${allowed ? "make" : "remove"} ${
        selectedEmployee?.employee?.name || "this employee"
      } ${allowed ? "a Team Lead" : "from Team Lead"}?`,
      confirmText: allowed ? "Make TL" : "Remove TL",
      tone: allowed ? "primary" : "danger",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await hrApi.updateEmployeeAccess(selectedEmployeeId, {
        isTeamLead: allowed,
        modules: { systemAllotment: allowed || Boolean(selectedEmployee?.modules?.systemAllotment) },
      });
      toast.success(allowed ? "Employee is now Team Lead" : "Team Lead access removed");
      if (allowed) {
        setSelectedTeamLeadId(selectedEmployeeId);
      }
      await loadAccess();
      if (!allowed && selectedTeamLeadId === selectedEmployeeId) {
        setSelectedTeamLeadId("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update Team Lead access");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CommonLoader text="Loading Team Lead assignments..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage TL</h1>
            <p className="text-sm text-gray-500 mt-1">
              Step 1: make an employee TL. Step 2: select that TL and assign employees under them.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ["Staff", stats.total, "bg-gray-900 text-white"],
              ["Team Leads", stats.teamLeads, "bg-blue-50 text-blue-700 border border-blue-200"],
              ["Assigned", stats.assigned, "bg-green-50 text-green-700 border border-green-200"],
              ["Unassigned", stats.unassigned, "bg-gray-100 text-gray-700 border border-gray-200"],
            ].map(([label, value, className]) => (
              <div key={label} className={`px-3 py-2 rounded-sm text-sm font-semibold ${className}`}>
                <span className="block text-xs opacity-80">{label}</span>
                <span className="text-lg leading-5">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-sm shadow p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 lg:items-end">
          <label className="text-sm font-medium text-gray-700">
            Select Team Lead
            <select
              value={selectedTeamLeadId}
              onChange={(e) => setSelectedTeamLeadId(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
            >
              <option value="">Select TL</option>
              {teamLeads.map((row) => (
                <option key={row.employee?._id} value={row.employee?._id}>
                  {row.employee?.employeeId || "-"} - {row.employee?.name} ({employees.filter((employeeRow) => String(employeeRow.teamLead?._id || employeeRow.teamLead) === row.employee?._id).length} assigned)
                </option>
              ))}
            </select>
          </label>
          <Button
            text={`Save ${assignedEmployeeIds.length} Assignment${assignedEmployeeIds.length === 1 ? "" : "s"}`}
            onClick={saveAssignments}
            loading={saving}
            disabled={!selectedTeamLeadId}
            className="w-full lg:w-auto"
          />
        </div>

        {selectedTeamLead && (
          <div className="border border-blue-100 bg-blue-50 rounded-sm p-3 text-sm text-blue-800">
            <b>{selectedTeamLead.employee?.name}</b> will manage {assignedEmployeeIds.length} selected employee(s).
          </div>
        )}
        {!teamLeads.length && (
          <div className="border border-amber-100 bg-amber-50 rounded-sm p-3 text-sm text-amber-800">
            No Team Lead exists yet. Select an employee in the right panel and click Make TL first.
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees by name, ID, email, department"
              className="w-full border border-gray-300 rounded-sm px-3 py-2"
            />
            <Button text="Select Visible" variant="secondary" onClick={selectVisible} disabled={!selectedTeamLeadId} />
            <Button text="Clear Visible" variant="secondary" onClick={clearVisible} disabled={!selectedTeamLeadId} />
          </div>

          <div className="hidden lg:grid grid-cols-[52px_120px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 bg-gray-100 px-4 py-3 text-xs uppercase font-semibold text-gray-600">
            <span />
            <span>ID</span>
            <span>Assignable Employee</span>
            <span>Department</span>
            <span>Current TL</span>
          </div>

          {!selectedTeamLeadId && (
            <div className="border-b bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Select a TL above to start assigning employees. The list below shows employees who can be assigned.
            </div>
          )}

          {filteredEmployees.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">No assignable employees found.</p>
          ) : (
            filteredEmployees.map((row) => {
              const employeeId = row.employee?._id;
              const checked = assignedEmployeeIds.includes(employeeId);
              const currentTlId = String(row.teamLead?._id || row.teamLead || "");
              const assignedToSelectedTl = selectedTeamLeadId && currentTlId === selectedTeamLeadId;
              return (
                <label
                  key={employeeId}
                  className={`grid grid-cols-[32px_minmax(0,1fr)] lg:grid-cols-[52px_120px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t px-4 py-3 text-sm lg:items-center cursor-pointer hover:bg-gray-50 ${
                    checked ? "bg-[#fff5f3]" : "bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEmployee(employeeId)}
                    disabled={!selectedTeamLeadId}
                    className="mt-1 lg:mt-0 h-4 w-4"
                  />
                  <span className="hidden lg:block">{row.employee?.employeeId || "-"}</span>
                  <span>
                    <span className="block font-medium">{row.employee?.name || "N/A"}</span>
                    <span className="block text-xs text-gray-500 break-all">
                      <span className="lg:hidden">{row.employee?.employeeId || "-"} | </span>
                      {row.employee?.email || "-"}
                    </span>
                  </span>
                  <span>
                    <span className="block">{row.employee?.department || "-"}</span>
                    <span className="block text-xs text-gray-500">{row.employee?.designation || "-"}</span>
                  </span>
                  <span className="text-gray-600">
                    {row.teamLead?.name ? `${row.teamLead.name} (${row.teamLead.employeeId || "-"})` : "-"}
                    {assignedToSelectedTl && <span className="ml-2 text-xs font-semibold text-green-700">Current</span>}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <div className="bg-white rounded-sm shadow overflow-hidden h-fit">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Create / Remove TL</h2>
            <p className="text-xs text-gray-500 mt-1">First make an employee TL, then assign employees from the left panel.</p>
          </div>
          <div className="p-4 space-y-3">
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

            {selectedEmployee && (
              <div className="border border-gray-200 bg-gray-50 rounded-sm p-3">
                <p className="font-semibold text-gray-900">{selectedEmployee.employee?.name}</p>
                <p className="text-xs text-gray-500 break-all">{selectedEmployee.employee?.email || "-"}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-sm border ${
                  selectedEmployee.isTeamLead
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {selectedEmployee.isTeamLead ? "Team Lead" : "Employee"}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                text="Make TL"
                onClick={() => setTeamLead(true)}
                loading={saving}
                disabled={!selectedEmployeeId || selectedEmployee?.isTeamLead}
                className="w-full"
              />
              <Button
                text="Remove TL"
                variant="secondary"
                onClick={() => setTeamLead(false)}
                loading={saving}
                disabled={!selectedEmployeeId || !selectedEmployee?.isTeamLead}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmployeeAccessControl;
