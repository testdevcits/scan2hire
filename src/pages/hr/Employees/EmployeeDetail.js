import { useContext, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiHome,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { authApi, hrApi } from "../../../api";
import Button from "../../../components/common/Button";
import CommonLoader from "../../../components/common/CommonLoader";
import FilePreviewModal from "../../../components/common/FilePreviewModal";
import FileUploadField from "../../../components/common/FileUploadField";
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

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "EM";

const detailFallback = (value) => value || "N/A";

const DetailItem = ({ icon, label, value, className = "" }) => (
  <div className={`min-w-0 rounded-sm border border-gray-100 bg-gray-50 px-3 py-3 ${className}`}>
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {icon}
      <span>{label}</span>
    </div>
    <p className="mt-1 break-words text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
  </div>
);

const EmployeeDetail = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useModal();
  const { user } = useContext(AuthContext);
  const canManage = user?.role === "hr" || user?.role === "superadmin";
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    altMobile: "",
    department: "",
    designation: "",
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
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [accountCredentials, setAccountCredentials] = useState([]);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [departments, setDepartments] = useState([]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const requests = [
        hrApi.getEmployee(employeeId),
        hrApi.getEmployeeMonthlyReport(employeeId, month),
      ];
      if (user?.role === "superadmin") {
        requests.push(hrApi.getEmployeeAccountCredentials(employeeId));
      }
      if (canManage) {
        requests.push(hrApi.getEmployees());
        requests.push(authApi.getDepartments());
      }
      const [employeeRes, reportRes, thirdRes, fourthRes, fifthRes] = await Promise.all(requests);
      const credentialsRes = user?.role === "superadmin" ? thirdRes : null;
      const employeesRes = canManage ? (user?.role === "superadmin" ? fourthRes : thirdRes) : null;
      const departmentsRes = canManage ? (user?.role === "superadmin" ? fifthRes : fourthRes) : null;
      const employeeData = employeeRes.data.data;
      setEmployee(employeeData);
      setEmployeeOptions(employeesRes?.data?.data || []);
      setDepartments(departmentsRes?.data?.data || []);
      setEditForm({
        name: employeeData.name || "",
        mobile: employeeData.mobile || "",
        altMobile: employeeData.altMobile || "",
        department: employeeData.department || "",
        designation: employeeData.designation || "",
        dateOfJoining: employeeData.dateOfJoining ? employeeData.dateOfJoining.slice(0, 10) : "",
        reportingManager: employeeData.reportingManager || "",
        teamLead: employeeData.teamLead?._id || employeeData.teamLead || "",
        employeeType: employeeData.employeeType || "Permanent",
        attendanceMode: employeeData.attendanceMode || "office",
        address: {
          street: employeeData.address?.street || "",
          city: employeeData.address?.city || "",
          state: employeeData.address?.state || "",
          country: employeeData.address?.country || "",
          pincode: employeeData.address?.pincode || "",
        },
      });
      setAttendance(reportRes.data.data?.records || []);
      setSummary(reportRes.data.data?.summary || null);
      setAccountCredentials(credentialsRes?.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load employee");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployee();
    // eslint-disable-next-line
  }, [employeeId, month]);

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
      await loadEmployee();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to deactivate");
    }
  };

  const activateEmployee = async () => {
    try {
      await hrApi.activateEmployee(employeeId);
      toast.success("Employee activated");
      await loadEmployee();
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

  const updateEmployee = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await hrApi.updateEmployee(employeeId, editForm);
      toast.success("Employee updated");
      await loadEmployee();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update employee");
    } finally {
      setSavingProfile(false);
    }
  };

  const fileToDataUri = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhoto = async (file) => {
    if (!file) return;
    const dataUri = await fileToDataUri(file);
    setEditForm((prev) => ({
      ...prev,
      photo: { dataUri, name: file.name, type: file.type },
    }));
  };

  const handleAddressChange = (field, value) => {
    if (field === "pincode" && !/^\d{0,6}$/.test(value)) return;
    setEditForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
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
    ["passbook", "Passbook"],
    ["degree", "Degree"],
    ["resume", "Resume"],
  ];

  const activeBadgeClass = employee.isActive
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className="space-y-5">
      <div className="rounded-sm border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-[#fff1ed] text-xl font-bold text-[#f84525]">
              {getInitials(employee.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold text-gray-900">{employee.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs font-semibold ${activeBadgeClass}`}>
                  {employee.isActive ? <FiCheckCircle /> : <FiUserX />}
                  {employee.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {employee.employeeId || "No employee ID"} / {employee.designation || "No designation"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-sm border border-gray-200 bg-gray-50 px-2 py-1">
                  <FiBriefcase /> {employee.department || "No department"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-gray-200 bg-gray-50 px-2 py-1">
                  <FiCalendar /> Joined {formatDate(employee.dateOfJoining)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-gray-200 bg-gray-50 px-2 py-1">
                  <FiShield /> {employee.employeeType || "Employee"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Report Month
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Single Day
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    if (e.target.value) setMonth(e.target.value.slice(0, 7));
                  }}
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                />
              </label>
            </div>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <Button variant="secondary" onClick={() => navigate(-1)} className="inline-flex items-center gap-2">
                <FiArrowLeft /> Back
              </Button>
              <Button onClick={downloadEmployeeReport} className="inline-flex items-center gap-2">
                <FiDownload /> {reportDate ? "Day Report" : "Monthly PDF"}
              </Button>
              {canManage && (employee.isActive ? (
                <Button variant="danger" onClick={deactivateEmployee} className="inline-flex items-center gap-2">
                  <FiUserX /> Deactivate
                </Button>
              ) : (
                <Button variant="success" onClick={activateEmployee} className="inline-flex items-center gap-2">
                  <FiUserCheck /> Activate
                </Button>
              ))}
              {canManage && (
                <Button variant="danger" onClick={deleteEmployee} className="inline-flex items-center gap-2">
                  <FiTrash2 /> Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 gap-3 p-4 text-sm md:grid-cols-5">
            <DetailItem icon={<FiCalendar />} label="Report Days" value={summary.days} />
            <DetailItem icon={<FiCheckCircle />} label="Present" value={summary.present} />
            <DetailItem icon={<FiCalendar />} label="Half Day" value={summary.halfDay} />
            <DetailItem icon={<FiBriefcase />} label="Work Time" value={minutesToHours(summary.workMinutes)} />
            <DetailItem icon={<FiCalendar />} label="Break Time" value={minutesToHours(summary.breakMinutes)} />
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm xl:col-span-2">
          <SectionHeader title="Employee Details" subtitle="Basic information HR/admin needs before making changes." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailItem icon={<FiMail />} label="Email" value={detailFallback(employee.email)} />
            <DetailItem icon={<FiPhone />} label="Mobile" value={detailFallback(employee.mobile)} />
            <DetailItem icon={<FiBriefcase />} label="Department" value={detailFallback(employee.department)} />
            <DetailItem icon={<FiUser />} label="Designation" value={detailFallback(employee.designation)} />
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

        <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <SectionHeader title="Documents" subtitle="Uploaded files and verification material." />
          <div className="space-y-2">
            {documentItems.map(([key, label]) => {
              const hasDocument = Boolean(employee.documents?.[key]?.url);
              return (
                <div key={key} className="flex items-center justify-between gap-3 rounded-sm border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-gray-800">
                    <FiFileText className={hasDocument ? "text-[#f84525]" : "text-gray-400"} />
                    {label}
                  </span>
                  {hasDocument ? (
                    <button
                      type="button"
                      onClick={() => setPreview({ title: label, url: employee.documents[key].url })}
                      className="shrink-0 rounded-sm border border-[#ffd0c7] bg-white px-3 py-1 text-xs font-semibold text-[#f84525] hover:bg-[#fff1ed]"
                    >
                      View
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-sm bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">Missing</span>
                  )}
                </div>
              );
            })}
          </div>
          {employee.documents?.salarySlips?.length > 0 && (
            <div className="mt-4 text-sm">
              <p className="font-semibold text-gray-800">Salary Slips</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {employee.documents.salarySlips.map((slip, index) => (
                  <button
                    key={slip.public_id || index}
                    type="button"
                    onClick={() => setPreview({ title: `salary slip ${index + 1}`, url: slip.url })}
                    className="rounded-sm border border-[#ffd0c7] bg-[#fff8f6] px-3 py-1 text-xs font-semibold text-[#f84525]"
                  >
                    View Slip {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {canManage && (
      <form onSubmit={updateEmployee} className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
          <SectionHeader title="Update Employee" subtitle="Edit identity, work assignment, attendance mode, photo and address." />
          <Button text={savingProfile ? "Saving..." : "Save Changes"} loading={savingProfile} type="submit" className="md:min-w-40" />
        </div>

        <div className="grid grid-cols-1 gap-5 pt-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Personal & Work</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[
          ["name", "Full Name", "text"],
          ["mobile", "Mobile", "text"],
          ["altMobile", "Alt Mobile", "text"],
          ["designation", "Designation", "text"],
          ["dateOfJoining", "Joining Date", "date"],
        ].map(([name, label, type]) => (
          <label key={name} className="text-sm font-medium text-gray-700">
            {label}
            <input
              type={type}
              value={editForm[name]}
              onChange={(e) => setEditForm((prev) => ({ ...prev, [name]: name.includes("Mobile") || name === "mobile" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value }))}
              className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
              required={["name", "mobile"].includes(name)}
            />
          </label>
        ))}
        <label className="text-sm font-medium text-gray-700">
          Department
          <select
            value={editForm.department}
            onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
          >
            <option value="">Select Department</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Reporting Manager
          <select
            value={editForm.teamLead}
            onChange={(e) => {
              const selectedTeamLead = teamLeadOptions.find((item) => item._id === e.target.value);
              setEditForm((prev) => ({
                ...prev,
                teamLead: e.target.value,
                reportingManager: selectedTeamLead
                  ? selectedTeamLead.employeeId || selectedTeamLead.name
                  : "",
              }));
            }}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
          >
            <option value="">No Reporting Manager</option>
            {teamLeadOptions.map((teamLead) => (
              <option key={teamLead._id} value={teamLead._id}>
                {teamLead.employeeId || "-"} - {teamLead.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Employee Type
          <select
            value={editForm.employeeType}
            onChange={(e) => setEditForm((prev) => ({ ...prev, employeeType: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
          >
            <option>Permanent</option>
            <option>Contract</option>
            <option>Intern</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Attendance Mode
          <select
            value={editForm.attendanceMode}
            onChange={(e) => setEditForm((prev) => ({ ...prev, attendanceMode: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
          >
            <option value="office">Office</option>
            <option value="work_from_home">Work From Home</option>
          </select>
        </label>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Profile Photo</h3>
            <FileUploadField
              label="Update Photo"
              accept=".jpg,.jpeg,.png,.webp"
              hint="Upload JPG, PNG, WEBP"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
              fileName={editForm.photo?.name}
            />
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Address</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {[
            ["street", "Address"],
            ["city", "City"],
            ["state", "State"],
            ["country", "Country"],
            ["pincode", "Pincode"],
          ].map(([field, label]) => (
            <label key={field} className="text-sm font-medium text-gray-700">
              {label}
              <input
                type="text"
                value={editForm.address[field]}
                onChange={(e) => handleAddressChange(field, e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
              />
            </label>
          ))}
          </div>
        </div>
      </form>
      )}

      {user?.role === "superadmin" && (
        <section className="bg-white rounded-sm shadow overflow-hidden">
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

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Document Update History</h2>
        </div>
        {employee.documentHistory?.length ? (
          employee.documentHistory
            .slice()
            .reverse()
            .map((item, index) => (
              <div key={`${item.updatedAt}-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t px-4 py-3 text-sm">
                <span>{new Date(item.updatedAt).toLocaleString()}</span>
                <span>{item.documents?.join(", ") || "Documents"}</span>
                <span>{item.verifiedByEmail || "HR verified"}</span>
              </div>
            ))
        ) : (
          <p className="p-4 text-sm text-gray-500">No document update history.</p>
        )}
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
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
          <p className="p-4 text-sm text-gray-500">No attendance found.</p>
        ) : (
          filteredAttendance.map((item) => (
            <div key={item._id} className="grid grid-cols-1 md:grid-cols-5 gap-2 border-t px-4 py-3 text-sm">
              <span>{item.dateKey}</span>
              <span>{item.status}</span>
              <span>Work: {minutesToHours(item.totalWorkMinutes)}</span>
              <span>Break: {minutesToHours(item.totalBreakMinutes)}</span>
              <span>{item.logoutAt ? new Date(item.logoutAt).toLocaleTimeString() : "Running"}</span>
            </div>
          ))
        )}
      </section>

      {preview && (
        <FilePreviewModal
          title={preview.title.replace(/([A-Z])/g, " $1")}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

export default EmployeeDetail;
