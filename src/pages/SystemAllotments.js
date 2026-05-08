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
  systemType: "laptop",
  assetTag: "",
  brand: "",
  model: "",
  serialNumber: "",
  processor: "",
  ram: "",
  storage: "",
  graphicCard: "",
  storageType: "",
  displaySize: "",
  operatingSystem: "",
  assignedDate: new Date().toISOString().slice(0, 10),
  locationDept: "",
  purchaseDate: "",
  warrantyExpiry: "",
  purchaseSource: "",
  shopPlatformName: "",
  cost: "",
  notes: "",
  status: "available",
};

const SystemAllotments = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const { confirm } = useModal();
  const isEmployee = ["employee", "teamlead"].includes(user?.role);
  const canEdit = user?.role === "employee";
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
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

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
      setSelectedIds([]);
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

  const allVisibleSelected = items.length > 0 && selectedIds.length === items.length;

  const stats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { total: 0, available: 0, assigned: 0, returned: 0, repair: 0, inactive: 0 }
    );
  }, [items]);

  const statusTone = {
    available: "bg-blue-50 text-blue-700 border-blue-200",
    assigned: "bg-green-50 text-green-700 border-green-200",
    returned: "bg-slate-50 text-slate-700 border-slate-200",
    repair: "bg-amber-50 text-amber-700 border-amber-200",
    inactive: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const statusLabel = (status = "") => status.replace(/_/g, " ") || "unknown";

  const getSystemTitle = (item) =>
    item.systemName ||
    [item.brand, item.model].filter(Boolean).join(" ") ||
    item.serialNumber ||
    "Unnamed system";

  const getSpecs = (item) =>
    [
      item.processor,
      item.ram && `${item.ram} RAM`,
      item.storage && `${item.storage} Storage`,
      item.graphicCard,
      item.operatingSystem,
    ]
      .filter(Boolean)
      .join(" • ");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "employee" ? { status: value ? "assigned" : "available" } : {}),
    }));
  };

  const fillFormFromSystem = (item) => {
    setEditingId(item._id);
    setShowForm(true);
    setForm({
      employee: item.employee?._id || "",
      systemName: item.systemName || "",
      systemType: item.systemType || "laptop",
      assetTag: item.assetTag || "",
      brand: item.brand || "",
      model: item.model || "",
      serialNumber: item.serialNumber || "",
      processor: item.processor || "",
      ram: item.ram || "",
      storage: item.storage || "",
      graphicCard: item.graphicCard || "",
      storageType: item.storageType || "",
      displaySize: item.displaySize || "",
      operatingSystem: item.operatingSystem || "",
      assignedDate: item.assignedDate ? item.assignedDate.slice(0, 10) : emptyForm.assignedDate,
      locationDept: item.locationDept || "",
      purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0, 10) : "",
      warrantyExpiry: item.warrantyExpiry ? item.warrantyExpiry.slice(0, 10) : "",
      purchaseSource: item.purchaseSource || "",
      shopPlatformName: item.shopPlatformName || "",
      cost: item.cost || "",
      notes: item.notes || "",
      status: item.status || "available",
    });
  };

  const handleSystemSelect = (e) => {
    const systemId = e.target.value;
    if (!systemId) {
      setEditingId("");
      setForm(emptyForm);
      setShowForm(true);
      return;
    }
    const item = systemList.find((system) => system._id === systemId);
    if (item) fillFormFromSystem(item);
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
    employeid: "employeeId",
    name: "employeeName",
    assignedto: "assignedTo",
    systemname: "systemName",
    system: "systemName",
    devicename: "deviceName",
    brand: "brand",
    model: "model",
    type: "systemType",
    systemtype: "systemType",
    asset: "assetTag",
    assettag: "assetTag",
    assetid: "assetId",
    serial: "serialNumber",
    serialnumber: "serialNumber",
    serialno: "serialNumber",
    srno: "srNo",
    processor: "processor",
    ram: "ram",
    ramgb: "ram",
    storage: "storage",
    storagegb: "storage",
    graphiccardgb: "graphicCard",
    graphiccard: "graphicCard",
    storagetype: "storageType",
    displaysizein: "displaySize",
    displaysize: "displaySize",
    os: "operatingSystem",
    operatingsystem: "operatingSystem",
    assigneddate: "assignedDate",
    locationdept: "locationDept",
    department: "locationDept",
    purchasedate: "purchaseDate",
    warrantyexpiry: "warrantyExpiry",
    purchasesource: "purchaseSource",
    shopplatformname: "shopPlatformName",
    shopname: "shopPlatformName",
    platformname: "shopPlatformName",
    cost: "cost",
    costrs: "cost",
    date: "date",
    status: "status",
    notes: "notes",
    remark: "remark",
  };

  const parseWorkbookRows = (sheet) => {
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const headerIndex = matrix.findIndex((row) => {
      const mappedCount = row.filter((cell) => importKeyMap[normalizeImportKey(cell)]).length;
      return mappedCount >= 3;
    });
    if (headerIndex === -1) {
      return XLSX.utils.sheet_to_json(sheet, { defval: "" });
    }
    const headers = matrix[headerIndex].map((cell) => importKeyMap[normalizeImportKey(cell)] || "");
    return matrix.slice(headerIndex + 1).map((row) =>
      row.reduce((acc, value, index) => {
        const key = headers[index];
        if (key) acc[key] = value instanceof Date ? value.toISOString().slice(0, 10) : value;
        return acc;
      }, {})
    ).filter((row) => Object.values(row).some((value) => String(value || "").trim()));
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
      const rawRows = parseWorkbookRows(sheet);
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

  const toggleSelected = (itemId) => {
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAllVisible = () => {
    setSelectedIds(allVisibleSelected ? [] : items.map((item) => item._id));
  };

  const deleteSelectedItems = async () => {
    if (!selectedIds.length) {
      toast.error("Select at least one system first");
      return;
    }
    const ok = await confirm({
      title: "Delete Selected Systems",
      message: `${selectedIds.length} selected system(s) will be marked inactive.`,
      confirmText: "Delete Selected",
      tone: "danger",
    });
    if (!ok) return;
    setImporting(true);
    try {
      await Promise.all(selectedIds.map((id) => api.deleteSystemAllotment(id)));
      toast.success(`${selectedIds.length} system(s) removed`);
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete selected systems");
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
    const payload = {
      ...form,
      systemName: form.systemName.trim() || [form.brand, form.model].filter(Boolean).join(" ").trim(),
    };
    if (!payload.systemName && !payload.serialNumber) {
      toast.error("Add system name, brand/model, or serial number first");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.updateSystemAllotment(editingId, payload);
        toast.success("System allotment updated");
      } else {
        await api.createSystemAllotment(payload);
        toast.success("System allotment added");
      }
      setForm(emptyForm);
      setEditingId("");
      setShowForm(false);
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
    fillFormFromSystem(item);
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
      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Allotments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track inventory, assign devices to employees, and review current ownership in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <Button
                  text={showForm ? "Close Form" : editingId ? "Continue Editing" : "Add / Assign System"}
                  onClick={() => setShowForm((prev) => !prev)}
                />
                <label className="inline-flex items-center justify-center px-4 py-2 rounded-sm bg-[#f84525] text-white text-sm font-semibold cursor-pointer">
                  {importing ? "Importing..." : "Import Excel"}
                  <input type="file" accept=".xlsx,.xls,.csv,.ods" onChange={handleImport} className="hidden" disabled={importing} />
                </label>
                <Button
                  text={selectedIds.length ? `Delete Selected (${selectedIds.length})` : "Delete Selected"}
                  variant="danger"
                  onClick={deleteSelectedItems}
                  disabled={!selectedIds.length}
                  loading={importing && selectedIds.length > 0}
                />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border-b border-gray-100">
          {[
            ["Total", stats.total, "bg-gray-900 text-white"],
            ["Available", stats.available, statusTone.available],
            ["Assigned", stats.assigned, statusTone.assigned],
            ["Repair", stats.repair, statusTone.repair],
            ["Inactive", stats.inactive, statusTone.inactive],
          ].map(([label, value, className]) => (
            <div key={label} className="p-4 border-r border-b md:border-b-0 border-gray-100">
              <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded-sm border text-[11px] font-semibold ${className}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm font-medium text-gray-700">
            Employee
            <select value={filters.employeeId} onChange={(e) => setFilters((prev) => ({ ...prev, employeeId: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2">
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>{employee.employeeId || "-"} - {employee.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Status
            <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2">
              <option value="">All status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="returned">Returned</option>
              <option value="repair">Repair</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Search
            <input value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="System, employee, serial, asset" className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
          </label>
        </div>
      </section>

      {canEdit && showForm && (
      <form onSubmit={saveAllotment} className="bg-white rounded-sm shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">{editingId ? "Edit System Assignment" : "Add Inventory / Assign System"}</h2>
            <p className="text-xs text-gray-500">Step 1: choose or enter system details. Step 2: select employee if assigned.</p>
          </div>
          <div className="flex gap-2">
            {editingId && <span className="px-3 py-2 rounded-sm bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">Editing</span>}
            <Button text="Cancel" variant="secondary" onClick={() => { setEditingId(""); setForm(emptyForm); setShowForm(false); }} />
          </div>
        </div>

        <div className="p-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm font-medium text-gray-700">
              Existing System
              <select value={editingId} onChange={handleSystemSelect} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2">
                <option value="">Create new inventory item</option>
                {systemList.map((system) => (
                  <option key={system._id} value={system._id}>
                    {getSystemTitle(system)} | {system.serialNumber || system.assetTag || "-"} | {system.employee?.name || "Inventory"}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Assign To
              <select name="employee" value={form.employee} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2">
                <option value="">Inventory only / not assigned</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.employeeId || "-"} - {employee.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <h3 className="md:col-span-4 text-sm font-semibold text-gray-900 border-b pb-2">Device Identity</h3>
            {[
              ["systemName", "System Name"],
              ["brand", "Brand"],
              ["model", "Model"],
              ["assetTag", "Asset Tag"],
              ["serialNumber", "Serial Number"],
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
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="returned">Returned</option>
                <option value="repair">Repair</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <h3 className="md:col-span-4 text-sm font-semibold text-gray-900 border-b pb-2">Specifications</h3>
            {[
              ["processor", "Processor"],
              ["ram", "RAM"],
              ["storage", "Storage"],
              ["storageType", "Storage Type"],
              ["graphicCard", "Graphic Card"],
              ["displaySize", "Display Size"],
              ["operatingSystem", "Operating System"],
              ["locationDept", "Location / Dept"],
            ].map(([name, label]) => (
              <label key={name} className="text-sm font-medium text-gray-700">
                {label}
                <input name={name} value={form[name]} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <h3 className="md:col-span-4 text-sm font-semibold text-gray-900 border-b pb-2">Purchase & Notes</h3>
            <label className="text-sm font-medium text-gray-700">
              Assigned Date
              <input type="date" name="assignedDate" value={form.assignedDate} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Purchase Date
              <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Warranty Expiry
              <input type="date" name="warrantyExpiry" value={form.warrantyExpiry} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
            </label>
            {[
              ["purchaseSource", "Purchase Source"],
              ["shopPlatformName", "Shop / Platform"],
              ["cost", "Cost"],
            ].map(([name, label]) => (
              <label key={name} className="text-sm font-medium text-gray-700">
                {label}
                <input name={name} value={form[name]} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
              </label>
            ))}
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Notes
              <input name="notes" value={form.notes} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" />
            </label>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t pt-4">
            <p className="text-sm text-gray-500">
              {selectedEmployee
                ? `Assigning to ${selectedEmployee.name} (${selectedEmployee.email || "no email"})`
                : "No employee selected: this system stays in inventory."}
            </p>
            <Button text={editingId ? "Save Changes" : "Save System"} type="submit" loading={saving} />
          </div>
        </div>
      </form>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50">
            <div>
              <h2 className="font-semibold text-gray-900">Employees</h2>
              <p className="text-xs text-gray-500">
                {canEdit ? "Click an employee before saving to assign a system." : "View employee system ownership."}
              </p>
            </div>
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
                onClick={() => canEdit && setForm((prev) => ({ ...prev, employee: employee._id, status: "assigned" }))}
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium text-sm">{employee.employeeId || "-"} - {employee.name}</span>
                  <span className="text-xs bg-[#fff5f3] text-[#f84525] px-2 py-1 rounded-sm">
                    {employeeAllotmentCounts[employee._id] || 0} systems
                  </span>
                </span>
                <span className="block text-xs text-gray-500 mt-1">{employee.email || "-"} {employee.department ? `• ${employee.department}` : ""}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Quick System Picker</h2>
            <p className="text-xs text-gray-500">
              {canEdit ? "Click a system to open it in edit mode." : "View system details."}
            </p>
          </div>
          <div className="max-h-72 overflow-auto divide-y">
            {systemList.map((system) => (
              <button
                key={system._id}
                type="button"
                onClick={() => canEdit && fillFormFromSystem(system)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-medium text-sm">{getSystemTitle(system)}</span>
                <span className="block text-xs text-gray-500">
                  {[system.brand, system.model].filter(Boolean).join(" ") || system.assetTag || system.serialNumber || "-"} • {system.employee?.name || "Inventory"} • {statusLabel(system.status)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Current Allotments</h2>
            <p className="text-xs text-gray-500">
              {canEdit ? "Tick systems below, then use Delete Selected." : "View-only access for Team Lead."}
            </p>
          </div>
          {canEdit && <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                className="w-4 h-4 accent-[#f84525]"
              />
              Select all visible
            </label>
            <Button
              text={selectedIds.length ? `Delete Selected (${selectedIds.length})` : "Delete Selected"}
              variant="danger"
              onClick={deleteSelectedItems}
              disabled={!selectedIds.length}
              loading={importing && selectedIds.length > 0}
              className="text-sm"
            />
          </div>}
        </div>
        {items.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No system allotments found.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 p-4">
            {items.map((item) => (
              <article
                key={item._id}
                className={`border rounded-sm p-4 bg-white hover:shadow-sm transition-shadow ${
                  selectedIds.includes(item._id) ? "border-[#f84525] ring-1 ring-[#f84525]" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {canEdit && (
                    <label className="shrink-0 pt-1" title="Select for bulk delete">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleSelected(item._id)}
                        className="w-4 h-4 accent-[#f84525]"
                      />
                    </label>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 break-words">{getSystemTitle(item)}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {[item.brand, item.model, item.systemType].filter(Boolean).join(" • ") || "No model details"}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-sm border text-xs font-semibold capitalize ${statusTone[item.status] || statusTone.inactive}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Owner</p>
                    <p className="font-medium text-gray-900 break-words">{item.employee?.name || "Inventory"}</p>
                    <p className="text-xs text-gray-500">{item.employee?.employeeId || item.locationDept || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned Date</p>
                    <p>{item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Asset Tag</p>
                    <p className="break-words">{item.assetTag || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Serial</p>
                    <p className="break-words">{item.serialNumber || "-"}</p>
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <p className="text-xs text-gray-500">Specs</p>
                  <p className="break-words">{getSpecs(item) || "-"}</p>
                </div>
                {(item.purchaseDate || item.warrantyExpiry || item.cost || item.shopPlatformName) && (
                  <div className="mt-3 text-xs text-gray-500">
                    {[item.purchaseDate && `Purchased ${new Date(item.purchaseDate).toLocaleDateString()}`, item.warrantyExpiry && `Warranty ${new Date(item.warrantyExpiry).toLocaleDateString()}`, item.cost && `Cost ${item.cost}`, item.shopPlatformName].filter(Boolean).join(" • ")}
                  </div>
                )}
                {item.notes && <p className="mt-3 text-sm text-gray-600 break-words">{item.notes}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {canEdit && (
                    <>
                      <Button text="Edit" variant="secondary" onClick={() => editItem(item)} className="text-xs px-3 py-1.5" />
                      <Button text="Remove" variant="danger" onClick={() => deleteItem(item)} className="text-xs px-3 py-1.5" />
                    </>
                  )}
                  <details className="w-full text-xs text-gray-600 mt-1">
                    <summary className="cursor-pointer font-semibold">History</summary>
                    {(item.history || []).slice().reverse().map((history, index) => (
                      <p key={`${item._id}-${index}`} className="mt-1">
                        {history.action} - {history.updatedAt ? new Date(history.updatedAt).toLocaleString() : "-"}
                      </p>
                    ))}
                  </details>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SystemAllotments;
