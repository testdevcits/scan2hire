import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { hrApi } from "../../../api";
import Button from "../../../components/common/Button";
import CommonLoader from "../../../components/common/CommonLoader";
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
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const [employeeRes, reportRes] = await Promise.all([
        hrApi.getEmployee(employeeId),
        hrApi.getEmployeeMonthlyReport(employeeId, month),
      ]);
      setEmployee(employeeRes.data.data);
      setAttendance(reportRes.data.data?.records || []);
      setSummary(reportRes.data.data?.summary || null);
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

  const downloadEmployeeReport = () => {
    const rows = attendance
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
          <p>${employee.employeeId || ""} | ${employee.designation || ""} | ${month}</p>
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
        <div className="flex gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded-sm px-3 py-2"
          />
          <Button text="Back" variant="secondary" onClick={() => navigate(-1)} />
          <Button text="Download PDF" onClick={downloadEmployeeReport} />
          {employee.isActive ? (
            <Button text="Deactivate" variant="danger" onClick={deactivateEmployee} />
          ) : (
            <Button text="Activate" variant="success" onClick={activateEmployee} />
          )}
          {user?.role === "superadmin" && (
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
            <p><b>Type:</b> {employee.employeeType || "N/A"}</p>
            <p><b>Created By:</b> {employee.createdBy?.name || "N/A"}</p>
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
        </div>
      </section>

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
        {attendance.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No attendance found.</p>
        ) : (
          attendance.map((item) => (
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold capitalize">{preview.title.replace(/([A-Z])/g, " $1")}</h2>
              <button onClick={() => setPreview(null)} className="text-gray-500">x</button>
            </div>
            <iframe title={preview.title} src={preview.url} className="w-full h-[70vh]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;
