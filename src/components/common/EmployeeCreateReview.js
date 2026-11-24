import EmploymentReview from "./EmploymentReview";
import { employeeCreateDocumentFields } from "../../utils/employeeDocumentFields";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { TbEdit } from "react-icons/tb";
import { employeeChecklistGroups } from "./EmployeeChecklist";

const labelFor = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());

const ReviewValue = ({ value }) => {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? <ol className="space-y-3">{value.map((item, index) => <li key={index}><ReviewValue value={item} /></li>)}</ol> : "None";
  // File payloads contain encoded data; show the filename in the review.
  if (typeof value === "object") {
    if (value.dataUri || value.url) return value.name || "Uploaded file";
    const entries = Object.entries(value);
    return entries.length ? <dl className="space-y-1">{entries.map(([key, item]) => <div key={key}><dt className="font-medium">{labelFor(key)}</dt><dd><ReviewValue value={item} /></dd></div>)}</dl> : "None";
  }
  return String(value);
};

export default function EmployeeCreateReview({ form, employees = [], onEdit }) {
  const [showPassword, setShowPassword] = useState(false);
  const manager = employees.find((employee) => employee._id === form.teamLead);
  const sections = [
    ["Personal & Contact Details", [
      ["First Name", form.firstName], ["Middle Name", form.middleName], ["Last Name", form.lastName],
      ["Father / Husband Name", form.fatherOrHusbandName], ["Gender", form.gender], ["Blood Group", form.bloodGroup],
      ["Date of Birth / Birthday", form.dob], ["Celebrate DOB", form.celebrateDob], ["Email", form.email],
      ["Mobile", form.mobile], ["Alternate Mobile", form.altMobile], ["Emergency Contact Number", form.emergencyNumber],
      ["Temporary Password", form.password ? "•••••••• (set)" : "Not provided"],
    ], 1],
    ["Employment", [
      ["Joining Date", form.dateOfJoining], ["Department", form.department], ["Designation", form.designation],
      ["Employee Type", form.employeeType], ["Experience", form.experienceType], ...(form.experienceType === "Experienced" ? [["Total Experience (Years)", form.totalExperienceYears]] : []),
      ["Probation Period", form.trainingPeriod], ["Attendance Mode", form.attendanceMode === "work_from_home" ? "Work From Home" : "Office"],
      ["Reporting Manager", manager ? `${manager.employeeId || ""} ${manager.name}`.trim() : form.reportingManager],
      ["Resignation Date", form.resignationDate], ["Leaving Date", form.leavingDate], ["Qualifications", form.qualifications],
    ], 2],
    ["Bank & Salary", [
      ["Salary", form.salary], ["Salary on Hold", form.salaryOnHold], ["Bond Period Duration", form.bondPeriodDuration],
      ["Bank Holder Name", form.bankHolderName], ["Bank Name", form.bankName], ["Bank Account Number", form.bankAccountNumber],
      ["Bank IFSC Code", form.bankIfscCode], ["Cheque Number", form.chequeNumber], ["Cheque Account Number", form.chequeAccountNumber],
      ["Cheque Amount", form.chequeAmount], ["Cheque Date", form.chequeDate], ["Cheque Bank Name", form.bankName],
    ], 3],
    ["Addresses", [["Permanent Address", form.permanentAddress], ["Alternate / Current Address", form.alternateAddress]], 4],
    ["Documents & Previous Employment", [
      ["Employee Photo", form.photo || "Not uploaded"],
      ...employeeCreateDocumentFields.map(([key, label]) => [label, form.documents?.[key] || "Not uploaded"]),
      ...(form.experienceType === "Experienced" ? [["Previous Employment", form.previousEmployments]] : []),
    ], 5],
    ...employeeChecklistGroups.map((group) => [group.title, group.items.map(([key, label]) => [label, Boolean(form[group.key]?.[key])]), 6]),
  ];

  return <div className="md:col-span-3 space-y-4">
    <p role="note" className="border-l-4 border-[#f84525] bg-[#fff5f1] px-4 py-3 text-sm leading-relaxed text-gray-700 dark:bg-orange-950/30 dark:text-gray-200"><span className="font-semibold text-[#c6381d] dark:text-orange-300">Note:</span> Review each step before adding the employee. Select the edit icon to update that step.</p>
    <p role="note" className="border-l-4 border-[#f84525] bg-[#fff5f1] px-4 py-3 text-sm leading-relaxed text-gray-700 dark:bg-orange-950/30 dark:text-gray-200"><span className="font-semibold text-[#c6381d] dark:text-orange-300">Note:</span> Employee Code / HR File No. will be generated automatically after saving.</p>
    <div className="space-y-8">
      {["Basic details", "Employment", "Bank & salary", "Addresses", "Documents", "Checklists"].map((stepTitle, index) => <section key={stepTitle} className="min-w-0">
        <div className="mb-4 flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Step {index + 1}: {stepTitle}</h3>
          <span aria-hidden="true" className="h-0.5 flex-1 bg-gray-300 dark:bg-gray-600" />
          <button type="button" onClick={() => onEdit(index + 1)} aria-label={`Edit ${stepTitle}`} title={`Edit ${stepTitle}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[#f84525] hover:bg-[#fff1ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f84525]"><TbEdit size={22} aria-hidden="true" /></button>
        </div>
        <div className="space-y-4">
          {sections.filter(([, , step]) => step === index + 1).map(([title, rows]) => <div key={title}>
            {index === 5 && <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h4>}
            {index === 3 ? <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[800px] table-fixed text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"><tr>
                  {["Address Type", "Street", "City", "State", "Country", "Pincode"].map((heading) => <th key={heading} scope="col" className={`px-3 py-2 font-medium ${heading === "Street" ? "w-[30%]" : heading === "Address Type" ? "w-[20%]" : ""}`}>{heading}</th>)}
                </tr></thead>
                <tbody className="text-gray-900 dark:text-gray-100">{rows.map(([label, address]) => <tr key={label} className="border-b border-gray-100 align-top dark:border-gray-800">
                  <th scope="row" className="break-words px-3 py-3 font-medium">{label}</th>
                  {["street", "city", "state", "country", "pincode"].map((field) => <td key={field} className="whitespace-pre-wrap break-words px-3 py-3 [overflow-wrap:anywhere]"><ReviewValue value={address?.[field]} /></td>)}
                </tr>)}</tbody>
              </table>
            </div> : <dl className={`grid gap-3 text-sm ${index === 4 ? "grid-cols-1" : "lg:grid-cols-2"}`}>{rows.map(([label, value]) => label === "Qualifications" ? <div key={label} className="min-w-0 lg:col-span-2">
              <dt className="mb-3 flex items-center gap-2 text-base font-semibold text-[#c6381d] dark:text-orange-300"><span aria-hidden="true" className="h-5 w-1 rounded-full bg-[#f84525]" />Qualifications</dt>
              <dd className="overflow-x-auto">{value?.length ? <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"><tr>{["Qualification", "Course / Specialization", "Institute / University", "Passing Year", "Marksheet"].map((heading) => <th key={heading} scope="col" className="px-3 py-2 font-medium">{heading}</th>)}</tr></thead>
                <tbody className="text-gray-900 dark:text-gray-100">{value.map((item, qualificationIndex) => <tr key={qualificationIndex} className="border-b border-gray-100 align-top dark:border-gray-800">
                  {[item.level, item.course, item.institute, item.passingYear, item.documents?.marksheet?.name].map((cell, cellIndex) => <td key={cellIndex} className="max-w-xs break-words px-3 py-3"><ReviewValue value={cell} /></td>)}
                </tr>)}</tbody>
              </table> : "None"}</dd>
            </div> : <div key={label} className="grid gap-1 break-words sm:grid-cols-2">
              <dt className="font-medium text-gray-600 dark:text-gray-400">{label}</dt>
              <dd className="min-w-0 whitespace-pre-wrap text-gray-900 dark:text-gray-100">{label === "Temporary Password" && form.password ? <div className="flex items-center gap-2">
                <span className="min-w-0 break-all">{showPassword ? form.password : "••••••••"}</span>
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-gray-500 hover:text-[#f84525] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f84525] dark:text-gray-300">{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>
              </div> : label === "Previous Employment" ? <EmploymentReview companies={value} /> : <ReviewValue value={value} />}</dd>
            </div>)}</dl>}
          </div>)}
        </div>
      </section>)}
    </div>
  </div>;
}
