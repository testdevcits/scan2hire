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
const employeeAccessModules = [["dashboard", "Dashboard"], ["attendance", "Attendance"], ["interviews", "Interviews"], ["leaves", "Leaves"], ["leaveCalendar", "Conative Calendar"], ["systemAllotment", "My System"], ["documents", "Documents"], ["credentials", "Credentials"], ["settings", "Settings"]];
const hrAccessModules = [["dashboard", "Dashboard"], ["employees", "Employees"], ["candidates", "Candidates"], ["checkins", "Today Check-ins"], ["attendanceReports", "Attendance Reports"], ["leaveReports", "Leave Reports"], ["documents", "Documents & Signatures"], ["credentials", "Credentials"], ["rolesAccess", "Roles & Access"], ["systemAllotments", "System Allotments"]];
const documentLabelMap = { photo: "Photo", aadhaarCard: "Aadhaar Card", panCard: "PAN Card", passbook: "Bank Proof / Passbook", bloodGroupProof: "Blood Group Proof", addressProof: "Address Proof", addressProofPermanent: "Permanent Address Proof", addressProofAlternate: "Alternate Address Proof", degree: "Degree", resume: "Resume" };
const resolveEmployeeTab = (requestedTab, canManage, isSuperAdmin, editRequested) => {
  const availableTabs = ["details", "attendance", "documents", "documentSignatures"];
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
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    employeeId: "",
    name: "",
    mobile: "",
    altMobile: "",
    bloodGroup: "",
    department: "",
    designation: "",
    dob: "",
    dateOfJoining: "",
    reportingManager: "",
    teamLead: "",
    employeeType: "Permanent",
    attendanceMode: "office",
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
  const [documentFiles, setDocumentFiles] = useState({});
  const [existingDocumentFiles, setExistingDocumentFiles] = useState({});
  const [documentErrors, setDocumentErrors] = useState({});
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [newEmployeePassword, setNewEmployeePassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [accessDraft, setAccessDraft] = useState({});
  const [roleDraft, setRoleDraft] = useState("employee");
  const [savingAccess, setSavingAccess] = useState(false);
  const [hrModuleAccess, setHrModuleAccess] = useState(null);
  const [activeTab, setActiveTabState] = useState(() => {
    const params = new URLSearchParams(location.search);
    return resolveEmployeeTab(params.get("tab"), canManage, user?.role === "superadmin", params.get("edit") === "1");
  });

  const changeActiveTab = (tab) => {
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
    setActiveTabState(tab);
  };
  const handleChecklistChange = (group, key, value) => setEditForm((current) => ({ ...current, [group]: { ...(current[group] || {}), [key]: value } }));

  const loadEmployee = async ({ includeReport = true, initial = false } = {}) => {
    if (initial) setLoading(true);
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
      setExistingDocumentFiles(Object.fromEntries(Object.entries(employeeData.documents || {}).map(([key, value]) => [key, value?.name || value?.fileName || (value?.url ? `${documentLabelMap[key] || key} (saved)` : "")]).filter(([, name]) => name)));
      const defaultAccess = Object.fromEntries(employeeAccessModules.map(([key]) => [key, employeeData.user?.moduleAccess?.[key] || { view: true, edit: true }]));
      setAccessDraft(defaultAccess);
      setRoleDraft(employeeData.user?.role === "teamlead" || employeeData.workRole === "teamlead" ? "teamlead" : "employee");
      if (canManage) {
        setEmployeeOptions(employeesRes?.data?.data || []);
        setDepartments(departmentsRes?.data?.data || []);
      }
      setEditForm({
        employeeId: employeeData.employeeId || "",
        name: employeeData.name || "",
        mobile: employeeData.mobile || "",
        altMobile: employeeData.altMobile || "",
        bloodGroup: employeeData.bloodGroup || "",
        department: employeeData.department || "",
        designation: employeeData.designation || "",
        dob: employeeData.dob ? employeeData.dob.slice(0, 10) : "",
        dateOfJoining: employeeData.dateOfJoining ? employeeData.dateOfJoining.slice(0, 10) : "",
        reportingManager: employeeData.reportingManager || "",
        teamLead: employeeData.teamLead?._id || employeeData.teamLead || "",
        employeeType: employeeData.employeeType || "Permanent",
        attendanceMode: employeeData.attendanceMode || "office",
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
    }
  };

  const hrCanViewModule = (key) => user?.role !== "hr"
    || hrModuleAccess === null
    || hrModuleAccess?.[key] === undefined
    || hrModuleAccess[key]?.view !== false;
  const hrCanEditModule = (key) => user?.role !== "hr"
    || hrModuleAccess === null
    || hrModuleAccess?.[key] === undefined
    || hrModuleAccess[key]?.edit !== false;
  const canManageDocuments = (user?.role === "hr" || user?.role === "superadmin") && hrCanEditModule("documents");

  // The tab guard intentionally runs when the active tab or fetched HR permissions change.
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
      await hrApi.deleteEmployee(employeeId);
      toast.success("Employee deleted");
      navigate(user?.role === "superadmin" ? "/admin/employees" : "/hr/employees");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete");
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
        name: editForm.name.trim(),
        mobile: editForm.mobile.trim(),
        altMobile: editForm.altMobile.trim(),
        department: editForm.department.trim(),
        designation: editForm.designation.trim(),
        address: Object.fromEntries(Object.entries(editForm.address).map(([key, value]) => [key, value.trim()])),
        permanentAddress: Object.fromEntries(Object.entries(editForm.permanentAddress).map(([key, value]) => [key, value.trim()])),
        alternateAddress: Object.fromEntries(Object.entries(editForm.alternateAddress).map(([key, value]) => [key, value.trim()])),
      };
      await hrApi.updateEmployee(employeeId, payload);
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
        payload[key] = { dataUri: await fileToDataUri(file), name: file.name, type: file.type };
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
    if (editForm.employeeType && !["Permanent", "Contract", "Intern"].includes(editForm.employeeType)) errors.employeeType = "Choose a valid employee type";
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
    ["addressProofPermanent", "Permanent Address Proof"],
    ["addressProofAlternate", "Alternate Address Proof"],
    ["degree", "Degree"],
    ["resume", "Resume"],
  ];

  const activeBadgeClass = employee.isActive
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";
  const employeeTabs = [
    { value: "details", label: "Details" },
    ...(canManage && hrCanEditModule("employees") ? [{ value: "edit", label: "Edit Profile" }] : []),
    { value: "attendance", label: "Attendance" },
    { value: "documents", label: "Documents" },
    ...(hrCanViewModule("documents") ? [{ value: "documentSignatures", label: "Documents & Signatures" }] : []),
    ...(canManage && hrCanEditModule("employees") ? [{ value: "security", label: "Security" }] : []),
    ...(user?.role === "superadmin" ? [{ value: "access", label: "Role & Access" }, { value: "credentials", label: "Credentials" }] : []),
    ...(canManage && hrCanEditModule("employees") ? [{ value: "actions", label: "Actions" }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-4 lg:grid-cols-[auto_minmax(320px,1fr)_auto] lg:items-center lg:gap-x-5 lg:gap-y-3 lg:p-5">
          <div className="order-1 flex min-w-0 items-center gap-3 lg:col-start-3 lg:row-start-1 lg:justify-self-end">
            <Avatar name={employee.name} src={employee.documents?.photo?.url} size="h-16 w-16" className="text-xl" alt={`${employee.name} profile`} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold text-gray-900">{employee.name}</h1>
                <span className="inline-flex items-center rounded-sm border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold capitalize text-orange-700">
                  {employee.user?.role === "teamlead" || employee.workRole === "teamlead" ? "Team Lead" : employee.user?.role === "hr" ? "HR" : "Employee"}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs font-semibold ${activeBadgeClass}`}>
                  {employee.isActive ? <FiCheckCircle /> : <FiUserX />}
                  {employee.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {employee.employeeId || "No employee ID"} / {employee.designation || "No designation"}
              </p>
            </div>
          </div>

          <div className="order-2 flex flex-wrap items-center gap-2 lg:col-start-1 lg:row-start-1 lg:justify-self-start">
            <Button variant="secondary" onClick={() => navigate(-1)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg">
              <FiArrowLeft /> Back
            </Button>
          </div>

          <div className="order-4 flex flex-wrap items-center gap-2 text-xs text-gray-600 lg:col-start-3 lg:row-start-2 lg:justify-self-end">
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
            <DetailItem
              icon={<FiHome />}
              label="Attendance Mode"
              value={employee.attendanceMode === "work_from_home" ? "Work From Home" : "Office"}
            />
            <DetailItem icon={<FiUser />} label="Created By" value={employee.createdBy?.name || "N/A"} />
            <DetailItem icon={<FiMapPin />} label="Address" value={formatAddress(employee.address)} className="md:col-span-2" />
          </div>
        </div>
          <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm xl:col-span-1 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-gray-900 dark:text-white">Employee Documents</h3><button type="button" onClick={() => changeActiveTab("documents")} className="text-sm font-semibold text-[#f84525]">Manage documents</button></div>
            <div className="space-y-2">{Object.entries(documentLabelMap).map(([key, label]) => { const url = employee.documents?.[key]?.url; const uploaded = Boolean(url); return <div key={key} className={`flex items-center justify-between rounded-sm border px-3 py-2 text-sm ${uploaded ? "border-green-200 bg-green-50 text-green-800" : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}><span className="truncate">{label}</span>{uploaded ? <button type="button" onClick={() => setDocumentPreview({ label, url, type: employee.documents?.[key]?.resource_type || employee.documents?.[key]?.format })} className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-sm border border-green-300 bg-white px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"><FiEye /> View</button> : <span className="ml-2 shrink-0 text-xs font-semibold">Remaining</span>}</div>; })}</div>
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
          ["name", "Full Name", "text"],
          ["mobile", "Mobile", "text"],
          ["altMobile", "Alt Mobile", "text"],
          ["designation", "Designation", "text"],
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
          />
        ))}
        <CustomDropdown
          label="Blood Group"
          value={editForm.bloodGroup}
          onChange={(value) => setEditForm((current) => ({ ...current, bloodGroup: value }))}
          options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
          placeholder="Select blood group"
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
            setEditErrors((current) => ({ ...current, employeeType: ["Permanent", "Contract", "Intern"].includes(value) ? "" : "Choose a valid employee type" }));
          }}
          options={["Permanent", "Contract", "Intern"]}
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
            </div>
          </section>

        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900"><FiMapPin className="text-[#f84525]" />Address</h3>
          <div className="space-y-5"><div><h3 className="mb-2 font-semibold">Permanent Address</h3><AddressFields value={editForm.permanentAddress} onChange={(event) => handleAddressChange(event, "permanentAddress")} errors={editErrors} className="border-0 p-0 md:grid-cols-3 xl:grid-cols-5" /></div><div><h3 className="mb-2 font-semibold">Alternative / Current Address</h3><AddressFields value={editForm.alternateAddress} onChange={(event) => handleAddressChange(event, "alternateAddress")} errors={editErrors} className="border-0 p-0 md:grid-cols-3 xl:grid-cols-5" /></div></div>
        </div>
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Employee Checklists</h3>
          <EmployeeChecklist value={editForm} onChange={handleChecklistChange} disabled={savingProfile} />
        </div>
      </form>
      )}

      {user?.role === "superadmin" && activeTab === "access" && (
        <section id="access-panel" role="tabpanel" className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-lg font-semibold">Role &amp; Access</h2><p className="text-sm text-gray-500">Assign this user as Employee or Team Lead and manage individual module access.</p></div>
            <CustomDropdown label="Role" value={roleDraft} showPlaceholder={false} options={[{ value: "employee", label: "Employee" }, { value: "teamlead", label: "Team Lead" }, { value: "hr", label: "HR" }]} onChange={(value) => { setRoleDraft(value); setAccessDraft(Object.fromEntries((value === "hr" ? hrAccessModules : employeeAccessModules).map(([key]) => [key, { view: true, edit: true }]))); }} className="w-full sm:w-64" portalMenu placement="bottom" />
          </div>
          <ModulePermissionMatrix modules={roleDraft === "hr" ? hrAccessModules : employeeAccessModules} value={accessDraft} onChange={(key, value) => setAccessDraft((current) => ({ ...current, [key]: value }))} />
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

      {canManage && hrCanEditModule("employees") && activeTab === "security" && (
        <section className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Security" subtitle="Manage this employee login securely." />
          <div className="mt-5 flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-4">
            <div><p className="font-semibold text-gray-900">Login password</p><p className="text-sm text-gray-500">Set a new password for this employee account.</p></div>
            <Button variant="secondary" onClick={() => setPasswordModalOpen(true)} className="inline-flex items-center gap-2 whitespace-nowrap"><FiShield /> Change Password</Button>
          </div>
        </section>
      )}

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
            {user?.role === "superadmin" && <Button variant="danger" onClick={deleteEmployee} className="inline-flex items-center gap-2"><FiTrash2 /> Delete Employee</Button>}
          </div>
        </section>
      )}

      {activeTab === "documents" && <section id="documents-panel" role="tabpanel" className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <SectionHeader title="Documents" subtitle="Upload or replace employee documents below." />
        {canManageDocuments && <form onSubmit={saveEmployeeDocuments} className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-700"><div className="grid grid-cols-1 gap-4">{documentItems.map(([key, label]) => { const isSupporting = key === "addressProof"; const isResume = key === "resume"; const isScan = ["aadhaarCard", "panCard", "passbook", "bloodGroupProof", "addressProof", "degree"].includes(key); const accept = key === "photo" ? ".jpg,.jpeg,.png,.webp" : (isSupporting || isResume) ? ".pdf,.jpg,.jpeg" : ".pdf,.jpg,.jpeg,.png,.webp"; return <FileUploadField key={key} label={label} name={key} accept={accept} hint={key === "photo" ? "JPEG · 413 × 531 px (default) · 630 × 810 also supported" : key === "aadhaarCard" ? "Aadhaar scan only · landscape card image required" : key === "panCard" ? "Image: 197 × 276 px (NSDL) · PDF also allowed" : isResume ? "PDF or JPG/JPEG · no fixed dimensions · keep text readable" : isSupporting ? "PDF, JPG, JPEG · max 500 KB · 150–200 DPI" : isScan ? "PDF or JPG/JPEG scan · 150–300 DPI · keep within portal limit" : "PDF, JPG, PNG, WEBP"} fileName={documentFiles[key]?.name || existingDocumentFiles[key]} selectedFile={documentFiles[key]} error={documentErrors[key]} uploaded={Boolean(documentFiles[key] || existingDocumentFiles[key])} onChange={async (event) => { const file = event.target.files?.[0] || null; if (!file) return; const extension = file.name.split(".").pop()?.toLowerCase(); const allowed = key === "photo" ? ["jpg", "jpeg", "png", "webp"] : (isSupporting || isResume) ? ["pdf", "jpg", "jpeg"] : ["pdf", "jpg", "jpeg", "png", "webp"]; if (!allowed.includes(extension) || (isSupporting && file.size > 500 * 1024 && extension === "pdf")) { setDocumentErrors((current) => ({ ...current, [key]: `Invalid file for ${label}. Allowed: ${allowed.join(", ")} and max 500 KB.` })); setDocumentFiles((current) => ({ ...current, [key]: null })); return; } try { if (key === "aadhaarCard" && extension !== "pdf") { const { width, height } = await readImageSize(file); const ratio = width / height; if (ratio < 1.3 || ratio > 2.1) throw new Error("Aadhaar card image must be landscape"); } const normalizedFile = key === "photo" ? await normalizePassportPhoto(file) : key === "panCard" && extension !== "pdf" ? await normalizePanPhoto(file) : isSupporting && extension !== "pdf" ? await normalizeSupportingImage(file) : file; setDocumentErrors((current) => ({ ...current, [key]: "" })); setDocumentFiles((current) => ({ ...current, [key]: normalizedFile })); } catch (error) { setDocumentErrors((current) => ({ ...current, [key]: error.message === "Aadhaar card image must be landscape" ? "Invalid Aadhaar image. Upload a landscape Aadhaar card scan, not a normal portrait photo." : "Unable to process this document" })); setDocumentFiles((current) => ({ ...current, [key]: null })); } }} disabled={savingDocuments} />; })}</div><div className="mt-4 flex justify-end"><Button type="submit" loading={savingDocuments} text="Save Documents" /></div></form>}
      </section>}

      {hrCanViewModule("documents") && activeTab === "documentSignatures" && <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="border-b border-gray-100 p-4"><h2 className="font-semibold">Documents &amp; Signatures</h2><p className="mt-1 text-xs text-gray-500">Manage this employee’s appointment letter, HR policy and signature verification.</p></div>
        <div className="p-4"><DocumentSigningList managed employeeFilterId={employeeId} /></div>
      </section>}

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

      {passwordModalOpen && <CommonModal title="Change employee password" subtitle={`Set a new login password for ${employee.name}.`} className="max-w-md" as="form" onSubmit={resetEmployeePassword} onClose={() => { if (!savingPassword) setPasswordModalOpen(false); }} footer={<><Button text="Cancel" variant="secondary" type="button" disabled={savingPassword} onClick={() => setPasswordModalOpen(false)} /><Button text="Save Password" type="submit" loading={savingPassword} disabled={newEmployeePassword.length < 8} /></>}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">New password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={newEmployeePassword} onChange={(event) => setNewEmployeePassword(event.target.value)} className="mt-2 w-full rounded-sm border border-gray-300 p-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Minimum 8 characters" required /></label>
        <p className="mt-3 text-xs text-gray-500">The employee will need to use this new password on their next login.</p>
      </CommonModal>}

    </div>
  );
};

export default EmployeeDetail;
