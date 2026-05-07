import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { employeeApi, hrApi } from "../api";
import Button from "../components/common/Button";
import CommonLoader from "../components/common/CommonLoader";
import { AuthContext } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { useToast } from "../contexts/ToastContext";

const emptyForm = {
  employee: "",
  systemName: "",
  systemType: "desktop",
  assetTag: "",
  serialNumber: "",
  processor: "",
  ram: "",
  storage: "",
  operatingSystem: "",
  assignedDate: new Date().toISOString().slice(0, 10),
  notes: "",
  status: "assigned",
};

const SystemAllotments = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const { confirm } = useModal();
  const isEmployee = ["employee", "teamlead"].includes(user?.role);
  const api = isEmployee ? employeeApi : hrApi;
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ employeeId: "", status: "", search: "" });
  const [employeeListFilter, setEmployeeListFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const allotmentsReq = api.getSystemAllotments({
        employeeId: filters.employeeId || undefined,
        status: filters.status || undefined,
        search: filters.search.trim() || undefined,
      });
      const employeesReq = isEmployee ? employeeApi.getSystemAllotmentEmployees() : hrApi.getEmployees();
      const [employeesRes, allotmentsRes] = await Promise.all([employeesReq, allotmentsReq]);
      setEmployees(employeesRes.data.data || []);
      setItems(allotmentsRes.data.data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
      } else {
        toast.error(err.response?.data?.message || "Unable to load system allotments");
      }
    } finally {
      setLoading(false);
    }
  }, [api, filters.employeeId, filters.search, filters.status, isEmployee, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee._id === form.employee),
    [employees, form.employee]
  );

  const employeeAllotmentCounts = useMemo(() => {
    return items.reduce((acc, item) => {
      const id = item.employee?._id;
      if (!id) return acc;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const count = employeeAllotmentCounts[employee._id] || 0;
      if (employeeListFilter === "assigned") return count > 0;
      if (employeeListFilter === "unassigned") return count === 0;
      return true;
    });
  }, [employeeAllotmentCounts, employeeListFilter, employees]);

  const systemList = useMemo(() => {
    const byKey = new Map();
    items.forEach((item) => {
      const key = item.assetTag || item.serialNumber || item.systemName || item._id;
      byKey.set(key, item);
    });
    return Array.from(byKey.values());
  }, [items]);

  const stats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { total: 0, assigned: 0, returned: 0, repair: 0, inactive: 0 }
    );
  }, [items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const normalizeImportKey = (key) =>
    String(key || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const importKeyMap = {
    employee: "employee",
    employeeid: "employeeId",
    empid: "employeeId",
    email: "email",
    employeename: "employeeName",
    name: "employeeName",
    systemname: "systemName",
    system: "systemName",
    devicename: "deviceName",
    type: "systemType",
    systemtype: "systemType",
    asset: "assetTag",
    assettag: "assetTag",
    assetid: "assetId",
    serial: "serialNumber",
    serialnumber: "serialNumber",
    srno: "srNo",
    processor: "processor",
    ram: "ram",
    storage: "storage",
    os: "operatingSystem",
    operatingsystem: "operatingSystem",
    assigneddate: "assignedDate",
    date: "date",
    status: "status",
    notes: "notes",
    remark: "remark",
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ok = await confirm({
      title: "Import System Allotments",
      message: `Are you sure you want to import ${file.name}? Existing systems with same asset or serial may be updated.`,
      confirmText: "Import",
    });
    if (!ok) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const rows = rawRows.map((row) =>
        Object.entries(row).reduce((acc, [key, value]) => {
          const normalizedKey = importKeyMap[normalizeImportKey(key)];
          if (normalizedKey) acc[normalizedKey] = value instanceof Date ? value.toISOString().slice(0, 10) : value;
          return acc;
        }, {})
      );

      const res = await api.importSystemAllotments(rows);
      const { created = 0, updated = 0, skipped = [] } = res.data.data || {};
      toast.success(`Imported: ${created} new, ${updated} updated, ${skipped.length} skipped`);
      if (skipped.length) {
        toast.error(`Skipped rows: ${skipped.slice(0, 3).map((item) => item.row).join(", ")}`);
      }
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to import Excel file");
    } finally {
      setImporting(false);
    }
  };

  const saveAllotment = async (e) => {
    e.preventDefault();
    const ok = await confirm({
      title: editingId ? "Update System Allotment" : "Add System Allotment",
      message: editingId
        ? "Are you sure you want to update this system allotment?"
        : "Are you sure you want to add this system allotment?",
      confirmText: editingId ? "Update" : "Add",
      tone: editingId ? "primary" : "primary",
    });
    if (!ok) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateSystemAllotment(editingId, form);
        toast.success("System allotment updated");
      } else {
        await api.createSystemAllotment(form);
        toast.success("System allotment added");
      }
      setForm(emptyForm);
      setEditingId("");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save system allotment");
    } finally {
      setSaving(false);
    }
  };

  const editItem = async (item) => {
    const ok = await confirm({
      title: "Edit System Allotment",
      message: `Are you sure you want to edit ${item.systemName}?`,
      confirmText: "Edit",
    });
    if (!ok) return;
    setEditingId(item._id);
    setForm({
      employee: item.employee?._id || "",
      systemName: item.systemName || "",
      systemType: item.systemType || "desktop",
      assetTag: item.assetTag || "",
      serialNumber: item.serialNumber || "",
      processor: item.processor || "",
      ram: item.ram || "",
      storage: item.storage || "",
      operatingSystem: item.operatingSystem || "",
      assignedDate: item.assignedDate ? item.assignedDate.slice(0, 10) : emptyForm.assignedDate,
      notes: item.notes || "",
      status: item.status || "assigned",
    });
  };

  const deleteItem = async (item) => {
    const ok = await confirm({
      title: "Remove System Allotment",
      message: `${item.systemName} allotment will be marked inactive.`,
      confirmText: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.deleteSystemAllotment(item._id);
      toast.success("System allotment removed");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove allotment");
    }
  };

  if (loading) return <CommonLoader text="Loading system allotments..." />;
  if (accessDenied) {
    return (
      <section className="bg-white rounded-sm shadow p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">Access Not Allowed</h1>
        <p className="text-sm text-gray-500 mt-2">Admin has not allowed system allotment access for your employee account.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Allotments</h1>
            <p className="text-sm text-gray-500 mt-1">Add, bulk import, filter, and update which employee has which system.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["Total", stats.total, "bg-gray-900 text-white"],
              ["Assigned", stats.assigned, "bg-green-50 text-green-700 border border-green-200"],
              ["Repair", stats.repair, "bg-amber-50 text-amber-700 border border-amber-200"],
              ["Inactive", stats.inactive, "bg-gray-100 text-gray-700 border border-gray-200"],
            ].map(([label, value, className]) => (
              <span key={label} className={`px-3 py-2 rounded-sm text-xs font-semibold ${className}`}>
                {label}: {value}
              </span>
            ))}
            <label className="inline-flex items-center justify-center px-4 py-2 rounded-sm bg-[#f84525] text-white text-sm font-semibold cursor-pointer">
              {importing ? "Importing..." : "Upload Excel / Google Sheet"}
              <input type="file" accept=".xlsx,.xls,.csv,.ods" onChange={handleImport} className="hidden" disabled={importing} />
            </label>
          </div>
        </div>
      </section>

      <form onSubmit={saveAllotment} className="bg-white rounded-sm shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">{editingId ? "Update Allotment" : "New Allotment"}</h2>
            <p className="text-xs text-gray-500">Select employee and system details before saving.</p>
          </div>
          {editingId && <span className="px-3 py-1 rounded-sm bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">Editing</span>}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-sm font-medium text-gray-700 md:col-span-2">
          Employee
          <select name="employee" value={form.employee} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" required>
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.employeeId || "-"} - {employee.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          System Name
          <input name="systemName" value={form.systemName} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Assigned Date
          <input type="date" name="assignedDate" value={form.assignedDate} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" required />
        </label>
        {[
          ["assetTag", "Asset Tag"],
          ["serialNumber", "Serial Number"],
          ["processor", "Processor"],
          ["ram", "RAM"],
          ["storage", "Storage"],
          ["operatingSystem", "Operating System"],
        ].map(([name, label]) => (
          <label key={name} className="text-sm font-medium text-gray-700">
            {label}
            <input name={name} value={form[name]} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
          </label>
        ))}
        <label className="text-sm font-medium text-gray-700">
          Type
          <select name="systemType" value={form.systemType} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2">
            <option value="desktop">Desktop</option>
            <option value="laptop">Laptop</option>
            <option value="server">Server</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Status
          <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2">
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
            <option value="repair">Repair</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700 md:col-span-2">
          Notes
          <input name="notes" value={form.notes} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
        </label>
        <div className="md:col-span-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-sm text-gray-500">{selectedEmployee ? `${selectedEmployee.email || ""} ${selectedEmployee.department ? `| ${selectedEmployee.department}` : ""}` : "Select employee before saving."}</p>
          <div className="flex gap-2">
            {editingId && <Button text="Cancel" variant="secondary" onClick={() => { setEditingId(""); setForm(emptyForm); }} />}
            <Button text={editingId ? "Update Allotment" : "Add Allotment"} type="submit" loading={saving} />
          </div>
        </div>
        </div>
      </form>

      <section className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <select value={filters.employeeId} onChange={(e) => setFilters((prev) => ({ ...prev, employeeId: e.target.value }))} className="border border-gray-300 rounded-sm px-3 py-2">
          <option value="">All employees</option>
          {employees.map((employee) => (
            <option key={employee._id} value={employee._id}>{employee.employeeId || "-"} - {employee.name}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className="border border-gray-300 rounded-sm px-3 py-2">
          <option value="">All status</option>
          <option value="assigned">Assigned</option>
          <option value="returned">Returned</option>
          <option value="repair">Repair</option>
          <option value="inactive">Inactive</option>
        </select>
        <input value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="Search system, employee, serial" className="border border-gray-300 rounded-sm px-3 py-2" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Employee List</h2>
            <select value={employeeListFilter} onChange={(e) => setEmployeeListFilter(e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1 text-sm">
              <option value="all">All</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
          <div className="max-h-72 overflow-auto divide-y">
            {filteredEmployees.map((employee) => (
              <button
                key={employee._id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, employee: employee._id }))}
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-medium text-sm">{employee.employeeId || "-"} - {employee.name}</span>
                <span className="block text-xs text-gray-500">{employee.email || "-"} | Systems: {employeeAllotmentCounts[employee._id] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50">
            <h2 className="font-semibold text-gray-900">System List</h2>
          </div>
          <div className="max-h-72 overflow-auto divide-y">
            {systemList.map((system) => (
              <button
                key={system._id}
                type="button"
                onClick={() => editItem(system)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-medium text-sm">{system.systemName}</span>
                <span className="block text-xs text-gray-500">
                  {system.assetTag || system.serialNumber || "-"} | {system.employee?.name || "Unassigned"} | {system.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="hidden lg:grid grid-cols-8 bg-gray-100 text-xs uppercase text-gray-600 font-semibold">
          {["Employee", "System", "Asset", "Serial", "Specs", "Date", "Status", "Actions"].map((item) => (
            <div key={item} className="px-4 py-3">{item}</div>
          ))}
        </div>
        {items.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No system allotments found.</p>
        ) : (
          items.map((item) => (
            <div key={item._id} className="grid grid-cols-1 lg:grid-cols-8 gap-2 border-t px-4 py-3 text-sm lg:items-start">
              <span className="font-medium">{item.employee?.name || "N/A"}<br /><small className="text-gray-500">{item.employee?.employeeId || "-"}</small></span>
              <span>{item.systemName}<br /><small className="capitalize text-gray-500">{item.systemType}</small></span>
              <span>{item.assetTag || "-"}</span>
              <span>{item.serialNumber || "-"}</span>
              <span>{[item.processor, item.ram, item.storage, item.operatingSystem].filter(Boolean).join(", ") || "-"}</span>
              <span>{item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : "-"}</span>
              <span className="font-semibold capitalize">{item.status}</span>
              <span className="flex gap-2 flex-wrap">
                <Button text="Edit" variant="secondary" onClick={() => editItem(item)} className="text-xs px-3 py-1.5" />
                <Button text="Remove" variant="danger" onClick={() => deleteItem(item)} className="text-xs px-3 py-1.5" />
                <details className="w-full text-xs text-gray-600">
                  <summary className="cursor-pointer font-semibold">History</summary>
                  {(item.history || []).slice().reverse().map((history, index) => (
                    <p key={`${item._id}-${index}`} className="mt-1">
                      {history.action} - {history.updatedAt ? new Date(history.updatedAt).toLocaleString() : "-"}
                    </p>
                  ))}
                </details>
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default SystemAllotments;
