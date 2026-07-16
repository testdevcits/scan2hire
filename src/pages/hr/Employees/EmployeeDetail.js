import { useContext, useEffect, useMemo, useState } from "react";
import { FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { hrApi } from "../../../api";
import Button from "../../../components/common/Button";
import CommonLoader from "../../../components/common/CommonLoader";
import FilePreviewModal from "../../../components/common/FilePreviewModal";
import FileUploadField from "../../../components/common/FileUploadField";
import { AuthContext } from "../../../contexts/AuthContext";
import { useModal } from "../../../contexts/ModalContext";
import { useToast } from "../../../contexts/ToastContext";

const minutesToHours = (minutes = 0) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const EmployeeDetail = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useModal();
  const { user } = useContext(AuthContext);
  const canManage = user?.role === "hr";
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
      const [employeeRes, reportRes, credentialsRes] = await Promise.all(requests);
      const employeeData = employeeRes.data.data;
      setEmployee(employeeData);
      setEditForm({
        name: employeeData.name || "",
        mobile: employeeData.mobile || "",
        altMobile: employeeData.altMobile || "",
        department: employeeData.department || "",
        designation: employeeData.designation || "",
        dateOfJoining: employeeData.dateOfJoining ? employeeData.dateOfJoining.slice(0, 10) : "",
        reportingManager: employeeData.reportingManager || "",
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{employee.name}</h1>
          <p className="text-sm text-gray-500">
            {employee.employeeId} • {employee.designation || "No designation"} • {employee.isActive ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded-sm px-3 py-2"
          />
          <input
            type="date"
            value={reportDate}
            onChange={(e) => {
              setReportDate(e.target.value);
              if (e.target.value) setMonth(e.target.value.slice(0, 7));
            }}
            className="border rounded-sm px-3 py-2"
          />
          <Button text="Back" variant="secondary" onClick={() => navigate(-1)} />
          <Button text={reportDate ? "Download Day Report" : "Download PDF"} onClick={downloadEmployeeReport} />
          {canManage && (employee.isActive ? (
            <Button text="Deactivate" variant="danger" onClick={deactivateEmployee} />
          ) : (
            <Button text="Activate" variant="success" onClick={activateEmployee} />
          ))}
          {canManage && (
            <Button text="Delete" variant="danger" onClick={deleteEmployee} />
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-sm shadow p-4 lg:col-span-2">
          <h2 className="font-semibold mb-3">Employee Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><b>Email:</b> {employee.email}</p>
            <p><b>Mobile:</b> {employee.mobile}</p>
            <p><b>Department:</b> {employee.department || "N/A"}</p>
            <p><b>Designation:</b> {employee.designation || "N/A"}</p>
            <p><b>Joining:</b> {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : "N/A"}</p>
            <p><b>Reporting Manager:</b> {employee.reportingManager || "N/A"}</p>
            <p><b>Type:</b> {employee.employeeType || "N/A"}</p>
            <p><b>Attendance Mode:</b> {employee.attendanceMode === "work_from_home" ? "Work From Home" : "Office"}</p>
            <p><b>Created By:</b> {employee.createdBy?.name || "N/A"}</p>
            <p className="md:col-span-2">
              <b>Address:</b>{" "}
              {[
                employee.address?.street,
                employee.address?.city,
                employee.address?.state,
                employee.address?.country,
                employee.address?.pincode,
              ].filter(Boolean).join(", ") || "N/A"}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow p-4">
          <h2 className="font-semibold mb-3">Documents</h2>
          {["photo", "aadhaarCard", "panCard", "passbook", "degree", "resume"].map((key) => (
            <p key={key} className="text-sm capitalize mb-2">
              <b>{key.replace(/([A-Z])/g, " $1")}:</b>{" "}
              {employee.documents?.[key]?.url ? (
                <button type="button" onClick={() => setPreview({ title: key, url: employee.documents[key].url })} className="text-[#f84525] underline">
                  View
                </button>
              ) : (
                "N/A"
              )}
            </p>
          ))}
          {employee.documents?.salarySlips?.length > 0 && (
            <div className="text-sm">
              <b>Salary Slips:</b>
              <div className="mt-2 flex flex-wrap gap-2">
                {employee.documents.salarySlips.map((slip, index) => (
                  <button
                    key={slip.public_id || index}
                    type="button"
                    onClick={() => setPreview({ title: `salary slip ${index + 1}`, url: slip.url })}
                    className="text-[#f84525] underline"
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
      <form onSubmit={updateEmployee} className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <h2 className="font-semibold md:col-span-4">Update Employee</h2>
        {[
          ["name", "Full Name", "text"],
          ["mobile", "Mobile", "text"],
          ["altMobile", "Alt Mobile", "text"],
          ["department", "Department", "text"],
          ["designation", "Designation", "text"],
          ["dateOfJoining", "Joining Date", "date"],
          ["reportingManager", "Reporting Manager", "text"],
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
        <FileUploadField
          label="Update Photo"
          accept=".jpg,.jpeg,.png,.webp"
          hint="Upload JPG, PNG, WEBP"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
          fileName={editForm.photo?.name}
        />
        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-5 gap-3 border-t pt-3">
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
        <Button text={savingProfile ? "Saving..." : "Save Employee"} loading={savingProfile} type="submit" className="md:col-span-4" />
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
