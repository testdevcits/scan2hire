import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FiCopy, FiEdit2, FiEye, FiPlus, FiRefreshCw, FiTrash2, FiX } from "react-icons/fi";
import { employeeApi, hrApi } from "../api";
import Button from "../components/common/Button";
import CommonLoader from "../components/common/CommonLoader";
import Pagination, { usePagination } from "../components/common/Pagination";
import { AuthContext } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { useToast } from "../contexts/ToastContext";

const assetTabs = [
  { key: "assign", label: "Assign" },
  { key: "my-assets", label: "My Assigned Assets" },
  { key: "allotments", label: "Allotments" },
  { key: "system", label: "Systems" },
  { key: "monitor", label: "Monitors" },
  { key: "keyboard", label: "Keyboards" },
  { key: "mouse", label: "Mouse" },
  { key: "headphone", label: "Headphones" },
  { key: "webcam", label: "Webcams" },
  { key: "buds", label: "Buds" },
];

const inventoryTypes = ["system", "monitor", "keyboard", "mouse", "headphone", "webcam", "buds"];

const emptyAssignment = {
  employee: "",
  systemAsset: "",
  monitorAsset: "",
  keyboardAsset: "",
  mouseAsset: "",
  headphoneAsset: "",
  webcamAsset: "",
  budsAsset: "",
  assignmentType: "office",
  assignedDate: new Date().toISOString().slice(0, 10),
  returnDate: "",
};

const emptyAsset = {
  name: "",
  brand: "",
  model: "",
  serialNumber: "",
  status: "available",
  systemType: "desktop",
  processor: "",
  ram: "",
  storage: "",
  operatingSystem: "",
  displaySize: "",
  purchaseDate: "",
  warrantyExpiry: "",
  cost: "",
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

const displayDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const assignmentTypeLabels = {
  office: "Office",
  work_from_home: "Work From Home",
  temporary: "Temporary",
  other: "Other",
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

const SystemAllotments = ({ selfOnly = false }) => {
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
  const [viewingAllotment, setViewingAllotment] = useState(null);
  const visibleTabs = canEdit ? assetTabs : [{ key: "allotments", label: "My Assigned Assets" }];

  const loadData = useCallback(async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const accessReq = isEmployeeRoute
        ? employeeApi.getMyAccess()
        : Promise.resolve({ data: { data: { systemAllotmentManage: true } } });
      const employeesReq = isEmployeeRoute ? employeeApi.getSystemAllotmentEmployees() : hrApi.getEmployees();
      const [accessRes, employeesRes, allotmentsRes] = await Promise.all([
        accessReq,
        employeesReq,
        api.getSystemAllotments(),
      ]);
      const allowed = !selfOnly && (!isEmployeeRoute || Boolean(accessRes?.data?.data?.systemAllotmentManage));
      const assetResponses = allowed
        ? await Promise.all(inventoryTypes.map((type) => api.getSystemAssets(type)))
        : [];
      setCanEdit(allowed);
      if (!allowed) setActiveTab("allotments");
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
  }, [api, isEmployeeRoute, selfOnly, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAssignments = useMemo(
    () => allotments.filter((item) => item.status === "assigned" && item.employee),
    [allotments]
  );

  const myEmployeeId = useMemo(() => {
    const email = String(user?.email || "").trim().toLowerCase();
    if (!email) return "";
    return employees.find((employee) => String(employee.email || "").trim().toLowerCase() === email)?._id || "";
  }, [employees, user?.email]);

  const myAllotments = useMemo(
    () =>
      myEmployeeId
        ? allotments.filter((item) => String(item.employee?._id || item.employee || "") === String(myEmployeeId))
        : [],
    [allotments, myEmployeeId]
  );

  const selectableEmployees = useMemo(
    () => employees,
    [employees]
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
        item.webcamAsset?.assetId,
        item.budsAsset?.assetId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [allotments, search]);

  const assignedAssetRows = useCallback((item) => {
    return [
      ["PC / System", item.systemAsset, item.systemName || item.assetTag || item.serialNumber],
      ["Monitor", item.monitorAsset],
      ["Keyboard", item.keyboardAsset],
      ["Mouse", item.mouseAsset],
      ["Headphone", item.headphoneAsset],
      ["Webcam", item.webcamAsset],
      ["Buds", item.budsAsset],
    ]
      .map(([label, asset, fallback]) => ({
        label,
        name: asset ? assetName(asset) : fallback || "",
        assetId: asset?.assetId || "",
        serialNumber: asset?.serialNumber || "",
        details: [
          asset?.assetType === "system" && asset?.systemType,
          asset?.processor,
          asset?.ram,
          asset?.storage,
          asset?.operatingSystem,
          asset?.displaySize,
        ].filter(Boolean).join(" | "),
      }))
      .filter((row) => row.name || row.assetId || row.serialNumber);
  }, []);

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
      webcamAsset: item.webcamAsset?._id || "",
      budsAsset: item.budsAsset?._id || "",
      assignmentType: item.assignmentType || "office",
      assignedDate: formatDate(item.assignedDate) || emptyAssignment.assignedDate,
      returnDate: formatDate(item.returnDate),
    });
    setActiveTab("assign");
  };

  const saveAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.employee || !assignmentForm.systemAsset) {
      toast.error("Select employee and system first");
      return;
    }
    if (
      assignmentForm.assignedDate &&
      assignmentForm.returnDate &&
      new Date(assignmentForm.returnDate) < new Date(assignmentForm.assignedDate)
    ) {
      toast.error("To date cannot be before from date");
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
      title: "Delete Allocation",
      message: `${assignmentTitle(item)} allocation will be deleted and selected assets will become free.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.deleteSystemAllotment(item._id);
      toast.success("Allocation deleted");
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
      systemType: asset.systemType || "desktop",
      processor: asset.processor || "",
      ram: asset.ram || "",
      storage: asset.storage || "",
      operatingSystem: asset.operatingSystem || "",
      displaySize: asset.displaySize || "",
      purchaseDate: formatDate(asset.purchaseDate),
      warrantyExpiry: formatDate(asset.warrantyExpiry),
      cost: asset.cost || "",
    });
  };

  const copyAsset = (asset) => {
    setEditingAssetId("");
    setAssetForm({
      name: asset.name || "",
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: "",
      status: "available",
      systemType: asset.systemType || "desktop",
      processor: asset.processor || "",
      ram: asset.ram || "",
      storage: asset.storage || "",
      operatingSystem: asset.operatingSystem || "",
      displaySize: asset.displaySize || "",
      purchaseDate: formatDate(asset.purchaseDate),
      warrantyExpiry: formatDate(asset.warrantyExpiry),
      cost: asset.cost || "",
    });
    toast.success("Asset copied. Add serial number and save.");
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
      toast.success("Asset deleted");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove asset");
    }
  };

  const fieldClass = "mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/10";
  const labelClass = "text-sm font-medium text-gray-700";
  const currentAssets = inventoryTypes.includes(activeTab) ? assets[activeTab] || [] : [];
  const personalAllotments = selfOnly ? myAllotments : filteredAllotments;
  const personalPagination = usePagination(personalAllotments, [selfOnly, search]);
  const myAssetsPagination = usePagination(myAllotments, [activeTab]);
  const allotmentsPagination = usePagination(filteredAllotments, [activeTab, search]);
  const assetsPagination = usePagination(currentAssets, [activeTab]);

  if (loading) return <CommonLoader text="Loading system allotments..." />;
  if (accessDenied) {
    return (
      <section className="bg-white rounded-sm shadow p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">Access Not Allowed</h1>
        <p className="text-sm text-gray-500 mt-2">Admin has not allowed system allotment access for your employee account.</p>
      </section>
    );
  }

  if (!canEdit) {
    return (
      <div className="space-y-4">
        <section className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Assigned Assets</h1>
              <p className="text-sm text-gray-500 mt-1">Your assigned PC and accessories.</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 border border-gray-200 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
            >
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </section>

        {personalAllotments.length === 0 ? (
          <section className="bg-white rounded-lg shadow-sm border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No system or accessories are assigned to you yet.
          </section>
        ) : (
          <>
          {personalPagination.pageItems.map((item) => (
            <section key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{assignmentTitle(item)}</h2>
                  <p className="text-sm text-gray-500">
                    {assignmentTypeLabels[item.assignmentType] || "Office"} | {displayDate(item.assignedDate)} to {displayDate(item.returnDate)}
                  </p>
                </div>
                <span className={`w-fit px-2 py-1 rounded-sm border text-xs font-semibold ${statusTone[item.status] || statusTone.inactive}`}>
                  {item.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {assignedAssetRows(item).map((asset) => (
                  <div key={asset.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{asset.label}</p>
                    <p className="mt-2 font-semibold text-gray-900 break-words">{asset.name || "-"}</p>
                    <p className="mt-1 text-xs text-gray-500 break-words">
                      {[asset.assetId, asset.serialNumber && `SN ${asset.serialNumber}`].filter(Boolean).join(" | ") || "-"}
                    </p>
                    {asset.details && <p className="mt-2 text-xs text-gray-600 break-words">{asset.details}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
          <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <Pagination {...personalPagination} />
          </section>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{canEdit ? "System Allotments" : "My Assigned Assets"}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {canEdit
                ? "Add inventory, allocate complete desktop kits, and keep every asset from being double-booked."
                : "View the system and accessories currently assigned to you."}
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 border border-gray-200 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
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

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-10 gap-2 p-3 bg-gray-50">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                resetAsset();
              }}
              className={`rounded-md border px-3 py-3 text-left text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-[#f84525] text-white border-[#f84525] shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#f84525]/40 hover:bg-[#fff5f3]"
              }`}
            >
              <span className="block">{tab.label}</span>
              <span className={`mt-1 block text-xs font-medium ${activeTab === tab.key ? "text-white/80" : "text-gray-500"}`}>
                {tab.key === "assign"
                  ? "Dropdown allocation"
                  : tab.key === "my-assets"
                  ? `${myAllotments.length} assigned`
                  : tab.key === "allotments"
                  ? `${filteredAllotments.length} record${filteredAllotments.length === 1 ? "" : "s"}`
                  : `${assets[tab.key]?.length || 0} item${assets[tab.key]?.length === 1 ? "" : "s"}`}
              </span>
            </button>
          ))}
        </div>
      </section>

      {activeTab === "assign" && (
        <form onSubmit={saveAssignment} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">{editingAssignmentId ? "Edit Allocation" : "Allocate Complete Setup"}</h2>
              <p className="text-xs text-gray-500">Start with employee, then pick available system and accessories from dropdowns.</p>
            </div>
            {editingAssignmentId && (
              <Button text="Cancel Edit" variant="secondary" onClick={resetAssignment}>
                <span className="inline-flex items-center gap-2"><FiX /> Cancel Edit</span>
              </Button>
            )}
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <label className={`${labelClass} lg:col-span-1`}>
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
                    {employee.employeeId || "-"} - {employee.name}{String(employee._id) === String(myEmployeeId) ? " (Self)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Assignment Type
              <select
                value={assignmentForm.assignmentType}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, assignmentType: e.target.value }))}
                className={fieldClass}
                disabled={!canEdit}
              >
                <option value="office">Office</option>
                <option value="work_from_home">Work From Home</option>
                <option value="temporary">Temporary</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className={labelClass}>
              From Date
              <input
                type="date"
                value={assignmentForm.assignedDate}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, assignedDate: e.target.value }))}
                className={fieldClass}
                disabled={!canEdit}
              />
            </label>
            <label className={labelClass}>
              To Date / Return Date
              <input
                type="date"
                value={assignmentForm.returnDate}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, returnDate: e.target.value }))}
                className={fieldClass}
                disabled={!canEdit}
              />
            </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
            {[
              ["system", "systemAsset", "System"],
              ["monitor", "monitorAsset", "Monitor"],
              ["keyboard", "keyboardAsset", "Keyboard"],
              ["mouse", "mouseAsset", "Mouse"],
              ["headphone", "headphoneAsset", "Headphone"],
              ["webcam", "webcamAsset", "Webcam"],
              ["buds", "budsAsset", "Buds"],
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
            </div>

          </div>

          <div className="px-5 py-4 border-t flex justify-end">
            <Button type="submit" text={editingAssignmentId ? "Save Changes" : "Allocate"} loading={saving} disabled={!canEdit}>
              <span className="inline-flex items-center gap-2"><FiPlus /> {editingAssignmentId ? "Save Changes" : "Allocate"}</span>
            </Button>
          </div>
        </form>
      )}

      {activeTab === "my-assets" && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-900">My Assigned Assets</h2>
            <p className="text-xs text-gray-500">Your assigned PC and accessories.</p>
          </div>
          <div className="p-5">
            {myAllotments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No system or accessories are assigned to you yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myAssetsPagination.pageItems.map((item) => (
                  <div key={item._id} className="space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{assignmentTitle(item)}</p>
                      <p className="text-xs text-gray-500">
                        {assignmentTypeLabels[item.assignmentType] || "Office"} | {displayDate(item.assignedDate)} to {displayDate(item.returnDate)}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                      {assignedAssetRows(item).map((asset) => (
                        <div key={asset.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{asset.label}</p>
                          <p className="mt-2 font-semibold text-gray-900 break-words">{asset.name || "-"}</p>
                          <p className="mt-1 text-xs text-gray-500 break-words">
                            {[asset.assetId, asset.serialNumber && `SN ${asset.serialNumber}`].filter(Boolean).join(" | ") || "-"}
                          </p>
                          {asset.details && <p className="mt-2 text-xs text-gray-600 break-words">{asset.details}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Pagination {...myAssetsPagination} />
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "allotments" && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">{canEdit ? "Current Allotments" : "Assigned To You"}</h2>
              <p className="text-xs text-gray-500">
                {canEdit
                  ? "Edit an allocation to change employee assets, or release it to free inventory."
                  : "These are the assets currently mapped to your employee profile."}
              </p>
            </div>
            {canEdit && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee or asset ID"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm md:w-72 focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/10"
              />
            )}
          </div>

          {!canEdit ? (
            <div className="p-5">
              {filteredAllotments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  No system or accessories are assigned to you yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {allotmentsPagination.pageItems.map((item) => (
                    <article key={item._id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{assignmentTitle(item)}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                          {assignmentTypeLabels[item.assignmentType] || "Office"} | {displayDate(item.assignedDate)} to {displayDate(item.returnDate)}
                          </p>
                        </div>
                        <span className={`w-fit px-2 py-1 rounded-sm border text-xs font-semibold ${statusTone[item.status] || statusTone.inactive}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {assignedAssetRows(item).map((asset) => (
                          <div key={asset.label} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{asset.label}</p>
                            <p className="mt-1 font-semibold text-gray-900 break-words">{asset.name}</p>
                            <p className="mt-1 text-xs text-gray-500 break-words">
                              {[asset.assetId, asset.serialNumber && `SN ${asset.serialNumber}`].filter(Boolean).join(" | ") || "-"}
                            </p>
                            {asset.details && <p className="mt-2 text-xs text-gray-600 break-words">{asset.details}</p>}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                  <Pagination {...allotmentsPagination} />
                </div>
              )}
            </div>
          ) : (
          <>
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
                  allotmentsPagination.pageItems.map((item) => (
                    <tr key={item._id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{item.employee?.name || "Inventory"}</p>
                        <p className="text-xs text-gray-500">{item.employee?.employeeId || "-"} {item.employee?.department ? `| ${item.employee.department}` : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{assignmentTitle(item)}</p>
                        <p className="text-xs text-gray-500">{item.systemAsset?.assetId || item.assetTag || item.serialNumber || "-"}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.systemType || item.systemAsset?.systemType || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        {[
                          item.monitorAsset && `Monitor: ${item.monitorAsset.assetId}`,
                          item.keyboardAsset && `Keyboard: ${item.keyboardAsset.assetId}`,
                          item.mouseAsset && `Mouse: ${item.mouseAsset.assetId}`,
                          item.headphoneAsset && `Headphone: ${item.headphoneAsset.assetId}`,
                          item.webcamAsset && `Webcam: ${item.webcamAsset.assetId}`,
                          item.budsAsset && `Buds: ${item.budsAsset.assetId}`,
                        ].filter(Boolean).join(" | ") || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <p>{displayDate(item.assignedDate)} to {displayDate(item.returnDate)}</p>
                        <p className="text-xs text-gray-500">{assignmentTypeLabels[item.assignmentType] || "Office"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-sm border text-xs font-semibold ${statusTone[item.status] || statusTone.inactive}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setViewingAllotment(item)} className="p-2 rounded-md border hover:bg-gray-50" title="View">
                            <FiEye />
                          </button>
                          <button type="button" onClick={() => fillAssignment(item)} className="p-2 rounded-md border hover:bg-gray-50" title="Edit">
                            <FiEdit2 />
                          </button>
                          <button type="button" onClick={() => releaseAssignment(item)} className="p-2 rounded-md border text-red-600 hover:bg-red-50" title="Delete">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination {...allotmentsPagination} />
          </>
          )}
        </section>
      )}

      {inventoryTypes.includes(activeTab) && (
        <section className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
          <form onSubmit={saveAsset} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-900">{editingAssetId ? `Edit ${titleCase(activeTab)}` : `Add ${titleCase(activeTab)}`}</h2>
              <p className="text-xs text-gray-500">Each saved item receives an automatic asset ID.</p>
            </div>
            <div className="p-5 grid grid-cols-1 gap-3">
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
                  <label className={labelClass}>
                    System Type
                    <select value={assetForm.systemType} onChange={(e) => setAssetForm((prev) => ({ ...prev, systemType: e.target.value }))} className={fieldClass} disabled={!canEdit}>
                      <option value="desktop">Desktop</option>
                      <option value="laptop">Laptop</option>
                      <option value="server">Server</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
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
              ].map(([field, label]) => (
                <label key={field} className={labelClass}>
                  {label}
                  <input value={assetForm[field]} onChange={(e) => setAssetForm((prev) => ({ ...prev, [field]: e.target.value }))} className={fieldClass} disabled={!canEdit} />
                </label>
              ))}
            </div>
            <div className="px-5 py-4 border-t flex flex-wrap justify-end gap-2">
              {editingAssetId && <Button text="Cancel" variant="secondary" onClick={resetAsset} />}
              <Button type="submit" text={editingAssetId ? "Save" : "Add"} loading={saving} disabled={!canEdit} />
            </div>
          </form>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b">
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
                    assetsPagination.pageItems.map((asset) => (
                      <tr key={asset._id} className="border-t">
                        <td className="px-4 py-3 font-semibold text-gray-900">{asset.assetId}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{assetName(asset)}</p>
                          <p className="text-xs text-gray-500">{[asset.brand, asset.model].filter(Boolean).join(" ") || "-"}</p>
                        </td>
                        <td className="px-4 py-3">{asset.serialNumber || "-"}</td>
                        <td className="px-4 py-3">
                          {activeTab === "system"
                            ? [asset.systemType, asset.processor, asset.ram, asset.storage, asset.operatingSystem].filter(Boolean).join(" | ") || "-"
                            : activeTab === "monitor"
                            ? asset.displaySize || "-"
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-sm border text-xs font-semibold ${statusTone[asset.status] || statusTone.inactive}`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {canEdit && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => copyAsset(asset)} className="p-2 rounded-sm border hover:bg-gray-50" title="Copy">
                                <FiCopy />
                              </button>
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
            <Pagination {...assetsPagination} />
          </div>
        </section>
      )}

      {viewingAllotment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{viewingAllotment.employee?.name || "Inventory"}</h2>
                <p className="text-sm text-gray-500">
                  {viewingAllotment.employee?.employeeId || "-"} | {assignmentTypeLabels[viewingAllotment.assignmentType] || "Office"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAllotment(null)}
                className="rounded-md border border-gray-200 p-2 hover:bg-gray-50"
                title="Close"
              >
                <FiX />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Period</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {displayDate(viewingAllotment.assignedDate)} to {displayDate(viewingAllotment.returnDate)}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Status</p>
                  <p className="mt-1 font-semibold capitalize text-gray-900">{viewingAllotment.status || "-"}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {assignedAssetRows(viewingAllotment).map((asset) => (
                  <div key={asset.label} className="rounded-md border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{asset.label}</p>
                    <p className="mt-2 font-semibold text-gray-900 break-words">{asset.name || "-"}</p>
                    <p className="mt-1 text-xs text-gray-500 break-words">
                      {[asset.assetId, asset.serialNumber && `SN ${asset.serialNumber}`].filter(Boolean).join(" | ") || "-"}
                    </p>
                    {asset.details && <p className="mt-2 text-xs text-gray-600 break-words">{asset.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default SystemAllotments;
