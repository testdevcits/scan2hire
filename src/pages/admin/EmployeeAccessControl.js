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
    blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900",
    amber: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900",
    violet: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-900",
    green: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900",
    gray: "bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  };
  const dot = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    green: "bg-green-500",
    gray: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        classes[tone] || classes.gray
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[tone] || dot.gray}`} />
      {text}
    </span>
  );
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "?";

const Avatar = ({ name, size = "h-8 w-8", className = "" }) => (
  <span
    className={`flex ${size} flex-shrink-0 items-center justify-center rounded-full bg-[#fff5f3] dark:bg-[#2a1712] text-xs font-bold text-[#f84525] ${className}`}
  >
    {initials(name)}
  </span>
);

// shared card shell
const Card = ({ className = "", children }) => (
  <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <label className="relative block">
    <FiSearch className="absolute left-3 top-3 text-gray-400" />
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 py-2 pl-9 pr-3 text-sm focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/40"
    />
  </label>
);

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
    <div className="space-y-5 pb-8">
      {/* Header + stats */}
      <Card className="overflow-hidden">
        <div className="p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Roles &amp; Access Control</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select an employee, grant the required role, then assign team members to a Team Lead.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            {[
              ["Staff", stats.total, "text-gray-900 dark:text-gray-100", "bg-gray-200 dark:bg-gray-700"],
              ["Team Leads", stats.teamLeads, "text-blue-700 dark:text-blue-400", "bg-blue-400"],
              ["Testers", stats.testers, "text-amber-700 dark:text-amber-400", "bg-amber-400"],
              ["Coordinators", stats.projectCoordinators, "text-violet-700 dark:text-violet-400", "bg-violet-400"],
              ["System Managers", stats.systemManagers, "text-emerald-700 dark:text-emerald-400", "bg-emerald-400"],
              ["Assigned", stats.assigned, "text-green-700 dark:text-green-400", "bg-green-400"],
              ["Unassigned", stats.unassigned, "text-gray-600 dark:text-gray-400", "bg-gray-300 dark:bg-gray-600"],
            ].map(([label, value, textClass, barClass]) => (
              <div
                key={label}
                className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 shadow-sm"
              >
                <span className="block text-[11px] font-medium text-gray-400">{label}</span>
                <span className={`text-xl font-bold leading-7 ${textClass}`}>{value}</span>
                <span className={`mt-1 block h-1 w-6 rounded-full ${barClass}`} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)] gap-4">
        {/* Give Role / Access */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Give Role / Access</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose one employee and switch on the access they need.
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] gap-5">
            <div className="flex flex-col gap-3 min-h-0">
              <SearchInput value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder="Search employee" />

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex-1 min-h-0">
                <div className="max-h-[520px] overflow-y-auto">
                  {filteredRoleRows.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No employees found.</p>
                  ) : (
                    filteredRoleRows.map((row) => {
                      const active = row.employee?._id === selectedEmployeeId;
                      return (
                        <button
                          key={row.employee?._id}
                          type="button"
                          onClick={() => setSelectedEmployeeId(row.employee?._id)}
                          className={`flex w-full items-start gap-3 border-b border-gray-100 dark:border-gray-800 px-3 py-3 text-left transition-colors last:border-b-0 ${
                            active ? "bg-[#fff5f3] dark:bg-[#2a1712]" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                          }`}
                        >
                          <Avatar name={row.employee?.name} className="mt-0.5" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-gray-900 dark:text-gray-100">{employeeLabel(row)}</span>
                            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400 break-all">
                              {row.employee?.email || "-"}
                            </span>
                            <span className="mt-2 flex flex-wrap gap-1.5">
                              {row.isTeamLead && <RolePill tone="blue" text="TL" />}
                              {row.isTester && <RolePill tone="amber" text="Tester" />}
                              {row.isProjectCoordinator && <RolePill tone="violet" text="Coordinator" />}
                              {row.modules?.systemAllotment && <RolePill tone="green" text="System" />}
                              {!row.isTeamLead &&
                                !row.isTester &&
                                !row.isProjectCoordinator &&
                                !row.modules?.systemAllotment && <RolePill tone="gray" text="Employee" />}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
                {selectedEmployee ? (
                  <div className="flex items-start gap-3">
                    <Avatar name={selectedEmployee.employee?.name} size="h-11 w-11" className="bg-white dark:bg-gray-900 shadow-sm text-sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Selected Employee
                      </p>
                      <h3 className="mt-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                        {selectedEmployee.employee?.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {selectedEmployee.employee?.employeeId || "-"} ·{" "}
                        {selectedEmployee.employee?.department || "-"} ·{" "}
                        {selectedEmployee.employee?.designation || "-"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-all">
                        {selectedEmployee.employee?.email || "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select an employee from the list to manage access.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roleCards.map((role) => {
                  const enabled = selectedRoleStates[role.key];
                  return (
                    <div
                      key={role.key}
                      className={`rounded-xl border p-4 transition-colors ${
                        enabled
                          ? "border-[#f84525]/30 bg-[#fff8f7] dark:bg-[#2a1712] dark:border-[#5c2c1f]"
                          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 rounded-lg p-2 ${
                            enabled ? "bg-[#fff5f3] dark:bg-[#3a2018] text-[#f84525]" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {role.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{role.title}</h3>
                            {enabled ? <RolePill tone="green" text="On" /> : <RolePill tone="gray" text="Off" />}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{role.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRole(role.key, true)}
                          disabled={!selectedEmployeeId || enabled || saving}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#f84525] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#e13a1c] transition-colors"
                        >
                          <FiCheck /> Allow
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleRole(role.key, false)}
                          disabled={!selectedEmployeeId || !enabled || saving}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
        </Card>

        {/* Assign Team Members */}
        <Card className="overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Team Members</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pick a Team Lead, select employees, and save the team list.</p>
          </div>

          <div className="p-5 space-y-4 flex-1 min-h-0 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Lead
              <select
                value={selectedTeamLeadId}
                onChange={(e) => setSelectedTeamLeadId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/40"
              >
                <option value="">Select Team Lead</option>
                {teamLeads.map((row) => (
                  <option key={row.employee?._id} value={row.employee?._id}>
                    {employeeLabel(row)}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-300">
              {selectedTeamLead ? (
                <>
                  <b>{selectedTeamLead.employee?.name}</b> will manage {assignedEmployeeIds.length} selected
                  employee(s).
                </>
              ) : (
                "Make an employee Team Lead first, then select them here."
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
              <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team members" />
              <Button text="Select Visible" variant="secondary" onClick={selectVisible} disabled={!selectedTeamLeadId} />
              <Button text="Clear Visible" variant="secondary" onClick={clearVisible} disabled={!selectedTeamLeadId} />
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex-1 min-h-0">
              <div className="max-h-[420px] overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No assignable employees found.</p>
                ) : (
                  filteredEmployees.map((row) => {
                    const employeeId = row.employee?._id;
                    const checked = assignedEmployeeIds.includes(employeeId);
                    const currentTeamLeads = [row.teamLead, ...(row.teamLeads || [])].filter(Boolean);
                    const uniqueCurrentTeamLeads = currentTeamLeads.filter(
                      (teamLead, index, list) =>
                        list.findIndex(
                          (item) => String(item?._id || item) === String(teamLead?._id || teamLead)
                        ) === index
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
                        className={`grid grid-cols-[32px_minmax(0,1fr)] gap-2 border-b border-gray-100 dark:border-gray-800 px-3 py-3 text-sm last:border-b-0 ${
                          checked ? "bg-[#fff5f3] dark:bg-[#2a1712]" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60"
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
                          <span className="block font-semibold text-gray-900 dark:text-gray-100">{employeeLabel(row)}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 break-all">{row.employee?.email || "-"}</span>
                          <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                            {row.employee?.department || "-"} | {row.employee?.designation || "-"}
                          </span>
                          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                            Current TLs: {currentTlNames || "-"}
                            {assignedToSelectedTl && (
                              <span className="ml-2 font-semibold text-green-700 dark:text-green-400">Selected TL</span>
                            )}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <Button
              text={`Save Team (${assignedEmployeeIds.length})`}
              onClick={saveAssignments}
              loading={saving}
              disabled={!selectedTeamLeadId}
              className="w-full"
            />
          </div>
        </Card>
      </section>
    </div>
  );
};

export default EmployeeAccessControl;