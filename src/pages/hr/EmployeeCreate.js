import { useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authApi, hrApi } from "../../api";
import AddressFields from "../../components/common/AddressFields";
import Button from "../../components/common/Button";
import CalendarPicker from "../../components/common/CalendarPicker";
import FileUploadField from "../../components/common/FileUploadField";
import InputField from "../../components/common/InputField";
import CustomDropdown from "../../components/common/CustomDropdown";
import EmployeeChecklist from "../../components/common/EmployeeChecklist";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useEmployee } from "../../contexts/Hr/EmployeeContext";

const initialForm = {
  firstName: "",
  lastName: "",
  name: "",
  email: "",
  mobile: "",
  altMobile: "", gender: "Other", attendanceMode: "office",
  hrFileNo: "", fatherOrHusbandName: "", emergencyNumber: "", bloodGroup: "", trainingPeriod: "", salary: "", salaryOnHold: false, bondPeriodDuration: "",
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
const hasWhiteBackground = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas"); canvas.width = 40; canvas.height = 40;
    const context = canvas.getContext("2d"); context.drawImage(image, 0, 0, 40, 40);
    const pixels = context.getImageData(0, 0, 40, 40).data; let white = 0; let total = 0;
    for (let y = 0; y < 40; y += 2) for (let x = 0; x < 40; x += 2) if (x < 8 || x > 31 || y < 8 || y > 31) { const i = (y * 40 + x) * 4; total += 1; if (pixels[i] > 220 && pixels[i + 1] > 220 && pixels[i + 2] > 220) white += 1; }
    URL.revokeObjectURL(image.src); resolve(white / total >= 0.65);
  };
  image.onerror = reject; image.src = URL.createObjectURL(file);
});

const EmployeeCreate = () => {
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [masterOptions, setMasterOptions] = useState({ bloodGroup: [], gender: [], qualification: [], employeeType: [], designation: [], trainingPeriod: [], bondPeriod: [] });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const { user } = useContext(AuthContext);
  const { createEmployee } = useEmployee();
  const toast = useToast();
  const navigate = useNavigate();
  const employeesPath = user?.role === "superadmin" ? "/admin/employees" : "/hr/employees";
  const departmentOptions = useMemo(() => [...new Set(
    departments.map((department) => String(department.name || "").trim()).filter(Boolean)
  )].sort(), [departments]);
  const teamLeadOptions = useMemo(
    () => employeeOptions
      .filter((item) => item.workRole === "teamlead" || item.user?.role === "teamlead")
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [employeeOptions]
  );

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
    ])
      .then(([departmentResponse, bloodResponse, genderResponse, qualificationResponse, typeResponse, designationResponse, trainingResponse, bondResponse, employeesResponse]) => {
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
      })
      .catch(() => setDepartments([]));
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (["mobile", "altMobile"].includes(name) && !/^\d{0,10}$/.test(value)) return;
    if (["firstName", "lastName"].includes(name)) {
      const titleCased = value.trimStart().replace(/(^|\s)([a-z])/g, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
      setForm((current) => ({ ...current, [name]: titleCased }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };
  const handleSelect = (name) => (value) => setForm((current) => ({ ...current, [name]: value }));
  const addEmployment = () => setForm((current) => ({ ...current, previousEmployments: [...current.previousEmployments, { companyName: "", designation: "", joiningDate: "", leavingDate: "", offerLetter: null, relievingLetter: null, salarySlips: [] }] }));
  const updateEmployment = (index, key, value) => setForm((current) => ({ ...current, previousEmployments: current.previousEmployments.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  const addQualification = () => setForm((current) => ({ ...current, qualifications: [...current.qualifications, { level: "", course: "", institute: "", passingYear: "", percentage: "", documents: {} }] }));
  const updateQualification = (index, key, value) => setForm((current) => ({ ...current, qualifications: current.qualifications.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));

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
  const handlePhoto = async (file) => {
    if (!file) return;
    try {
      if (!(await hasWhiteBackground(file))) { toast.error("Employee photo must have a white background."); return; }
      const payload = await fileToPayload(file);
      if (payload) setForm((current) => ({ ...current, photo: payload }));
    } catch {
      toast.error("Unable to read the selected photo");
    }
  };
  const handleSalarySlips = async (files) => {
    try {
      const selectedFiles = Array.from(files || []).slice(0, 10).filter((file) => file.size <= MAX_UPLOAD_SIZE);
      if (selectedFiles.length < Array.from(files || []).length) toast.error("One or more salary slips exceed the 5 MB limit.");
      const salarySlips = await Promise.all(selectedFiles.map(fileToPayload));
      setForm((current) => ({ ...current, salarySlips }));
    } catch {
      toast.error("Unable to read selected salary slips");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createEmployee({
        ...form,
        chequeBankName: form.bankName,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        hrFileNo: undefined,
      });
      toast.success("Employee added successfully");
      navigate(employeesPath, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add employee");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "hr" && user?.role !== "superadmin") {
    return <Navigate to={employeesPath} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Employee</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create an employee profile and login access.</p>
        </div>
        <Button variant="secondary" text="Back to Employees" onClick={() => navigate(employeesPath)} />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-white p-2 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-4 lg:grid-cols-7">
        {["Basic details", "Employment", "Bank & salary", "Addresses", "Documents", "Checklists", "Review"].map((label, index) => (
          <button type="button" key={label} onClick={() => setStep(index + 1)} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${step === index + 1 ? "bg-[#f84525] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-[#fff1ed] dark:bg-gray-800 dark:text-gray-300"}`}>
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
        {step === 1 ? (
          <>
            <InputField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <InputField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
            <InputField label="Father / Husband Name" name="fatherOrHusbandName" value={form.fatherOrHusbandName} onChange={handleChange} />
            <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <InputField label="Mobile" name="mobile" type="tel" value={form.mobile} onChange={handleChange} required />
            <InputField label="Alternate Mobile" name="altMobile" type="tel" value={form.altMobile} onChange={handleChange} />
            <InputField label="Emergency Contact Number" name="emergencyNumber" type="tel" value={form.emergencyNumber} onChange={handleChange} />
            <InputField label="Temporary Password" name="password" type="password" value={form.password} onChange={handleChange} required autoComplete="new-password" />
            <CustomDropdown label="Gender" value={form.gender} onChange={handleSelect("gender")} options={masterOptions.gender.length ? masterOptions.gender : ["Male", "Female", "Other"]} />
            <CalendarPicker label="Date of Birth / Birthday" mode="date" value={form.dob} onChange={(value) => setForm((current) => ({ ...current, dob: value, celebrateDob: current.celebrateDob === current.dob ? value : current.celebrateDob }))} />
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={Boolean(form.dob && form.celebrateDob === form.dob)} onChange={(event) => setForm((current) => ({ ...current, celebrateDob: event.target.checked ? current.dob : "" }))} />
              Set as Celebrate DOB
            </label>
            <CalendarPicker label="Celebrate DOB" mode="date" value={form.celebrateDob} onChange={(value) => setForm((current) => ({ ...current, celebrateDob: value }))} />
            <CustomDropdown label="Blood Group" value={form.bloodGroup} onChange={handleSelect("bloodGroup")} options={masterOptions.bloodGroup.length ? masterOptions.bloodGroup : ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            <div className="rounded-lg border border-dashed border-orange-200 bg-[#fffaf8] p-3 dark:border-orange-900 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Employee Code / HR File No.</p>
              <p className="mt-1 text-sm font-semibold text-[#f84525]">Generated automatically after saving</p>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <CalendarPicker label="Joining Date" mode="date" value={form.dateOfJoining} onChange={(value) => setForm((current) => ({ ...current, dateOfJoining: value }))} />
            <CustomDropdown label="Department" value={form.department} onChange={handleSelect("department")} options={departmentOptions} searchable portalMenu />
            <CustomDropdown label="Designation" value={form.designation} onChange={handleSelect("designation")} options={masterOptions.designation} searchable portalMenu />
            <CustomDropdown label="Employee Type" value={form.employeeType} onChange={handleSelect("employeeType")} options={masterOptions.employeeType.length ? masterOptions.employeeType : ["Permanent", "Probation", "Intern"]} />
            <CustomDropdown label="Experience" value={form.experienceType} onChange={handleSelect("experienceType")} options={["Fresher", "Experienced"]} />
            {form.experienceType === "Experienced" ? <InputField label="Total Experience (Years)" type="number" min="0" step="0.1" value={form.totalExperienceYears} onChange={handleChange} name="totalExperienceYears" /> : null}
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
          </>
        ) : null}
        {step === 2 ? <div className="md:col-span-3 space-y-3"><div className="flex items-center justify-between"><h3 className="font-semibold">Qualification Details</h3><Button type="button" text="Add Qualification" onClick={addQualification} /></div>{form.qualifications.map((item, index) => <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-2"><CustomDropdown label="Qualification" value={item.level} onChange={(value) => updateQualification(index, "level", value)} options={masterOptions.qualification} placeholder="Select qualification" /><InputField label="Course / Specialization" value={item.course} onChange={(e) => updateQualification(index, "course", e.target.value)} /><InputField label="Institute / University" value={item.institute} onChange={(e) => updateQualification(index, "institute", e.target.value)} /><InputField label="Passing Year" value={item.passingYear} onChange={(e) => updateQualification(index, "passingYear", e.target.value)} /></div>)}</div> : null}

        {step === 5 && form.experienceType === "Experienced" ? <div className="md:col-span-3 space-y-3"><div className="flex items-center justify-between"><h3 className="font-semibold">Previous Employment</h3><Button type="button" text="Add Company" onClick={addEmployment} /></div>{form.previousEmployments.map((item, index) => <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-2"><InputField label="Company Name" value={item.companyName} onChange={(e) => updateEmployment(index, "companyName", e.target.value)} /><InputField label="Designation" value={item.designation} onChange={(e) => updateEmployment(index, "designation", e.target.value)} /><InputField label="Joining Date" type="date" value={item.joiningDate} onChange={(e) => updateEmployment(index, "joiningDate", e.target.value)} /><InputField label="Leaving Date" type="date" value={item.leavingDate} onChange={(e) => updateEmployment(index, "leavingDate", e.target.value)} /></div>)}</div> : null}

        {step === 3 ? (
          <>
            <InputField label="Salary" name="salary" value={form.salary} onChange={handleChange} />
            <CustomDropdown label="Bond Period Duration" value={form.bondPeriodDuration} onChange={handleSelect("bondPeriodDuration")} options={masterOptions.bondPeriod.length ? masterOptions.bondPeriod : ["15 Days", "1 Month", "2 Months", "3 Months", "6 Months"]} searchable portalMenu />
            <InputField label="Bank Holder Name" name="bankHolderName" value={form.bankHolderName} onChange={handleChange} />
            <InputField label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} />
            <InputField label="Bank Account Number" name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} />
            <InputField label="Bank IFSC Code" name="bankIfscCode" value={form.bankIfscCode} onChange={handleChange} />
            <InputField label="Cheque Number" name="chequeNumber" value={form.chequeNumber} onChange={handleChange} />
            <InputField label="Cheque Account Number" name="chequeAccountNumber" value={form.chequeAccountNumber} onChange={handleChange} />
            <InputField label="Cheque Amount" name="chequeAmount" value={form.chequeAmount} onChange={handleChange} />
            <CalendarPicker label="Cheque Date" mode="date" value={form.chequeDate} onChange={(value) => setForm((current) => ({ ...current, chequeDate: value }))} />
            <label className="flex h-[42px] items-center gap-2 rounded-md border border-gray-200 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200 md:mt-[22px]"><input type="checkbox" checked={form.salaryOnHold} onChange={(event) => setForm((current) => ({ ...current, salaryOnHold: event.target.checked }))} /> Salary on hold</label>
          </>
        ) : null}

        {step === 4 ? (
          <div className="md:col-span-3 space-y-5">
            <div><h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Permanent Address</h3><AddressFields value={form.permanentAddress} onChange={handleNamedAddressChange("permanentAddress")} /></div>
            <div><h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Alternate / Current Address</h3><AddressFields value={form.alternateAddress} onChange={handleNamedAddressChange("alternateAddress")} /></div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="md:col-span-3">
            <FileUploadField label="Employee Photo" name="employee-photo" accept=".jpg,.jpeg,.png,.webp" hint="Upload JPG, PNG or WEBP" onChange={(event) => handlePhoto(event.target.files?.[0])} fileName={form.photo?.name} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["aadhaarCard", "Aadhaar Card"], ["panCard", "PAN Card"], ["passbook", "Bank Proof / Passbook"],
                ["bloodGroupProof", "Blood Group Proof"], ["bondDocument", "Bond Document Original"],
                ["bondLetter", "Bond Letter"], ["addressProof", "Address Proof"],
                ["degree", "Degree / Qualification"], ["resume", "Resume"], ["offerLetter", "Offer Letter"],
                ["appointmentLetter", "Appointment Letter"], ["leavingLetter", "Leaving Letter"], ["experienceCertificate", "Experience Certificate"],
                ["previousCompanyDocument", "Previous Company Document"], ["documentXerox", "Previous Document Xerox"], ["bankStatement", "Bank Statement"]
              ].map(([key, label]) => <FileUploadField key={key} label={label} name={key} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => handleProof(key, event.target.files?.[0])} fileName={form.documents[key]?.name} />)}
            </div>
            <FileUploadField label="Salary Slips" name="salary-slips" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple hint="Select up to 10 salary slips" onChange={(event) => handleSalarySlips(event.target.files)} fileName={form.salarySlips.length ? `${form.salarySlips.length} file(s) selected` : ""} />
          </div>
        ) : null}

        {step === 6 ? (
          <div className="md:col-span-3 space-y-6"><EmployeeChecklist value={form} onChange={handleChecklist} /></div>
        ) : null}

        {step === 7 ? (
          <div className="md:col-span-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"><h3 className="font-semibold text-gray-900 dark:text-gray-100">Personal & Employment</h3><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{form.firstName} {form.lastName}<br />{form.department || "Department not selected"} · {form.designation || "Designation not selected"}<br />Joining: {form.dateOfJoining || "Not selected"}</p></div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"><h3 className="font-semibold text-gray-900 dark:text-gray-100">Documents & Bank</h3><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{Object.keys(form.documents).length} documents selected<br />Bank: {form.bankName || "Not entered"}<br />Training: {form.trainingPeriod || "Not selected"}</p></div>
          </div>
        ) : null}

        <div className="flex justify-between border-t border-gray-100 pt-4 dark:border-gray-800 md:col-span-3">
          <Button type="button" variant="secondary" text="Previous" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} />
          <div className="flex gap-2">
            {step < 7 ? <Button type="button" text="Next" onClick={() => setStep((value) => Math.min(7, value + 1))} /> : <Button type="submit" text="Add Employee" loading={saving} className="min-w-40" />}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployeeCreate;
