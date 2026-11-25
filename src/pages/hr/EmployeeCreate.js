import Checkbox from "../../components/common/Checkbox";
/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import { employeeUploadErrors } from "../../utils/employeeUploadSize";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { FiPlus } from "react-icons/fi";

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
  hrFileNo: "", fatherOrHusbandName: "", emergencyNumber: "", bloodGroup: "", trainingPeriod: "", salary: "", salaryOnHold: true, bondPeriodDuration: "", nextIncrementDate: "", bondEndDate: "",
  experienceType: "Fresher", totalExperienceYears: "", previousEmployments: [],
  qualifications: [],
  bankHolderName: "", bankAccountNumber: "", bankIfscCode: "", bankName: "",
  chequeNumber: "", chequeAccountNumber: "", chequeAmount: "", chequeDate: "", chequeBankName: "",
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


const EmployeeCreate = () => {
  const { authApi, hrApi } = useApi();
  const { employeeId } = useParams();
  const isEditMode = Boolean(employeeId);
  const [useDefaultPassword, setUseDefaultPassword] = useState(false);
  const [defaultPasswordConfigured, setDefaultPasswordConfigured] = useState(false);
  useEffect(() => { if (!isEditMode) hrApi.getDefaultEmployeePasswordStatus().then(res => { const configured = res.data.configured === true; setDefaultPasswordConfigured(configured); setUseDefaultPassword(configured); }).catch(() => setDefaultPasswordConfigured(false)); }, [isEditMode]);

  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [reportingManagerOptions, setReportingManagerOptions] = useState([]);
  const [masterOptions, setMasterOptions] = useState({ bloodGroup: [], gender: [], qualification: [], employeeType: [], designation: [], trainingPeriod: [], bondPeriod: [] });
  const [uploadErrors, setUploadErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const { user } = useContext(AuthContext);
  const { createEmployee } = useEmployee();
  const toast = useToast();
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(false);
  const draftKey = user?._id || user?.id || user?.email;
  const [loadedDraftKey, setLoadedDraftKey] = useState(null);
  const [draftStatus, setDraftStatus] = useState("Loading draft…");
  const draftFinished = useRef(false);
  const draftReady = Boolean(draftKey && loadedDraftKey === draftKey);
  const employmentDetailsComplete = Boolean(form.dateOfJoining && form.department && form.designation && form.employeeType && form.attendanceMode && form.salary && form.bondPeriodDuration);

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
    hrApi.getEmployee(employeeId).then((response) => {
      if (!active) return;
      const data = response.data?.data || {};
      setForm((current) => ({ ...current, ...data, password: "", photo: null, documents: {},
        qualifications: (data.qualifications || []).map((item) => ({ ...item, id: item.id || crypto.randomUUID(), documents: item.documents || {} })),
        previousEmployments: (data.previousEmployments || []).map((item, index, items) => ({ ...item, id: item.id || crypto.randomUUID(), documents: item.documents || {}, isLastCompany: items.some((entry) => entry.isLastCompany) ? Boolean(item.isLastCompany) : index === items.length - 1 })),
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
    Promise.all([
      authApi.getDepartments(),
      authApi.getMasterOptions("bloodGroup"),
      authApi.getMasterOptions("gender"),
      authApi.getMasterOptions("qualification"),
      authApi.getMasterOptions("employeeType"),
      authApi.getMasterOptions("designation"),
      authApi.getMasterOptions("trainingPeriod"),
      authApi.getMasterOptions("bondPeriod"),
      hrApi.getEmployees(),
      hrApi.getReportingManagers(),
    ])
      .then(([departmentResponse, bloodResponse, genderResponse, qualificationResponse, typeResponse, designationResponse, trainingResponse, bondResponse, employeesResponse, managersResponse]) => {
        setDepartments(departmentResponse.data.data || []);
        setMasterOptions({
          bloodGroup: (bloodResponse.data.data || []).map((item) => item.name),
          gender: (genderResponse.data.data || []).map((item) => item.name),
          qualification: (qualificationResponse.data.data || []).map((item) => item.name),
          employeeType: (typeResponse.data.data || []).map((item) => item.name),
          designation: (designationResponse.data.data || []).map((item) => item.name),
          trainingPeriod: (trainingResponse.data.data || []).map((item) => item.name),
          bondPeriod: (bondResponse.data.data || []).map((item) => item.name),
        });
        setEmployeeOptions(employeesResponse?.data?.data || []);
        setReportingManagerOptions(managersResponse?.data?.data || []);
      })
      .catch(() => setDepartments([]));
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "email") { setForm(current => ({ ...current, email: value.toLowerCase().trim() })); return; }
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
  const handleMobileBlur = (event) => {
    const { name, value } = event.target;
    setFieldErrors((current) => ({ ...current, [name]: validateMobileField(name, value) }));
  };
  const handleSelect = (name) => (value) => setForm((current) => ({ ...current, [name]: value, ...(name === "experienceType" && value === "Experienced" && !current.previousEmployments.length ? { previousEmployments: [newEmployment(true)] } : {}) }));
  useEffect(() => {
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ").trim();
    if (fullName && !String(form.bankHolderName || "").trim()) setForm((current) => ({ ...current, bankHolderName: fullName }));
  }, [form.firstName, form.middleName, form.lastName, form.bankHolderName]);
  const addQualification = () => setForm((current) => ({ ...current, qualifications: [...current.qualifications, { id: crypto.randomUUID(), level: "", course: "", institute: "", passingYear: "", percentage: "", documents: {} }] }));
  const updateQualification = (index, key, value) => setForm((current) => ({ ...current, qualifications: current.qualifications.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value, ...(key === "level" && !qualificationHasSpecialization(value) ? { course: "" } : {}) } : item) }));

  const handleNamedAddressChange = (addressKey) => (event) => {
    const { name, value } = event.target;
    if (name === "pincode" && !/^\d{0,6}$/.test(value)) return;
    setForm((current) => ({ ...current, [addressKey]: { ...current[addressKey], [name]: value } }));
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
      const mobileErrors = Object.fromEntries(["mobile", "altMobile", "emergencyNumber"].map((name) => [name, validateMobileField(name, form[name])]));
      setFieldErrors((current) => ({ ...current, ...mobileErrors }));
      if (Object.values(mobileErrors).some(Boolean)) { toast.error("Please correct the highlighted mobile numbers"); return; }
    }
    if (step === 2 || step === 5) {
      const error = experienceError(form, step === 5);
      if (error) { toast.error(error); return; }
    }
    if (step === 2 && (!form.dateOfJoining || !form.department || !form.designation || !form.employeeType)) { toast.error("Complete joining date, department, designation and employee type before continuing"); return; }
    if (step === 3 && form.salary !== "" && (Number.isNaN(Number(form.salary)) || Number(form.salary) < 0)) { toast.error("Enter a valid salary"); return; }
    if (step === 4 && [form.permanentAddress, form.alternateAddress].some((address) => address?.pincode && !/^\d{6}$/.test(address.pincode))) { toast.error("Enter a valid 6-digit pincode"); return; }
    setStep((value) => Math.min(7, value + 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step !== 7 || saving) return;
    if (!event.currentTarget.form?.reportValidity()) return;
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
    setSaving(true);
    try {
      const payload = {
        ...form,
        useDefaultPassword: !isEditMode && useDefaultPassword,
        password: useDefaultPassword ? "" : form.password,
        salaryOnHold: Boolean(form.salaryOnHold),
        previousEmployments: form.experienceType === "Experienced" ? form.previousEmployments : [],
        totalExperienceYears: form.experienceType === "Experienced" ? form.totalExperienceYears : 0,
        salarySlips: [],
        documents: Object.fromEntries(employeeCreateDocumentFields.filter(([key]) => form.documents[key]).map(([key]) => [key, form.documents[key]])),
        chequeBankName: form.bankName,
        name: `${form.firstName.trim()} ${form.middleName.trim()} ${form.lastName.trim()}`.replace(/\s+/g, " ").trim(),
        hrFileNo: undefined,
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
        const documentPayload = { ...documents, ...(photo ? { photo } : {}) };
        if (Object.keys(documentPayload).length) await hrApi.updateEmployeeDocuments(employeeId, documentPayload);
      } else await createEmployee(payload);
      draftFinished.current = true;
      try { await employeeDraft("delete", draftKey); }
      catch { toast.warning("Employee saved, but the browser draft could not be cleared."); }
      toast.success(isEditMode ? "Employee updated successfully" : "Employee added successfully");
      navigate(employeesPath, { replace: true });
    } catch (error) {
      toast.error(error.response?.status === 413 ? "Uploads exceed the server request limit. Compress the selected files and try again." : error.response?.data?.message || "Unable to add employee. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "hr" && user?.role !== "superadmin") {
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

      <form onSubmit={(event) => event.preventDefault()} autoComplete="off" className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
        {step === 1 ? (
          <>
            <div className="md:col-span-3 flex items-center gap-4 text-lg font-semibold"><span>Personal information</span><span aria-hidden="true" className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600" /></div>
            <InputField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <InputField label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} />
            <InputField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
            <InputField label="Father / Husband Name" name="fatherOrHusbandName" value={form.fatherOrHusbandName} onChange={handleChange} />
            <CustomDropdown label="Gender" value={form.gender} onChange={handleSelect("gender")} options={masterOptions.gender.length ? masterOptions.gender : ["Male", "Female", "Other"]} />
            <div>
              <CustomDropdown label="Blood Group" value={form.bloodGroup} onChange={handleSelect("bloodGroup")} options={masterOptions.bloodGroup.length ? masterOptions.bloodGroup : ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            </div>
            <CalendarPicker label="Date of Birth / Birthday" mode="date" value={form.dob} onChange={(value) => setForm((current) => ({ ...current, dob: value, celebrateDob: current.celebrateDob === current.dob ? value : current.celebrateDob }))} />
            <CalendarPicker label="Celebrate DOB" labelAddon={<label className="inline-flex items-center gap-1 text-xs font-normal"><input type="checkbox" checked={Boolean(form.dob && form.celebrateDob === form.dob)} onChange={(event) => setForm((current) => ({ ...current, celebrateDob: event.target.checked ? current.dob : "" }))} /> Same as DOB</label>} mode="date" value={form.celebrateDob} onChange={(value) => setForm((current) => ({ ...current, celebrateDob: value }))} />
            <div className="md:col-span-3 flex items-center gap-4 pt-3 text-lg font-semibold"><span>Contact details</span><span aria-hidden="true" className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600" /></div>
            <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <InputField label="Mobile" name="mobile" type="tel" prefix="+91" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile number" value={form.mobile} onChange={handleChange} onBlur={handleMobileBlur} error={fieldErrors.mobile} required />
            <InputField label="Alternate Mobile" name="altMobile" type="tel" prefix="+91" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile number" value={form.altMobile} onChange={handleChange} onBlur={handleMobileBlur} error={fieldErrors.altMobile} />
            <InputField label="Emergency Contact Number" name="emergencyNumber" type="tel" prefix="+91" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile number" value={form.emergencyNumber} onChange={handleChange} onBlur={handleMobileBlur} error={fieldErrors.emergencyNumber} />
            <div className="md:col-span-3 flex items-center gap-4 pt-3 text-lg font-semibold"><span>Login and identity</span><span aria-hidden="true" className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600" /></div>
            {!isEditMode && <div className="md:col-span-3"><Checkbox label="Use temporary password" checked={useDefaultPassword} disabled={!defaultPasswordConfigured} onChange={checked => { setUseDefaultPassword(checked); setForm(current => ({ ...current, password: '' })); }} description={defaultPasswordConfigured ? 'Applies only to this new employee. You can also enter a custom password.' : 'Ask Admin to configure a default password in Settings, or enter a custom password.'} /></div>}
            {!isEditMode && !useDefaultPassword && <InputField label="Temporary Password" name="password" type="password" passwordToggle value={form.password} onChange={handleChange} required autoComplete="new-password" />}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <CustomDropdown label="Experience" value={form.experienceType} onChange={handleSelect("experienceType")} options={["Fresher", "Experienced"]} />
            {form.experienceType === "Experienced" ? <InputField label="Total Experience (Years)" type="number" min="0" step="0.1" value={form.totalExperienceYears} onChange={handleChange} name="totalExperienceYears" /> : null}
            <CalendarPicker label="Joining Date" mode="date" value={form.dateOfJoining} onChange={(value) => setForm((current) => ({ ...current, dateOfJoining: value }))} />
            <CustomDropdown label="Department" value={form.department} onChange={handleSelect("department")} options={departmentOptions} searchable portalMenu />
            <CustomDropdown label="Designation" value={form.designation} onChange={handleSelect("designation")} options={masterOptions.designation.filter((item) => !item.department || item.department === form.department).map((item) => item.name || item)} searchable portalMenu />
            <CustomDropdown label="Employee Type" value={form.employeeType} onChange={handleSelect("employeeType")} options={masterOptions.employeeType.length ? masterOptions.employeeType : ["Permanent", "Probation", "Intern"]} />
            <CustomDropdown label="Probation Period" value={form.trainingPeriod} onChange={handleSelect("trainingPeriod")} options={masterOptions.trainingPeriod.length ? masterOptions.trainingPeriod : ["1 Month", "3 Months", "6 Months"]} />
            <CustomDropdown label="Attendance Mode" value={form.attendanceMode} onChange={handleSelect("attendanceMode")} options={[{ value: "office", label: "Office" }, { value: "work_from_home", label: "Work From Home" }]} />
            <CustomDropdown
              label="Reporting Manager"
              value={form.teamLead}
              placeholder="No Reporting Manager"
              searchable
              portalMenu
              onChange={(value) => {
                const selectedTeamLead = teamLeadOptions.find((item) => item._id === value);
                setForm((current) => ({
                  ...current,
                  teamLead: value,
                  reportingManager: selectedTeamLead ? selectedTeamLead.employeeId || selectedTeamLead.name : "",
                }));
              }}
              options={teamLeadOptions.map((teamLead) => ({
                value: teamLead._id,
                label: `${teamLead.employeeId || "-"} - ${teamLead.name}`,
              }))}
            />
            <CalendarPicker label="Resignation Date" mode="date" value={form.resignationDate} onChange={(value) => setForm((current) => ({ ...current, resignationDate: value }))} />
            <CalendarPicker label="Leaving Date" mode="date" value={form.leavingDate} onChange={(value) => setForm((current) => ({ ...current, leavingDate: value }))} />
            <section className="md:col-span-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-base font-semibold">Joining / Current Record</h3>
              <p className="mt-1 text-sm text-gray-500">Enter the starting salary, increment date and bond details for this employee.</p>
              <div className="mt-4 grid grid-cols-1 items-start gap-4 md:grid-cols-3">
            <InputField label="Salary" name="salary" value={form.salary} onChange={handleChange} />
            {!isEditMode && <CalendarPicker label="Increment Date" mode="date" value={form.nextIncrementDate} onChange={(value) => setForm(current => ({ ...current, nextIncrementDate: value }))} />}
            {!isEditMode && <CalendarPicker label="Bond End Date" mode="date" value={form.bondEndDate} onChange={(value) => setForm(current => ({ ...current, bondEndDate: value }))} />}

            <CustomDropdown label="Bond Period Duration" value={form.bondPeriodDuration} onChange={handleSelect("bondPeriodDuration")} options={masterOptions.bondPeriod.length ? masterOptions.bondPeriod : ["15 Days", "1 Month", "2 Months", "3 Months", "6 Months"]} searchable portalMenu />
            {isEditMode && <label className="flex h-[42px] items-center gap-2 rounded-md border border-gray-200 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200 md:mt-[22px]"><input type="checkbox" checked={form.salaryOnHold} onChange={(event) => setForm((current) => ({ ...current, salaryOnHold: event.target.checked }))} /> Salary on hold</label>}
            {!isEditMode && <label className={`flex h-[42px] items-center gap-2 rounded-md border border-gray-200 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200 md:mt-[22px] ${!employmentDetailsComplete ? "cursor-not-allowed opacity-70" : ""}`}><input type="checkbox" checked={Boolean(form.salaryOnHold)} disabled={!employmentDetailsComplete} onChange={(event) => setForm((current) => ({ ...current, salaryOnHold: event.target.checked }))} /> Salary on hold</label>}
              </div>
            </section>
          </>
        ) : null}
        {step === 2 ? <div className="md:col-span-3 space-y-3"><div className="flex items-center gap-3"><h3 className="font-semibold">Qualification Details</h3><button type="button" onClick={addQualification} aria-label="Add qualification" title="Add qualification" className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[#f84525] hover:bg-[#fff1ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f84525]"><FiPlus size={22} aria-hidden="true" /></button></div>{form.qualifications.map((item, index) => <div key={index} className="rounded-lg border p-3"><div className="mb-2 flex justify-end"><button type="button" className="text-xs font-semibold text-red-600" onClick={() => setForm((current) => ({ ...current, qualifications: current.qualifications.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></div><div className="grid gap-3 md:grid-cols-2"><CustomDropdown label="Qualification" value={item.level} onChange={(value) => updateQualification(index, "level", value)} options={masterOptions.qualification} placeholder="Select qualification" /><InputField hidden={!qualificationHasSpecialization(item.level)} label="Course / Specialization" value={item.course} onChange={(e) => updateQualification(index, "course", e.target.value)} /><InputField label="Institute / University" value={item.institute} onChange={(e) => updateQualification(index, "institute", e.target.value)} /><CalendarPicker label="Passing Year" mode="year" value={item.passingYear} onChange={(value) => updateQualification(index, "passingYear", value)} /><div className="md:col-span-2"><FileUploadField label={`${item.level || "Qualification"} Marksheet`} error={uploadErrors[`qualification-marksheet-${index}`]} name={`qualification-marksheet-${index}`} accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={!item.level} hint="Select qualification first. JPG, PNG, WEBP or PDF, up to 5 MB." fileName={item.documents?.marksheet?.name} onChange={(event) => handleQualificationMarksheet(index, event.target.files?.[0])} /></div></div></div>)}</div> : null}

        {step === 2 ? <EmploymentHistory uploadErrors={uploadErrors} form={form} setForm={setForm} /> : null}
        {step === 5 ? <EmploymentHistory uploadErrors={uploadErrors} form={form} setForm={setForm} documents onFiles={handleEmploymentFiles} /> : null}

        {step === 3 ? (
          <>
            <InputField label="Bank Holder Name" name="bankHolderName" value={form.bankHolderName} onChange={handleChange} />
            <InputField label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} />
            <InputField label="Bank Account Number" name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} />
            <InputField label="Bank IFSC Code" name="bankIfscCode" value={form.bankIfscCode} onChange={handleChange} />
            <InputField label="Cheque Number" name="chequeNumber" value={form.chequeNumber} onChange={handleChange} />
            <InputField label="Cheque Account Number" name="chequeAccountNumber" value={form.chequeAccountNumber} onChange={handleChange} />
            <InputField label="Cheque Amount" name="chequeAmount" value={form.chequeAmount} onChange={handleChange} />
            <CalendarPicker label="Cheque Date" mode="date" value={form.chequeDate} onChange={(value) => setForm((current) => ({ ...current, chequeDate: value }))} />
          </>
        ) : null}

        {step === 4 ? (
          <div className="md:col-span-3 space-y-5">
            <div><h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Permanent Address</h3><AddressFields value={form.permanentAddress} onChange={handleNamedAddressChange("permanentAddress")} /></div>
            <div><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-gray-900 dark:text-gray-100">Alternate / Current Address</h3><label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300"><input type="checkbox" checked={JSON.stringify(form.alternateAddress || {}) === JSON.stringify(form.permanentAddress || {})} onChange={(event) => { if (event.target.checked) setForm((current) => ({ ...current, alternateAddress: { ...(current.permanentAddress || {}) } })); }} /> Same as Permanent Address</label></div><AddressFields value={form.alternateAddress} onChange={handleNamedAddressChange("alternateAddress")} /></div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="md:col-span-3">
            <FileUploadField label="Employee Photo" error={uploadErrors["employee-photo"]} name="employee-photo" accept=".jpg,.jpeg,.png,.webp" hint="Upload JPG, PNG or WEBP" onChange={(event) => handlePhoto(event.target.files?.[0])} fileName={form.photo?.name} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {employeeCreateDocumentFields.map(([key, label]) => <FileUploadField key={key} error={uploadErrors[key]} label={label} name={key} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => handleProof(key, event.target.files?.[0])} fileName={form.documents[key]?.name} />)}
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
