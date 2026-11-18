import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiEye } from "react-icons/fi";
import { useEmployee } from "../../contexts/Hr/EmployeeContext";
import CommonLoader from "../../components/common/CommonLoader";
import Avatar from "../../components/common/Avatar";
import CommonTable from "../../components/common/CommonTable";
import EmptyState from "../../components/common/EmptyState";
import { usePagination } from "../../components/common/Pagination";
import ProfileCard from "../../components/common/ProfileCard";
import TableToolbar from "../../components/common/TableToolbar";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import { AuthContext } from "../../contexts/AuthContext";
import { authApi } from "../../api";

const ManageEmployees = () => {
  const { employees, loading, error, pagination: serverPagination, fetchEmployees } =
    useEmployee();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const employeeAccess = user?.moduleAccess?.employees;
  const hasEmployeeAction = (action) => user?.role === "superadmin" || (user?.role === "hr" && (typeof employeeAccess === "object" ? employeeAccess[action] === true : employeeAccess === true));
  const canAddEmployee = hasEmployeeAction("add");
  const canEditEmployee = hasEmployeeAction("edit");
  const [viewMode, setViewMode] = useState("list");
  const [hrUsers, setHrUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasLoadedEmployees, setHasLoadedEmployees] = useState(false);
  const isServerPaginated = user?.role !== "superadmin";
  const searchPending = searchInput.trim() !== debouncedSearch;

  useEffect(() => {
    if (!isServerPaginated) {
      fetchEmployees().finally(() => setHasLoadedEmployees(true));
    }
    if (user?.role === "superadmin") {
      authApi
        .getHrs()
        .then((res) => setHrUsers(res.data.data || []))
        .catch(() => setHrUsers([]));
    }
  }, [fetchEmployees, isServerPaginated, user?.role]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!isServerPaginated) return;
    const params = viewMode === "list"
      ? { page, limit: pageSize, search: debouncedSearch, sort: "name" }
      : { search: debouncedSearch, sort: "name" };
    fetchEmployees(params).finally(() => setHasLoadedEmployees(true));
  }, [debouncedSearch, fetchEmployees, isServerPaginated, page, pageSize, viewMode]);

  const hrRows = useMemo(() => hrUsers.map((hr) => {
    const linked = hr.employeeProfile?._id || hr.employeeProfile || employees.find((item) => String(item.email || "").toLowerCase() === String(hr.email || "").toLowerCase() || String(item.name || "").trim().toLowerCase() === String(hr.name || "").trim().toLowerCase())?._id;
    const profile = hr.employeeProfile && typeof hr.employeeProfile === "object" ? hr.employeeProfile : employees.find((item) => String(item._id) === String(linked));
    return { ...hr, name: profile?.name || hr.name, email: profile?.email || hr.email, mobile: profile?.mobile || hr.mobile, employeeId: profile?.employeeId || "HR", department: profile?.department || "HR", designation: profile?.designation || "HR", isHrAccount: true, linkedEmployeeId: linked };
  }), [hrUsers, employees]);
  const hrEmails = useMemo(() => new Set(hrUsers.flatMap((hr) => [hr.email, hr.employeeProfile?.email]).filter(Boolean).map((email) => String(email).toLowerCase())), [hrUsers]);
  const hrLinkedIds = useMemo(() => new Set(hrRows.map((row) => String(row.linkedEmployeeId || "")).filter(Boolean)), [hrRows]);
  const hrIdentityKeys = useMemo(() => new Set(hrRows.map((row) => `${String(row.name || "").trim().toLowerCase()}|${String(row.mobile || "").trim()}`).filter((key) => key !== "|")), [hrRows]);
  const nonHrEmployees = useMemo(() => employees.filter((employee) => {
    const identity = `${String(employee.name || "").trim().toLowerCase()}|${String(employee.mobile || "").trim()}`;
    return !hrEmails.has(String(employee.email || "").toLowerCase()) && !hrLinkedIds.has(String(employee._id)) && !hrIdentityKeys.has(identity);
  }), [employees, hrEmails, hrLinkedIds, hrIdentityKeys]);
  const sortedHrEmployees = useMemo(() => [...employees].sort((left, right) =>
    String(left.name || "").localeCompare(String(right.name || ""), undefined, { sensitivity: "base" })
  ), [employees]);
  const displayEmployees = useMemo(() => user?.role === "superadmin"
    ? [...hrRows, ...nonHrEmployees].sort((left, right) =>
        String(left.name || "").localeCompare(String(right.name || ""), undefined, { sensitivity: "base" })
      )
    : sortedHrEmployees, [hrRows, nonHrEmployees, sortedHrEmployees, user?.role]);
  const filteredEmployees = useMemo(() => {
    if (isServerPaginated || !searchInput.trim()) return displayEmployees;
    const term = searchInput.trim().toLowerCase();
    return displayEmployees.filter((employee) => [
      employee.employeeId, employee.name, employee.email, employee.mobile, employee.department, employee.designation,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [displayEmployees, isServerPaginated, searchInput]);
  const employeePagination = usePagination(isServerPaginated ? [] : filteredEmployees, [viewMode, user?.role, searchInput]);
  const pagedEmployees = isServerPaginated ? employees : employeePagination.pageItems;
  const totalEmployees = isServerPaginated ? serverPagination.totalItems : filteredEmployees.length;
  const totalPages = isServerPaginated ? serverPagination.totalPages : employeePagination.totalPages;

  const formatValue = (value) => value || "N/A";
  const isTeamLead = (user?.effectiveRole || user?.role) === "teamlead";
  const openEmployee = (employee) => {
    const employeeRecordId = employee.isHrAccount ? employee.linkedEmployeeId : employee._id;
    if (employeeRecordId) navigate(`${employeesPath}/${employeeRecordId}`);
  };
  const editEmployee = (employee) => {
    const employeeRecordId = employee.isHrAccount ? employee.linkedEmployeeId : employee._id;
    if (employeeRecordId) navigate(`${employeesPath}/${employeeRecordId}?edit=1`);
  };
  const employeesPath = user?.role === "superadmin" ? "/admin/employees" : "/hr/employees";

  const paginationProps = isServerPaginated
    ? {
        page,
        pageSize,
        setPage,
        setPageSize: (nextPageSize) => { setPageSize(nextPageSize); setPage(1); },
        totalItems: totalEmployees,
        totalPages,
      }
    : { ...employeePagination, totalItems: totalEmployees };
  const employeeColumns = [
    { accessor: "employeeId", header: "ID", render: (value) => <span className="font-medium text-gray-900 dark:text-gray-100">{value || "N/A"}</span> },
    {
      accessor: "name",
      header: "Employee",
      render: (value, employee) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={employee.name} src={employee.documents?.photo?.url} />
          <span className="truncate font-medium text-gray-900 dark:text-gray-100">{value || "N/A"}</span>
        </span>
      ),
    },
    { accessor: "email", header: "Email", render: (value) => <span className="break-all">{value || "N/A"}</span> },
    { accessor: "mobile", header: "Mobile", render: (value) => value || "N/A" },
    { accessor: "department", header: "Department", render: (value) => <span className="block truncate">{formatValue(value)}</span> },
    { accessor: "designation", header: "Designation", render: (value) => <span className="block truncate">{formatValue(value)}</span> },
    {
      accessor: "action",
      header: "Actions",
      render: (_, employee) => (
        <div className="flex items-center gap-2">
          <button type="button" title="View employee" aria-label={`View ${employee.name || "employee"}`} onClick={() => openEmployee(employee)} className="rounded-sm border border-gray-200 p-2 text-gray-600 transition hover:border-[#f84525] hover:text-[#f84525] dark:border-gray-700 dark:text-gray-300">
            <FiEye aria-hidden="true" />
          </button>
          {canEditEmployee && (
            <button type="button" title="Edit employee" aria-label={`Edit ${employee.name || "employee"}`} onClick={() => editEmployee(employee)} className="rounded-sm border border-gray-200 p-2 text-gray-600 transition hover:border-[#f84525] hover:text-[#f84525] dark:border-gray-700 dark:text-gray-300">
              <FiEdit2 aria-hidden="true" />
            </button>
          )}
        </div>
      ),
    },
  ];
  const employeeToolbar = (
    <TableToolbar
      value={searchInput}
      onChange={(value) => { setSearchInput(value); setPage(1); }}
      label="Search employees"
      placeholder="Name, ID, email, mobile, department..."
      summary={searchInput.trim() ? `${totalEmployees} matching` : `Showing ${totalEmployees} employees`}
      loading={loading || searchPending}
      loadingText={searchPending && !loading ? "Searching…" : "Loading…"}
    />
  );
  const cardEmployees = isServerPaginated ? employees : filteredEmployees;
  const employeeOnlyCount = filteredEmployees.filter((item) => item.user?.role !== "hr" && item.workRole !== "hr").length;

  if (loading && !hasLoadedEmployees) return <CommonLoader text="Fetching employees..." />;

  return (
    <div className="space-y-5 p-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{isTeamLead ? "Your Team" : "Manage Employees"}</h1>
          <p className="text-sm text-gray-500">
            {isTeamLead
              ? "View employees assigned to your team."
              : "Add employees, create login access, and review documents."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewSwitcher
            value={viewMode}
            onChange={setViewMode}
            options={[{ value: "list", label: "List View" }, { value: "card", label: "Card View" }]}
          />
          <span className="rounded-sm bg-[#fff5f3] px-3 py-2 text-sm text-[#f84525]">
            {isTeamLead ? "Team Members" : user?.role === "superadmin" ? "Employees" : "Total Employees"}: {user?.role === "superadmin" ? employeeOnlyCount : totalEmployees}
          </span>
          {user?.role === "superadmin" && (
            <span className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-sm">
              Including HR: {filteredEmployees.length}
            </span>
          )}
          {canAddEmployee && <button
            type="button"
            onClick={() => navigate(`${employeesPath}/new`)}
            className="bg-[#f84525] text-white px-4 py-2 rounded-sm text-sm"
          >
            Add Employee
          </button>}
        </div>
      </div>

      {viewMode === "list" ? (
        <CommonTable
          columns={employeeColumns}
          data={pagedEmployees}
          pagination={paginationProps}
          loading={loading}
          loadingText="Loading employees..."
          error={error}
          emptyText={searchInput.trim() ? "No employees match this search" : "No employees found"}
          toolbar={employeeToolbar}
        />
      ) : (
        <>
          {employeeToolbar}
          {error && <EmptyState variant="error" text={error} className="mt-3" />}
          {loading && <CommonLoader text="Loading employees..." compact />}
          {cardEmployees.length === 0 ? (
            !loading && !error && <EmptyState text={searchInput.trim() ? "No employees match this search" : "No employees found"} />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
              {cardEmployees.map((employee) => (
                <ProfileCard
                  key={employee._id}
                  name={employee.name}
                  image={employee.documents?.photo?.url}
                  subtitle={employee.designation || employee.department || employee.employeeId}
                  onClick={() => openEmployee(employee)}
                />
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default ManageEmployees;
