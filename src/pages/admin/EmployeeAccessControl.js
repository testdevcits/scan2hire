import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCheck,
  FiMonitor,
  FiSearch,
  FiShield,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import Pagination, { usePagination } from "../../components/common/Pagination";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const roleCards = [
  {
    key: "teamLead",
    title: "Team Lead",
    description: "Can view team reports and manage assigned team members.",
    icon: <FiUsers />,
  },
  {
    key: "tester",
    title: "Tester",
    description: "Can add website bugs, screenshots, and update bug status.",
    icon: <FiShield />,
  },
  {
    key: "projectCoordinator",
    title: "Project Coordinator",
    description: "Can create task sheets, assign tasks, and export reports.",
    icon: <FiBriefcase />,
  },
  {
    key: "systemAllotment",
    title: "System Manager",
    description: "Can add inventory and allocate systems/accessories.",
    icon: <FiMonitor />,
  },
];

const RolePill = ({ tone, text }) => {
  const classes = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    green: "bg-green-50 text-green-700 border-green-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold ${classes[tone] || classes.gray}`}>
      {text}
    </span>
  );
};

const EmployeeAccessControl = () => {
  const toast = useToast();
  const { confirm } = useModal();
  const [rows, setRows] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState("");
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState([]);
  const [search, setSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
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
      toast.error(err.response?.data?.message || "Unable to load role access");
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
        .filter((row) => {
          const leadIds = [
            row.teamLead?._id || row.teamLead,
            ...(row.teamLeads || []).map((teamLead) => teamLead?._id || teamLead),
          ].map(String);
          return leadIds.includes(selectedTeamLeadId);
        })
        .map((row) => row.employee?._id)
        .filter(Boolean)
    );
  }, [employees, selectedTeamLeadId]);

  const filterRows = (list, term) => {
    const value = term.trim().toLowerCase();
    if (!value) return list;
    return list.filter((row) =>
      [
        row.employee?.name,
        row.employee?.employeeId,
        row.employee?.email,
        row.employee?.department,
        row.employee?.designation,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(value))
    );
  };

  const filteredRoleRows = useMemo(() => filterRows(rows, roleSearch), [roleSearch, rows]);
  const filteredEmployees = useMemo(() => filterRows(employees, search), [employees, search]);
  const roleRowsPagination = usePagination(filteredRoleRows, [roleSearch]);
  const employeesPagination = usePagination(filteredEmployees, [search, selectedTeamLeadId]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      teamLeads: teamLeads.length,
      testers: rows.filter((row) => row.isTester).length,
      projectCoordinators: rows.filter((row) => row.isProjectCoordinator).length,
      systemManagers: rows.filter((row) => row.modules?.systemAllotment).length,
      assigned: employees.filter((row) => row.teamLead || row.teamLeads?.length).length,
      unassigned: employees.filter((row) => !row.teamLead && !row.teamLeads?.length).length,
    }),
    [employees, rows, teamLeads.length]
  );

  const selectedRoleStates = {
    teamLead: Boolean(selectedEmployee?.isTeamLead),
    tester: Boolean(selectedEmployee?.isTester),
    projectCoordinator: Boolean(selectedEmployee?.isProjectCoordinator),
    systemAllotment: Boolean(selectedEmployee?.modules?.systemAllotment),
  };

  const employeeLabel = (row) =>
    `${row.employee?.employeeId || "-"} - ${row.employee?.name || "N/A"}`;

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
	      }? This Team Lead's list will be replaced by the selected list. Other Team Lead assignments will stay.`,
      confirmText: "Save Team",
      tone: "primary",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await hrApi.assignTeamLeadEmployees(selectedTeamLeadId, {
        employeeIds: assignedEmployeeIds,
      });
      toast.success("Team Lead assignments saved");
      await loadAccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to assign employees");
    } finally {
      setSaving(false);
    }
  };

  const updateSelectedAccess = async (updates, successMessage) => {
    if (!selectedEmployeeId) {
      toast.error("Select employee first");
      return;
    }

    setSaving(true);
    try {
      await hrApi.updateEmployeeAccess(selectedEmployeeId, updates);
      toast.success(successMessage);
      await loadAccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update access");
    } finally {
      setSaving(false);
    }
  };

  const setTeamLead = async (allowed) => {
    const ok = await confirm({
      title: allowed ? "Make Team Lead" : "Remove Team Lead",
      message: `${selectedEmployee?.employee?.name || "This employee"} ${
        allowed ? "will become a Team Lead." : "will be removed from Team Lead access."
      }`,
      confirmText: allowed ? "Make TL" : "Remove TL",
      tone: allowed ? "primary" : "danger",
    });
    if (!ok) return;

    await updateSelectedAccess(
      {
        isTeamLead: allowed,
        modules: { systemAllotment: Boolean(selectedEmployee?.modules?.systemAllotment) },
      },
      allowed ? "Employee is now Team Lead" : "Team Lead access removed"
    );
    if (allowed) setSelectedTeamLeadId(selectedEmployeeId);
    if (!allowed && selectedTeamLeadId === selectedEmployeeId) setSelectedTeamLeadId("");
  };

  const setTester = async (allowed) => {
    const ok = await confirm({
      title: allowed ? "Make Tester" : "Remove Tester",
      message: `${selectedEmployee?.employee?.name || "This employee"} ${
        allowed ? "will get tester access." : "will lose tester access."
      }`,
      confirmText: allowed ? "Make Tester" : "Remove",
      tone: allowed ? "primary" : "danger",
    });
    if (!ok) return;

    await updateSelectedAccess(
      {
        isTester: allowed,
        modules: { systemAllotment: Boolean(selectedEmployee?.modules?.systemAllotment) },
      },
      allowed ? "Employee is now Tester" : "Tester access removed"
    );
  };

  const setProjectCoordinator = async (allowed) => {
    const ok = await confirm({
      title: allowed ? "Make Project Coordinator" : "Remove Project Coordinator",
      message: `${selectedEmployee?.employee?.name || "This employee"} ${
        allowed ? "will manage project task sheets." : "will no longer manage task sheets."
      }`,
      confirmText: allowed ? "Make Coordinator" : "Remove",
      tone: allowed ? "primary" : "danger",
    });
    if (!ok) return;

    await updateSelectedAccess(
      {
        isProjectCoordinator: allowed,
        modules: { systemAllotment: Boolean(selectedEmployee?.modules?.systemAllotment) },
      },
      allowed ? "Employee is now Project Coordinator" : "Project Coordinator access removed"
    );
  };

  const setSystemAllotmentAccess = async (allowed) => {
    const ok = await confirm({
      title: allowed ? "Allow System Manager" : "Remove System Manager",
      message: `${selectedEmployee?.employee?.name || "This employee"} ${
        allowed ? "will manage system inventory and allotments." : "will no longer manage system allotments."
      }`,
      confirmText: allowed ? "Allow" : "Remove",
      tone: allowed ? "primary" : "danger",
    });
    if (!ok) return;

    await updateSelectedAccess(
      { modules: { systemAllotment: allowed } },
      allowed ? "System Manager access allowed" : "System Manager access removed"
    );
  };

  const toggleRole = (roleKey, allowed) => {
    if (!selectedEmployeeId) {
      toast.error("Select employee first");
      return;
    }
    if (roleKey === "teamLead") return setTeamLead(allowed);
    if (roleKey === "tester") return setTester(allowed);
    if (roleKey === "projectCoordinator") return setProjectCoordinator(allowed);
    return setSystemAllotmentAccess(allowed);
  };

  if (loading) return <CommonLoader text="Loading role assignments..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Access Control</h1>
            <p className="text-sm text-gray-500 mt-1">
              Select an employee, grant the required role, then assign team members to a Team Lead.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            {[
              ["Staff", stats.total, "bg-gray-900 text-white border-gray-900"],
              ["Team Leads", stats.teamLeads, "bg-blue-50 text-blue-700 border-blue-200"],
              ["Testers", stats.testers, "bg-amber-50 text-amber-700 border-amber-200"],
              ["Coordinators", stats.projectCoordinators, "bg-violet-50 text-violet-700 border-violet-200"],
              ["System Managers", stats.systemManagers, "bg-emerald-50 text-emerald-700 border-emerald-200"],
              ["Assigned", stats.assigned, "bg-green-50 text-green-700 border-green-200"],
              ["Unassigned", stats.unassigned, "bg-gray-50 text-gray-700 border-gray-200"],
            ].map(([label, value, className]) => (
              <div key={label} className={`rounded-md border px-3 py-2 text-sm font-semibold ${className}`}>
                <span className="block text-xs opacity-80">{label}</span>
                <span className="text-xl leading-6">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)] gap-4">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Give Role / Access</h2>
            <p className="text-sm text-gray-500 mt-1">Choose one employee and switch on the access they need.</p>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] gap-5">
            <div className="space-y-3">
              <label className="relative block">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search employee"
                  className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/10"
                />
              </label>

              <div className="rounded-md border border-gray-200 overflow-hidden">
                {filteredRoleRows.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">No employees found.</p>
                ) : (
                  roleRowsPagination.pageItems.map((row) => {
                    const active = row.employee?._id === selectedEmployeeId;
                    return (
                      <button
                        key={row.employee?._id}
                        type="button"
                        onClick={() => setSelectedEmployeeId(row.employee?._id)}
                        className={`w-full border-b border-gray-100 px-3 py-3 text-left transition-colors last:border-b-0 ${
                          active ? "bg-[#fff5f3]" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <span className="block font-semibold text-gray-900">{employeeLabel(row)}</span>
                        <span className="mt-1 block text-xs text-gray-500 break-all">{row.employee?.email || "-"}</span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {row.isTeamLead && <RolePill tone="blue" text="TL" />}
                          {row.isTester && <RolePill tone="amber" text="Tester" />}
                          {row.isProjectCoordinator && <RolePill tone="violet" text="Coordinator" />}
                          {row.modules?.systemAllotment && <RolePill tone="green" text="System" />}
                          {!row.isTeamLead && !row.isTester && !row.isProjectCoordinator && !row.modules?.systemAllotment && (
                            <RolePill tone="gray" text="Employee" />
                          )}
                        </span>
                      </button>
                    );
                  })
                )}
                <Pagination {...roleRowsPagination} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                {selectedEmployee ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Selected Employee</p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900">{selectedEmployee.employee?.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedEmployee.employee?.employeeId || "-"} | {selectedEmployee.employee?.department || "-"} | {selectedEmployee.employee?.designation || "-"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 break-all">{selectedEmployee.employee?.email || "-"}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Select an employee from the list to manage access.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roleCards.map((role) => {
                  const enabled = selectedRoleStates[role.key];
                  return (
                    <div key={role.key} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 rounded-md p-2 ${enabled ? "bg-[#fff5f3] text-[#f84525]" : "bg-gray-100 text-gray-500"}`}>
                          {role.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-gray-900">{role.title}</h3>
                            {enabled ? <RolePill tone="green" text="On" /> : <RolePill tone="gray" text="Off" />}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{role.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRole(role.key, true)}
                          disabled={!selectedEmployeeId || enabled || saving}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-[#f84525] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiCheck /> Allow
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleRole(role.key, false)}
                          disabled={!selectedEmployeeId || !enabled || saving}
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiX /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Assign Team Members</h2>
            <p className="text-sm text-gray-500 mt-1">Pick a Team Lead, select employees, and save the team list.</p>
          </div>

          <div className="p-5 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Team Lead
              <select
                value={selectedTeamLeadId}
                onChange={(e) => setSelectedTeamLeadId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/10"
              >
                <option value="">Select Team Lead</option>
                {teamLeads.map((row) => (
                  <option key={row.employee?._id} value={row.employee?._id}>
                    {employeeLabel(row)}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
              {selectedTeamLead ? (
                <>
                  <b>{selectedTeamLead.employee?.name}</b> will manage {assignedEmployeeIds.length} selected employee(s).
                </>
              ) : (
                "Make an employee Team Lead first, then select them here."
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
              <label className="relative block">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search team members"
                  className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/10"
                />
              </label>
              <Button text="Select Visible" variant="secondary" onClick={selectVisible} disabled={!selectedTeamLeadId} />
              <Button text="Clear Visible" variant="secondary" onClick={clearVisible} disabled={!selectedTeamLeadId} />
            </div>

            <div className="rounded-md border border-gray-200 overflow-hidden">
              {filteredEmployees.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">No assignable employees found.</p>
              ) : (
	                employeesPagination.pageItems.map((row) => {
	                  const employeeId = row.employee?._id;
	                  const checked = assignedEmployeeIds.includes(employeeId);
	                  const currentTeamLeads = [
	                    row.teamLead,
	                    ...(row.teamLeads || []),
	                  ].filter(Boolean);
	                  const uniqueCurrentTeamLeads = currentTeamLeads.filter(
	                    (teamLead, index, list) =>
	                      list.findIndex((item) => String(item?._id || item) === String(teamLead?._id || teamLead)) === index
	                  );
	                  const currentTlIds = uniqueCurrentTeamLeads.map((teamLead) => String(teamLead?._id || teamLead));
	                  const currentTlNames = uniqueCurrentTeamLeads
	                    .map((teamLead) => teamLead?.name || teamLead?.employeeId || "")
	                    .filter(Boolean)
	                    .join(", ");
	                  const assignedToSelectedTl = selectedTeamLeadId && currentTlIds.includes(selectedTeamLeadId);
                  return (
                    <label
                      key={employeeId}
                      className={`grid grid-cols-[32px_minmax(0,1fr)] gap-2 border-b border-gray-100 px-3 py-3 text-sm last:border-b-0 ${
                        checked ? "bg-[#fff5f3]" : "bg-white hover:bg-gray-50"
                      } ${selectedTeamLeadId ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEmployee(employeeId)}
                        disabled={!selectedTeamLeadId}
                        className="mt-1 h-4 w-4 accent-[#f84525]"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-gray-900">{employeeLabel(row)}</span>
                        <span className="block text-xs text-gray-500 break-all">{row.employee?.email || "-"}</span>
                        <span className="mt-1 block text-xs text-gray-600">
                          {row.employee?.department || "-"} | {row.employee?.designation || "-"}
	                        </span>
	                        <span className="mt-1 block text-xs text-gray-500">
	                          Current TLs: {currentTlNames || "-"}
	                          {assignedToSelectedTl && <span className="ml-2 font-semibold text-green-700">Selected TL</span>}
	                        </span>
                      </span>
                    </label>
                  );
                })
              )}
              <Pagination {...employeesPagination} />
            </div>

            <Button
              text={`Save Team (${assignedEmployeeIds.length})`}
              onClick={saveAssignments}
              loading={saving}
              disabled={!selectedTeamLeadId}
              className="w-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmployeeAccessControl;
