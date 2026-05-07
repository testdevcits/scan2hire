import { useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  const isEmployee = user?.role === "employee";
  const api = isEmployee ? employeeApi : hrApi;
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ employeeId: "", status: "", search: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveAllotment = async (e) => {
    e.preventDefault();
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

  const editItem = (item) => {
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
        <h1 className="text-2xl font-bold text-gray-900">System Allotments</h1>
        <p className="text-sm text-gray-500 mt-1">Add and update which employee has which system, with update history.</p>
      </section>

      <form onSubmit={saveAllotment} className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
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
