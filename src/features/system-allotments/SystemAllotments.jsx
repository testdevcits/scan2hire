/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FiCopy,
  FiClock,
  FiEdit2,
  FiEye,
  FiHeadphones,
  FiMonitor,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { BsPc } from "react-icons/bs";
import { BsKeyboard, BsMouse2, BsEarbuds } from "react-icons/bs";

import Button from "../../components/ui/Button";
import CommonTable from "../../components/ui/Table/CommonTable";
import CommonLoader from "../../components/ui/CommonLoader";
import CommonModal from "../../components/ui/Modal/CommonModal";
import CalendarPicker from "../../components/ui/CalendarPicker/CalendarPicker";
import CustomDropdown from "../../components/ui/Select/CustomDropdown";
import EmptyState from "../../components/ui/EmptyState";
import InputField from "../../components/ui/Input/InputField";
import Pagination, { usePagination } from "../../components/ui/Pagination";
import { MetricCard } from "../../components/ui/ReusableCards";
import SearchInput from "../../components/ui/Input/SearchInput";
import Tabs from "../../components/ui/Tabs";
import { AuthContext } from "../../contexts/AuthContext";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const assetTabs = [
  { key: "assign", label: "Assign" },
  { key: "my-assets", label: "My Assigned Assets" },
  { key: "allotments", label: "Allotments" },
  { key: "history", label: "History" },
  { key: "system", label: "Systems" },
  { key: "monitor", label: "Monitors" },
  { key: "keyboard", label: "Keyboards" },
  { key: "mouse", label: "Mouse" },
  { key: "headphone", label: "Headphones" },
  { key: "webcam", label: "Webcams" },
  { key: "buds", label: "Buds" },
];

const inventoryTypes = ["system", "monitor", "keyboard", "mouse", "headphone", "webcam", "buds"];
const assetModalLabelClass = "!text-sm !font-medium !text-left !text-gray-700 dark:!text-gray-200";
const assetModalControlClass = "!min-h-10 !text-sm";

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

const assetIcons = {
  "PC / System": <BsPc />,
  Monitor: <FiMonitor />,
  Keyboard: <BsKeyboard />,
  Mouse: <BsMouse2 />,
  Headphone: <FiHeadphones />,
  Webcam: <FiVideo />,
  Buds: <BsEarbuds />,
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

const needsEndDate = (assignmentType) => ["work_from_home", "temporary"].includes(assignmentType);

const allocationPeriodText = (item = {}) => {
  const from = displayDate(item.assignedDate);
  const to = displayDate(item.returnDate);
  if (item.assignmentType === "work_from_home") return `WFH from ${from} to ${to}`;
  if (item.assignmentType === "temporary") return `Temporary from ${from} to ${to}`;
  if (item.returnDate) return `${from} to ${to}`;
  return `Allocated on ${from}`;
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

const getTabMeta = ({ tab, myAllotments, filteredAllotments, assets }) => {
  if (tab.key === "assign") return { count: "+", hint: "New" };
  if (tab.key === "my-assets") return { count: myAllotments.length, hint: "Mine" };
  if (tab.key === "allotments") return { count: filteredAllotments.length, hint: "All" };
  if (tab.key === "history") {
    const count = filteredAllotments.reduce((sum, item) => sum + (item.history?.length || 0), 0);
    return { count, hint: "Log" };
  }
  return { count: assets[tab.key]?.length || 0, hint: "Stock" };
};

const formatAction = (action = "") => action.replace(/_/g, " ");

const snapshotSummary = (snapshot = {}) =>
  [
    snapshot.systemName,
    snapshot.systemAsset,
    snapshot.monitorAsset,
    snapshot.keyboardAsset,
    snapshot.mouseAsset,
    snapshot.headphoneAsset,
    snapshot.webcamAsset,
    snapshot.budsAsset,
  ]
    .filter(Boolean)
    .slice(0, 3)
    .join(" | ") || "-";

// Card used for a single assigned item — icon + name + IDs, employee-facing style
const AssetItemCard = ({ asset }) => (
  <div className="group relative rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#f84525]/30 hover:shadow-md">
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#fff5f3] to-[#ffe4de] text-lg text-[#f84525]">
        {assetIcons[asset.label] || <FiMonitor />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {asset.label}
          </p>
          {asset.assetId && (
            <span className="shrink-0 rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
              {asset.assetId}
            </span>
          )}
        </div>

        <p className="mt-1 truncate font-semibold text-gray-900" title={asset.name}>
          {asset.name || "-"}
        </p>

        {asset.serialNumber && (
          <p className="mt-0.5 text-xs text-gray-500">SN {asset.serialNumber}</p>
        )}

        {asset.details && (
          <p
            className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-600"
            title={asset.details}
          >
            {asset.details}
          </p>
        )}
      </div>
    </div>
  </div>
);

const SystemAllotments = ({ selfOnly = false }) => {
  const { employeeApi, hrApi } = useApi();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const toast = useToast();
  const { confirm } = useModal();
  const isEmployeeRoute = location.pathname.startsWith("/employee");
  const canDelete = user?.role === "superadmin";
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
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewingAllotment, setViewingAllotment] = useState(null);
  const visibleTabs = canEdit ? assetTabs : [{ key: "allotments", label: "My Assigned Assets" }];

  const loadData = useCallback(async () => {
    setAccessDenied(false);
    try {
      const overviewRes = await api.getSystemAllotmentOverview(
        selfOnly ? { scope: "mine" } : undefined
      );
      const overview = overviewRes?.data?.data || {};
      const allowed = !selfOnly && Boolean(overview.canEdit);
      setCanEdit(allowed);
      if (!allowed) setActiveTab("allotments");
      setEmployees(overview.employees || []);
      setAllotments(overview.allotments || []);
      setAssets(
        inventoryTypes.reduce((acc, type) => {
          acc[type] = overview.assets?.[type] || [];
          return acc;
        }, {})
      );
    } catch (err) {
      if (err.response?.status === 403) setAccessDenied(true);
      else toast.error(err.response?.data?.message || "Unable to load system allotments");
    } finally {
      setLoading(false);
    }
  }, [api, selfOnly, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAssignments = useMemo(
    () => allotments.filter((item) => item.status === "assigned" && item.employee),
    [allotments]
  );

  const myEmployeeId = useMemo(() => {
    const email = String(user?.email || "")
      .trim()
      .toLowerCase();
    if (!email) return "";
    return (
      employees.find(
        (employee) =>
          String(employee.email || "")
            .trim()
            .toLowerCase() === email
      )?._id || ""
    );
  }, [employees, user?.email]);

  const myAllotments = useMemo(
    () =>
      myEmployeeId
        ? allotments.filter(
            (item) => String(item.employee?._id || item.employee || "") === String(myEmployeeId)
          )
        : [],
    [allotments, myEmployeeId]
  );

  const selectableEmployees = useMemo(() => employees, [employees]);

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
      (sum, type) =>
        sum + (assets[type] || []).filter((asset) => asset.status === "available").length,
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

  const historyItems = useMemo(
    () =>
      filteredAllotments
        .flatMap((item) =>
          (item.history || []).map((entry, index) => ({
            ...entry,
            key: `${item._id}-${index}`,
            allotment: item,
          }))
        )
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
    [filteredAllotments]
  );

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
        ]
          .filter(Boolean)
          .join(" | "),
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
    if (needsEndDate(assignmentForm.assignmentType) && !assignmentForm.returnDate) {
      toast.error("Select end date for Work From Home or Temporary allocation");
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
    setAssetModalOpen(true);
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
    setAssetModalOpen(true);
    toast.success("Asset copied. Add serial number and save.");
  };

  const resetAsset = () => {
    setEditingAssetId("");
    setAssetForm(emptyAsset);
    setAssetModalOpen(false);
  };

  const saveAsset = async (e) => {
    e.preventDefault();
    if (!assetForm.name.trim()) {
      toast.error("Asset name is required");
      return;
    }
    const cost = assetForm.cost === "" ? null : Number(assetForm.cost);
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      toast.error("Cost must be a valid non-negative amount");
      return;
    }
    if (
      assetForm.purchaseDate &&
      assetForm.warrantyExpiry &&
      assetForm.warrantyExpiry < assetForm.purchaseDate
    ) {
      toast.error("Warranty expiry cannot be before the purchase date");
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
      title: `Delete ${titleCase(activeTab)}`,
      message: `${assetName(asset)} will be deleted permanently.`,
      confirmText: "Delete",
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

  const currentAssets = inventoryTypes.includes(activeTab) ? assets[activeTab] || [] : [];
  const personalAllotments = selfOnly ? myAllotments : filteredAllotments;
  const myAssetsPagination = usePagination(myAllotments, [activeTab]);
  const allotmentsPagination = usePagination(filteredAllotments, [activeTab, search]);
  const historyPagination = usePagination(historyItems, [activeTab, search]);
  const assetsPagination = usePagination(currentAssets, [activeTab]);
  const allotmentColumns = [
    {
      accessor: "employee",
      header: "Employee",
      render: (_, item) => (
        <>
          <p className="font-semibold text-gray-900">{item.employee?.name || "Inventory"}</p>
          <p className="text-xs text-gray-500">
            {item.employee?.employeeId || "-"}
            {item.employee?.department ? ` | ${item.employee.department}` : ""}
          </p>
        </>
      ),
    },
    {
      accessor: "systemName",
      header: "System",
      render: (_, item) => (
        <>
          <p className="font-medium">{assignmentTitle(item)}</p>
          <p className="text-xs text-gray-500">
            {item.systemAsset?.assetId || item.assetTag || item.serialNumber || "-"}
          </p>
          <p className="text-xs capitalize text-gray-500">
            {item.systemType || item.systemAsset?.systemType || "-"}
          </p>
        </>
      ),
    },
    {
      accessor: "peripherals",
      header: "Peripherals",
      render: (_, item) =>
        [
          item.monitorAsset && `Monitor: ${item.monitorAsset.assetId}`,
          item.keyboardAsset && `Keyboard: ${item.keyboardAsset.assetId}`,
          item.mouseAsset && `Mouse: ${item.mouseAsset.assetId}`,
          item.headphoneAsset && `Headphone: ${item.headphoneAsset.assetId}`,
          item.webcamAsset && `Webcam: ${item.webcamAsset.assetId}`,
          item.budsAsset && `Buds: ${item.budsAsset.assetId}`,
        ]
          .filter(Boolean)
          .join(" | ") || "-",
    },
    {
      accessor: "assignedDate",
      header: "Assigned",
      render: (_, item) => (
        <>
          <p>{allocationPeriodText(item)}</p>
          <p className="text-xs text-gray-500">
            {assignmentTypeLabels[item.assignmentType] || "Office"}
          </p>
        </>
      ),
    },
    {
      accessor: "status",
      header: "Status",
      render: (status) => (
        <span
          className={`rounded-sm border px-2 py-1 text-xs font-semibold ${statusTone[status] || statusTone.inactive}`}
        >
          {status}
        </span>
      ),
    },
  ];
  const allotmentActions = [
    {
      key: "view",
      title: "View",
      iconOnly: true,
      icon: <FiEye />,
      className: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      onClick: setViewingAllotment,
    },
    {
      key: "edit",
      title: "Edit",
      iconOnly: true,
      icon: <FiEdit2 />,
      className: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      onClick: fillAssignment,
    },
    ...(canDelete
      ? [
          {
            key: "delete",
            title: "Delete",
            iconOnly: true,
            icon: <FiTrash2 />,
            className: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
            onClick: releaseAssignment,
          },
        ]
      : []),
  ];
  const historyColumns = [
    { accessor: "updatedAt", header: "Date", render: displayDate },
    {
      accessor: "employee",
      header: "Employee",
      render: (_, entry) => (
        <>
          <p className="font-semibold text-gray-900">
            {entry.allotment.employee?.name || "Inventory"}
          </p>
          <p className="text-xs text-gray-500">{entry.allotment.employee?.employeeId || "-"}</p>
        </>
      ),
    },
    {
      accessor: "action",
      header: "Action",
      render: (action) => (
        <span className="inline-flex items-center gap-1 rounded-sm border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold capitalize">
          <FiClock /> {formatAction(action)}
        </span>
      ),
    },
    {
      accessor: "system",
      header: "System",
      render: (_, entry) => (
        <>
          <p className="font-medium">
            {entry.snapshot?.systemName || assignmentTitle(entry.allotment)}
          </p>
          <p className="break-all text-xs text-gray-500">{snapshotSummary(entry.snapshot)}</p>
        </>
      ),
    },
    {
      accessor: "updatedBy",
      header: "Updated By",
      render: (_, entry) => (
        <>
          <p className="font-medium">{entry.updatedBy?.name || "-"}</p>
          <p className="break-all text-xs text-gray-500">{entry.updatedBy?.email || ""}</p>
        </>
      ),
    },
  ];
  const inventoryColumns = [
    {
      accessor: "assetId",
      header: "Asset ID",
      render: (value) => (
        <span className="whitespace-nowrap font-semibold text-gray-900">{value}</span>
      ),
    },
    {
      accessor: "name",
      header: "Name",
      render: (_, asset) => (
        <>
          <p className="font-medium">{assetName(asset)}</p>
          <p className="text-xs text-gray-500">
            {[asset.brand, asset.model].filter(Boolean).join(" ") || "-"}
          </p>
        </>
      ),
    },
    {
      accessor: "serialNumber",
      header: "Serial",
      render: (value) => <span className="whitespace-nowrap">{value || "-"}</span>,
    },
    {
      accessor: "details",
      header: "Details",
      render: (_, asset) =>
        activeTab === "system"
          ? [asset.systemType, asset.processor, asset.ram, asset.storage, asset.operatingSystem]
              .filter(Boolean)
              .join(" | ") || "-"
          : activeTab === "monitor"
            ? asset.displaySize || "-"
            : "-",
    },
    {
      accessor: "status",
      header: "Status",
      render: (status) => (
        <span
          className={`rounded-sm border px-2 py-1 text-xs font-semibold ${statusTone[status] || statusTone.inactive}`}
        >
          {status}
        </span>
      ),
    },
  ];
  const inventoryActions = [
    {
      key: "copy",
      title: "Copy",
      iconOnly: true,
      icon: <FiCopy />,
      className: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      onClick: copyAsset,
    },
    {
      key: "edit",
      title: "Edit",
      iconOnly: true,
      icon: <FiEdit2 />,
      className: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      onClick: fillAsset,
    },
    ...(canDelete
      ? [
          {
            key: "delete",
            title: "Delete",
            iconOnly: true,
            icon: <FiTrash2 />,
            className: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
            onClick: deleteAsset,
          },
        ]
      : []),
  ];

  if (loading) return <CommonLoader text="Loading system allotments..." />;
  if (accessDenied) {
    return (
      <section className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <EmptyState
          title="Access Not Allowed"
          message="Admin has not allowed system allotment access for your employee account."
        />
      </section>
    );
  }

  if (!canEdit) {
    return (
      <div className="space-y-4">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Assigned Assets</h1>
              <p className="text-sm text-gray-500 mt-1">Your assigned PC and accessories.</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            >
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </section>

        {personalAllotments.length === 0 ? (
          <section className="overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <EmptyState text="No system or accessories are assigned to you yet." />
          </section>
        ) : (
          personalAllotments.map((item) => (
            <section
              key={item._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{assignmentTitle(item)}</h2>
                  <p className="text-sm text-gray-500">{allocationPeriodText(item)}</p>
                </div>
                <span
                  className={`w-fit px-2.5 py-1 rounded-full border text-xs font-semibold ${statusTone[item.status] || statusTone.inactive}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {assignedAssetRows(item).map((asset) => (
                  <AssetItemCard key={asset.label} asset={asset} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {canEdit ? "System Allotments" : "My Assigned Assets"}
            </h1>
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

        <div className="grid grid-cols-2 gap-3 border-b border-gray-100 p-3 md:grid-cols-4">
          {[
            ["Employees", stats.employees],
            ["Active Allocations", stats.active],
            ["Total Assets", stats.totalAssets],
            ["Free Assets", stats.availableAssets],
          ].map(([label, value], index) => (
            <MetricCard
              key={label}
              label={label}
              value={value}
              index={index + 1}
              className="min-h-0 shadow-none"
            />
          ))}
        </div>

        <div className="border-b border-gray-100 bg-gray-50 px-3">
          <Tabs
            label="System allotment sections"
            value={activeTab}
            onChange={(tabKey) => {
              setActiveTab(tabKey);
              resetAsset();
            }}
            tabs={visibleTabs.map((tab) => {
              const meta = getTabMeta({ tab, myAllotments, filteredAllotments, assets });
              return {
                value: tab.key,
                label: (
                  <span className="inline-flex items-center gap-2">
                    {tab.label}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      {meta.count}
                    </span>
                  </span>
                ),
              };
            })}
          />
        </div>
      </section>

      {activeTab === "assign" && (
        <form
          onSubmit={saveAssignment}
          className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-5 py-4 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">
                {editingAssignmentId ? "Edit Allocation" : "Allocate Complete Setup"}
              </h2>
              <p className="text-xs text-gray-500">
                Start with employee, then pick available system and accessories from dropdowns.
              </p>
            </div>
            {editingAssignmentId && (
              <Button text="Cancel Edit" variant="secondary" onClick={resetAssignment}>
                <span className="inline-flex items-center gap-2">
                  <FiX /> Cancel Edit
                </span>
              </Button>
            )}
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <CustomDropdown
                label="Employee"
                value={assignmentForm.employee}
                onChange={(value) => setAssignmentForm((prev) => ({ ...prev, employee: value }))}
                placeholder="Select employee"
                disabled={!canEdit}
                portalMenu
                options={selectableEmployees.map((employee) => ({
                  value: employee._id,
                  label: `${employee.employeeId || "-"} - ${employee.name}${String(employee._id) === String(myEmployeeId) ? " (Self)" : ""}`,
                }))}
              />
              <CustomDropdown
                label="Assignment Type"
                value={assignmentForm.assignmentType}
                onChange={(value) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    assignmentType: value,
                    returnDate: needsEndDate(value) ? prev.returnDate : "",
                  }))
                }
                showPlaceholder={false}
                disabled={!canEdit}
                portalMenu
                options={[
                  { value: "office", label: "Office" },
                  { value: "work_from_home", label: "Work From Home" },
                  { value: "temporary", label: "Temporary" },
                  { value: "other", label: "Other" },
                ]}
              />
              <CalendarPicker
                label={
                  needsEndDate(assignmentForm.assignmentType) ? "From Date" : "Allocation Date"
                }
                labelClassName="text-sm font-medium text-left text-gray-900 dark:text-gray-100"
                className="!min-h-[38px] !rounded-sm !border-gray-300 !shadow-none dark:!border-gray-700"
                value={assignmentForm.assignedDate}
                onChange={(value) =>
                  setAssignmentForm((prev) => ({ ...prev, assignedDate: value }))
                }
                disabled={!canEdit}
              />
              {needsEndDate(assignmentForm.assignmentType) && (
                <CalendarPicker
                  label="To Date"
                  labelClassName="text-sm font-medium text-left text-gray-900 dark:text-gray-100"
                  className="!min-h-[38px] !rounded-sm !border-gray-300 !shadow-none dark:!border-gray-700"
                  value={assignmentForm.returnDate}
                  onChange={(value) =>
                    setAssignmentForm((prev) => ({ ...prev, returnDate: value }))
                  }
                  disabled={!canEdit}
                />
              )}
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
                <CustomDropdown
                  key={field}
                  label={label}
                  value={assignmentForm[field]}
                  onChange={(value) => setAssignmentForm((prev) => ({ ...prev, [field]: value }))}
                  placeholder={type === "system" ? "Select system" : `No ${label.toLowerCase()}`}
                  disabled={!canEdit}
                  portalMenu
                  options={selectableAssets(type, assignmentForm[field]).map((asset) => ({
                    value: asset._id,
                    label: assetOptionLabel(asset),
                  }))}
                />
              ))}
            </div>
          </div>

          <div className="px-5 py-4 border-t flex justify-end">
            <Button
              type="submit"
              text={editingAssignmentId ? "Save Changes" : "Allocate"}
              loading={saving}
              disabled={!canEdit}
            >
              <span className="inline-flex items-center gap-2">
                <FiPlus /> {editingAssignmentId ? "Save Changes" : "Allocate"}
              </span>
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
                      <p className="text-xs text-gray-500">{allocationPeriodText(item)}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {assignedAssetRows(item).map((asset) => (
                        <AssetItemCard key={asset.label} asset={asset} />
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
              <h2 className="font-semibold text-gray-900">
                {canEdit ? "Current Allotments" : "Assigned To You"}
              </h2>
              <p className="text-xs text-gray-500">
                {canEdit
                  ? "Edit an allocation to change employee assets, or release it to free inventory."
                  : "These are the assets currently mapped to your employee profile."}
              </p>
            </div>
            {canEdit && (
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search employee or asset ID"
                className="md:w-72"
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
                <div className="grid grid-cols-1 gap-4">
                  {filteredAllotments.map((item) => (
                    <article
                      key={item._id}
                      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {assignmentTitle(item)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{allocationPeriodText(item)}</p>
                        </div>
                        <span
                          className={`w-fit px-2.5 py-1 rounded-full border text-xs font-semibold ${statusTone[item.status] || statusTone.inactive}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {assignedAssetRows(item).map((asset) => (
                          <AssetItemCard key={asset.label} asset={asset} />
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <CommonTable
                columns={allotmentColumns}
                data={allotmentsPagination.pageItems}
                actions={allotmentActions}
                pagination={allotmentsPagination}
                emptyText="No allotments found."
              />
            </>
          )}
        </section>
      )}

      {activeTab === "history" && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">Allotment History</h2>
              <p className="text-xs text-gray-500">
                Created, updated, and deleted allocation changes.
              </p>
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search employee or asset ID"
              className="md:w-72"
            />
          </div>
          <CommonTable
            columns={historyColumns}
            data={historyPagination.pageItems}
            pagination={historyPagination}
            emptyText="No history found."
          />
        </section>
      )}

      {inventoryTypes.includes(activeTab) && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{titleCase(activeTab)} List</h2>
              <p className="text-xs text-gray-500">
                Allocated items are hidden from assignment dropdowns until released.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEditingAssetId("");
                setAssetForm(emptyAsset);
                setAssetModalOpen(true);
              }}
              text={`Add ${titleCase(activeTab)}`}
            >
              <span className="inline-flex items-center gap-2">
                <FiPlus /> Add {titleCase(activeTab)}
              </span>
            </Button>
          </div>
          <CommonTable
            columns={inventoryColumns}
            data={assetsPagination.pageItems}
            actions={inventoryActions}
            pagination={assetsPagination}
            emptyText={`No ${activeTab} assets found.`}
          />
        </section>
      )}

      {assetModalOpen && inventoryTypes.includes(activeTab) && (
        <CommonModal
          as="form"
          onSubmit={saveAsset}
          onClose={resetAsset}
          className="max-w-3xl"
          title={editingAssetId ? `Edit ${titleCase(activeTab)}` : `Add ${titleCase(activeTab)}`}
          subtitle="Each saved item receives an automatic asset ID."
          footer={
            <>
              <Button text="Cancel" variant="secondary" onClick={resetAsset} />
              <Button
                type="submit"
                text={editingAssetId ? "Save" : "Add"}
                loading={saving}
                disabled={!canEdit}
              />
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              ["name", "Name"],
              ["brand", "Brand"],
              ["model", "Model"],
              ["serialNumber", "Serial Number"],
            ].map(([field, label]) => (
              <InputField
                key={field}
                label={label}
                labelClassName={assetModalLabelClass}
                inputClassName={assetModalControlClass}
                required={field === "name"}
                value={assetForm[field]}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, [field]: e.target.value }))}
                disabled={!canEdit}
              />
            ))}

            {activeTab === "system" && (
              <>
                <CustomDropdown
                  label="System Type"
                  labelClassName={assetModalLabelClass}
                  buttonClassName={assetModalControlClass}
                  value={assetForm.systemType}
                  onChange={(value) => setAssetForm((prev) => ({ ...prev, systemType: value }))}
                  showPlaceholder={false}
                  disabled={!canEdit}
                  portalMenu
                  options={["desktop", "laptop", "server", "other"]}
                />
                {[
                  ["processor", "Processor"],
                  ["ram", "RAM"],
                  ["storage", "Storage"],
                  ["operatingSystem", "Operating System"],
                ].map(([field, label]) => (
                  <InputField
                    key={field}
                    label={label}
                    labelClassName={assetModalLabelClass}
                    inputClassName={assetModalControlClass}
                    value={assetForm[field]}
                    onChange={(e) => setAssetForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    disabled={!canEdit}
                  />
                ))}
              </>
            )}

            {activeTab === "monitor" && (
              <InputField
                label="Display Size"
                labelClassName={assetModalLabelClass}
                inputClassName={assetModalControlClass}
                value={assetForm.displaySize}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, displaySize: e.target.value }))}
                disabled={!canEdit}
              />
            )}

            <CustomDropdown
              label="Status"
              labelClassName={assetModalLabelClass}
              buttonClassName={assetModalControlClass}
              value={assetForm.status}
              onChange={(value) => setAssetForm((prev) => ({ ...prev, status: value }))}
              showPlaceholder={false}
              disabled={!canEdit}
              portalMenu
              options={["available", "allocated", "repair", "inactive"]}
            />
            <CalendarPicker
              label="Purchase Date"
              labelClassName={assetModalLabelClass}
              className="!min-h-10 !rounded-sm !border-gray-300 !text-sm !shadow-none dark:!border-gray-700"
              value={assetForm.purchaseDate}
              onChange={(value) => setAssetForm((prev) => ({ ...prev, purchaseDate: value }))}
              disabled={!canEdit}
            />
            <CalendarPicker
              label="Warranty Expiry"
              labelClassName={assetModalLabelClass}
              className="!min-h-10 !rounded-sm !border-gray-300 !text-sm !shadow-none dark:!border-gray-700"
              value={assetForm.warrantyExpiry}
              onChange={(value) => setAssetForm((prev) => ({ ...prev, warrantyExpiry: value }))}
              disabled={!canEdit}
            />
            <InputField
              label="Cost"
              labelClassName={assetModalLabelClass}
              inputClassName={assetModalControlClass}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={assetForm.cost}
              onChange={(e) => setAssetForm((prev) => ({ ...prev, cost: e.target.value }))}
              disabled={!canEdit}
            />
          </div>
        </CommonModal>
      )}

      {viewingAllotment && (
        <CommonModal
          onClose={() => setViewingAllotment(null)}
          className="max-w-4xl"
          title={viewingAllotment.employee?.name || "Inventory"}
          subtitle={`${viewingAllotment.employee?.employeeId || "-"} | ${assignmentTypeLabels[viewingAllotment.assignmentType] || "Office"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Period</p>
              <p className="mt-1 font-semibold text-gray-900">
                {allocationPeriodText(viewingAllotment)}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Status</p>
              <p className="mt-1 font-semibold capitalize text-gray-900">
                {viewingAllotment.status || "-"}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {assignedAssetRows(viewingAllotment).map((asset) => (
              <AssetItemCard key={asset.label} asset={asset} />
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-gray-100">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <h3 className="font-semibold text-gray-900">History</h3>
            </div>
            {(viewingAllotment.history || []).length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No history found.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {[...(viewingAllotment.history || [])]
                  .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
                  .map((entry, index) => (
                    <div
                      key={`${entry.action}-${entry.updatedAt}-${index}`}
                      className="grid grid-cols-1 gap-2 px-4 py-3 text-sm md:grid-cols-[140px_1fr_180px]"
                    >
                      <span className="font-semibold capitalize text-gray-900">
                        {formatAction(entry.action)}
                      </span>
                      <span className="text-gray-600 break-all">
                        {snapshotSummary(entry.snapshot)}
                      </span>
                      <span className="text-gray-500">{displayDate(entry.updatedAt)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CommonModal>
      )}
    </div>
  );
};

export default SystemAllotments;
