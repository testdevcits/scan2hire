import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2, FiX } from "react-icons/fi";
import { employeeApi, hrApi } from "../api";
import Button from "../components/common/Button";
import CommonLoader from "../components/common/CommonLoader";
import { AuthContext } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { useToast } from "../contexts/ToastContext";

const assetTabs = [
  { key: "assign", label: "Assign" },
  { key: "allotments", label: "Allotments" },
  { key: "system", label: "Systems" },
  { key: "monitor", label: "Monitors" },
  { key: "keyboard", label: "Keyboards" },
  { key: "mouse", label: "Mice" },
  { key: "headphone", label: "Headphones" },
];

const inventoryTypes = ["system", "monitor", "keyboard", "mouse", "headphone"];

const emptyAssignment = {
  employee: "",
  systemAsset: "",
  monitorAsset: "",
  keyboardAsset: "",
  mouseAsset: "",
  headphoneAsset: "",
  assignedDate: new Date().toISOString().slice(0, 10),
  locationDept: "",
  notes: "",
};

const emptyAsset = {
  name: "",
  brand: "",
  model: "",
  serialNumber: "",
  status: "available",
  processor: "",
  ram: "",
  storage: "",
  operatingSystem: "",
  displaySize: "",
  purchaseDate: "",
  warrantyExpiry: "",
  cost: "",
  locationDept: "",
  notes: "",
};

const titleCase = (value = "") => value.charAt(0).toUpperCase() + value.slice(1);

const statusTone = {
  available: "bg-blue-50 text-blue-700 border-blue-200",
  allocated: "bg-green-50 text-green-700 border-green-200",
  assigned: "bg-green-50 text-green-700 border-green-200",
  repair: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  returned: "bg-slate-50 text-slate-700 border-slate-200",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const assetName = (asset) =>
  asset
    ? asset.name ||
      [asset.brand, asset.model].filter(Boolean).join(" ") ||
      asset.assetId ||
      asset.serialNumber ||
      "Unnamed asset"
    : "-";

const assetOptionLabel = (asset) =>
  `${asset.assetId || "-"} | ${assetName(asset)}${asset.serialNumber ? ` | SN ${asset.serialNumber}` : ""}`;

const assignmentTitle = (item) => {
  const system = item.systemAsset ? assetName(item.systemAsset) : item.systemName;
  return system || "System assignment";
};

const SystemAllotments = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const { confirm } = useModal();
  const isEmployeeRoute = ["employee", "teamlead"].includes(user?.role);
  const api = isEmployeeRoute ? employeeApi : hrApi;

  const [activeTab, setActiveTab] = useState("assign");
  const [canEdit, setCanEdit] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [allotments, setAllotments] = useState([]);
  const [assets, setAssets] = useState(() =>
    inventoryTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {})
  );
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);
  const [editingAssignmentId, setEditingAssignmentId] = useState("");
  const [assetForm, setAssetForm] = useState(emptyAsset);
  const [editingAssetId, setEditingAssetId] = useState("");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const accessReq = isEmployeeRoute
        ? employeeApi.getMyAccess()
        : Promise.resolve({ data: { data: { systemAllotmentManage: true } } });
      const employeesReq = isEmployeeRoute ? employeeApi.getSystemAllotmentEmployees() : hrApi.getEmployees();
      const [accessRes, employeesRes, allotmentsRes, ...assetResponses] = await Promise.all([
        accessReq,
        employeesReq,
        api.getSystemAllotments(),
        ...inventoryTypes.map((type) => api.getSystemAssets(type)),
      ]);
      const allowed = !isEmployeeRoute || Boolean(accessRes?.data?.data?.systemAllotmentManage);
      setCanEdit(allowed);
      setEmployees(employeesRes.data.data || []);
      setAllotments(allotmentsRes.data.data || []);
      setAssets(
        inventoryTypes.reduce((acc, type, index) => {
          acc[type] = assetResponses[index]?.data?.data || [];
          return acc;
        }, {})
      );
    } catch (err) {
      if (err.response?.status === 403) setAccessDenied(true);
      else toast.error(err.response?.data?.message || "Unable to load system allotments");
    } finally {
      setLoading(false);
    }
  }, [api, isEmployeeRoute, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAssignments = useMemo(
    () => allotments.filter((item) => item.status === "assigned" && item.employee),
    [allotments]
  );

  const assignedEmployeeIds = useMemo(
    () => new Set(activeAssignments.map((item) => String(item.employee?._id))),
    [activeAssignments]
  );

  const editingAssignment = useMemo(
    () => allotments.find((item) => item._id === editingAssignmentId),
    [allotments, editingAssignmentId]
  );

  const selectableEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          !assignedEmployeeIds.has(String(employee._id)) ||
          String(editingAssignment?.employee?._id) === String(employee._id)
      ),
    [assignedEmployeeIds, editingAssignment, employees]
  );

  const selectableAssets = useCallback(
    (type, currentId = "") =>
      (assets[type] || []).filter(
        (asset) => asset.status === "available" || String(asset._id) === String(currentId)
      ),
    [assets]
  );

  const stats = useMemo(() => {
    const totalAssets = inventoryTypes.reduce((sum, type) => sum + (assets[type]?.length || 0), 0);
    const availableAssets = inventoryTypes.reduce(
      (sum, type) => sum + (assets[type] || []).filter((asset) => asset.status === "available").length,
      0
    );
    return {
      employees: employees.length,
      active: activeAssignments.length,
      totalAssets,
      availableAssets,
    };
  }, [activeAssignments.length, assets, employees.length]);

  const filteredAllotments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allotments;
    return allotments.filter((item) =>
      [
        item.employee?.name,
        item.employee?.employeeId,
        item.systemName,
        item.systemAsset?.assetId,
        item.monitorAsset?.assetId,
        item.keyboardAsset?.assetId,
        item.mouseAsset?.assetId,
        item.headphoneAsset?.assetId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [allotments, search]);

  const resetAssignment = () => {
    setAssignmentForm(emptyAssignment);
    setEditingAssignmentId("");
  };

  const fillAssignment = (item) => {
    setEditingAssignmentId(item._id);
    setAssignmentForm({
      employee: item.employee?._id || "",
      systemAsset: item.systemAsset?._id || "",
      monitorAsset: item.monitorAsset?._id || "",
      keyboardAsset: item.keyboardAsset?._id || "",
      mouseAsset: item.mouseAsset?._id || "",
      headphoneAsset: item.headphoneAsset?._id || "",
      assignedDate: formatDate(item.assignedDate) || emptyAssignment.assignedDate,
      locationDept: item.locationDept || "",
      notes: item.notes || "",
    });
    setActiveTab("assign");
  };

  const saveAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.employee || !assignmentForm.systemAsset) {
      toast.error("Select employee and system first");
      return;
    }
    const ok = await confirm({
      title: editingAssignmentId ? "Update Allocation" : "Allocate System",
      message: editingAssignmentId
        ? "Update this employee asset allocation?"
        : "Allocate selected assets to this employee?",
      confirmText: editingAssignmentId ? "Update" : "Allocate",
    });
    if (!ok) return;
    setSaving(true);
    try {
      if (editingAssignmentId) {
        await api.updateSystemAllotment(editingAssignmentId, assignmentForm);
        toast.success("Allocation updated");
      } else {
        await api.createSystemAllotment(assignmentForm);
        toast.success("System allocated");
      }
      resetAssignment();
      await loadData();
      setActiveTab("allotments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save allocation");
    } finally {
      setSaving(false);
    }
  };

  const releaseAssignment = async (item) => {
    const ok = await confirm({
      title: "Release Allocation",
      message: `${assignmentTitle(item)} will become free for another employee.`,
      confirmText: "Release",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.deleteSystemAllotment(item._id);
      toast.success("Allocation released");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to release allocation");
    }
  };

  const fillAsset = (asset) => {
    setEditingAssetId(asset._id);
    setAssetForm({
      name: asset.name || "",
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      status: asset.status || "available",
      processor: asset.processor || "",
      ram: asset.ram || "",
      storage: asset.storage || "",
      operatingSystem: asset.operatingSystem || "",
      displaySize: asset.displaySize || "",
      purchaseDate: formatDate(asset.purchaseDate),
      warrantyExpiry: formatDate(asset.warrantyExpiry),
      cost: asset.cost || "",
      locationDept: asset.locationDept || "",
      notes: asset.notes || "",
    });
  };

  const resetAsset = () => {
    setEditingAssetId("");
    setAssetForm(emptyAsset);
  };

  const saveAsset = async (e) => {
    e.preventDefault();
    if (!assetForm.name && !assetForm.model && !assetForm.serialNumber) {
      toast.error("Add name, model, or serial number first");
      return;
    }
    setSaving(true);
    try {
      if (editingAssetId) {
        await api.updateSystemAsset(activeTab, editingAssetId, assetForm);
        toast.success(`${titleCase(activeTab)} updated`);
      } else {
        await api.createSystemAsset(activeTab, assetForm);
        toast.success(`${titleCase(activeTab)} added`);
      }
      resetAsset();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save asset");
    } finally {
      setSaving(false);
    }
  };

  const deleteAsset = async (asset) => {
    const ok = await confirm({
      title: `Remove ${titleCase(activeTab)}`,
      message: `${assetName(asset)} will be marked inactive.`,
      confirmText: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.deleteSystemAsset(activeTab, asset._id);
      toast.success("Asset removed");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove asset");
    }
  };

  const fieldClass = "mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 text-sm";
  const labelClass = "text-sm font-medium text-gray-700";

  if (loading) return <CommonLoader text="Loading system allotments..." />;
  if (accessDenied) {
    return (
      <section className="bg-white rounded-sm shadow p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">Access Not Allowed</h1>
        <p className="text-sm text-gray-500 mt-2">Admin has not allowed system allotment access for your employee account.</p>
      </section>
    );
  }

  const currentAssets = inventoryTypes.includes(activeTab) ? assets[activeTab] || [] : [];

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Allotments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage systems, peripherals, and employee allocations.</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 border rounded-sm px-3 py-2 text-sm"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-100">
          {[
            ["Employees", stats.employees],
            ["Active Allocations", stats.active],
            ["Total Assets", stats.totalAssets],
            ["Free Assets", stats.availableAssets],
          ].map(([label, value]) => (
            <div key={label} className="p-4 border-r border-gray-100">
              <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto p-3">
          {assetTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                resetAsset();
              }}
              className={`shrink-0 rounded-sm border px-3 py-2 text-sm font-semibold ${
                activeTab === tab.key
                  ? "bg-[#f84525] text-white border-[#f84525]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "assign" && (
        <form onSubmit={saveAssignment} className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">{editingAssignmentId ? "Edit Allocation" : "Allocate Assets"}</h2>
              <p className="text-xs text-gray-500">Only free employees and available assets are shown.</p>
            </div>
            {editingAssignmentId && (
              <Button text="Cancel Edit" variant="secondary" onClick={resetAssignment}>
                <span className="inline-flex items-center gap-2"><FiX /> Cancel Edit</span>
              </Button>
            )}
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
            <label className={labelClass}>
              Employee
              <select
                value={assignmentForm.employee}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, employee: e.target.value }))}
                className={fieldClass}
                disabled={!canEdit}
              >
                <option value="">Select employee</option>
                {selectableEmployees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.employeeId || "-"} - {employee.name}
                  </option>
                ))}
              </select>
            </label>

            {[
              ["system", "systemAsset", "System"],
              ["monitor", "monitorAsset", "Monitor"],
              ["keyboard", "keyboardAsset", "Keyboard"],
              ["mouse", "mouseAsset", "Mouse"],
              ["headphone", "headphoneAsset", "Headphone"],
            ].map(([type, field, label]) => (
              <label key={field} className={labelClass}>
                {label}
                <select
                  value={assignmentForm[field]}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  className={fieldClass}
                  disabled={!canEdit}
                >
                  <option value="">{type === "system" ? "Select system" : `No ${label.toLowerCase()}`}</option>
                  {selectableAssets(type, assignmentForm[field]).map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {assetOptionLabel(asset)}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            <label className={labelClass}>
              Assigned Date
              <input
                type="date"
                value={assignmentForm.assignedDate}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, assignedDate: e.target.value }))}
                className={fieldClass}
                disabled={!canEdit}
              />
            </label>
            <label className={labelClass}>
              Location / Dept
              <input
                value={assignmentForm.locationDept}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, locationDept: e.target.value }))}
                className={fieldClass}
                disabled={!canEdit}
              />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Notes
              <input
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                className={fieldClass}
                disabled={!canEdit}
              />
            </label>
          </div>

          <div className="px-4 py-3 border-t flex justify-end">
            <Button type="submit" text={editingAssignmentId ? "Save Changes" : "Allocate"} loading={saving} disabled={!canEdit}>
              <span className="inline-flex items-center gap-2"><FiPlus /> {editingAssignmentId ? "Save Changes" : "Allocate"}</span>
            </Button>
          </div>
        </form>
      )}

      {activeTab === "allotments" && (
        <section className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">Current Allotments</h2>
              <p className="text-xs text-gray-500">Edit an allocation to change employee assets, or release it to free inventory.</p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or asset ID"
              className="border border-gray-300 rounded-sm px-3 py-2 text-sm md:w-72"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">System</th>
                  <th className="text-left px-4 py-3">Peripherals</th>
                  <th className="text-left px-4 py-3">Assigned</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllotments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No allotments found.</td>
                  </tr>
                ) : (
                  filteredAllotments.map((item) => (
                    <tr key={item._id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{item.employee?.name || "Inventory"}</p>
                        <p className="text-xs text-gray-500">{item.employee?.employeeId || "-"} {item.employee?.department ? `| ${item.employee.department}` : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{assignmentTitle(item)}</p>
                        <p className="text-xs text-gray-500">{item.systemAsset?.assetId || item.assetTag || item.serialNumber || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        {[
                          item.monitorAsset && `Monitor: ${item.monitorAsset.assetId}`,
                          item.keyboardAsset && `Keyboard: ${item.keyboardAsset.assetId}`,
                          item.mouseAsset && `Mouse: ${item.mouseAsset.assetId}`,
                          item.headphoneAsset && `Headphone: ${item.headphoneAsset.assetId}`,
                        ].filter(Boolean).join(" | ") || "-"}
                      </td>
                      <td className="px-4 py-3">{item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-sm border text-xs font-semibold ${statusTone[item.status] || statusTone.inactive}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => fillAssignment(item)} className="p-2 rounded-sm border hover:bg-gray-50" title="Edit">
                              <FiEdit2 />
                            </button>
                            <button type="button" onClick={() => releaseAssignment(item)} className="p-2 rounded-sm border text-red-600 hover:bg-red-50" title="Release">
                              <FiTrash2 />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {inventoryTypes.includes(activeTab) && (
        <section className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
          <form onSubmit={saveAsset} className="bg-white rounded-sm shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-900">{editingAssetId ? `Edit ${titleCase(activeTab)}` : `Add ${titleCase(activeTab)}`}</h2>
              <p className="text-xs text-gray-500">Each saved item receives an automatic asset ID.</p>
            </div>
            <div className="p-4 grid grid-cols-1 gap-3">
              {[
                ["name", "Name"],
                ["brand", "Brand"],
                ["model", "Model"],
                ["serialNumber", "Serial Number"],
              ].map(([field, label]) => (
                <label key={field} className={labelClass}>
                  {label}
                  <input value={assetForm[field]} onChange={(e) => setAssetForm((prev) => ({ ...prev, [field]: e.target.value }))} className={fieldClass} disabled={!canEdit} />
                </label>
              ))}

              {activeTab === "system" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                  {[
                    ["processor", "Processor"],
                    ["ram", "RAM"],
                    ["storage", "Storage"],
                    ["operatingSystem", "Operating System"],
                  ].map(([field, label]) => (
                    <label key={field} className={labelClass}>
                      {label}
                      <input value={assetForm[field]} onChange={(e) => setAssetForm((prev) => ({ ...prev, [field]: e.target.value }))} className={fieldClass} disabled={!canEdit} />
                    </label>
                  ))}
                </div>
              )}

              {activeTab === "monitor" && (
                <label className={labelClass}>
                  Display Size
                  <input value={assetForm.displaySize} onChange={(e) => setAssetForm((prev) => ({ ...prev, displaySize: e.target.value }))} className={fieldClass} disabled={!canEdit} />
                </label>
              )}

              <label className={labelClass}>
                Status
                <select value={assetForm.status} onChange={(e) => setAssetForm((prev) => ({ ...prev, status: e.target.value }))} className={fieldClass} disabled={!canEdit}>
                  <option value="available">Available</option>
                  <option value="allocated">Allocated</option>
                  <option value="repair">Repair</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                <label className={labelClass}>
                  Purchase Date
                  <input type="date" value={assetForm.purchaseDate} onChange={(e) => setAssetForm((prev) => ({ ...prev, purchaseDate: e.target.value }))} className={fieldClass} disabled={!canEdit} />
                </label>
                <label className={labelClass}>
                  Warranty Expiry
                  <input type="date" value={assetForm.warrantyExpiry} onChange={(e) => setAssetForm((prev) => ({ ...prev, warrantyExpiry: e.target.value }))} className={fieldClass} disabled={!canEdit} />
                </label>
              </div>

              {[
                ["cost", "Cost"],
                ["locationDept", "Location / Dept"],
                ["notes", "Notes"],
              ].map(([field, label]) => (
                <label key={field} className={labelClass}>
                  {label}
                  <input value={assetForm[field]} onChange={(e) => setAssetForm((prev) => ({ ...prev, [field]: e.target.value }))} className={fieldClass} disabled={!canEdit} />
                </label>
              ))}
            </div>
            <div className="px-4 py-3 border-t flex flex-wrap justify-end gap-2">
              {editingAssetId && <Button text="Cancel" variant="secondary" onClick={resetAsset} />}
              <Button type="submit" text={editingAssetId ? "Save" : "Add"} loading={saving} disabled={!canEdit} />
            </div>
          </form>

          <div className="bg-white rounded-sm shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-900">{titleCase(activeTab)} List</h2>
              <p className="text-xs text-gray-500">Allocated items are hidden from assignment dropdowns until released.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Asset ID</th>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Serial</th>
                    <th className="text-left px-4 py-3">Details</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAssets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No {activeTab} assets found.</td>
                    </tr>
                  ) : (
                    currentAssets.map((asset) => (
                      <tr key={asset._id} className="border-t">
                        <td className="px-4 py-3 font-semibold text-gray-900">{asset.assetId}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{assetName(asset)}</p>
                          <p className="text-xs text-gray-500">{[asset.brand, asset.model].filter(Boolean).join(" ") || "-"}</p>
                        </td>
                        <td className="px-4 py-3">{asset.serialNumber || "-"}</td>
                        <td className="px-4 py-3">
                          {activeTab === "system"
                            ? [asset.processor, asset.ram, asset.storage, asset.operatingSystem].filter(Boolean).join(" | ") || "-"
                            : activeTab === "monitor"
                            ? asset.displaySize || "-"
                            : asset.notes || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-sm border text-xs font-semibold ${statusTone[asset.status] || statusTone.inactive}`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {canEdit && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => fillAsset(asset)} className="p-2 rounded-sm border hover:bg-gray-50" title="Edit">
                                <FiEdit2 />
                              </button>
                              <button type="button" onClick={() => deleteAsset(asset)} className="p-2 rounded-sm border text-red-600 hover:bg-red-50" title="Remove">
                                <FiTrash2 />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SystemAllotments;
