import { FiPlus, FiTrash2 } from "react-icons/fi";
import InputField from "./InputField";
import CalendarPicker from "./CalendarPicker";
import FileUploadField from "./FileUploadField";
import { employmentDocumentFields, lastCompanyDocumentFields, newEmployment } from "../../utils/employmentFields";

export default function EmploymentHistory({ form, setForm, documents = false, onFiles, className = "md:col-span-3" }) {
  if (form.experienceType !== "Experienced") return null;
  const companies = form.previousEmployments || [];
  const update = (index, key, value) => setForm((current) => ({ ...current, previousEmployments: current.previousEmployments.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  return <div className={`space-y-4 ${className}`}>
    <div className="flex items-center gap-3"><h3 className="font-semibold">{documents ? "Previous Company Documents" : "Previous Companies"}</h3>
      {!documents && <button type="button" title="Add company" aria-label="Add company" className="flex h-9 w-9 items-center justify-center text-[#f84525] hover:bg-orange-50" onClick={() => setForm((current) => ({ ...current, previousEmployments: [...current.previousEmployments, newEmployment(!current.previousEmployments.length)] }))}><FiPlus size={22} /></button>}
    </div>
    <p className="text-xs text-gray-500">Last company: Offer Letter, Experience Letter, Relieving Letter, last 3 months Bank Statement (one PDF) and Salary Slips (one combined PDF). Earlier companies: Offer Letter and Experience Letter.</p>
    {!companies.length && <p className="text-sm text-gray-500">Add previous companies in the Employment step.</p>}
    {companies.map((company, index) => <section key={company.id || index} className="space-y-3 border-b border-gray-200 py-3 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-semibold">{company.companyName || `Company ${index + 1}`} {company.isLastCompany && <span className="ml-2 text-xs text-[#f84525]">Last company</span>}</h4>
        <div className="flex items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="radio" name="last-company" checked={Boolean(company.isLastCompany)} onChange={() => setForm((current) => ({ ...current, previousEmployments: current.previousEmployments.map((item, itemIndex) => ({ ...item, isLastCompany: itemIndex === index })) }))} />Last company</label>
          {!documents && <button type="button" aria-label={`Remove company ${index + 1}`} className="p-2 text-red-600" onClick={() => setForm((current) => { const remaining = current.previousEmployments.filter((_, itemIndex) => itemIndex !== index); return { ...current, previousEmployments: remaining }; })}><FiTrash2 /></button>}</div>
      </div>
      {documents ? <div className="grid gap-3 md:grid-cols-2">
        {(company.isLastCompany ? lastCompanyDocumentFields : employmentDocumentFields).map(([key, label]) => <FileUploadField key={key} label={`${label} *`} name={`${company.id}-${key}`} accept={key === "salarySlips" || key === "bankStatement" ? ".pdf" : ".pdf,.jpg,.jpeg,.png,.webp"} hint={key === "salarySlips" || key === "bankStatement" ? "Required. Last 3 months in one PDF, up to 5 MB." : "Required. JPG, PNG, WEBP or PDF, up to 5 MB."} fileName={key === "salarySlips" ? company.documents?.[key]?.map((file) => file.name).join(", ") : company.documents?.[key]?.name} onChange={(event) => onFiles(company.id, key, event.target.files)} />)}
      </div> : <div className="grid gap-3 md:grid-cols-2">
        <InputField label="Company Name" value={company.companyName} onChange={(event) => update(index, "companyName", event.target.value)} required />
        <InputField label="Designation" value={company.designation} onChange={(event) => update(index, "designation", event.target.value)} required />
        <CalendarPicker label="Joining Date" value={company.joiningDate} onChange={(value) => update(index, "joiningDate", value)} />
        <CalendarPicker label="Leaving Date" value={company.leavingDate} onChange={(value) => update(index, "leavingDate", value)} />
      </div>}
    </section>)}
  </div>;
}
