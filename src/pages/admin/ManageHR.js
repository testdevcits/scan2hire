import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import EmployeeModuleAccess from "./EmployeeModuleAccess";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const emptyForm = { name: "", email: "", mobile: "", password: "", employeeId: "" };
const moduleActions = ["view", "add", "edit", "delete"];
const moduleOptions = [["employees", "Employees", "View and manage employee records"], ["leaveCalendar", "Leave Calendar", "View and manage company calendar"], ["candidates", "Candidates", "Manage candidate pipeline"], ["checkins", "Today Check-ins", "View daily employee check-ins"], ["attendanceReports", "Attendance Reports", "View attendance reports"], ["leaveReports", "Leave Reports", "Review leave and holiday reports"], ["documents", "Documents & Signatures", "Send and verify employee documents"], ["credentials", "Credentials", "Access employee credential records"], ["rolesAccess", "Roles & Access", "Manage team access"], ["systemAllotments", "System Allotments", "Manage system assignments"]];

const ManageHR = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { confirm } = useModal();
  const [hrs, setHrs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [accessTarget, setAccessTarget] = useState(null);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [moduleDraft, setModuleDraft] = useState({});
  const [savingAccess, setSavingAccess] = useState(false);
  const [activeTab, setActiveTab] = useState("hr");
  const roleLabel = "HR";

  const hrEmployeeIds = useMemo(
    () => new Set(hrs.map((hr) => String(hr.employeeProfile?._id || hr.employeeProfile || "")).filter(Boolean)),
    [hrs]
  );
  const hrEmails = useMemo(
    () => new Set(hrs.map((hr) => String(hr.email || "").trim().toLowerCase()).filter(Boolean)),
    [hrs]
  );
  const availableEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const employeeUserRole = employee.user?.role;
        const email = String(employee.email || "").trim().toLowerCase();
        return employeeUserRole !== "hr" && !hrEmployeeIds.has(String(employee._id)) && !hrEmails.has(email);
      }),
    [employees, hrEmployeeIds, hrEmails]
  );

  const loadHrs = useCallback(async () => {
    setLoading(true);
    try {
      const [hrRes, employeeRes] = await Promise.all([
        authApi.getHrs(),
        hrApi.getEmployees(),
      ]);
      setHrs(hrRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || `Unable to load ${roleLabel} users`);
    } finally {
      setLoading(false);
    }
  }, [roleLabel, toast]);

  useEffect(() => {
    setForm(emptyForm);
    setEditingId("");
    setShowForm(false);
    loadHrs();
  }, [loadHrs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile" && !/^\d{0,10}$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveHr = async (e) => {
    e.preventDefault();
    const ok = await confirm({
      title: editingId ? `Update ${roleLabel}` : `Create ${roleLabel}`,
      message: editingId
        ? `Are you sure you want to update this ${roleLabel} account?`
        : `Are you sure you want to give HR access to this employee?`,
      confirmText: editingId ? "Update" : "Give Access",
    });
    if (!ok) return;
    setSaving(true);
    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await authApi.updateUser(editingId, payload);
      } else {
        await authApi.assignEmployeeAsHr({
          employeeId: form.employeeId,
          password: form.password || undefined,
        });
      }
      setForm(emptyForm);
      setEditingId("");
      setShowForm(false);
      toast.success(`${roleLabel} access ${editingId ? "updated" : "assigned"}`);
      await loadHrs();
    } catch (err) {
      toast.error(err.response?.data?.message || `Unable to save ${roleLabel}`);
    } finally {
      setSaving(false);
    }
  };

  const getEmployeeProfileId = (hr) => hr.employeeProfile?._id || hr.employeeProfile || employees.find((employee) => String(employee.name || "").trim().toLowerCase() === String(hr.name || "").trim().toLowerCase() || String(employee.email || "").toLowerCase() === String(hr.email || "").toLowerCase())?._id;

  const editHr = async (hr) => {
    const ok = await confirm({
      title: `Edit ${roleLabel}`,
      message: `Are you sure you want to edit ${hr.name}?`,
      confirmText: "Edit",
    });
    if (!ok) return;
    setEditingId(hr._id);
    setForm({ name: hr.name || "", email: hr.email || "", mobile: hr.mobile || "", password: "", employeeId: hr.employeeProfile?._id || "" });
    setShowForm(true);
  };

  const toggleHr = async (hr) => {
    const action = hr.isActive ? "deactivate" : "activate";
    const ok = await confirm({
      title: `${hr.isActive ? "Deactivate" : "Activate"} ${roleLabel}`,
      message: hr.isActive
        ? `${hr.name} will not be able to login. Are you sure?`
        : `${hr.name} will be able to login again. Are you sure?`,
      confirmText: hr.isActive ? "Deactivate" : "Activate",
      tone: hr.isActive ? "danger" : "primary",
    });
    if (!ok) return;
    try {
      if (hr.isActive) await authApi.deactivateUser(hr._id);
      else await authApi.activateUser(hr._id);
      toast.success(`${roleLabel} ${action}d`);
      await loadHrs();
    } catch (err) {
      toast.error(err.response?.data?.message || `Unable to ${action} ${roleLabel}`);
    }
  };

  const openAccess = (hr) => {
    setAccessTarget(hr);
    setModuleDraft(Object.fromEntries(moduleOptions.map(([key]) => {
      const value = hr.moduleAccess?.[key];
      return [key, typeof value === 'object' ? value : { view: value !== false, edit: value !== false }];
    })));
  };
  const saveAccess = async () => {
    setSavingAccess(true);
    try { await authApi.updateHrModuleAccess(accessTarget._id, moduleDraft); toast.success('HR module access updated'); closeDrawer(); await loadHrs(); }
    catch (err) { toast.error(err.response?.data?.message || 'Unable to update module access'); }
    finally { setSavingAccess(false); }
  };
  const closeDrawer = () => { setDrawerClosing(true); window.setTimeout(() => { setDrawerClosing(false); setAccessTarget(null); }, 220); };

  const removeHrAccess = async (hr) => {
    const ok = await confirm({
      title: `Remove ${roleLabel} Access`,
      message: `${hr.name} will become a normal employee login again. Employee profile will stay saved.`,
      confirmText: "Remove Access",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await authApi.removeHrAccess(hr._id);
      toast.success(`${roleLabel} access removed`);
      await loadHrs();
    } catch (err) {
      toast.error(err.response?.data?.message || `Unable to remove ${roleLabel} access`);
    }
  };

  if (loading) return <CommonLoader text={`Loading ${roleLabel} accounts...`} />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role &amp; Access</h1>
            <p className="text-sm text-gray-500 mt-1">Assign roles and manage module access for HR, employees and team leads.</p>
          </div>
          <Button
            text={showForm ? "Close" : `Assign Employee as ${roleLabel}`}
            variant={showForm ? "secondary" : "primary"}
            onClick={() => {
              setShowForm((prev) => !prev);
              setEditingId("");
              setForm(emptyForm);
            }}
          />
        </div>
      </section>

      {showForm && (
      <section className="bg-white rounded-sm shadow p-4">
        <div className="mb-3">
          <h2 className="font-semibold text-gray-900">{editingId ? "Update HR Login" : "Assign HR Access"}</h2>
          <p className="text-xs text-gray-500 mt-1">
            Choose from employee records. Password is needed only when that employee does not already have login credentials.
          </p>
        </div>
        <form onSubmit={saveHr} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {!editingId ? (
            <>
              <label className="text-sm font-medium text-gray-700 md:col-span-3">
                Select Employee
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                >
                  <option value="">Select employee</option>
                  {availableEmployees
                    .map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.employeeId || "EMP"} - {employee.name} ({employee.email})
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Temp Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                  placeholder="Only if no login"
                />
              </label>
            </>
          ) : (
            <>
              {[
                ["name", "Full Name"],
                ["email", "Email"],
                ["mobile", "Mobile"],
                ["password", "New Password"],
              ].map(([name, label]) => (
                <label key={name} className="text-sm font-medium text-gray-700">
                  {label}
                  <input
                    type={name === "password" ? "password" : name === "email" ? "email" : "text"}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                    required={name !== "password"}
                  />
                </label>
              ))}
            </>
          )}
          {!editingId && availableEmployees.length === 0 && (
            <p className="md:col-span-4 text-sm text-gray-500">All eligible employees already have HR access.</p>
          )}
          <Button text={editingId ? `Update ${roleLabel}` : `Give ${roleLabel} Access`} type="submit" loading={saving} className="md:col-span-4" />
        </form>
      </section>
      )}

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 pt-4">
          <button type="button" onClick={() => setActiveTab("hr")} className={`px-3 pb-3 text-sm font-semibold ${activeTab === "hr" ? "border-b-2 border-[#f84525] text-[#f84525]" : "text-gray-500"}`}>HR Role &amp; Access</button>
          <button type="button" onClick={() => setActiveTab("employee")} className={`px-3 pb-3 text-sm font-semibold ${activeTab === "employee" ? "border-b-2 border-[#f84525] text-[#f84525]" : "text-gray-500"}`}>Employee Role &amp; Access</button>
          <button type="button" onClick={() => setActiveTab("teamlead")} className={`px-3 pb-3 text-sm font-semibold ${activeTab === "teamlead" ? "border-b-2 border-[#f84525] text-[#f84525]" : "text-gray-500"}`}>Team Lead Role &amp; Access</button>
        </div>
        {activeTab === "employee" ? <div className="p-4"><EmployeeModuleAccess embedded /></div> : null}
        {activeTab === "teamlead" ? <div className="p-4"><EmployeeModuleAccess role="teamlead" title="Team Lead Role & Access" embedded /></div> : null}
        {activeTab === "hr" ? <>
        <div className="border-b bg-gray-50 px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900">HR Role &amp; Access</h2>
          <p className="mt-1 text-xs text-gray-500 md:text-sm">Choose “Manage Role Access” to decide which modules each HR user can see.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Employee</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Mobile</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hrs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No employees have HR access yet.</td>
                </tr>
              ) : (
                hrs.map((hr) => (
                  <tr key={hr._id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{hr.employeeProfile?.name || hr.name}</p>
                      <p className="text-xs text-gray-500">{hr.employeeProfile?.employeeId || "Employee"}</p>
                    </td>
                    <td className="px-4 py-3 break-all">{hr.employeeProfile?.email || hr.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{hr.employeeProfile?.mobile || hr.mobile || "-"}</td>
                    <td className="px-4 py-3">
                      <p>{hr.employeeProfile?.department || "-"}</p>
                      <p className="text-xs text-gray-500">{hr.employeeProfile?.designation || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={hr.isActive ? "text-green-600 font-semibold" : "text-gray-500 font-semibold"}>
                        {hr.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex gap-2 flex-wrap">
                        <button type="button" onClick={() => getEmployeeProfileId(hr) ? navigate(`/admin/employees/${getEmployeeProfileId(hr)}`) : toast.error("Employee profile not found")} className="px-3 py-1.5 rounded-sm text-xs text-white bg-blue-600">
                          Edit Employee
                        </button>
                        <button type="button" onClick={() => editHr(hr)} className="px-3 py-1.5 rounded-sm text-xs text-white bg-indigo-600">
                          Edit Login
                        </button>
                        <button type="button" onClick={() => openAccess(hr)} className="px-3 py-1.5 rounded-sm text-xs font-semibold text-white bg-purple-600">Manage Role Access</button>
                        <button type="button" onClick={() => toggleHr(hr)} className={`px-3 py-1.5 rounded-sm text-xs text-white ${hr.isActive ? "bg-gray-900" : "bg-green-600"}`}>
                          {hr.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button type="button" onClick={() => removeHrAccess(hr)} className="px-3 py-1.5 rounded-sm text-xs text-white bg-red-600">
                          Remove Access
                        </button>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </> : null}
      </section>
      {accessTarget && <div className={`fixed inset-0 z-50 bg-black/20 ${drawerClosing ? "animate-fade-out" : ""}`} onClick={() => { if (!savingAccess) closeDrawer(); }}><aside className={`${drawerClosing ? "animate-slide-out-right" : "animate-slide-in-right"} absolute right-0 top-0 flex h-screen max-h-screen w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl`} onClick={(event) => event.stopPropagation()}><div className="border-b px-6 py-5"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">Manage Role Access</h2><p className="mt-1 text-sm text-gray-500">Select modules for {accessTarget.name}.</p></div><button type="button" onClick={closeDrawer} className="text-xl text-gray-500">×</button></div></div><div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 rounded-sm border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900"><p className="font-semibold">HR role permissions</p><p className="mt-1 text-xs">Checked modules will appear in this HR user’s panel. Unchecked modules will be hidden.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">{moduleOptions.map(([key, label, description]) => <div key={key} className="rounded-sm border border-gray-200 p-3 dark:border-gray-700"><span className="block text-sm font-semibold text-gray-900 dark:text-white">{label}</span><span className="mt-1 block text-xs text-gray-500">{description}</span><div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">{moduleActions.map((action) => <label key={action} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(moduleDraft[key]?.[action])} onChange={(event) => setModuleDraft((current) => ({ ...current, [key]: { ...current[key], [action]: event.target.checked, ...(action !== "view" && event.target.checked ? { view: true } : {}) } }))} className="accent-[#f84525]" /> {action[0].toUpperCase() + action.slice(1)}</label>)}</div></div>)}</div>
      </div><div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4"><Button text="Cancel" variant="secondary" disabled={savingAccess} onClick={closeDrawer} /><Button text="Save HR Permissions" loading={savingAccess} onClick={saveAccess} /></div></aside></div>}
    </div>
  );
};

export default ManageHR;
