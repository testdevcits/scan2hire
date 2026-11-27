import Checkbox from "../../components/common/Checkbox";
/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import { employeeUploadErrors } from "../../utils/employeeUploadSize";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { FiPlus, FiX } from "react-icons/fi";

import AddressFields from "../../components/common/AddressFields";
import Button from "../../components/common/Button";
import CalendarPicker from "../../components/common/CalendarPicker";
import FileUploadField from "../../components/common/FileUploadField";
import InputField from "../../components/common/InputField";
import CustomDropdown from "../../components/common/CustomDropdown";
import EmployeeChecklist from "../../components/common/EmployeeChecklist";
import EmploymentHistory from "../../components/common/EmploymentHistory";
import { newEmployment, experienceError } from "../../utils/employmentFields";
import EmployeeCreateReview from "../../components/common/EmployeeCreateReview";
import { employeeCreateDocumentFields } from "../../utils/employeeDocumentFields";
import { hasWhitePhotoBackground } from "../../utils/photoBackground";
import { employeeDraft } from "../../utils/employeeDraft";
import { bondEndDateFromDuration } from "../../utils/bondDates";
import { validateAadhaarLetterFormat, validateWhiteBackgroundDocument } from "../../utils/documentValidation";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useEmployee } from "../../contexts/Hr/EmployeeContext";

const initialForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  name: "",
  email: "",
  mobile: "",
  altMobile: "", gender: "Other", attendanceMode: "office",
  hrFileNo: "", fatherOrHusbandName: "", emergencyNumber: "", bloodGroup: "", trainingPeriod: "", salary: "", salaryOnHold: true, bondPeriodDuration: "", nextIncrementDate: "", bondEndDate: "", initialSalaryReviews: [],
  experienceType: "Fresher", totalExperienceYears: "", previousEmployments: [],
  qualifications: [],
  bankHolderName: "", bankAccountNumber: "", bankIfscCode: "", bankName: "",
  chequeNumber: "", chequeAccountNumber: "", chequeAmount: "", chequeDate: "", chequeBankName: "", bondDocumentCheque: false,
  resignationDate: "", leavingDate: "",
  password: "",
  department: "",
  designation: "",
  dob: "", celebrateDob: "",
  dateOfJoining: "",
  reportingManager: "",
  teamLead: "",
  employeeType: "Probation",
  address: { street: "", city: "", state: "", country: "India", pincode: "" },
  permanentAddress: { street: "", city: "", state: "", country: "India", pincode: "" },
  alternateAddress: { street: "", city: "", state: "", country: "India", pincode: "" },
  photo: null,
  salarySlips: [],
  documents: {},
  joiningChecklist: { idCard: false, credentials: false, tshirtBag: false, officeKeyPhoneSystem: false },
  leavingChecklist: { idCardNotepadPen: false, credentials: false, tshirtBag: false, officeKeyPhoneSystem: false },
  noDuesChecklist: { teamLeadProjectManager: false, itHead: false, hrHead: false },
};
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const qualificationHasSpecialization = (level = "") => !/^(10(?:th|ᵗʰ)?|tenth)\b/i.test(String(level).trim());
const dateInputValue = (value) => value ? String(value).slice(0, 10) : "";
const currentDateValue = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const employeeEditRequestCache = new Map();
const shareEmployeeEditRequest = (key, createRequest) => {
  if (!employeeEditRequestCache.has(key)) {
    const request = createRequest();
    employeeEditRequestCache.set(key, request);
    request.then(() => employeeEditRequestCache.delete(key), () => employeeEditRequestCache.delete(key));
  }
  return employeeEditRequestCache.get(key);
};


const EmployeeCreate = () => {
  const { authApi, hrApi } = useApi();
  const { employeeId } = useParams();
  const isEditMode = Boolean(employeeId);
  const [useDefaultPassword, setUseDefaultPassword] = useState(false);
  const [defaultPasswordConfigured, setDefaultPasswordConfigured] = useState(false);
  useEffect(() => { if (!isEditMode) hrApi.getDefaultEmployeePasswordStatus().then(res => { const configured = res.data.configured === true; setDefaultPasswordConfigured(configured); setUseDefaultPassword(configured); }).catch(() => setDefaultPasswordConfigured(false)); }, [isEditMode]);

  const [form, setForm] = useState(initialForm);
  const originalSalaryReviews = useRef([]);
  const [departments, setDepartments] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [reportingManagerOptions, setReportingManagerOptions] = useState([]);
  const [masterOptions, setMasterOptions] = useState({ bloodGroup: [], gender: [], qualification: [], employeeType: [], designation: [], trainingPeriod: [], bondPeriod: [] });
  const [uploadErrors, setUploadErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [addressErrors, setAddressErrors] = useState({ permanentAddress: {}, alternateAddress: {} });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const { user } = useContext(AuthContext);
  const [hrModuleAccess, setHrModuleAccess] = useState(user?.moduleAccess || null);
  const [accessLoading, setAccessLoading] = useState(user?.role === "hr" && isEditMode);
  useEffect(() => {
    if (user?.role !== "hr" || !isEditMode) return undefined;
    let active = true;
    authApi.getProfile()
      .then((response) => { if (active) setHrModuleAccess(response.data.data?.moduleAccess || {}); })
      .catch(() => { if (active) setHrModuleAccess({}); })
      .finally(() => { if (active) setAccessLoading(false); });
    return () => { active = false; };
  }, [authApi, isEditMode, user?.role]);
  const effectiveHrAccess = hrModuleAccess || user?.moduleAccess || {};
  const canEditEmployee = user?.role === "superadmin"
    || (user?.role === "hr" && effectiveHrAccess.employees?.edit === true);
  const canEditEmployeeId = user?.role === "superadmin"
    || (user?.role === "hr" && (effectiveHrAccess.employeeIdentity?.edit === true || effectiveHrAccess.employees?.editIdentity === true));
  const { createEmployee, invalidateEmployeesCache } = useEmployee();
  const toast = useToast();
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(false);
  const draftKey = user?._id || user?.id || user?.email;
  const [loadedDraftKey, setLoadedDraftKey] = useState(null);
  const [draftStatus, setDraftStatus] = useState("Loading draft…");
  const draftFinished = useRef(false);
  const draftReady = Boolean(draftKey && loadedDraftKey === draftKey);
  const employmentDetailsComplete = Boolean(form.dateOfJoining && form.department && form.designation && form.employeeType && form.attendanceMode && form.salary);

  useEffect(() => {
    if (isEditMode || !draftKey || !["hr", "superadmin"].includes(user?.role)) return;
    let active = true;
    draftFinished.current = false;
    setLoadedDraftKey(null);
    setForm(initialForm);
    setStep(1);
    employeeDraft("get", draftKey).then((draft) => {
      if (!active) return;
      setForm({ ...initialForm, ...draft?.form, password: "", qualifications: (draft?.form?.qualifications || []).map((item) => ({ ...item, id: item.id || crypto.randomUUID() })), previousEmployments: (draft?.form?.previousEmployments || []).map((item, index, items) => ({ ...item, id: item.id || crypto.randomUUID(), documents: item.documents || {}, isLastCompany: items.some((entry) => entry.isLastCompany) ? Boolean(item.isLastCompany) : index === items.length - 1 })) });
      setStep(Number.isInteger(draft?.step) ? Math.min(7, Math.max(1, draft.step)) : 1);
      setDraftStatus(draft ? "Draft restored. Re-enter the temporary password before saving." : "Draft saves automatically in this browser.");
    }).catch(() => {
      if (active) setDraftStatus("Browser draft storage is unavailable. Keep this page open to avoid losing changes.");
    }).finally(() => { if (active) setLoadedDraftKey(draftKey); });
    return () => { active = false; };
  }, [draftKey, user?.role, isEditMode]);

  useEffect(() => {
    if (isEditMode || !draftReady || draftFinished.current) return;
    const { password, ...draftForm } = form;
    let active = true;
    employeeDraft("put", draftKey, { form: draftForm, step, updatedAt: Date.now() }).catch(() => {
      if (active) setDraftStatus("Draft could not be saved in this browser. Keep this page open to avoid losing changes.");
    });
    return () => { active = false; };
  }, [form, step, draftKey, draftReady, isEditMode]);
  const employeesPath = user?.role === "superadmin" ? "/admin/employees" : "/hr/employees";

  useEffect(() => {
    if (!isEditMode || !employeeId) return;
    let active = true;
    setEditLoading(true);
    shareEmployeeEditRequest(`employee:${employeeId}`, () => hrApi.getEmployee(employeeId)).then((response) => {
      if (!active) return;
      const data = response.data?.data || {};
      const scheduledReviews = (data.salaryReviewHistory || [])
        .filter((review) => review.status === "scheduled")
        .slice()
        .sort((left, right) => String(left.effectiveDate).slice(0, 10).localeCompare(String(right.effectiveDate).slice(0, 10)))
        .map((review) => ({
          _id: review._id,
          effectiveDate: String(review.effectiveDate || "").slice(0, 10),
          incrementAmount: String(review.incrementAmount ?? ""),
          nextIncrementDate: String(review.nextIncrementDate || "").slice(0, 10),
          reason: review.reason || "",
        }));
      const storedNameParts = String(data.name || "").trim().split(/\s+/).filter(Boolean);
      originalSalaryReviews.current = scheduledReviews.map((review) => ({ ...review }));
      setForm((current) => ({ ...current, ...data, password: "", photo: null, documents: {},
        firstName: data.firstName || storedNameParts[0] || "",
        middleName: data.middleName || "",
        lastName: data.lastName || storedNameParts.slice(1).join(" "),
        dob: dateInputValue(data.dob),
        celebrateDob: dateInputValue(data.celebrateDob),
        dateOfJoining: dateInputValue(data.dateOfJoining),
        resignationDate: dateInputValue(data.resignationDate),
        leavingDate: dateInputValue(data.leavingDate),
        chequeDate: dateInputValue(data.chequeDate),
        initialSalaryReviews: scheduledReviews,
        teamLead: data.reportingManagerUser ? `hr:${data.reportingManagerUser._id || data.reportingManagerUser}` : data.teamLead?._id || data.teamLead || "",
        bondEndDate: dateInputValue(data.employeeRecords?.current?.bondEndDate || data.bondEndDate),
        bondPeriodDuration: data.employeeRecords?.current?.bondPeriodDuration || data.bondPeriodDuration || "",
        qualifications: (data.qualifications || []).map((item) => ({ ...item, id: item.id || crypto.randomUUID(), documents: item.documents || {} })),
        previousEmployments: (data.previousEmployments || []).map((item, index, items) => ({ ...item, joiningDate: dateInputValue(item.joiningDate), leavingDate: dateInputValue(item.leavingDate), id: item.id || crypto.randomUUID(), documents: item.documents || {}, isLastCompany: items.some((entry) => entry.isLastCompany) ? Boolean(item.isLastCompany) : index === items.length - 1 })),
        bondDocumentCheque: Boolean(data.chequeNumber || data.chequeAccountNumber || data.chequeAmount || data.chequeDate),
        permanentAddress: data.permanentAddress || current.permanentAddress,
        alternateAddress: data.alternateAddress || current.alternateAddress,
      }));
    }).catch(() => toast.error("Unable to load employee for editing")).finally(() => { if (active) setEditLoading(false); });
    return () => { active = false; };
  }, [employeeId, isEditMode, toast]);
  const departmentOptions = useMemo(() => [...new Set(
    departments.map((department) => String(department.name || "").trim()).filter(Boolean)
  )].sort(), [departments]);
  const teamLeadOptions = useMemo(() => reportingManagerOptions.length ? reportingManagerOptions : employeeOptions.filter((item) => item.workRole === "teamlead" || item.user?.role === "teamlead"), [employeeOptions, reportingManagerOptions]);

  useEffect(() => {
    if (user?.role !== "hr" && user?.role !== "superadmin") return;
    let active = true;
    shareEmployeeEditRequest("employee-edit-options", () => hrApi.getEmployeeEditOptions())
      .then((response) => {
        if (!active) return;
        const options = response.data.data || {};
        const managers = options.reportingManagers || [];
        setDepartments(options.departments || []);
        setMasterOptions(Object.fromEntries(Object.entries(options.masterOptions || {}).map(([key, values]) => [key, values.map((item) => item.name)])));
        setEmployeeOptions(managers);
        setReportingManagerOptions(managers);
      })
      .catch(() => setDepartments([]));
    return () => { active = false; };
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (["firstName", "lastName"].includes(name)) {
      setFieldErrors((current) => ({ ...current, [name]: value.trim() ? "" : `${name === "firstName" ? "First" : "Last"} name is required` }));
    }
    if (["bankAccountNumber"].includes(name) && !/^\d{0,18}$/.test(value)) return;
    if (name === "bankIfscCode" && !/^[a-zA-Z0-9]{0,11}$/.test(value)) return;
    if (["bankHolderName", "bankName"].includes(name) && !/^[a-zA-Z .'-]*$/.test(value)) return;
    if (name === "email") {
      const email = value.toLowerCase().trim();
      setForm(current => ({ ...current, email }));
      setFieldErrors((current) => ({ ...current, email: email && !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(email) ? "Enter a valid email address, e.g. name@gmail.com" : "" }));
      return;
    }
    if (["mobile", "altMobile", "emergencyNumber"].includes(name)) {
      if (!/^\d{0,10}$/.test(value)) return;
      setFieldErrors((current) => ({ ...current, [name]: "" }));
    }
    if (["firstName", "middleName", "lastName", "fatherOrHusbandName"].includes(name)) {
      const titleCased = value.trimStart().replace(/(^|\s)([a-z])/g, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
      setForm((current) => {
        const next = { ...current, [name]: titleCased };
        if (["firstName", "middleName", "lastName"].includes(name) && !String(current.bankHolderName || "").trim()) {
          next.bankHolderName = [next.firstName, next.middleName, next.lastName].filter(Boolean).join(" ");
        }
        return next;
      });
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };
  const validateMobileField = (name, value) => {
    const labels = { mobile: "Mobile number", altMobile: "Alternate mobile", emergencyNumber: "Emergency contact" };
    if (!value && name !== "mobile") return "";
    if (!value) return "Mobile number is required";
    return /^[6-9]\d{9}$/.test(value) ? "" : `${labels[name]} must be 10 digits and start with 6, 7, 8 or 9`;
  };
  const validateBankDetails = () => {
    const errors = {};
    if (form.bankHolderName && !/^[a-zA-Z][a-zA-Z .'-]{1,99}$/.test(form.bankHolderName.trim())) errors.bankHolderName = "Enter a valid name";
    if (form.bankName && !/^[a-zA-Z][a-zA-Z .'-]{1,99}$/.test(form.bankName.trim())) errors.bankName = "Enter a valid bank name";
    if (form.bankAccountNumber && !/^\d{6,18}$/.test(form.bankAccountNumber)) errors.bankAccountNumber = "Account number must be 6-18 digits";
    if (form.bankIfscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankIfscCode.toUpperCase())) errors.bankIfscCode = "Enter a valid IFSC code";
    return errors;
  };
  const validateBirthDates = () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const errors = {};
    if (form.dob && form.dob > today) errors.dob = "Date of birth must be in the past";
    if (form.celebrateDob && form.celebrateDob > today) errors.celebrateDob = "Birthday must be today or a past date";
    return errors;
  };
  const scrollToFirstError = () => {
    setTimeout(() => {
      const target = document.querySelector('[aria-invalid="true"], [data-invalid="true"]');
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };
  const handleMobileBlur = (event) => {
    const { name, value } = event.target;
    setFieldErrors((current) => ({ ...current, [name]: validateMobileField(name, value) }));
  };
  const handleSelect = (name) => (value) => setForm((current) => ({ ...current, [name]: value, ...(name === "experienceType" && value === "Experienced" && !current.previousEmployments.length ? { previousEmployments: [newEmployment(true)] } : {}) }));
  const handleBondPeriodSelect = (value) => setForm((current) => ({ ...current, bondPeriodDuration: value, bondEndDate: value ? bondEndDateFromDuration(current.dateOfJoining, value) : "" }));
  useEffect(() => {
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ").trim();
    if (fullName && String(form.bankHolderName || "").trim() !== fullName) setForm((current) => ({ ...current, bankHolderName: fullName }));
  }, [form.firstName, form.middleName, form.lastName, form.bankHolderName]);
  const addQualification = () => setForm((current) => ({ ...current, qualifications: [...current.qualifications, { id: crypto.randomUUID(), level: "", course: "", institute: "", passingYear: "", percentage: "", documents: {} }] }));
  const updateQualification = (index, key, value) => setForm((current) => ({ ...current, qualifications: current.qualifications.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value, ...(key === "level" && !qualificationHasSpecialization(value) ? { course: "" } : {}) } : item) }));

  const validateAddress = (address = {}) => {
    const errors = {};
    if (!String(address.street || "").trim()) errors.street = "Address is required";
    if (!String(address.city || "").trim()) errors.city = "City is required";
    if (!String(address.state || "").trim()) errors.state = "State is required";
    if (!String(address.country || "").trim()) errors.country = "Country is required";
    if (!/^\d{6}$/.test(String(address.pincode || ""))) errors.pincode = "Enter a valid 6-digit pincode";
    return errors;
  };
  const handleNamedAddressChange = (addressKey) => (event) => {
    const { name, value } = event.target;
    if (name === "pincode" && !/^\d{0,6}$/.test(value)) return;
    setForm((current) => {
      const nextAddress = { ...current[addressKey], [name]: value };
      setAddressErrors((errors) => ({ ...errors, [addressKey]: { ...errors[addressKey], [name]: validateAddress(nextAddress)[name] || "" } }));
      return { ...current, [addressKey]: nextAddress };
    });
  };
  const handleChecklist = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));

  const fileToPayload = async (file) => {
    if (!file) return null;
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(`${file.name || "This file"} is too large. Maximum allowed size is 5 MB.`);
      return null;
    }
    const dataUri = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    return { dataUri, name: file.name, type: file.type };
  };
  const handleProof = async (key, file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("Upload documents as PDF, JPG, PNG or WEBP files.");
      return;
    }
    if (["aadhaarCard", "panCard", "bloodGroupProof"].includes(key) && !(await validateWhiteBackgroundDocument(file))) {
      toast.error("Use a clear scan with a white or light background, or upload the full-page PDF.");
      return;
    }
    if (key === "aadhaarCard" && !(await validateAadhaarLetterFormat(file))) {
      toast.error("Upload the full-page Aadhaar letter image in portrait format, or upload its PDF.");
      return;
    }
    try { const payload = await fileToPayload(file); if (!payload) return; setForm((current) => ({ ...current, documents: { ...current.documents, [key]: payload } })); }
    catch { toast.error("Unable to read the selected file"); }
  };
  const handleQualificationMarksheet = async (index, file) => {
    if (!file) return;
    const qualificationId = form.qualifications[index]?.id;
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("Select a JPG, PNG, WEBP or PDF marksheet.");
      return;
    }
    try {
      const payload = await fileToPayload(file);
      if (!payload) return;
      setForm((current) => ({ ...current, qualifications: current.qualifications.map((item) => item.id === qualificationId ? { ...item, documents: { ...item.documents, marksheet: payload } } : item) }));
    } catch { toast.error("Unable to read the selected marksheet"); }
  };
  const handlePhoto = async (file) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE) { toast.error("Employee photo must be 5 MB or smaller."); return; }
    try {
      if (!(await hasWhitePhotoBackground(file))) { toast.error("Employee photo must have a white background."); return; }
      const payload = await fileToPayload(file);
      if (payload) setForm((current) => ({ ...current, photo: payload }));
    } catch {
      toast.error("Unable to read the selected photo");
    }
  };
  const handleEmploymentFiles = async (companyId, key, files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    if (selected.length > 1 && key !== "salarySlips") { toast.error("Select one file per document. Salary slips can be uploaded as one or multiple PDFs."); return; }
    if (selected.some((file) => file.size > MAX_UPLOAD_SIZE || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type))) { toast.error("Company documents must be JPG, PNG, WEBP or PDF and 5 MB or smaller."); return; }
    if ((key === "salarySlips" || key === "bankStatement") && selected.some((file) => file.type !== "application/pdf")) { toast.error("Upload the last 3 months as one PDF for this document."); return; }
    try {
      const payloads = await Promise.all(selected.map(fileToPayload));
      setForm((current) => ({ ...current, previousEmployments: current.previousEmployments.map((item) => item.id === companyId ? { ...item, documents: { ...item.documents, [key]: key === "salarySlips" ? payloads : payloads[0] } } : item) }));
    } catch { toast.error("Unable to read company documents."); }
  };
  const nextStep = (event) => {
    event?.preventDefault();
    if (step === 1) {
      const birthErrors = validateBirthDates();
      setFieldErrors((current) => ({ ...current, ...birthErrors }));
      if (Object.keys(birthErrors).length) { toast.error(Object.values(birthErrors)[0]); scrollToFirstError(); return; }
      const mobileErrors = Object.fromEntries(["mobile", "altMobile", "emergencyNumber"].map((name) => [name, validateMobileField(name, form[name])]));
      setFieldErrors((current) => ({ ...current, ...mobileErrors }));
      if (Object.values(mobileErrors).some(Boolean)) { toast.error("Please correct the highlighted mobile numbers"); scrollToFirstError(); return; }
      const emailError = !form.email.trim() ? "Email is required" : !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(form.email) ? "Enter a valid email address, e.g. name@gmail.com" : "";
      setFieldErrors((current) => ({ ...current, email: emailError }));
      const nameErrors = { firstName: form.firstName.trim() ? "" : "First name is required", lastName: form.lastName.trim() ? "" : "Last name is required" };
      setFieldErrors((current) => ({ ...current, ...nameErrors }));
      if (Object.values(nameErrors).some(Boolean) || emailError) { toast.error("First name and last name are required"); scrollToFirstError(); return; }
    }
    if (step === 2 || step === 5) {
      const error = experienceError(form, step === 5);
      if (error) { toast.error(error); return; }
    }
    if (step === 2 && (!form.dateOfJoining || !form.department || !form.designation || !form.employeeType)) { toast.error("Complete joining date, department, designation and employee type before continuing"); return; }
    if (step === 2 && form.salary !== "" && (Number.isNaN(Number(form.salary)) || Number(form.salary) < 0)) { toast.error("Enter a valid salary"); return; }
    if (step === 2) {
      const fullName = [form.firstName, form.middleName, form.lastName].map((value) => String(value || "").trim()).filter(Boolean).join(" ");
      if (fullName) setForm((current) => ({ ...current, bankHolderName: fullName }));
    }
    if (step === 3) {
      const bankErrors = validateBankDetails();
      if (Object.keys(bankErrors).length) { toast.error(Object.values(bankErrors)[0]); scrollToFirstError(); return; }
    }
    if (step === 4) {
      const permanentErrors = validateAddress(form.permanentAddress);
      const alternateErrors = validateAddress(form.alternateAddress);
      setAddressErrors({ permanentAddress: permanentErrors, alternateAddress: alternateErrors });
      if (Object.keys(permanentErrors).length || Object.keys(alternateErrors).length) { toast.error("Complete both addresses with a valid 6-digit pincode"); scrollToFirstError(); return; }
    }
    setStep((value) => Math.min(7, value + 1));
  };

  const validateEditedSalaryReviews = () => {
    const reviews = (form.initialSalaryReviews || []).map((review) => ({ ...review }));
    if (!reviews.length) return [];
    const sorted = reviews.slice().sort((left, right) => (left.effectiveDate || "").localeCompare(right.effectiveDate || ""));
    const originalIds = originalSalaryReviews.current.map((review) => review._id);
    const sortedExistingIds = sorted.filter((review) => review._id).map((review) => review._id);
    if (originalIds.some((id, index) => sortedExistingIds[index] !== id)) {
      throw new Error("Keep saved salary increments in their current date order. Update the dates without moving one past another.");
    }
    let plannedSalary = Number(form.salary);
    if (!Number.isFinite(plannedSalary) || plannedSalary < 0) throw new Error("Enter a valid current salary before saving increments.");
    let previousDate = "";
    const latestSavedDate = originalSalaryReviews.current.map((review) => review.effectiveDate).sort().at(-1) || "";
    for (const review of sorted) {
      const amount = Number(review.incrementAmount);
      const label = `Increment ${reviews.indexOf(review) + 1}`;
      if (!review.effectiveDate) throw new Error(`${label}: select an Effective Date.`);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error(`${label}: enter an Increment Amount greater than zero.`);
      if (!review.nextIncrementDate) throw new Error(`${label}: select a Next Review Date.`);
      if (review.nextIncrementDate <= review.effectiveDate) throw new Error(`${label}: Next Review Date must be after ${review.effectiveDate}${review.useCurrentDate ? " (today, the automatic effective date)" : ""}.`);
      if (!review.reason?.trim()) throw new Error(`${label}: enter Review remarks.`);
      if (review.reason.length > 1000) throw new Error(`${label}: Review remarks must be at most 1000 characters.`);
      if (previousDate && review.effectiveDate <= previousDate) throw new Error("Schedule salary increments in increasing date order.");
      if (!review._id && latestSavedDate && review.effectiveDate <= latestSavedDate) throw new Error("New increments must be scheduled after the saved increments.");
      previousDate = review.effectiveDate;
    }
    return sorted;
  };

  const saveEditedSalaryReviews = async (sorted) => {
    if (!sorted.length) return;
    let plannedSalary = Number(form.salary);
    for (const review of sorted) {
      const amount = Number(review.incrementAmount);
      if (review._id) {
        await hrApi.updateSalaryIncrement(employeeId, review._id, {
          effectiveDate: review.effectiveDate,
          newSalary: plannedSalary + amount,
          nextIncrementDate: review.nextIncrementDate,
          reason: review.reason.trim(),
        });
      } else {
        const response = await hrApi.addSalaryIncrement(employeeId, {
          useCurrentDate: review.useCurrentDate === true,
          effectiveDate: review.effectiveDate,
          incrementAmount: amount,
          nextIncrementDate: review.nextIncrementDate,
          reason: review.reason.trim(),
        });
        const incrementId = response.data?.incrementId;
        if (incrementId) {
          review._id = incrementId;
          setForm((current) => ({ ...current, initialSalaryReviews: current.initialSalaryReviews.map((item) => item._clientId === review._clientId ? { ...item, _id: incrementId, _clientId: undefined } : item) }));
        }
      }
      plannedSalary += amount;
    }
    const refreshed = await hrApi.getEmployee(employeeId);
    const savedReviews = (refreshed.data?.data?.salaryReviewHistory || [])
      .filter((review) => review.status === "scheduled")
      .slice()
      .sort((left, right) => String(left.effectiveDate).slice(0, 10).localeCompare(String(right.effectiveDate).slice(0, 10)))
      .map((review) => ({ _id: review._id, effectiveDate: String(review.effectiveDate || "").slice(0, 10), incrementAmount: String(review.incrementAmount ?? ""), nextIncrementDate: String(review.nextIncrementDate || "").slice(0, 10), reason: review.reason || "" }));
    originalSalaryReviews.current = savedReviews.map((review) => ({ ...review }));
    setForm((current) => ({ ...current, initialSalaryReviews: savedReviews }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step !== 7 || saving) return;
    if (!event.currentTarget.form?.reportValidity()) return;
    if (!form.firstName.trim() || !form.lastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFieldErrors((current) => ({ ...current, firstName: form.firstName.trim() ? "" : "First name is required", lastName: form.lastName.trim() ? "" : "Last name is required" }));
      setStep(1);
      toast.error("First name and last name are required");
      scrollToFirstError();
      return;
    }
    if (!form.dateOfJoining || !form.department || !form.designation || !form.employeeType) {
      setStep(2);
      toast.error("Complete joining date, department, designation and employee type before saving");
      return;
    }
    const bankErrors = validateBankDetails();
    if (Object.keys(bankErrors).length) { setStep(3); toast.error(Object.values(bankErrors)[0]); return; }
    const permanentErrors = validateAddress(form.permanentAddress);
    const alternateErrors = validateAddress(form.alternateAddress);
    if (Object.keys(permanentErrors).length || Object.keys(alternateErrors).length) {
      setAddressErrors({ permanentAddress: permanentErrors, alternateAddress: alternateErrors });
      setStep(4);
      toast.error("Complete both addresses with a valid 6-digit pincode");
      return;
    }
    const birthErrors = validateBirthDates();
    if (Object.keys(birthErrors).length) { setFieldErrors((current) => ({ ...current, ...birthErrors })); setStep(1); toast.error(Object.values(birthErrors)[0]); return; }
    if (!isEditMode && !useDefaultPassword && !form.password) {
      setStep(1);
      toast.error("Please enter the temporary password before adding the employee.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile) || (form.altMobile && !/^[6-9]\d{9}$/.test(form.altMobile)) || (form.emergencyNumber && !/^[6-9]\d{9}$/.test(form.emergencyNumber))) {
      setStep(1);
      toast.error("Please enter valid Indian mobile numbers.");
      return;
    }
    const error = experienceError(form);
    if (error) { setStep(5); toast.error(error); return; }
    let validatedReviews = [];
    if (isEditMode) {
      try { validatedReviews = validateEditedSalaryReviews(); }
      catch (error) { setStep(2); toast.error(error.message); return; }
    }
    setSaving(true);
    let profileSaved = false;
    try {
      const payload = {
        ...form,
        initialSalaryReviews: form.initialSalaryReviews || [],
        ...(canEditEmployeeId && isEditMode ? { employeeId: form.employeeId, hrFileNo: form.hrFileNo } : { employeeId: undefined, hrFileNo: undefined }),
        ...(!isEditMode ? { bondEndDate: undefined } : {}),
        useDefaultPassword: !isEditMode && useDefaultPassword,
        password: useDefaultPassword ? "" : form.password,
        salaryOnHold: Boolean(form.salaryOnHold),
        ...(isEditMode ? { employeeRecords: { current: { bondEndDate: form.bondEndDate, bondPeriodDuration: form.bondPeriodDuration } } } : {}),
        previousEmployments: form.experienceType === "Experienced" ? form.previousEmployments : [],
        totalExperienceYears: form.experienceType === "Experienced" ? form.totalExperienceYears : 0,
        salarySlips: [],
        documents: Object.fromEntries(employeeCreateDocumentFields.filter(([key]) => form.documents[key]).map(([key]) => [key, form.documents[key]])),
        chequeBankName: form.bankName,
        name: `${form.firstName.trim()} ${form.middleName.trim()} ${form.lastName.trim()}`.replace(/\s+/g, " ").trim(),
      };
      const sizeErrors = employeeUploadErrors(payload);
      setUploadErrors(sizeErrors);
      if (Object.keys(sizeErrors).length) {
        setStep(Object.keys(sizeErrors).some((key) => key.startsWith("qualification-marksheet-")) ? 2 : 5);
        toast.error("Uploads are too large together. Reduce the files marked below.");
        return;
      }
      if (isEditMode) {
        const { password, photo, documents, ...profilePayload } = payload;
        await hrApi.updateEmployee(employeeId, profilePayload);
        invalidateEmployeesCache();
        profileSaved = true;
        await saveEditedSalaryReviews(validatedReviews);
        const documentPayload = { ...documents, ...(photo ? { photo } : {}) };
        if (Object.keys(documentPayload).length) await hrApi.updateEmployeeDocuments(employeeId, documentPayload);
      } else await createEmployee(payload);
      draftFinished.current = true;
      try { await employeeDraft("delete", draftKey); }
      catch { toast.warning("Employee saved, but the browser draft could not be cleared."); }
      toast.success(isEditMode ? "Employee updated successfully" : "Employee added successfully");
      navigate(employeesPath, { replace: true });
    } catch (error) {
      toast.error(profileSaved ? `Employee details saved, but salary increments could not be saved: ${error.response?.data?.message || error.message}` : error.response?.status === 413 ? "Uploads exceed the server request limit. Compress the selected files and try again." : error.response?.data?.message || "Unable to add employee. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "hr" && user?.role !== "superadmin") {
    return <Navigate to={employeesPath} replace />;
  }

  if (isEditMode && accessLoading) return <div className="p-4 text-sm" role="status">Checking employee edit access…</div>;

  if (isEditMode && !canEditEmployee) {
    return <Navigate to={employeesPath} replace />;
  }

  if ((!isEditMode && !draftReady && draftKey) || editLoading) return <div className="p-4 text-sm" role="status">Loading employee details…</div>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{isEditMode ? "Edit Employee" : "Add Employee"}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isEditMode ? "Update employee details step by step." : "Create an employee profile and login access."}</p>
        </div>
        <Button variant="secondary" text="Back to Employees" onClick={() => navigate(employeesPath)} />
      </div>

      {!isEditMode && <p role="status" className="text-xs text-gray-500 dark:text-gray-400">{draftKey ? draftStatus : "Draft saving requires a signed-in account."} Temporary passwords are not stored.</p>}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
        {["Basic details", "Employment", "Bank details", "Addresses", "Documents", "Checklists", "Review"].map((label, index) => (
          <button type="button" key={label} onClick={() => setStep(index + 1)} className={`min-w-[125px] flex-1 rounded-lg border px-3 py-3 text-xs font-semibold transition ${step === index + 1 ? "border-[#f84525] bg-[#fff1ed] text-[#f84525]" : "border-gray-200 bg-white text-gray-600 hover:bg-[#fff1ed] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
            <span className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full ${step === index + 1 ? "bg-[#f84525] text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>{index + 1}</span>{label}
          </button>
        ))}
      </div>

      <form onSubmit={(event) => event.preventDefault()} autoComplete="off" className="grid grid-cols-1 items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
        {step === 1 ? (
          <>
            <div className="md:col-span-3 flex items-center gap-4 text-lg font-semibold"><span>Personal information</span><span aria-hidden="true" className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600" /></div>
            <InputField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} error={fieldErrors.firstName} required />
            <InputField label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} />
            <InputField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} error={fieldErrors.lastName} required />
            <InputField label="Father / Husband Name" name="fatherOrHusbandName" value={form.fatherOrHusbandName} onChange={handleChange} />
            <CustomDropdown label="Gender" value={form.gender} onChange={handleSelect("gender")} options={masterOptions.gender.length ? masterOptions.gender : ["Male", "Female", "Other"]} />
            <div>
              <CustomDropdown label="Blood Group" value={form.bloodGroup} onChange={handleSelect("bloodGroup")} options={masterOptions.bloodGroup.length ? masterOptions.bloodGroup : ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            </div>
            <CalendarPicker label="Date of Birth / Birthday" mode="date" value={form.dob} error={fieldErrors.dob} onChange={(value) => setForm((current) => ({ ...current, dob: value, celebrateDob: current.celebrateDob === current.dob ? value : current.celebrateDob }))} />
            <CalendarPicker label="Celebrate DOB" error={fieldErrors.celebrateDob} labelAddon={<label className="inline-flex items-center gap-1 text-xs font-normal"><input type="checkbox" checked={Boolean(form.dob && form.celebrateDob === form.dob)} onChange={(event) => setForm((current) => ({ ...current, celebrateDob: event.target.checked ? current.dob : "" }))} /> Same as DOB</label>} mode="date" value={form.celebrateDob} onChange={(value) => setForm((current) => ({ ...current, celebrateDob: value }))} />
            <div className="md:col-span-3 flex items-center gap-4 pt-3 text-lg font-semibold"><span>Contact details</span><span aria-hidden="true" className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600" /></div>
            <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={fieldErrors.email} required />
            <InputField label="Mobile" name="mobile" type="tel" prefix="+91" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile number" value={form.mobile} onChange={handleChange} onBlur={handleMobileBlur} error={fieldErrors.mobile} required />
            <InputField label="Alternate Mobile" name="altMobile" type="tel" prefix="+91" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile number" value={form.altMobile} onChange={handleChange} onBlur={handleMobileBlur} error={fieldErrors.altMobile} />
            <InputField label="Emergency Contact Number" name="emergencyNumber" type="tel" prefix="+91" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile number" value={form.emergencyNumber} onChange={handleChange} onBlur={handleMobileBlur} error={fieldErrors.emergencyNumber} />
            <div className="md:col-span-3 flex items-center gap-4 pt-3 text-lg font-semibold"><span>Login and identity</span><span aria-hidden="true" className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600" /></div>
            {isEditMode && canEditEmployeeId && <><InputField label="Employee ID" name="employeeId" value={form.employeeId || ""} onChange={handleChange} required /><InputField label="HR File Number" name="hrFileNo" value={form.hrFileNo || ""} onChange={handleChange} required /></>}
            {!isEditMode && <div className="md:col-span-3"><Checkbox label="Use temporary password" checked={useDefaultPassword} disabled={!defaultPasswordConfigured} onChange={checked => { setUseDefaultPassword(checked); setForm(current => ({ ...current, password: '' })); }} description={defaultPasswordConfigured ? 'Applies only to this new employee. You can also enter a custom password.' : 'Ask Admin to configure a default password in Settings, or enter a custom password.'} /></div>}
            {!isEditMode && !useDefaultPassword && <InputField label="Temporary Password" name="password" type="password" passwordToggle value={form.password} onChange={handleChange} required autoComplete="new-password" />}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <CustomDropdown label="Experience" value={form.experienceType} onChange={handleSelect("experienceType")} options={["Fresher", "Experienced"]} />
            {form.experienceType === "Experienced" ? <InputField label="Total Experience (Years)" inputMode="numeric" maxLength={2} value={form.totalExperienceYears} onChange={(event) => { const value = event.target.value; if (/^\d{0,2}$/.test(value) && (value === "" || Number(value) <= 20)) handleChange({ target: { name: "totalExperienceYears", value } }); }} name="totalExperienceYears" /> : null}
            <CalendarPicker label="Joining Date" mode="date" value={form.dateOfJoining} onChange={(value) => setForm((current) => ({ ...current, dateOfJoining: value, ...(current.bondPeriodDuration ? { bondEndDate: bondEndDateFromDuration(value, current.bondPeriodDuration) } : {}) }))} />
            <CustomDropdown label="Department" value={form.department} onChange={handleSelect("department")} options={departmentOptions} searchable portalMenu />
            <CustomDropdown label="Designation" value={form.designation} onChange={handleSelect("designation")} options={masterOptions.designation.filter((item) => !item.department || item.department === form.department).map((item) => item.name || item)} searchable portalMenu />
            <CustomDropdown label="Employee Type" value={form.employeeType} onChange={handleSelect("employeeType")} options={masterOptions.employeeType.length ? masterOptions.employeeType : ["Permanent", "Probation", "Intern"]} />
            <CustomDropdown label="Probation Period" value={form.trainingPeriod} onChange={handleSelect("trainingPeriod")} options={masterOptions.trainingPeriod.length ? masterOptions.trainingPeriod : ["1 Month", "3 Months", "6 Months"]} />
            {isEditMode && <div className="md:col-span-3 grid grid-cols-1 items-end gap-4 md:grid-cols-3">
              <CustomDropdown label="Attendance Mode" value={form.attendanceMode} onChange={handleSelect("attendanceMode")} options={[{ value: "office", label: "Office" }, { value: "work_from_home", label: "Work From Home" }]} />
              <CustomDropdown label="Reporting Manager" value={form.teamLead} placeholder="No Reporting Manager" searchable portalMenu onChange={(value) => { const selectedManager = teamLeadOptions.find((item) => item._id === value); setForm((current) => ({ ...current, teamLead: value, reportingManager: selectedManager ? selectedManager.employeeId || selectedManager.name : "" })); }} options={teamLeadOptions.map((manager) => ({ value: manager._id, label: manager.role === "HR" ? `${manager.name} — HR` : `${manager.employeeId || "-"} - ${manager.name}` }))} />
              <InputField label="Salary" name="salary" value={form.salary} onChange={handleChange} />
              <CalendarPicker label="Resignation Date" mode="date" value={form.resignationDate} onChange={(value) => setForm((current) => ({ ...current, resignationDate: value }))} />
              <CalendarPicker label="Leaving Date" mode="date" value={form.leavingDate} onChange={(value) => setForm((current) => ({ ...current, leavingDate: value }))} />
              <label className="flex h-[42px] items-center gap-2 rounded-md border border-gray-200 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"><input type="checkbox" checked={Boolean(form.salaryOnHold)} onChange={(event) => setForm((current) => ({ ...current, salaryOnHold: event.target.checked }))} /> Salary on hold</label>
              <CalendarPicker label="Bond End Date" mode="date" value={form.bondEndDate} disabled={Boolean(form.bondPeriodDuration)} onChange={(value) => setForm((current) => ({ ...current, bondEndDate: value }))} />
              <CustomDropdown label="Bond Period Duration" value={form.bondPeriodDuration} onChange={handleBondPeriodSelect} options={masterOptions.bondPeriod.length ? masterOptions.bondPeriod : ["15 Days", "1 Month", "2 Months", "3 Months", "6 Months"]} searchable portalMenu />
            </div>}
            {!isEditMode && <div className="md:col-span-3 grid grid-cols-1 items-end gap-4 md:grid-cols-3">
              <CustomDropdown label="Attendance Mode" value={form.attendanceMode} onChange={handleSelect("attendanceMode")} options={[{ value: "office", label: "Office" }, { value: "work_from_home", label: "Work From Home" }]} />
              <CustomDropdown label="Reporting Manager" value={form.teamLead} placeholder="No Reporting Manager" searchable portalMenu onChange={(value) => { const selectedTeamLead = teamLeadOptions.find((item) => item._id === value); setForm((current) => ({ ...current, teamLead: value, reportingManager: selectedTeamLead ? selectedTeamLead.employeeId || selectedTeamLead.name : "" })); }} options={teamLeadOptions.map((teamLead) => ({ value: teamLead._id, label: teamLead.role === "HR" ? `${teamLead.name} — HR` : `${teamLead.employeeId || "-"} - ${teamLead.name}` }))} />
              <InputField label="Current Salary" name="salary" value={form.salary} onChange={(event) => { const value = event.target.value; if (/^\d*$/.test(value) && (value === "" || Number(value) > 0)) handleChange(event); }} inputMode="numeric" />
              <label className={`flex h-[42px] items-center gap-2 rounded-md border border-gray-200 px-3 text-sm text-gray-700 ${!employmentDetailsComplete ? "cursor-not-allowed opacity-70" : ""}`}><input type="checkbox" checked={Boolean(form.salaryOnHold)} disabled={!employmentDetailsComplete} onChange={(event) => setForm((current) => ({ ...current, salaryOnHold: event.target.checked }))} /> Salary on hold</label>
              <CustomDropdown label="Bond Period Duration" value={form.bondPeriodDuration} onChange={handleBondPeriodSelect} options={masterOptions.bondPeriod.length ? masterOptions.bondPeriod : ["15 Days", "1 Month", "2 Months", "3 Months", "6 Months"]} searchable portalMenu />
            </div>}
            <Checkbox label="Bond Document Cheque" description="Select if a cheque is being provided for the bond." compact className="md:col-span-3 min-h-11 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700" checked={Boolean(form.bondDocumentCheque)} onChange={(checked) => setForm((current) => ({ ...current, bondDocumentCheque: checked, ...(!checked ? { chequeNumber: "", chequeAccountNumber: "", chequeAmount: "", chequeDate: "" } : {}) }))} />
            {form.bondDocumentCheque && <div className="md:col-span-3 grid grid-cols-1 items-start gap-4 md:grid-cols-3"><InputField label="Cheque Number" name="chequeNumber" value={form.chequeNumber} onChange={handleChange} /><InputField label="Cheque Account Number" name="chequeAccountNumber" value={form.chequeAccountNumber} onChange={handleChange} /><InputField label="Cheque Amount" name="chequeAmount" value={form.chequeAmount} onChange={handleChange} /><CalendarPicker label="Cheque Date" mode="date" value={form.chequeDate} onChange={(value) => setForm((current) => ({ ...current, chequeDate: value }))} /></div>}
          </>
        ) : null}
        {step === 2 ? <div className="md:col-span-3 space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Qualification Details</h3><button type="button" onClick={addQualification} aria-label="Add qualification" title="Add qualification" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#f84525] transition hover:bg-[#ffe1d8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f84525]"><FiPlus size={21} aria-hidden="true" /></button></div>{form.qualifications.map((item, index) => <div key={index} className="rounded-lg border p-3"><div className="mb-2 flex justify-end"><button type="button" className="text-xs font-semibold text-red-600" onClick={() => setForm((current) => ({ ...current, qualifications: current.qualifications.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></div><div className="grid gap-3 md:grid-cols-2"><CustomDropdown label="Qualification" value={item.level} onChange={(value) => updateQualification(index, "level", value)} options={masterOptions.qualification} placeholder="Select qualification" /><InputField hidden={!qualificationHasSpecialization(item.level)} label="Course / Specialization" value={item.course} onChange={(e) => updateQualification(index, "course", e.target.value)} /><InputField label="Institute / University" value={item.institute} onChange={(e) => updateQualification(index, "institute", e.target.value)} /><CalendarPicker label="Passing Year" mode="year" value={item.passingYear} onChange={(value) => setForm((current) => ({ ...current, qualifications: current.qualifications.map((entry, itemIndex) => itemIndex === index ? { ...entry, passingYear: value } : entry) }))} /><div className="md:col-span-2"><FileUploadField label={`${item.level || "Qualification"} Marksheet`} error={uploadErrors[`qualification-marksheet-${index}`]} name={`qualification-marksheet-${index}`} accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={!item.level} hint="Select qualification first. JPG, PNG, WEBP or PDF, up to 5 MB." fileName={item.documents?.marksheet?.name} onChange={(event) => handleQualificationMarksheet(index, event.target.files?.[0])} /></div></div></div>)}</div> : null}
        {step === 2 && <div className="md:col-span-3 space-y-4">
          <section className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="text-sm font-semibold text-gray-900">Salary increment history</h3><p className="mt-1 text-xs text-gray-500">Add past or planned increments. Past entries are marked applied; future entries stay scheduled.</p></div>
              <button type="button" onClick={() => setForm((current) => ({ ...current, initialSalaryReviews: [...(current.initialSalaryReviews || []), { _clientId: crypto.randomUUID(), effectiveDate: "", incrementAmount: "", nextIncrementDate: "", reason: "" }] }))} aria-label="Add salary increment" title="Add salary increment" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#f84525] transition hover:bg-[#ffe1d8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f84525]"><FiPlus size={21} aria-hidden="true" /></button>
            </div>
            {(form.initialSalaryReviews || []).map((review, index) => <div key={review._id || review._clientId || index} className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between"><h4 className="text-sm font-semibold text-gray-800">Increment {index + 1}{review._id ? " · saved" : ""}</h4>{!review._id && <button type="button" onClick={() => setForm((current) => ({ ...current, initialSalaryReviews: current.initialSalaryReviews.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Remove salary increment ${index + 1}`} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"><FiX size={15} /> Remove</button>}</div>
              <div className={`grid grid-cols-1 items-start gap-4 ${review._id || index !== (form.initialSalaryReviews || []).findIndex((item) => !item._id) ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                <CalendarPicker label="Effective Date" mode="date" value={review.effectiveDate} onChange={(value) => setForm((current) => ({ ...current, initialSalaryReviews: current.initialSalaryReviews.map((item, itemIndex) => itemIndex === index ? { ...item, effectiveDate: value } : item) }))} />
                <InputField label="Increment Amount" type="number" min="0.01" step="0.01" value={review.incrementAmount} onChange={(event) => setForm((current) => ({ ...current, initialSalaryReviews: current.initialSalaryReviews.map((item, itemIndex) => itemIndex === index ? { ...item, incrementAmount: event.target.value } : item) }))} />
                <CalendarPicker label="Next Review Date" mode="date" value={review.nextIncrementDate} onChange={(value) => setForm((current) => ({ ...current, initialSalaryReviews: current.initialSalaryReviews.map((item, itemIndex) => itemIndex === index ? { ...item, nextIncrementDate: value } : item) }))} />
                <label className="block text-sm font-medium text-gray-700 md:col-span-full">Review remarks<textarea maxLength={1000} value={review.reason} onChange={(event) => setForm((current) => ({ ...current, initialSalaryReviews: current.initialSalaryReviews.map((item, itemIndex) => itemIndex === index ? { ...item, reason: event.target.value } : item) }))} className="mt-1 min-h-20 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#f84525] focus:outline-none focus:ring-1 focus:ring-[#f84525]" /></label>
              </div>
            </div>)}
          </section>
        </div>}

        {step === 2 ? <EmploymentHistory uploadErrors={uploadErrors} form={form} setForm={setForm} employeeJoiningDate={form.dateOfJoining} /> : null}
        {step === 5 ? <EmploymentHistory uploadErrors={uploadErrors} form={form} setForm={setForm} documents onFiles={handleEmploymentFiles} /> : null}

        {step === 3 ? (
          <>
            <InputField label="Bank Holder Name" name="bankHolderName" value={form.bankHolderName} onChange={handleChange} maxLength={100} />
            <InputField label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} maxLength={100} />
            <InputField label="Bank Account Number" name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} inputMode="numeric" maxLength={18} />
            <InputField label="Bank IFSC Code" name="bankIfscCode" value={form.bankIfscCode} onChange={handleChange} maxLength={11} />
          </>
        ) : null}

        {step === 4 ? (
          <div className="md:col-span-3 space-y-5">
            <div><h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Permanent Address</h3><AddressFields value={form.permanentAddress} errors={addressErrors.permanentAddress} onChange={handleNamedAddressChange("permanentAddress")} /></div>
            <div><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-gray-900 dark:text-gray-100">Alternate / Current Address</h3><label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300"><input type="checkbox" checked={JSON.stringify(form.alternateAddress || {}) === JSON.stringify(form.permanentAddress || {})} onChange={(event) => { if (event.target.checked) setForm((current) => ({ ...current, alternateAddress: { ...(current.permanentAddress || {}) } })); }} /> Same as Permanent Address</label></div><AddressFields value={form.alternateAddress} errors={addressErrors.alternateAddress} onChange={handleNamedAddressChange("alternateAddress")} /></div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="md:col-span-3">
            <FileUploadField label="Employee Photo" error={uploadErrors["employee-photo"]} name="employee-photo" accept=".jpg,.jpeg,.png,.webp" hint="White-background JPG, PNG or WEBP · up to 5 MB" onChange={(event) => handlePhoto(event.target.files?.[0])} fileName={form.photo?.name} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {employeeCreateDocumentFields.map(([key, label]) => <FileUploadField key={key} error={uploadErrors[key]} label={label} name={key} accept=".pdf,.jpg,.jpeg,.png,.webp" hint={["aadhaarCard", "panCard", "bloodGroupProof"].includes(key) ? "White-background scan or full-page PDF · JPG, PNG, WEBP or PDF · up to 5 MB" : "PDF, JPG, PNG or WEBP · up to 5 MB"} onChange={(event) => handleProof(key, event.target.files?.[0])} fileName={form.documents[key]?.name} />)}
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="md:col-span-3 space-y-6"><EmployeeChecklist value={form} onChange={handleChecklist} /></div>
        ) : null}

        {step === 7 ? <EmployeeCreateReview isEditMode={isEditMode} form={{ ...form, useDefaultPassword }} employees={employeeOptions} onEdit={setStep} /> : null}

        <div className="flex justify-between border-t border-gray-100 pt-4 dark:border-gray-800 md:col-span-3">
          <Button type="button" variant="secondary" text="Previous" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} />
          <div className="flex gap-2">
            {step < 7 ? <Button key="next-step" type="button" text="Next" onClick={nextStep} /> : <Button key="save-employee" type="button" onClick={handleSubmit} text={isEditMode ? "Update Employee" : "Add Employee"} loading={saving} className="min-w-40" />}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployeeCreate;
