import EmployeeBackgroundDetails from './EmployeeBackgroundDetails';
const date = value => value ? new Date(value).toLocaleDateString() : '';
const address = value => value ? ['street', 'city', 'state', 'country', 'pincode'].map(key => value[key]).filter(Boolean).join(', ') : '';
export default function SubmittedProfileDetails({ employee: e, canView }) {
  const groups = [
    ['Basic Details', true, [['Employee ID', e.employeeId], ['Name', e.name], ['Email', e.email], ['Mobile', e.mobile], ['Department', e.department], ['Designation', e.designation]]],
    ['Personal Details', canView('profilePersonal'), [['Father / Husband Name', e.fatherOrHusbandName], ['Gender', e.gender], ['Date of Birth', date(e.dob)], ['Celebration Date', date(e.celebrateDob)], ['Alternate Mobile', e.altMobile], ['Emergency Contact', e.emergencyNumber], ['Blood Group', e.bloodGroup], ['Current Address', address(e.address)], ['Permanent Address', address(e.permanentAddress)], ['Alternate Address', address(e.alternateAddress)]]],
    ['Work Details', canView('profileWork'), [['Joining Date', date(e.dateOfJoining)], ['Reporting Manager', e.teamLead?.name || e.reportingManager], ['Employment Type', e.employeeType], ['Training Period', e.trainingPeriod], ['Bond Duration', e.bondPeriodDuration], ['Attendance Mode', e.attendanceMode], ['Work Role', e.workRole]]],
    ['Salary Details', canView('profileSalary'), [['Salary', e.salary], ['Salary on Hold', e.salaryOnHold === undefined ? '' : e.salaryOnHold ? 'Yes' : 'No']]],
    ['Bank Details', canView('profileBank'), [['Account Holder', e.bankHolderName], ['Bank Name', e.bankName], ['IFSC Code', e.bankIfscCode], ['Account Number', e.bankAccountNumber], ['Cheque Number', e.chequeNumber], ['Cheque Account Number', e.chequeAccountNumber], ['Cheque Amount', e.chequeAmount], ['Cheque Date', date(e.chequeDate)], ['Cheque Bank', e.chequeBankName]]],
  ];
  return <>{groups.filter(([, show]) => show).map(([title, , rows]) => <section key={title} className="rounded-lg border bg-white"><h2 className="border-b px-5 py-4 text-lg font-semibold">{title}</h2><dl className="grid gap-5 p-5 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt><dd className="mt-1 break-words text-sm text-gray-900">{value === undefined || value === null || value === '' ? 'Not provided' : String(value)}</dd></div>)}</dl></section>)}{canView('profilePersonal') && <EmployeeBackgroundDetails employee={e} />}</>;
}
