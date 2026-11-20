import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiHome,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiSave,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiUserX,
} from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { authApi, hrApi } from "../../../api";
import Button from "../../../components/common/Button";
import AddressFields from "../../../components/common/AddressFields";
import Avatar from "../../../components/common/Avatar";
import CalendarPicker from "../../../components/common/CalendarPicker";
import CommonLoader from "../../../components/common/CommonLoader";
import LeaveReviewDetails from "../../../components/common/LeaveReviewDetails";
import CommonModal from "../../../components/common/CommonModal";
import CommonTable from "../../../components/common/CommonTable";
import CustomDropdown from "../../../components/common/CustomDropdown";
import DetailItem from "../../../components/common/DetailItem";
import EmptyState from "../../../components/common/EmptyState";
import { usePagination } from "../../../components/common/Pagination";
import FileUploadField from "../../../components/common/FileUploadField";
import DocumentSigningList from "../../../components/documents/DocumentSigningList";
import EmployeeChecklist from "../../../components/common/EmployeeChecklist";
import InputField from "../../../components/common/InputField";
import SectionHeader from "../../../components/common/SectionHeader";
import Tabs from "../../../components/common/Tabs";
import ModulePermissionMatrix from "../../../components/common/ModulePermissionMatrix";
import { AuthContext } from "../../../contexts/AuthContext";
import { useModal } from "../../../contexts/ModalContext";
import { useToast } from "../../../contexts/ToastContext";

const minutesToHours = (minutes = 0) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "N/A");

const formatAddress = (address = {}) =>
  [address.street, address.city, address.state, address.country, address.pincode]
    .filter(Boolean)
    .join(", ") || "N/A";

const detailFallback = (value) => value || "N/A";
const employeeLeaveBalanceTypes = [
  { value: "earned_leave", label: "Earned Leave" },
  { value: "sick_leave", label: "Sick Leave" },
  { value: "optional_leave", label: "Optional Leave" },
];
const normalizePhoto = (file, targetWidth, targetHeight) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    const scale = Math.max(targetWidth / image.width, targetHeight / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(image, (targetWidth - width) / 2, (targetHeight - height) / 2, width, height);
    URL.revokeObjectURL(image.src);
    const encode = (quality) => canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Unable to process photo"));
      if (blob.size > 250 * 1024 && quality > 0.35) return encode(quality - 0.1);
      const normalized = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      resolve(normalized);
    }, "image/jpeg", quality);
    encode(0.9);
  };
  image.onerror = () => reject(new Error("Invalid image"));
  image.src = URL.createObjectURL(file);
});
const normalizePassportPhoto = (file) => normalizePhoto(file, 413, 531);
const normalizePanPhoto = (file) => normalizePhoto(file, 197, 276);
const readImageSize = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => { URL.revokeObjectURL(image.src); resolve({ width: image.width, height: image.height }); };
  image.onerror = () => { URL.revokeObjectURL(image.src); reject(new Error("Invalid image")); };
  image.src = URL.createObjectURL(file);
});
const normalizeSupportingImage = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const scale = Math.min(1, 1200 / image.width, 1600 / image.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(image.src);
    const encode = (quality) => canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Unable to process document"));
      if (blob.size > 500 * 1024 && quality > 0.35) return encode(quality - 0.1);
      resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
    }, "image/jpeg", quality);
    encode(0.88);
  };
  image.onerror = () => reject(new Error("Invalid image"));
  image.src = URL.createObjectURL(file);
});
const labelize = (value = "") => String(value).replace(/_/g, " ");
const employeeModuleActions = ["view", "add", "edit", "delete"];
const employeeAccessModules = [["dashboard", "Dashboard", ["view"], { view: "View Dashboard" }], ["attendance", "Attendance", ["view", "edit"], { view: "View Attendance", edit: "Update Attendance" }], ["interviews", "Interviews", ["view", "edit"], { view: "View Interviews", edit: "Submit Review" }], ["leaves", "Leaves", ["view", "add"], { view: "View Leaves", add: "Apply Leave" }], ["leaveCalendar", "Conative Calendar", ["view"], { view: "View Calendar" }], ["systemAllotment", "My System", employeeModuleActions, { view: "View System", add: "Add Item", edit: "Update Item", delete: "Delete Item" }], ["documents", "Documents", ["view", "edit"], { view: "View Documents", edit: "Sign Documents" }], ["credentials", "Credentials", employeeModuleActions, { view: "View Credentials", add: "Add Credential", edit: "Update Credential", delete: "Delete Credential" }], ["settings", "Settings", ["view", "edit"], { view: "View Settings", edit: "Update Settings" }]];
const teamLeadAccessModules = [["dashboard", "Dashboard", ["view"], { view: "View Dashboard" }], ["yourTeam", "My Team / Team List", ["view", "edit"], { view: "View Team", edit: "Manage Team" }], ...employeeAccessModules.slice(1)];
const hrAccessModules = [["employees", "Employees", ["view", "add", "edit", "delete"]], ["employeeDocuments", "Employee Documents", ["view", "download", "add", "update", "delete"], { view: "View", download: "Download", add: "Add", update: "Update", delete: "Delete" }], ["employeeSecurity", "Security", ["view", "update"], { view: "View", update: "Change Password" }], ["candidates", "Candidates", ["view", "add", "edit", "delete"]], ["checkins", "Today Check-ins", ["view", "add", "edit", "delete"]], ["attendanceReports", "Attendance Reports", ["view", "add", "edit", "delete"]], ["leaveReports", "Leave Reports", ["view"], { view: "View Reports" }], ["leaveActions", "Leave Actions", ["edit", "adjust", "delete"], { edit: "Approve / Reject", adjust: "Adjust Leave", delete: "Delete Request" }], ["documents", "Documents & Signatures", ["view", "add", "update", "placement", "review", "cancel", "download", "delete"], { view: "View", add: "Add", update: "Update", placement: "Set Placement", review: "Approve / Correction", cancel: "Cancel Request", download: "Download", delete: "Delete" }], ["ownDocuments", "My Documents & Signatures", ["view", "add", "edit", "delete"]], ["credentials", "Credentials", ["view", "add", "edit", "delete"]], ["rolesAccess", "Roles & Access", ["view", "add", "edit", "delete"]], ["systemAllotments", "System Allotments", ["view", "add", "edit", "delete"]]];
const documentLabelMap = {
  photo: "Photo",
  aadhaarCard: "Aadhaar Card",
  panCard: "PAN Card",
  passbook: "Bank Proof / Passbook",
  bloodGroupProof: "Blood Group Proof",
  bondDocument: "Bond Document Original",
  bondLetter: "Bond Letter",
  addressProof: "Address Proof",
  degree: "Degree / Qualification",
  resume: "Resume",
  offerLetter: "Offer Letter",
  appointmentLetter: "Appointment Letter",
  leavingLetter: "Leaving Letter",
  experienceCertificate: "Experience Certificate",
  previousCompanyDocument: "Previous Company Document",
  documentXerox: "Previous Document Xerox",
  bankStatement: "Bank Statement",
  salarySlips: "Salary Slips",
};
const resolveEmployeeTab = (requestedTab, canManage, isSuperAdmin, editRequested) => {
  const availableTabs = ["details", "attendance", "leaves", "documents", "documentSignatures"];
  if (canManage) availableTabs.push("edit");
  if (isSuperAdmin) availableTabs.push("credentials", "access");
  if (canManage) availableTabs.push("security");
  if (canManage) availableTabs.push("actions");
  if (availableTabs.includes(requestedTab)) return requestedTab;
  if (editRequested && canManage) return "edit";
  return "details";
};

const EmployeeDetail = () => {
  const { employeeId } = useParams();
  const location = useLocation();
  const editFormRef = useRef(null);
  const tabsRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useModal();
  const { user } = useContext(AuthContext);
  // Backend profile edits and employee lifecycle actions are HR-only.
  const canManage = user?.role === "hr" || user?.role === "superadmin";
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [employeeLeavesLoading, setEmployeeLeavesLoading] = useState(false);
  const [selectedEmployeeLeave, setSelectedEmployeeLeave] = useState(null);
  const [employeeLeaveDrawerOpen, setEmployeeLeaveDrawerOpen] = useState(false);
  const employeeLeaveDrawerTimer = useRef(null);
  const employeeLeaveDrawerFrame = useRef(null);
  const [selectedLeaveBalance, setSelectedLeaveBalance] = useState(null);
  const [adjustType, setAdjustType] = useState("earned_leave");
  const [adjustDays, setAdjustDays] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustmentSaving, setAdjustmentSaving] = useState(false);
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    employeeId: "",
    hrFileNo: "",
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    mobile: "",
    altMobile: "",
    fatherOrHusbandName: "",
    emergencyNumber: "",
    bloodGroup: "",
    department: "",
    designation: "",
    dob: "",
    dateOfJoining: "",
    gender: "Other",
    employeeType: "Probation",
    attendanceMode: "office",
    teamLead: "",
    reportingManager: "",
    resignationDate: "",
    leavingDate: "",
    salary: "",
    salaryOnHold: false,
    bondPeriodDuration: "",
    bankHolderName: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    chequeNumber: "",
    chequeAccountNumber: "",
    chequeAmount: "",
    chequeDate: "",
    chequeBankName: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    },
    permanentAddress: { street: "", city: "", state: "", country: "India", pincode: "" },
    alternateAddress: { street: "", city: "", state: "", country: "India", pincode: "" },
    joiningChecklist: {}, leavingChecklist: {}, noDuesChecklist: {},
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [accountCredentials] = useState([]);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [masterOptions, setMasterOptions] = useState({ bloodGroup: [], employeeType: [], designation: [], trainingPeriod: [], bondPeriod: [] });
  const [documentFiles, setDocumentFiles] = useState({});
  const [existingDocumentFiles, setExistingDocumentFiles] = useState({});
  const [documentErrors, setDocumentErrors] = useState({});
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [newEmployeePassword, setNewEmployeePassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [loginPassword, setLoginPassword] = useState(null);
  const [loadingLoginPassword, setLoadingLoginPassword] = useState(false);
  const [passwordViewOpen, setPasswordViewOpen] = useState(false);
  useEffect(() => { if (!passwordViewOpen) return undefined; const timer = window.setTimeout(() => setPasswordViewOpen(false), 5000); return () => window.clearTimeout(timer); }, [passwordViewOpen]);
  const [accessDraft, setAccessDraft] = useState({});
  const [roleDraft, setRoleDraft] = useState("employee");
  const [savingAccess, setSavingAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [hrModuleAccess, setHrModuleAccess] = useState(null);
  const [activeTab, setActiveTabState] = useState(() => {
    const params = new URLSearchParams(location.search);
    return resolveEmployeeTab(params.get("tab"), canManage, user?.role === "superadmin", params.get("edit") === "1");
  });

  useEffect(() => {
    if (!selectedEmployeeLeave?.employee?._id && !employeeId) { setSelectedLeaveBalance(null); return undefined; }
    const targetId = selectedEmployeeLeave?.employee?._id || employeeId;
    let active = true;
    hrApi.getEmployeeLeaveBalance(targetId).then((response) => { if (active) setSelectedLeaveBalance(response.data.data || null); }).catch(() => { if (active) setSelectedLeaveBalance(null); });
    return () => { active = false; };
  }, [selectedEmployeeLeave, employeeId]);

  const adjustSelectedLeave = async () => {
    const days = Number(adjustDays);
    if (!Number.isFinite(days) || days === 0 || !adjustReason.trim()) return toast.error("Enter adjustment days and reason.");
    const typeLabel = employeeLeaveBalanceTypes.find((item) => item.value === adjustType)?.label || adjustType;
    // Close the drawer first so the confirmation is presented on its own.
    setEmployeeLeaveDrawerOpen(false);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    const ok = await confirm({ title: "Confirm leave adjustment", message: `${days > 0 ? "Add" : "Deduct"} ${Math.abs(days)} day(s) from ${typeLabel}? Reason: ${adjustReason.trim()}`, confirmText: "Adjust leaves", cancelText: "Cancel", tone: days < 0 ? "danger" : "primary" });
    if (!ok) {
      window.requestAnimationFrame(() => setEmployeeLeaveDrawerOpen(true));
      return;
    }
    setAdjustmentSaving(true);
    try {
      const response = await hrApi.adjustEmployeeLeaveBalance(employeeId, { type: adjustType, days, reason: adjustReason.trim() });
      setSelectedLeaveBalance(response.data.data || null);
      setAdjustDays("");
      setAdjustReason("");
      setSelectedEmployeeLeave(null);
      toast.success("Leave balance adjusted");
    } catch (err) {
      window.requestAnimationFrame(() => setEmployeeLeaveDrawerOpen(true));
      toast.error(err.response?.data?.message || "Unable to adjust leave");
    } finally {
      setAdjustmentSaving(false);
    }
  };

  const openEmployeeLeaveDrawer = (leave) => {
    window.clearTimeout(employeeLeaveDrawerTimer.current);
    window.cancelAnimationFrame(employeeLeaveDrawerFrame.current);
    setSelectedEmployeeLeave(leave);
    setEmployeeLeaveDrawerOpen(false);
    employeeLeaveDrawerFrame.current = window.requestAnimationFrame(() => setEmployeeLeaveDrawerOpen(true));
  };

  const closeEmployeeLeaveDrawer = () => {
    setEmployeeLeaveDrawerOpen(false);
    window.clearTimeout(employeeLeaveDrawerTimer.current);
    employeeLeaveDrawerTimer.current = window.setTimeout(() => setSelectedEmployeeLeave(null), 380);
  };

  const reviewEmployeeLeave = async (nextStatus) => {
    if (!selectedEmployeeLeave) return;
    const ok = await confirm({ title: `${nextStatus === "approved" ? "Approve" : "Reject"} leave?`, message: "Confirm this leave request action.", confirmText: nextStatus === "approved" ? "Approve" : "Reject", cancelText: "Cancel", tone: nextStatus === "approved" ? "primary" : "danger" });
    if (!ok) return;
    try { const response = await hrApi.reviewLeave(selectedEmployeeLeave._id, { status: nextStatus, employeeId }); toast.success(`Leave ${nextStatus}`); closeEmployeeLeaveDrawer(); setEmployeeLeaves((items) => items.map((item) => item._id === selectedEmployeeLeave._id ? { ...item, ...response.data.data } : item)); } catch (err) { toast.error(err.response?.data?.message || "Unable to update leave"); }
  };

  const changeActiveTab = (tab) => {
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
    setActiveTabState(tab);
    if (user?.role === "hr") authApi.getProfile().then((response) => setHrModuleAccess(response.data.data?.moduleAccess ?? null)).catch(() => {});
  };
  const handleChecklistChange = (group, key, value) => setEditForm((current) => ({ ...current, [group]: { ...(current[group] || {}), [key]: value } }));

  const loadEmployee = async ({ includeReport = true, initial = false } = {}) => {
    if (initial) setLoading(true);
    setAccessLoading(true);
    try {
      const requests = [hrApi.getEmployee(employeeId)];
      if (includeReport) requests.push(hrApi.getEmployeeMonthlyReport(employeeId, month));
      if (canManage) {
        requests.push(hrApi.getEmployees());
        requests.push(authApi.getDepartments());
      }
      if (user?.role === "hr") requests.push(authApi.getProfile());
      const responses = await Promise.all(requests);
      let responseIndex = 0;
      const employeeRes = responses[responseIndex++];
      const reportRes = includeReport ? responses[responseIndex++] : null;
      const employeesRes = canManage ? responses[responseIndex++] : null;
      const departmentsRes = canManage ? responses[responseIndex++] : null;
      const profileRes = user?.role === "hr" ? responses[responseIndex++] : null;
      const employeeData = employeeRes.data.data;
      if (profileRes) setHrModuleAccess(profileRes.data.data?.moduleAccess ?? null);
      setEmployee(employeeData);
      setExistingDocumentFiles({
        ...Object.fromEntries(
          Object.entries(employeeData.documents || {})
            .map(([key, value]) => [
              key,
              value?.name || value?.fileName || (value?.url
                ? `${documentLabelMap[key] || key} (saved)`
                : Array.isArray(value)
                  ? `${value.length} file(s) saved`
                  : ""),
            ])
            .filter(([, name]) => name)
        ),
        ...(Array.isArray(employeeData.documents?.salarySlips) && employeeData.documents.salarySlips.length
          ? { salarySlips: `${employeeData.documents.salarySlips.length} file(s) saved` }
          : {}),
      });
      const detectedRole = employeeData.workRole === "teamlead" || employeeData.user?.role === "teamlead"
        ? "teamlead"
        : employeeData.user?.role === "hr" || employeeData.workRole === "hr" ? "hr" : "employee";
      const accessModules = detectedRole === "hr" ? hrAccessModules : detectedRole === "teamlead" ? teamLeadAccessModules : employeeAccessModules;
      const defaultAccess = Object.fromEntries(accessModules.map(([key, , actions = ["view", "add", "edit", "delete"]]) => [key, employeeData.user?.moduleAccess?.[key] || Object.fromEntries(actions.map((action) => [action, action === "view" && (key === "dashboard" || key === "settings")]))]));
      setAccessDraft(defaultAccess);
      setRoleDraft(detectedRole);
      if (canManage) {
        setEmployeeOptions(employeesRes?.data?.data || []);
        setDepartments(departmentsRes?.data?.data || []);
        const masters = await Promise.all([
          authApi.getMasterOptions("bloodGroup"),
          authApi.getMasterOptions("employeeType"),
          authApi.getMasterOptions("designation"),
          authApi.getMasterOptions("trainingPeriod"),
          authApi.getMasterOptions("bondPeriod"),
        ]);
        setMasterOptions({
          bloodGroup: masters[0].data.data || [],
          employeeType: masters[1].data.data || [],
          designation: masters[2].data.data || [],
          trainingPeriod: masters[3].data.data || [],
          bondPeriod: masters[4].data.data || [],
        });
      }
      setEditForm({
        employeeId: employeeData.employeeId || "",
        hrFileNo: employeeData.hrFileNo || "",
        firstName: employeeData.firstName || "",
        lastName: employeeData.lastName || "",
        name: employeeData.name || "",
        email: employeeData.email || "",
        mobile: employeeData.mobile || "",
        altMobile: employeeData.altMobile || "",
        fatherOrHusbandName: employeeData.fatherOrHusbandName || "",
        emergencyNumber: employeeData.emergencyNumber || "",
        bloodGroup: employeeData.bloodGroup || "",
        department: employeeData.department || "",
        designation: employeeData.designation || "",
        dob: employeeData.dob ? employeeData.dob.slice(0, 10) : "",
        dateOfJoining: employeeData.dateOfJoining ? employeeData.dateOfJoining.slice(0, 10) : "",
        gender: employeeData.gender || "Other",
        employeeType: employeeData.employeeType || "Probation",
        attendanceMode: employeeData.attendanceMode || "office",
        teamLead: employeeData.teamLead?._id || employeeData.teamLead || "",
        reportingManager: employeeData.reportingManager || "",
        resignationDate: employeeData.resignationDate ? employeeData.resignationDate.slice(0, 10) : "",
        leavingDate: employeeData.leavingDate ? employeeData.leavingDate.slice(0, 10) : "",
        salary: employeeData.salary || "",
        salaryOnHold: Boolean(employeeData.salaryOnHold),
        bondPeriodDuration: employeeData.bondPeriodDuration || "",
        bankHolderName: employeeData.bankHolderName || "",
        bankName: employeeData.bankName || "",
        bankAccountNumber: employeeData.bankAccountNumber || "",
        bankIfscCode: employeeData.bankIfscCode || "",
        chequeNumber: employeeData.chequeNumber || "",
        chequeAccountNumber: employeeData.chequeAccountNumber || "",
        chequeAmount: employeeData.chequeAmount || "",
        chequeDate: employeeData.chequeDate ? employeeData.chequeDate.slice(0, 10) : "",
        chequeBankName: employeeData.chequeBankName || "",
        address: {
          street: employeeData.address?.street || "",
          city: employeeData.address?.city || "",
          state: employeeData.address?.state || "",
          country: employeeData.address?.country || "India",
          pincode: employeeData.address?.pincode || "",
        },
        permanentAddress: { ...(employeeData.permanentAddress || employeeData.address || {}) },
        alternateAddress: { ...(employeeData.alternateAddress || {}) },
        joiningChecklist: employeeData.joiningChecklist || {},
        leavingChecklist: employeeData.leavingChecklist || {},
        noDuesChecklist: employeeData.noDuesChecklist || {},
      });
      if (reportRes) {
        setAttendance(reportRes.data.data?.records || []);
        setSummary(reportRes.data.data?.summary || null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load employee");
    } finally {
      if (initial) setLoading(false);
      setAccessLoading(false);
    }
  };

  const hrCanViewModule = (key) => user?.role !== "hr"
    || accessLoading
    || hrModuleAccess === null
    || hrModuleAccess?.[key] === undefined
    || (key === "employeeDocuments" && (!hrModuleAccess?.employees || hrModuleAccess.employees.view !== true))
    || hrModuleAccess[key]?.view !== false;
  const hrCanEditModule = (key) => user?.role !== "hr"
    || hrModuleAccess === null
    || (hrModuleAccess?.[key] === undefined ? key !== "leaveActions" : hrModuleAccess[key]?.edit !== false);
  const hrCanDownloadModule = (key) => user?.role !== "hr"
    || accessLoading
    || hrModuleAccess === null
    || (key === "employeeDocuments" && (!hrModuleAccess?.employees || hrModuleAccess.employees.view !== true))
    || hrModuleAccess?.[key] === undefined
    || hrModuleAccess[key]?.download === true;
  const hrCanUpdateModule = (key) => user?.role !== "hr"
    || hrModuleAccess === null
    || (hrModuleAccess?.[key] === undefined ? key !== "leaveActions" : key === "leaveActions" ? hrModuleAccess[key]?.adjust === true : hrModuleAccess[key]?.update === true || hrModuleAccess[key]?.edit === true);
  const hrCanAddModule = (key) => user?.role !== "hr"
    || hrModuleAccess === null
    || hrModuleAccess?.[key] === undefined
    || hrModuleAccess[key]?.add === true;
  const canManageDocuments = (user?.role === "hr" || user?.role === "superadmin")
    && (user?.role === "superadmin" || hrCanAddModule("employeeDocuments") || hrCanUpdateModule("employeeDocuments") || hrCanEditModule("employeeDocuments"));

  const downloadEmployeeDocument = async (url, label) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${label || "employee-document"}.${blob.type.includes("pdf") ? "pdf" : blob.type.split("/")[1] || "file"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // The tab guard intentionally runs when the active tab or fetched HR permissions change.
  useEffect(() => {
    if (activeTab === "leaves" && employeeId) {
      setEmployeeLeavesLoading(true);
      hrApi.getLeaves({ employeeId, limit: 100 }).then((response) => setEmployeeLeaves(response.data.data || [])).catch(() => setEmployeeLeaves([])).finally(() => setEmployeeLeavesLoading(false));
    }
  }, [activeTab, employeeId]);

  useEffect(() => {
    if (user?.role === "hr" && hrModuleAccess && activeTab === "documentSignatures" && !hrCanViewModule("documents")) {
      changeActiveTab("details");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hrModuleAccess, user?.role]);

  useEffect(() => {
    loadEmployee({ includeReport: false, initial: true });
    // eslint-disable-next-line
  }, [employeeId, user?.role]);

  useEffect(() => {
    let cancelled = false;
    hrApi.getEmployeeMonthlyReport(employeeId, month)
      .then((response) => {
        if (cancelled) return;
        setAttendance(response.data.data?.records || []);
        setSummary(response.data.data?.summary || null);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.response?.data?.message || "Unable to load attendance report");
      });
    return () => { cancelled = true; };
    // Month changes should only request the matching attendance report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, month]);

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    setActiveTabState(resolveEmployeeTab(
      params.get("tab"),
      canManage,
      user?.role === "superadmin",
      params.get("edit") === "1"
    ));
  }, [canManage, loading, location.search, user?.role]);

  const deactivateEmployee = async () => {
    const ok = await confirm({
      title: "Deactivate Employee",
      message: "This employee will not be able to login.",
      confirmText: "Deactivate",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await hrApi.deactivateEmployee(employeeId);
      toast.success("Employee deactivated");
      await loadEmployee({ includeReport: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to deactivate");
    }
  };

  const activateEmployee = async () => {
    try {
      await hrApi.activateEmployee(employeeId);
      toast.success("Employee activated");
      await loadEmployee({ includeReport: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to activate");
    }
  };

  const deleteEmployee = async () => {
    const ok = await confirm({
      title: "Delete Employee",
      message: "This permanently deletes employee and login user.",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;

    try {
      setDeletingEmployee(true);
      await hrApi.deleteEmployee(employeeId);
      toast.success("Employee deleted");
      navigate(user?.role === "superadmin" ? "/admin/employees" : "/hr/employees");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete");
    } finally {
      setDeletingEmployee(false);
    }
  };

  const resetEmployeePassword = async (event) => {
    event.preventDefault();
    if (newEmployeePassword.length < 8) return toast.error("Password must be at least 8 characters");
    setSavingPassword(true);
    try {
      await hrApi.resetEmployeePassword(employeeId, newEmployeePassword);
      toast.success("Employee password changed successfully");
      setNewEmployeePassword("");
      setPasswordModalOpen(false);
    } catch (err) { toast.error(err.response?.data?.message || "Unable to change password"); }
    finally { setSavingPassword(false); }
  };

  const updateEmployee = async (e) => {
    e.preventDefault();
    const validationErrors = validateEditForm();
    if (Object.keys(validationErrors).length) {
      setEditErrors(validationErrors);
      toast.error("Please fix the highlighted fields before saving");
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        ...editForm,
        employeeId: editForm.employeeId.trim(),
        name: `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim(),
        mobile: editForm.mobile.trim(),
        altMobile: editForm.altMobile.trim(),
        department: editForm.department.trim(),
        designation: editForm.designation.trim(),
        address: Object.fromEntries(Object.entries(editForm.address).map(([key, value]) => [key, value.trim()])),
        permanentAddress: Object.fromEntries(Object.entries(editForm.permanentAddress).map(([key, value]) => [key, value.trim()])),
        alternateAddress: Object.fromEntries(Object.entries(editForm.alternateAddress).map(([key, value]) => [key, value.trim()])),
      };
      await hrApi.updateEmployee(employeeId, payload);
      const documentEntries = Object.entries(documentFiles).filter(([, file]) => file);
      if (documentEntries.length) {
        const documentPayload = {};
        for (const [key, file] of documentEntries) {
          if (Array.isArray(file)) {
            documentPayload[key] = await Promise.all(file.map(async (item) => ({ dataUri: await fileToDataUri(item), name: item.name, type: item.type })));
          } else {
            documentPayload[key] = { dataUri: await fileToDataUri(file), name: file.name, type: file.type };
          }
        }
        await hrApi.updateEmployeeDocuments(employeeId, documentPayload);
        setDocumentFiles({});
      }
      toast.success("Employee updated");
      await loadEmployee();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update employee");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveEmployeeAccess = async () => {
    const userId = employee?.user?._id || employee?.user;
    if (!userId) { toast.error("Employee login account not found"); return; }
    const currentRole = employee?.user?.role === "hr" ? "hr" : employee?.user?.role === "teamlead" || employee?.workRole === "teamlead" ? "teamlead" : "employee";
    if (currentRole !== roleDraft) {
      const roleName = roleDraft === "hr" ? "HR" : roleDraft === "teamlead" ? "Team Lead" : "Employee";
      const confirmed = await confirm({
        title: `Assign ${roleName} role`,
        message: `${employee.name} will be changed from ${currentRole === "teamlead" ? "Team Lead" : currentRole.toUpperCase()} to ${roleName}. The permission checklist will be refreshed for this role. Continue?`,
        confirmText: "Continue",
      });
      if (!confirmed) return;
    }
    setSavingAccess(true);
    try {
      await authApi.updateEmployeeRole(userId, roleDraft);
      if (roleDraft === "hr") await authApi.updateHrModuleAccess(userId, accessDraft);
      else await authApi.updateEmployeeModuleAccess(userId, accessDraft);
      toast.success("Role and access updated");
      await loadEmployee();
    } catch (err) { toast.error(err.response?.data?.message || "Unable to update role and access"); }
    finally { setSavingAccess(false); }
  };

  const fileToDataUri = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const saveEmployeeDocuments = async (event) => {
    event.preventDefault();
    const selectedEntries = Object.entries(documentFiles).filter(([, file]) => file);
    if (!selectedEntries.length) {
      toast.error("Choose at least one document to upload");
      return;
    }

    setSavingDocuments(true);
    try {
      const payload = {};
      for (const [key, file] of selectedEntries) {
        if (Array.isArray(file)) {
          payload[key] = await Promise.all(file.map(async (item) => ({ dataUri: await fileToDataUri(item), name: item.name, type: item.type })));
        } else if (key === "salarySlips") {
          payload[key] = [{ dataUri: await fileToDataUri(file), name: file.name, type: file.type }];
        } else {
          payload[key] = { dataUri: await fileToDataUri(file), name: file.name, type: file.type };
        }
      }
      const response = await hrApi.updateEmployeeDocuments(employeeId, payload);
      setEmployee(response.data.data || employee);
      setDocumentFiles({});
      toast.success(response.data.message || "Employee documents updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update employee documents");
    } finally {
      setSavingDocuments(false);
    }
  };

  const handleAddressChange = (event, addressKey = "address") => {
    const { name: field, value } = event.target;
    if (field === "pincode" && !/^\d{0,6}$/.test(value)) return;
    setEditForm((prev) => ({
      ...prev,
      [addressKey]: {
        ...prev[addressKey],
        [field]: value,
      },
    }));
    setEditErrors((current) => ({ ...current, [field]: validateAddressField(field, value) }));
  };

  const validateAddressField = (field, value) => {
    const cleanValue = value.trim();
    if (field === "pincode" && cleanValue && !/^\d{6}$/.test(cleanValue)) return "Enter a valid 6-digit pincode";
    const maxLength = field === "street" ? 200 : 100;
    if (cleanValue.length > maxLength) return `Use ${maxLength} characters or fewer`;
    return "";
  };

  const validateEditField = (field, value) => {
    const cleanValue = String(value ?? "").trim();
    if (field === "employeeId" && !cleanValue) return "Employee ID is required";
    if (field === "name" && !cleanValue) return "Full name is required";
    if (field === "mobile" && !/^\d{10}$/.test(cleanValue)) return "Enter a 10-digit mobile number";
    if (field === "altMobile" && cleanValue && !/^\d{10}$/.test(cleanValue)) return "Enter a 10-digit mobile number";
    if (field === "name" && cleanValue.length > 100) return "Use 100 characters or fewer";
    if (field === "employeeId" && cleanValue.length > 40) return "Use 40 characters or fewer";
    if (field === "department" && cleanValue.length > 100) return "Use 100 characters or fewer";
    if (field === "designation" && cleanValue.length > 100) return "Use 100 characters or fewer";
    if (field === "dateOfJoining" && cleanValue && Number.isNaN(Date.parse(cleanValue))) return "Enter a valid joining date";
    return "";
  };

  const validateEditForm = () => {
    const errors = {};
    ["employeeId", "name", "mobile", "altMobile", "department", "designation", "dateOfJoining"].forEach((field) => {
      const error = validateEditField(field, editForm[field]);
      if (error) errors[field] = error;
    });
    if (editForm.employeeType && !["Permanent", "Probation", "Intern"].includes(editForm.employeeType)) errors.employeeType = "Choose a valid employee type";
    if (editForm.attendanceMode && !["office", "work_from_home"].includes(editForm.attendanceMode)) errors.attendanceMode = "Choose a valid attendance mode";
    if (editForm.teamLead && !teamLeadOptions.some((item) => String(item._id) === String(editForm.teamLead))) errors.teamLead = "Choose a valid reporting manager";
    Object.entries(editForm.address).forEach(([field, value]) => {
      const error = validateAddressField(field, value || "");
      if (error) errors[field] = error;
    });
    return errors;
  };

  const handleEditFieldChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name.toLowerCase().includes("mobile") ? value.replace(/\D/g, "").slice(0, 10) : value;
    setEditForm((current) => ({ ...current, [name]: nextValue }));
    setEditErrors((current) => ({ ...current, [name]: validateEditField(name, nextValue) }));
  };

  const departmentOptions = useMemo(() => {
    const values = [
      ...departments.map((item) => item.name),
      editForm.department,
    ];
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort();
  }, [departments, editForm.department]);

  const teamLeadOptions = useMemo(
    () =>
      employeeOptions
        .filter((item) => (item.workRole === "teamlead" || item.user?.role === "teamlead") && String(item._id) !== String(employeeId))
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [employeeId, employeeOptions]
  );

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Unable to copy");
    }
  };

  const filteredAttendance = useMemo(() => {
    if (!reportDate) return attendance;
    return attendance.filter((item) => item.dateKey === reportDate);
  }, [attendance, reportDate]);
  const attendancePagination = usePagination(filteredAttendance, [reportDate, month]);

  const downloadEmployeeReport = () => {
    const rows = filteredAttendance
      .map(
        (item) => `
          <tr>
            <td>${item.dateKey}</td>
            <td>${item.loginAt ? new Date(item.loginAt).toLocaleTimeString() : "-"}</td>
            <td>${item.logoutAt ? new Date(item.logoutAt).toLocaleTimeString() : "-"}</td>
            <td>${minutesToHours(item.totalWorkMinutes)}</td>
            <td>${minutesToHours(item.totalBreakMinutes)}</td>
            <td>${item.status}</td>
          </tr>
        `
      )
      .join("");
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>${employee.name} Report ${month}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:24px;color:#111}
            h1{font-size:22px;margin-bottom:4px}
            table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left}
            th{background:#f5f5f5}
            .summary{display:flex;gap:12px;margin:16px 0;flex-wrap:wrap}
            .box{border:1px solid #ddd;padding:10px}
          </style>
        </head>
        <body>
          <h1>${employee.name} - Monthly Report</h1>
          <p>${employee.employeeId || ""} | ${employee.designation || ""} | ${reportDate || month}</p>
          <div class="summary">
            <div class="box">Days: ${summary?.days || 0}</div>
            <div class="box">Present: ${summary?.present || 0}</div>
            <div class="box">Half Day: ${summary?.halfDay || 0}</div>
            <div class="box">Work: ${minutesToHours(summary?.workMinutes || 0)}</div>
            <div class="box">Break: ${minutesToHours(summary?.breakMinutes || 0)}</div>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Login</th><th>Logout</th><th>Work</th><th>Break</th><th>Status</th></tr></thead>
            <tbody>${rows || "<tr><td colspan='6'>No attendance found</td></tr>"}</tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  if (loading) return <CommonLoader text="Loading employee..." />;
  if (!employee) return <p className="text-red-500">Employee not found</p>;

  const documentItems = [
    ["photo", "Photo"],
    ["aadhaarCard", "Aadhaar Card"],
    ["panCard", "PAN Card"],
    ["passbook", "Bank Proof / Passbook"],
    ["bloodGroupProof", "Blood Group Proof"],
    ["bondDocument", "Bond Document Original"],
    ["bondLetter", "Bond Letter"],
    ["addressProof", "Address Proof"],
    ["degree", "Degree / Qualification"],
    ["resume", "Resume"],
    ["offerLetter", "Offer Letter"],
    ["appointmentLetter", "Appointment Letter"],
    ["leavingLetter", "Leaving Letter"],
    ["experienceCertificate", "Experience Certificate"],
    ["previousCompanyDocument", "Previous Company Document"],
    ["documentXerox", "Previous Document Xerox"],
    ["bankStatement", "Bank Statement"],
    ["salarySlips", "Salary Slips"],
  ];

  const activeBadgeClass = employee.isActive
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";
  const employeeTabs = [
    { value: "details", label: "Details" },
    ...(canManage && hrCanEditModule("employees") ? [{ value: "edit", label: "Edit Profile" }] : []),
    { value: "attendance", label: "Attendance" },
    ...(hrCanViewModule("leaveReports") ? [{ value: "leaves", label: "Leaves" }] : []),
    ...(hrCanViewModule("employeeDocuments") ? [{ value: "documents", label: "Documents" }] : []),
    ...(hrCanViewModule("documents") ? [{ value: "documentSignatures", label: "Documents & Signatures" }] : []),
    ...(canManage && hrCanViewModule("employeeSecurity") ? [{ value: "security", label: "Security" }] : []),
    ...(user?.role === "superadmin" ? [{ value: "access", label: "Role & Access" }, { value: "credentials", label: "Credentials" }] : []),
    ...(canManage && hrCanEditModule("employees") ? [{ value: "actions", label: "Actions" }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="relative min-h-[178px] border-b border-gray-100 p-4 lg:p-5">
          <div className="absolute left-4 top-5 lg:left-5">
            <Button variant="secondary" onClick={() => navigate(-1)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg">
              <FiArrowLeft /> Back
            </Button>
          </div>

          <div className="absolute right-4 top-5 flex max-w-[calc(100%-2rem)] flex-row-reverse items-start justify-end gap-3 lg:right-5">
            <div className="flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-orange-200 bg-orange-50 text-2xl font-semibold text-[#f84525]">
              {employee.documents?.photo?.url ? <img src={employee.documents.photo.url} alt={employee.name} className="h-full w-full object-cover" /> : <Avatar name={employee.name} size="h-full w-full rounded-md text-xl" alt={`${employee.name} profile`} />}
            </div>
            <div className="min-w-0 text-right">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold text-gray-900">{employee.name}</h1>
                
              </div>
              
              <p className="mt-1 text-sm text-gray-500">
                {employee.employeeId || "No employee ID"} / {employee.designation || "No designation"}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <span className="inline-flex items-center rounded-sm border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold capitalize text-orange-700">
                  {employee.user?.role === "teamlead" || employee.workRole === "teamlead" ? "Team Lead" : employee.user?.role === "hr" ? "HR" : "Employee"}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs font-semibold ${activeBadgeClass}`}>
                  {employee.isActive ? <FiCheckCircle /> : <FiUserX />}
                  {employee.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute right-[132px] top-[128px] flex items-center justify-end gap-2 whitespace-nowrap text-xs text-gray-600 lg:right-[140px]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><FiBriefcase className="text-gray-500" />{employee.department || "No department"}</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><FiCalendar className="text-gray-500" />Joined {formatDate(employee.dateOfJoining)}</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><FiShield className="text-gray-500" />{employee.employeeType || "Employee"}</span>
          </div>
        </div>

      </div>

      <div ref={tabsRef} className="rounded-sm border border-gray-200 bg-white px-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <Tabs tabs={employeeTabs} value={activeTab} onChange={changeActiveTab} label="Employee profile sections" />
      </div>

      {activeTab === "details" && <section id="details-panel" role="tabpanel" aria-labelledby="details-tab" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm xl:col-span-2">
          <SectionHeader title="Employee Details" subtitle="Basic information HR/admin needs before making changes." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailItem icon={<FiMail />} label="Email" value={detailFallback(employee.email)} />
            <DetailItem icon={<FiPhone />} label="Mobile" value={detailFallback(employee.mobile)} />
            <DetailItem icon={<FiPhone />} label="Alternate Mobile" value={detailFallback(employee.altMobile)} />
            <DetailItem icon={<FiUser />} label="Father / Husband Name" value={detailFallback(employee.fatherOrHusbandName)} />
            <DetailItem icon={<FiPhone />} label="Emergency Number" value={detailFallback(employee.emergencyNumber)} />
            <DetailItem icon={<FiUser />} label="Gender" value={detailFallback(employee.gender)} />
            <DetailItem icon={<FiBriefcase />} label="HR File No." value={detailFallback(employee.hrFileNo)} />
            <DetailItem icon={<FiBriefcase />} label="Department" value={detailFallback(employee.department)} />
            <DetailItem icon={<FiUser />} label="Designation" value={detailFallback(employee.designation)} />
            <DetailItem icon={<FiCalendar />} label="Date of Birth" value={formatDate(employee.dob)} />
            <DetailItem icon={<FiCalendar />} label="Joining Date" value={formatDate(employee.dateOfJoining)} />
            <DetailItem icon={<FiUserCheck />} label="Reporting Manager" value={detailFallback(employee.reportingManager)} />
            <DetailItem
              icon={<FiUserCheck />}
              label="Team Lead"
              value={employee.teamLead?.name ? `${employee.teamLead.name} (${employee.teamLead.employeeId || "-"})` : "N/A"}
            />
            <DetailItem icon={<FiShield />} label="Employee Type" value={detailFallback(employee.employeeType)} />
            <DetailItem icon={<FiCalendar />} label="Training Period" value={detailFallback(employee.trainingPeriod)} />
            <DetailItem icon={<FiShield />} label="Work Role" value={labelize(employee.workRole || "employee")} />
            <DetailItem
              icon={<FiHome />}
              label="Attendance Mode"
              value={employee.attendanceMode === "work_from_home" ? "Work From Home" : "Office"}
            />
            <DetailItem icon={<FiUser />} label="Created By" value={employee.createdBy?.name || "N/A"} />
            <DetailItem icon={<FiCalendar />} label="Resignation Date" value={formatDate(employee.resignationDate)} />
            <DetailItem icon={<FiCalendar />} label="Leaving Date" value={formatDate(employee.leavingDate)} />
            <DetailItem icon={<FiShield />} label="Salary" value={detailFallback(employee.salary)} />
            <DetailItem icon={<FiShield />} label="Salary Status" value={employee.salaryOnHold ? "On hold" : "Active"} />
            <DetailItem icon={<FiShield />} label="Bond Period" value={detailFallback(employee.bondPeriodDuration)} />
            <DetailItem icon={<FiBriefcase />} label="Bank Holder Name" value={detailFallback(employee.bankHolderName)} />
            <DetailItem icon={<FiBriefcase />} label="Bank Name" value={detailFallback(employee.bankName)} />
            <DetailItem icon={<FiBriefcase />} label="Bank Account Number" value={detailFallback(employee.bankAccountNumber)} />
            <DetailItem icon={<FiBriefcase />} label="Bank IFSC Code" value={detailFallback(employee.bankIfscCode)} />
            <DetailItem icon={<FiBriefcase />} label="Cheque Number" value={detailFallback(employee.chequeNumber)} />
            <DetailItem icon={<FiBriefcase />} label="Cheque Account Number" value={detailFallback(employee.chequeAccountNumber)} />
            <DetailItem icon={<FiShield />} label="Cheque Amount" value={detailFallback(employee.chequeAmount)} />
            <DetailItem icon={<FiCalendar />} label="Cheque Date" value={formatDate(employee.chequeDate)} />
            <DetailItem icon={<FiBriefcase />} label="Cheque Bank Name" value={detailFallback(employee.chequeBankName)} />
            <DetailItem icon={<FiMapPin />} label="Address" value={formatAddress(employee.address)} className="md:col-span-2" />
            <DetailItem icon={<FiMapPin />} label="Permanent Address" value={formatAddress(employee.permanentAddress)} className="md:col-span-2" />
            <DetailItem icon={<FiMapPin />} label="Alternate / Current Address" value={formatAddress(employee.alternateAddress)} className="md:col-span-2" />
          </div>
        </div>
          <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm xl:col-span-1 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-gray-900 dark:text-white">Employee Documents</h3>{hrCanViewModule("employeeDocuments") && <button type="button" onClick={() => changeActiveTab("documents")} className="text-sm font-semibold text-[#f84525]">Manage documents</button>}</div>
            <div className="space-y-2">
              {Object.entries(documentLabelMap).map(([key, label]) => {
                const documentValue = employee.documents?.[key];
                const documentItem = Array.isArray(documentValue) ? documentValue[0] : documentValue;
                const url = documentItem?.url;
                const uploaded = Boolean(url);
                const canViewDocument = hrCanViewModule("employeeDocuments") && uploaded;
                const canDownloadDocument = hrCanDownloadModule("employeeDocuments") && uploaded;
                return <div key={key} className={`flex items-center justify-between rounded-sm border px-3 py-2 text-sm ${uploaded ? "border-green-200 bg-green-50 text-green-800" : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                  <span className="truncate">{label}</span>
                  {uploaded ? <div className="ml-2 flex shrink-0 gap-2">
                    {canViewDocument && <button type="button" onClick={() => setDocumentPreview({ label, url, type: documentItem?.resource_type || documentItem?.format })} className="inline-flex items-center gap-1 rounded-sm border border-green-300 bg-white px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"><FiEye /> View</button>}
                    {canDownloadDocument && <button type="button" onClick={() => downloadEmployeeDocument(url, label)} className="inline-flex items-center gap-1 rounded-sm border border-blue-300 bg-white px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"><FiDownload /> Download</button>}
                  </div> : <span className="ml-2 shrink-0 text-xs font-semibold">Remaining</span>}
                </div>;
              })}
            </div>
          </div>

      </section>}

      {documentPreview && <CommonModal title={documentPreview.label} onClose={() => setDocumentPreview(null)} className="max-w-4xl">
        {String(documentPreview.type || "").toLowerCase().includes("pdf") || /\.pdf(?:$|[?#])/i.test(documentPreview.url) ? <iframe title={documentPreview.label} src={documentPreview.url} className="h-[70vh] w-full rounded-sm border" /> : <img src={documentPreview.url} alt={documentPreview.label} className="max-h-[70vh] w-full object-contain" />}
      </CommonModal>}

      {canManage && hrCanEditModule("employees") && activeTab === "edit" && (
      <form id="edit-panel" role="tabpanel" aria-labelledby="edit-tab" ref={editFormRef} onSubmit={updateEmployee} className="scroll-mt-5 overflow-visible rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-xl text-[#f84525]"><FiUsers /></span>
            <SectionHeader title="Update Employee" subtitle="Edit employee details, work assignment, attendance mode, and more." className="mb-0" />
          </div>
          <Button text={savingProfile ? "Saving..." : "Save Changes"} loading={savingProfile} type="submit" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg sm:min-w-40">
            <FiSave /> Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <section className="min-w-0">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900"><FiBriefcase className="text-[#f84525]" />Personal &amp; Work</h3>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
        {[
          ["employeeId", "Employee ID", "text"],
          ["hrFileNo", "HR File Number", "text"],
          ["firstName", "First Name", "text"],
          ["lastName", "Last Name", "text"],
          ["email", "Email", "email"],
          ["mobile", "Mobile", "text"],
          ["altMobile", "Alt Mobile", "text"],
          ["fatherOrHusbandName", "Father / Husband Name", "text"],
          ["emergencyNumber", "Emergency Contact", "text"],
        ].map(([name, label, type]) => (
          <InputField
            key={name}
            label={label}
            name={name}
            type={type}
            value={editForm[name]}
            onChange={handleEditFieldChange}
            required={["name", "mobile"].includes(name)}
            error={editErrors[name]}
            maxLength={name.toLowerCase().includes("mobile") ? 10 : name === "employeeId" ? 40 : name === "name" ? 100 : 100}
            inputMode={name.toLowerCase().includes("mobile") ? "numeric" : undefined}
            pattern={name.toLowerCase().includes("mobile") ? "[0-9]{10}" : undefined}
            disabled={["employeeId", "hrFileNo"].includes(name) || savingProfile}
          />
        ))}
        <CustomDropdown
          label="Blood Group"
          value={editForm.bloodGroup}
          onChange={(value) => setEditForm((current) => ({ ...current, bloodGroup: value }))}
          options={masterOptions.bloodGroup.length ? masterOptions.bloodGroup : ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
          placeholder="Select blood group"
        />
        <CustomDropdown
          label="Gender"
          value={editForm.gender || "Other"}
          onChange={(value) => setEditForm((current) => ({ ...current, gender: value }))}
          options={["Male", "Female", "Other"]}
        />
        <CalendarPicker
          label="Date of Birth"
          mode="date"
          value={editForm.dob}
          onChange={(value) => setEditForm((current) => ({ ...current, dob: value }))}
        />
        <CustomDropdown
          label="Department"
          value={editForm.department}
          onChange={(value) => {
            setEditForm((current) => ({ ...current, department: value }));
            setEditErrors((current) => ({ ...current, department: validateEditField("department", value) }));
          }}
          options={departmentOptions}
          placeholder="Select department"
          error={editErrors.department}
        />
        <CustomDropdown label="Designation" value={editForm.designation} onChange={(value) => setEditForm((current) => ({ ...current, designation: value }))} options={masterOptions.designation} placeholder="Select designation" searchable />
        <CustomDropdown
          label="Reporting Manager"
          value={editForm.teamLead}
          placeholder="No Reporting Manager"
          searchable
          onChange={(value) => {
            const selectedTeamLead = teamLeadOptions.find((item) => item._id === value);
            setEditForm((prev) => ({
              ...prev,
              teamLead: value,
              reportingManager: selectedTeamLead ? selectedTeamLead.employeeId || selectedTeamLead.name : "",
            }));
            setEditErrors((prev) => ({ ...prev, teamLead: "" }));
          }}
          error={editErrors.teamLead}
          options={teamLeadOptions.map((teamLead) => ({
            value: teamLead._id,
            label: `${teamLead.employeeId || "-"} - ${teamLead.name}`,
          }))}
        />
        <CustomDropdown
          label="Employee Type"
          value={editForm.employeeType}
          onChange={(value) => {
            setEditForm((current) => ({ ...current, employeeType: value }));
            setEditErrors((current) => ({ ...current, employeeType: ["Permanent", "Probation", "Intern"].includes(value) ? "" : "Choose a valid employee type" }));
          }}
          options={masterOptions.employeeType.length ? masterOptions.employeeType : ["Permanent", "Probation", "Intern"]}
          error={editErrors.employeeType}
        />
        <CalendarPicker
          label="Joining Date"
          mode="date"
          value={editForm.dateOfJoining}
          onChange={(value) => {
            setEditForm((current) => ({ ...current, dateOfJoining: value }));
            setEditErrors((current) => ({ ...current, dateOfJoining: validateEditField("dateOfJoining", value) }));
          }}
          error={editErrors.dateOfJoining}
        />
        <CustomDropdown
          label="Attendance Mode"
          value={editForm.attendanceMode}
          onChange={(value) => {
            setEditForm((current) => ({ ...current, attendanceMode: value }));
            setEditErrors((current) => ({ ...current, attendanceMode: "" }));
          }}
          error={editErrors.attendanceMode}
          options={[
            { value: "office", label: "Office" },
            { value: "work_from_home", label: "Work From Home" },
          ]}
        />
        <CustomDropdown
          label="Training / Provision Period"
          value={editForm.trainingPeriod}
          onChange={(value) => setEditForm((current) => ({ ...current, trainingPeriod: value }))}
          options={masterOptions.trainingPeriod.length ? masterOptions.trainingPeriod.map((item) => item.name || item) : ["1 Month", "2 Months", "3 Months", "6 Months", "12 Months"]}
          searchable
          portalMenu
        />
        <CustomDropdown
          label="Bond Period Duration"
          value={editForm.bondPeriodDuration}
          onChange={(value) => setEditForm((current) => ({ ...current, bondPeriodDuration: value }))}
          options={masterOptions.bondPeriod.length ? masterOptions.bondPeriod.map((item) => item.name || item) : ["15 Days", "1 Month", "2 Months", "3 Months", "6 Months", "12 Months"]}
          searchable
          portalMenu
        />
        <CalendarPicker
          label="Resignation Date"
          mode="date"
          value={editForm.resignationDate}
          onChange={(value) => setEditForm((current) => ({ ...current, resignationDate: value }))}
        />
        <CalendarPicker
          label="Leaving Date"
          mode="date"
          value={editForm.leavingDate}
          onChange={(value) => setEditForm((current) => ({ ...current, leavingDate: value }))}
        />
            </div>
          </section>

          <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Upload Documents</h3>
          <div className="grid grid-cols-1 gap-4">
            {documentItems
              .filter(([key]) => key === "salarySlips"
                ? Array.isArray(employee?.documents?.[key]) && employee.documents[key].length > 0
                : Boolean(employee?.documents?.[key]?.url))
              .map(([key, label]) => key === "salarySlips" ? (
                <FileUploadField
                  key={key}
                  label={label}
                  name="salary-slips"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  multiple
                  hint="Select up to 10 salary slips"
                  fileName={documentFiles[key]?.length ? `${documentFiles[key].length} file(s) selected` : existingDocumentFiles[key]}
                  selectedFile={documentFiles[key]?.[0] || null}
                  uploaded={Boolean(documentFiles[key]?.length || existingDocumentFiles[key])}
                  onPreviewCurrent={employee?.documents?.salarySlips?.[0]?.url && hrCanViewModule("employeeDocuments") ? () => setDocumentPreview({ label: "Salary Slips", url: employee.documents.salarySlips[0].url, type: employee.documents.salarySlips[0].resource_type }) : undefined}
                  onDownloadCurrent={employee?.documents?.salarySlips?.[0]?.url && hrCanDownloadModule("employeeDocuments") ? () => downloadEmployeeDocument(employee.documents.salarySlips[0].url, "Salary Slips") : undefined}
                  onChange={(event) => setDocumentFiles((current) => ({ ...current, [key]: Array.from(event.target.files || []).slice(0, 10) }))}
                  disabled={savingProfile || savingDocuments || !canManageDocuments}
                />
            ) : (
              <FileUploadField
                key={key}
                label={label}
                name={key}
                accept={key === "photo" ? ".jpg,.jpeg,.png,.webp" : ".pdf,.jpg,.jpeg,.png,.webp"}
                hint={key === "photo" ? "JPEG · 413 × 531 px · 630 × 810 also supported" : key === "aadhaarCard" ? "Landscape Aadhaar card scan only" : "PDF, JPG, PNG or WEBP"}
                fileName={documentFiles[key]?.name || existingDocumentFiles[key]}
                selectedFile={documentFiles[key] || null}
                uploaded={Boolean(documentFiles[key] || existingDocumentFiles[key])}
                onPreviewCurrent={employee?.documents?.[key]?.url && hrCanViewModule("employeeDocuments") ? () => setDocumentPreview({ label, url: employee.documents[key].url, type: employee.documents[key].resource_type || employee.documents[key].format }) : undefined}
                onDownloadCurrent={employee?.documents?.[key]?.url && hrCanDownloadModule("employeeDocuments") ? () => downloadEmployeeDocument(employee.documents[key].url, label) : undefined}
                error={documentErrors[key]}
                onChange={async (event) => {
                  const file = event.target.files?.[0] || null;
                  if (!file) return;
                  try {
                    const normalizedFile = key === "photo"
                      ? await normalizePassportPhoto(file)
                      : key === "panCard" && !/\.pdf$/i.test(file.name)
                        ? await normalizePanPhoto(file)
                        : file;
                    setDocumentErrors((current) => ({ ...current, [key]: "" }));
                    setDocumentFiles((current) => ({ ...current, [key]: normalizedFile }));
                  } catch (error) {
                    setDocumentErrors((current) => ({ ...current, [key]: error.message || "Unable to process this document" }));
                    setDocumentFiles((current) => ({ ...current, [key]: null }));
                  }
                }}
                disabled={savingProfile || savingDocuments || !canManageDocuments}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">Documents selected here will be uploaded when you click “Save Changes”.</p>
        </div>
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Salary &amp; Bank</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
            <InputField label="Salary" name="salary" value={editForm.salary} onChange={handleEditFieldChange} />
            <InputField label="Bank Holder Name" name="bankHolderName" value={editForm.bankHolderName} onChange={handleEditFieldChange} />
            <InputField label="Bank Name" name="bankName" value={editForm.bankName} onChange={handleEditFieldChange} />
            <InputField label="Bank Account Number" name="bankAccountNumber" value={editForm.bankAccountNumber} onChange={handleEditFieldChange} />
            <InputField label="Bank IFSC Code" name="bankIfscCode" value={editForm.bankIfscCode} onChange={handleEditFieldChange} />
            <InputField label="Cheque Number" name="chequeNumber" value={editForm.chequeNumber} onChange={handleEditFieldChange} />
            <InputField label="Cheque Account Number" name="chequeAccountNumber" value={editForm.chequeAccountNumber} onChange={handleEditFieldChange} />
            <InputField label="Cheque Amount" name="chequeAmount" value={editForm.chequeAmount} onChange={handleEditFieldChange} />
            <InputField label="Cheque Bank Name" name="chequeBankName" value={editForm.chequeBankName} onChange={handleEditFieldChange} />
            <CalendarPicker label="Cheque Date" mode="date" value={editForm.chequeDate} onChange={(value) => setEditForm((current) => ({ ...current, chequeDate: value }))} />
            <label className="flex h-[42px] items-center gap-2 rounded-md border border-gray-200 px-3 text-sm text-gray-700 md:mt-[22px] dark:border-gray-700 dark:text-gray-200"><input type="checkbox" checked={Boolean(editForm.salaryOnHold)} onChange={(event) => setEditForm((current) => ({ ...current, salaryOnHold: event.target.checked }))} /> Salary on hold</label>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Address</h3>
          <div className="space-y-5"><div><h3 className="mb-2 font-semibold">Permanent Address</h3><AddressFields value={editForm.permanentAddress} onChange={(event) => handleAddressChange(event, "permanentAddress")} errors={editErrors} className="border-0 p-0 md:grid-cols-3 xl:grid-cols-5" /></div><div><h3 className="mb-2 font-semibold">Alternative / Current Address</h3><AddressFields value={editForm.alternateAddress} onChange={(event) => handleAddressChange(event, "alternateAddress")} errors={editErrors} className="border-0 p-0 md:grid-cols-3 xl:grid-cols-5" /></div></div>
        </div>
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Employee Checklists</h3>
          <EmployeeChecklist value={editForm} onChange={handleChecklistChange} disabled={savingProfile} />
        </div>
        </div>
      </form>
      )}

      {user?.role === "superadmin" && activeTab === "access" && (
        <section id="access-panel" role="tabpanel" className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-lg font-semibold">Role &amp; Access</h2><p className="text-sm text-gray-500">Assign this user as Employee or Team Lead and manage individual module access.</p></div>
            <CustomDropdown label="Role" value={roleDraft} disabled={accessLoading || savingAccess} showPlaceholder={false} options={[{ value: "employee", label: "Employee" }, { value: "teamlead", label: "Team Lead" }, { value: "hr", label: "HR" }]} onChange={(value) => { setRoleDraft(value); const modules = value === "hr" ? hrAccessModules : value === "teamlead" ? teamLeadAccessModules : employeeAccessModules; setAccessDraft(Object.fromEntries(modules.map(([key, , actions = ["view", "add", "edit", "delete"]]) => [key, Object.fromEntries(actions.map((action) => [action, action === "view" && (key === "dashboard" || key === "settings")]))]))); }} className="w-full sm:w-64" portalMenu placement="bottom" />
          </div>
          {accessLoading ? <CommonLoader text="Loading role and access..." /> : <ModulePermissionMatrix modules={roleDraft === "hr" ? hrAccessModules : roleDraft === "teamlead" ? teamLeadAccessModules : employeeAccessModules} value={accessDraft} onChange={(key, value) => setAccessDraft((current) => ({ ...current, [key]: value }))} />}
          <div className="mt-4 flex justify-end"><Button text="Save Role & Access" loading={savingAccess} onClick={saveEmployeeAccess} /></div>
        </section>
      )}

      {user?.role === "superadmin" && activeTab === "credentials" && (
        <section id="credentials-panel" role="tabpanel" aria-labelledby="credentials-tab" className="bg-white rounded-sm shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Employee Saved Credentials</h2>
          </div>
          {accountCredentials.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No saved credentials found.</p>
          ) : (
            accountCredentials.map((item) => (
              <div key={item._id} className="border-t px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.accountType}</p>
                  <p className="text-sm break-all mt-1">{item.loginId}</p>
                  <p className="text-sm mt-1">{revealedPasswords[item._id] ? item.password : "••••••••"}</p>
                  {item.notes ? <p className="text-xs text-gray-500 mt-1">{item.notes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRevealedPasswords((prev) => ({ ...prev, [item._id]: !prev[item._id] }))} className="border rounded-sm px-3 py-2 text-sm">
                    {revealedPasswords[item._id] ? <FiEyeOff /> : <FiEye />}
                  </button>
                  <button type="button" onClick={() => copyValue(item.loginId, "Login")} className="border rounded-sm px-3 py-2 text-sm">
                    <FiCopy />
                  </button>
                  <button type="button" onClick={() => copyValue(item.password, "Password")} className="border rounded-sm px-3 py-2 text-sm">
                    <FiCopy />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {canManage && hrCanViewModule("employeeSecurity") && activeTab === "security" && (
        <section className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Security" subtitle="Manage this employee login securely." />
          <div className="mt-5 flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-4">
            <div><p className="font-semibold text-gray-900">Login password</p><p className="text-sm text-gray-500">Password protected</p></div>
            {hrCanViewModule("employeeSecurity") && <Button variant="secondary" loading={loadingLoginPassword} onClick={async () => { setLoadingLoginPassword(true); try { const response = await hrApi.getEmployeeLoginPassword(employeeId); setLoginPassword(response.data.data); setPasswordViewOpen(true); } catch (err) { toast.error(err.response?.data?.message || "Unable to load password"); } finally { setLoadingLoginPassword(false); } }} className="inline-flex items-center gap-2 whitespace-nowrap"><FiEye /> View Password</Button>}
            {hrCanUpdateModule("employeeSecurity") && <Button variant="secondary" onClick={() => setPasswordModalOpen(true)} className="inline-flex items-center gap-2 whitespace-nowrap"><FiShield /> Change Password</Button>}
          </div>
        </section>
      )}
      {passwordViewOpen && loginPassword && <CommonModal title="Employee login password" subtitle={`Login ID: ${loginPassword.loginId || employee.email}`} className="max-w-md" showClose={false} onClose={() => setPasswordViewOpen(false)}><div className="flex items-center gap-2"><code className="flex-1 rounded border bg-gray-50 p-3 text-sm text-gray-900">{loginPassword.password}</code><button type="button" title="Copy password" aria-label="Copy password" className="rounded border border-gray-300 p-3 text-gray-700 hover:bg-gray-50" onClick={async () => { await navigator.clipboard.writeText(loginPassword.password); toast.success("Password copied"); }}><FiCopy /></button></div></CommonModal>}

      {canManage && hrCanEditModule("employees") && activeTab === "actions" && (
        <section className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Employee Actions" subtitle="Generate reports and manage this employee account." />
          <div className="mt-5 grid grid-cols-1 gap-4 rounded border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
            <CalendarPicker label="Report month" mode="month" value={month} onChange={setMonth} />
            <CalendarPicker label="Specific date (optional)" mode="date" value={reportDate} onChange={(value) => { setReportDate(value); if (value) setMonth(value.slice(0, 7)); }} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={downloadEmployeeReport} className="inline-flex items-center gap-2"><FiDownload /> {reportDate ? "Download Day Report" : "Download Monthly PDF"}</Button>
            {employee.isActive ? <Button variant="danger" onClick={deactivateEmployee} className="inline-flex items-center gap-2"><FiUserX /> Deactivate</Button> : <Button variant="success" onClick={activateEmployee} className="inline-flex items-center gap-2"><FiUserCheck /> Activate</Button>}
            {user?.role === "superadmin" && <Button variant="danger" loading={deletingEmployee} disabled={deletingEmployee} onClick={deleteEmployee} className="inline-flex items-center gap-2"><FiTrash2 /> {deletingEmployee ? "Deleting..." : "Delete Employee"}</Button>}
          </div>
        </section>
      )}

      {activeTab === "documents" && hrCanViewModule("employeeDocuments") && <section id="documents-panel" role="tabpanel" className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <SectionHeader title="Documents" subtitle={canManageDocuments ? "Upload or replace employee documents below." : "View uploaded employee documents."} />
        <div className="mt-5 space-y-2">
          {documentItems.map(([key, label]) => {
            const item = Array.isArray(employee.documents?.[key]) ? employee.documents[key][0] : employee.documents?.[key];
            if (!item?.url) return null;
            return <div key={key} className="flex items-center justify-between rounded border border-green-200 bg-green-50 px-3 py-2 text-sm"><span className="font-medium text-green-900">{label}</span><div className="flex gap-2"><button type="button" onClick={() => setDocumentPreview({ label, url: item.url, type: item.resource_type || item.format })} className="rounded border border-green-300 bg-white px-2 py-1 text-xs font-semibold text-green-700"><FiEye /> View</button>{hrCanDownloadModule("employeeDocuments") && <button type="button" onClick={() => downloadEmployeeDocument(item.url, label)} className="rounded border border-blue-300 bg-white px-2 py-1 text-xs font-semibold text-blue-700"><FiDownload /> Download</button>}</div></div>;
          })}
          {!documentItems.some(([key]) => { const item = employee.documents?.[key]; return Array.isArray(item) ? item.length > 0 : Boolean(item?.url); }) && <p className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No uploaded documents found.</p>}
        </div>
        {canManageDocuments && <form onSubmit={saveEmployeeDocuments} className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-700"><div className="grid grid-cols-1 gap-4">{documentItems.map(([key, label]) => { const isSupporting = key === "addressProof"; const isResume = key === "resume"; const isScan = ["aadhaarCard", "panCard", "passbook", "bloodGroupProof", "addressProof", "degree"].includes(key); const accept = key === "photo" ? ".jpg,.jpeg,.png,.webp" : (isSupporting || isResume) ? ".pdf,.jpg,.jpeg" : ".pdf,.jpg,.jpeg,.png,.webp"; return <FileUploadField key={key} label={label} name={key} accept={accept} hint={key === "photo" ? "JPEG · 413 × 531 px (default) · 630 × 810 also supported" : key === "aadhaarCard" ? "Aadhaar scan only · landscape card image required" : key === "panCard" ? "Image: 197 × 276 px (NSDL) · PDF also allowed" : isResume ? "PDF or JPG/JPEG · no fixed dimensions · keep text readable" : isSupporting ? "PDF, JPG, JPEG · max 500 KB · 150–200 DPI" : isScan ? "PDF or JPG/JPEG scan · 150–300 DPI · keep within portal limit" : "PDF, JPG, PNG, WEBP"} fileName={documentFiles[key]?.name || existingDocumentFiles[key]} selectedFile={documentFiles[key] || null} uploaded={Boolean(documentFiles[key] || existingDocumentFiles[key])} error={documentErrors[key]} onChange={async (event) => { const file = event.target.files?.[0] || null; if (!file) return; const extension = file.name.split(".").pop()?.toLowerCase(); const allowed = key === "photo" ? ["jpg", "jpeg", "png", "webp"] : (isSupporting || isResume) ? ["pdf", "jpg", "jpeg"] : ["pdf", "jpg", "jpeg", "png", "webp"]; if (!allowed.includes(extension) || (isSupporting && file.size > 500 * 1024 && extension === "pdf")) { setDocumentErrors((current) => ({ ...current, [key]: `Invalid file for ${label}. Allowed: ${allowed.join(", ")} and max 500 KB.` })); setDocumentFiles((current) => ({ ...current, [key]: null })); return; } try { if (key === "aadhaarCard" && extension !== "pdf") { const { width, height } = await readImageSize(file); const ratio = width / height; if (ratio < 1.3 || ratio > 2.1) throw new Error("Aadhaar card image must be landscape"); } const normalizedFile = key === "photo" ? await normalizePassportPhoto(file) : key === "panCard" && extension !== "pdf" ? await normalizePanPhoto(file) : isSupporting && extension !== "pdf" ? await normalizeSupportingImage(file) : file; setDocumentErrors((current) => ({ ...current, [key]: "" })); setDocumentFiles((current) => ({ ...current, [key]: normalizedFile })); } catch (error) { setDocumentErrors((current) => ({ ...current, [key]: error.message === "Aadhaar card image must be landscape" ? "Invalid Aadhaar image. Upload a landscape Aadhaar card scan, not a normal portrait photo." : "Unable to process this document" })); setDocumentFiles((current) => ({ ...current, [key]: null })); } }} disabled={savingDocuments} />; })}</div><div className="mt-4 flex justify-end"><Button type="submit" loading={savingDocuments} text="Save Documents" /></div></form>}
      </section>}

      {hrCanViewModule("documents") && activeTab === "documentSignatures" && <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4"><DocumentSigningList managed employeeFilterId={employeeId} moduleAccess={hrModuleAccess} /></div>
      </section>}

      {hrCanViewModule("leaveReports") && activeTab === "leaves" && <section className="rounded-sm bg-white p-4 shadow dark:bg-gray-900"><h2 className="mb-4 font-semibold">Employee Leaves</h2>{employeeLeavesLoading ? <CommonLoader text="Loading leaves..." /> : <CommonTable columns={[{ accessor: "type", header: "Leave Type", render: (value) => labelize(value) }, { accessor: "fromDate", header: "From", render: (value) => formatDate(value) }, { accessor: "toDate", header: "To", render: (value) => formatDate(value) }, { accessor: "status", header: "Status" }, { accessor: "reason", header: "Reason" }]} data={employeeLeaves} actions={[{ key: "view", label: "View leave", icon: <FiEye className="h-4 w-4" />, iconOnly: true, onClick: openEmployeeLeaveDrawer, className: "border border-orange-200 text-orange-600" }]} emptyText="No leaves found." />}</section>}

      {activeTab === "attendance" && <section id="attendance-panel" role="tabpanel" aria-labelledby="attendance-tab" className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">This Month Attendance</h2>
        </div>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-4 border-b text-sm">
            <p><b>Days:</b> {summary.days}</p>
            <p><b>Present:</b> {summary.present}</p>
            <p><b>Half Day:</b> {summary.halfDay}</p>
            <p><b>Work:</b> {minutesToHours(summary.workMinutes)}</p>
            <p><b>Break:</b> {minutesToHours(summary.breakMinutes)}</p>
          </div>
        )}
        {filteredAttendance.length === 0 ? (
          <EmptyState text="No attendance found." />
        ) : (
          <CommonTable
            columns={[
              { accessor: "dateKey", header: "Date" },
              { accessor: "status", header: "Status" },
              { accessor: "totalWorkMinutes", header: "Work", render: (value) => minutesToHours(value) },
              { accessor: "totalBreakMinutes", header: "Break", render: (value) => minutesToHours(value) },
              { accessor: "logoutAt", header: "Logout", render: (value) => value ? new Date(value).toLocaleTimeString() : "Running" },
            ]}
            data={attendancePagination.pageItems}
            pagination={attendancePagination}
          />
        )}
      </section>}

      {selectedEmployeeLeave && <CommonModal title="Leave request" drawer open={employeeLeaveDrawerOpen} className="!h-screen !max-h-none !max-w-[672px] !rounded-none" onClose={closeEmployeeLeaveDrawer} footer={<><Button text="Close" variant="secondary" onClick={closeEmployeeLeaveDrawer} />{hrCanEditModule("leaveActions") && selectedEmployeeLeave.status === "pending" && <><Button text="Reject" className="!bg-red-600" onClick={() => reviewEmployeeLeave("rejected")} /><Button text="Approve" className="!bg-green-600" onClick={() => reviewEmployeeLeave("approved")} /></>}{hrModuleAccess?.leaveActions?.delete === true && <Button text="Delete" className="!bg-red-700" onClick={async () => { try { await hrApi.deleteLeave(selectedEmployeeLeave._id, employeeId); closeEmployeeLeaveDrawer(); setEmployeeLeaves((items) => items.filter((item) => item._id !== selectedEmployeeLeave._id)); toast.success("Leave request deleted"); } catch (err) { toast.error(err.response?.data?.message || "Unable to delete leave"); } }} />}</>}>
        <div className="grid grid-cols-3 gap-2">
          {employeeLeaveBalanceTypes.map(({ value, label }) => {
            const item = selectedLeaveBalance?.balance?.[value] || { total: 0, used: 0, remaining: 0 };
            const usage = item.total > 0 ? Math.min(100, Math.max(0, (item.used / item.total) * 100)) : 0;
            return <article key={value} className="min-w-0 rounded-sm border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"><p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{item.remaining}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Remaining</p><p className="mt-3 text-xs tabular-nums text-gray-500 dark:text-gray-400">{item.used} / {item.total} used</p><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"><div className="h-full rounded-full bg-[#f84525]" style={{ width: `${usage}%` }} /></div></article>;
          })}
        </div>
        <h3 className="mb-3 mt-6 text-base font-semibold">Leave request details</h3>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <span className="text-gray-500">Status</span><span className="text-right"><b className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${selectedEmployeeLeave.status === "approved" ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300" : selectedEmployeeLeave.status === "rejected" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"}`}>{selectedEmployeeLeave.status}</b></span>
            <span className="text-gray-500">Type</span><b className="text-right">{labelize(selectedEmployeeLeave.type)}</b>
            <span className="text-gray-500">Duration</span><b className="text-right">{formatDate(selectedEmployeeLeave.fromDate)} <span className="mx-1 text-gray-400">→</span> {formatDate(selectedEmployeeLeave.toDate)}</b>
          </div>
        </div>
               <p className="mt-3 text-xs text-gray-500">ⓘ &nbsp;Urgent Leave, Half Day (0.5 day), and Full Day requests are deducted from Earned Leave.</p>
        {hrCanUpdateModule("leaveActions") && <form onSubmit={(event) => { event.preventDefault(); adjustSelectedLeave(); }} className="mt-4 grid grid-cols-1 gap-3 border-y border-gray-100 py-3 dark:border-gray-800 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_auto] xl:items-end">
          <div className="min-w-0"><span className="block text-sm font-medium leading-5 text-gray-700 dark:text-gray-200">Leave type</span><CustomDropdown className="mt-1" buttonClassName="!h-10 !min-h-10 w-full" value={adjustType} onChange={setAdjustType} options={employeeLeaveBalanceTypes} searchable={false} showPlaceholder={false} portalMenu /></div>
          <label className="block min-w-0 text-sm font-medium leading-5 text-gray-700 dark:text-gray-200">Adjust days<input type="number" step="0.5" min="-365" max="365" value={adjustDays} onChange={(event) => setAdjustDays(event.target.value)} placeholder="e.g. 2 or -1" className="mt-1 block h-10 w-full box-border rounded-sm border border-gray-300 bg-white px-3 text-sm font-normal dark:border-gray-700 dark:bg-gray-800" required /></label>
          <label className="block min-w-0 text-sm font-medium leading-5 text-gray-700 dark:text-gray-200">Reason<input value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} maxLength={500} placeholder="Why adjusting these leaves?" className="mt-1 block h-10 w-full box-border rounded-sm border border-gray-300 bg-white px-3 text-sm font-normal dark:border-gray-700 dark:bg-gray-800" required /></label>
          <Button text="Adjust leaves" type="submit" className="h-10 whitespace-nowrap self-end" />
        </form>}
        {selectedLeaveBalance && <section className="mt-3"><h3 className="text-sm font-semibold">Leave adjustments</h3>{selectedLeaveBalance.adjustments?.length ? <div className="mt-2 space-y-2">{selectedLeaveBalance.adjustments.map((item, index) => <div key={`${item._id || item.adjustedAt}-${index}`} className="flex flex-col gap-1 rounded-sm border border-gray-100 px-3 py-2 text-xs dark:border-gray-800 sm:flex-row sm:justify-between"><span className="font-medium">{item.days > 0 ? "+" : ""}{item.days} days · {labelize(item.type)}</span><span className="text-gray-500">{item.adjustedBy?.name || item.adjustedBy?.email || "Admin"} · {item.reason}</span></div>)}</div> : <p className="mt-1 text-sm text-gray-500">No leave adjustments yet.</p>}</section>}
        <p className="mt-4 rounded-sm border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800"><span className="font-semibold">Reason</span><br />{selectedEmployeeLeave.reason || selectedEmployeeLeave.content || "-"}</p>
        <LeaveReviewDetails leave={selectedEmployeeLeave} />
      </CommonModal>}

      {adjustmentSaving && <CommonLoader fullScreen text="Updating leave balance..." />}

      {passwordModalOpen && <CommonModal title="Change employee password" subtitle={`Set a new login password for ${employee.name}.`} className="max-w-md" as="form" onSubmit={resetEmployeePassword} onClose={() => { if (!savingPassword) setPasswordModalOpen(false); }} footer={<><Button text="Cancel" variant="secondary" type="button" disabled={savingPassword} onClick={() => setPasswordModalOpen(false)} /><Button text="Save Password" type="submit" loading={savingPassword} disabled={newEmployeePassword.length < 8} /></>}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">New password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={newEmployeePassword} onChange={(event) => setNewEmployeePassword(event.target.value)} className="mt-2 w-full rounded-sm border border-gray-300 p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Minimum 8 characters" required /></label>
        <p className="mt-3 text-xs text-gray-500">The employee will need to use this new password on their next login.</p>
      </CommonModal>}

    </div>
  );
};

export default EmployeeDetail;
