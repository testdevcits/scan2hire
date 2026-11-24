import DetailItem from "./DetailItem";
import EmployeeChecklist from "./EmployeeChecklist";
const valueOrEmpty = (value) => value === undefined || value === null || value === "" ? "Not provided" : value;
const dateLabel = (value) => value ? new Date(value).toLocaleDateString() : "Not provided";
const Panel = ({ title, children }) => <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"><h3 className="mb-4 border-b border-gray-100 pb-3 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">{title}</h3>{children}</section>;
export default function EmployeeBackgroundDetails({ employee }) {
  return <>
    <Panel title="Experience & Previous Companies">
      <div className="grid gap-x-6 md:grid-cols-2">
        <DetailItem plain label="Experience Type" value={valueOrEmpty(employee.experienceType)} />
        <DetailItem plain label="Total Experience (Years)" value={valueOrEmpty(employee.totalExperienceYears)} />
      </div>
      {employee.experienceType === "Experienced" ? (employee.previousEmployments || []).length ? <div className="mt-4 space-y-4">{employee.previousEmployments.map((company, index) => <div key={company.id || index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold">{valueOrEmpty(company.companyName)}</h4>{company.isLastCompany && <span className="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-700">Last company</span>}</div>
        <div className="grid gap-x-6 md:grid-cols-2"><DetailItem plain label="Designation" value={valueOrEmpty(company.designation)} /><DetailItem plain label="Joining Date" value={dateLabel(company.joiningDate)} /><DetailItem plain label="Leaving Date" value={dateLabel(company.leavingDate)} /></div>
      </div>)}</div> : <p className="mt-4 text-sm text-gray-500">No previous companies recorded.</p> : null}
    </Panel>
    <Panel title="Qualifications">
      {(employee.qualifications || []).length ? <div className="space-y-4">{employee.qualifications.map((item, index) => <div key={item.id || index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"><h4 className="text-sm font-semibold">{valueOrEmpty(item.level)}</h4><div className="grid gap-x-6 md:grid-cols-2">
        <DetailItem plain label="Course / Specialization" value={valueOrEmpty(item.course)} />
        <DetailItem plain label="Institute / University" value={valueOrEmpty(item.institute)} />
        <DetailItem plain label="Passing Year" value={valueOrEmpty(item.passingYear)} />
        <DetailItem plain label="Percentage / Grade" value={valueOrEmpty(item.percentage)} />
      </div></div>)}</div> : <p className="text-sm text-gray-500">No qualifications recorded.</p>}
    </Panel>
  </>;
}
export function EmployeeChecklistDetails({ employee }) {
  return <Panel title="Checklists"><EmployeeChecklist value={employee} disabled /></Panel>;
}
