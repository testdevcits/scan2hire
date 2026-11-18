import { useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../../api";
import AddressFields from "../../components/common/AddressFields";
import Button from "../../components/common/Button";
import CalendarPicker from "../../components/common/CalendarPicker";
import FileUploadField from "../../components/common/FileUploadField";
import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";
import EmployeeChecklist from "../../components/common/EmployeeChecklist";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useEmployee } from "../../contexts/Hr/EmployeeContext";

const initialForm = {
  name: "",
  email: "",
  mobile: "",
  hrFileNo: "", emergencyNumber: "", bloodGroup: "", trainingPeriod: "", salary: "", salaryOnHold: false, bondPeriodDuration: "", bankAccountNumber: "", bankIfscCode: "", resignationDate: "", leavingDate: "",
  password: "",
  department: "",
  designation: "",
  dob: "",
  dateOfJoining: "",
  reportingManager: "",
  employeeType: "Permanent",
  address: { street: "", city: "", state: "", country: "", pincode: "" },
  photo: null,
  documents: {},
  joiningChecklist: { idCard: false, credentials: false, tshirtBag: false, officeKeyPhoneSystem: false },
  leavingChecklist: { idCardNotepadPen: false, credentials: false, tshirtBag: false, officeKeyPhoneSystem: false },
  noDuesChecklist: { teamLeadProjectManager: false, itHead: false, hrHead: false },
};

const EmployeeCreate = () => {
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
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

  useEffect(() => {
    if (user?.role !== "hr" && user?.role !== "superadmin") return;
    authApi.getDepartments()
      .then((response) => setDepartments(response.data.data || []))
      .catch(() => setDepartments([]));
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "mobile" && !/^\d{0,10}$/.test(value)) return;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    if (name === "pincode" && !/^\d{0,6}$/.test(value)) return;
    setForm((current) => ({ ...current, address: { ...current.address, [name]: value } }));
  };
  const handleChecklist = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));

  const fileToPayload = async (file) => {
    if (!file) return null;
    const dataUri = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    return { dataUri, name: file.name, type: file.type };
  };
  const handleProof = async (key, file) => {
    if (!file) return;
    try { const payload = await fileToPayload(file); setForm((current) => ({ ...current, documents: { ...current.documents, [key]: payload } })); }
    catch { toast.error("Unable to read the selected file"); }
  };
  const handlePhoto = async (file) => {
    if (!file) return;
    try {
      const dataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setForm((current) => ({ ...current, photo: { dataUri, name: file.name, type: file.type } }));
    } catch {
      toast.error("Unable to read the selected photo");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createEmployee(form);
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
    <div className="mx-auto max-w-5xl space-y-4 p-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Employee</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create an employee profile and login access.</p>
        </div>
        <Button variant="secondary" text="Back to Employees" onClick={() => navigate(employeesPath)} />
      </div>

      <div className="flex gap-2 rounded-sm border border-gray-100 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">{["Basic details", "Employment & banking", "Checklists & proofs"].map((label, index) => <button type="button" key={label} onClick={() => setStep(index + 1)} className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${step === index + 1 ? "bg-[#f84525] text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{index + 1}. {label}</button>)}</div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-sm border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
        {[
          ["name", "Full Name", "text"],
          ["email", "Email", "email"],
          ["mobile", "Mobile", "tel"],
          ["password", "Temporary Password", "password"],
          ["designation", "Designation", "text"],
          ["dateOfJoining", "Joining Date", "date"],
          ["reportingManager", "Reporting Manager", "text"],
          ["hrFileNo", "HR File No.", "text"], ["emergencyNumber", "Emergency Number", "tel"], ["bloodGroup", "Blood Group", "text"], ["trainingPeriod", "Training Period", "text"], ["salary", "Salary", "text"], ["bondPeriodDuration", "Bond Period Duration", "text"], ["bankAccountNumber", "Bank Account Number", "text"], ["bankIfscCode", "Bank IFSC Code", "text"], ["resignationDate", "Resignation Date", "date"], ["leavingDate", "Leaving Date", "date"],
        ].filter(([name]) => step === 1 ? ["name", "email", "mobile", "password", "designation", "dateOfJoining", "department", "employeeType"].includes(name) : step === 2 ? !["name", "email", "mobile", "password", "designation", "dateOfJoining"].includes(name) : false).map(([name, label, type]) => (
          <InputField
            key={name}
            label={label}
            name={name}
            type={type}
            value={form[name]}
            onChange={handleChange}
            required={["name", "email", "mobile", "password"].includes(name)}
          />
        ))}

        {step === 1 ? <><CalendarPicker label="Date of Birth" mode="date" value={form.dob} onChange={(value) => setForm((current) => ({ ...current, dob: value }))} /><SelectField label="Department" name="department" value={form.department} onChange={handleChange} options={departmentOptions} /><SelectField label="Employee Type" name="employeeType" value={form.employeeType} onChange={handleChange} options={["Permanent", "Contract", "Intern"]} /></> : null}
        {step === 3 ? <div className="md:col-span-3 border-t pt-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.salaryOnHold} onChange={(e) => setForm((c) => ({ ...c, salaryOnHold: e.target.checked }))} /> Salary on hold</label>
          <EmployeeChecklist value={form} onChange={handleChecklist} />
        </div> : null}

        {step === 3 ? <AddressFields value={form.address} onChange={handleAddressChange} className="md:col-span-3" /> : null}
        {step === 3 ? <div className="md:col-span-3 border-t pt-4">
          <FileUploadField label="Employee Photo" name="employee-photo" accept=".jpg,.jpeg,.png,.webp" hint="Upload JPG, PNG, WEBP" onChange={(event) => handlePhoto(event.target.files?.[0])} fileName={form.photo?.name} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["aadhaarCard","Aadhaar Card"],["panCard","PAN Card"],["passbook","Bank Proof / Passbook"],["bloodGroupProof","Blood Group Proof"],["bondDocument","Bond Document"],["addressProof","Address Proof"],["experienceCertificate","Experience Certificate"]].map(([key,label]) => <FileUploadField key={key} label={label} name={key} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => handleProof(key, event.target.files?.[0])} fileName={form.documents[key]?.name} />)}</div>
        </div> : null}
        <div className="flex justify-between border-t pt-4 md:col-span-3"><Button type="button" variant="secondary" text="Previous" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} /><div className="flex gap-2">{step < 3 ? <Button type="button" text="Next" onClick={() => setStep((value) => Math.min(3, value + 1))} /> : <Button type="submit" text="Add Employee" loading={saving} className="min-w-40" />}</div></div>
      </form>
    </div>
  );
};

export default EmployeeCreate;
