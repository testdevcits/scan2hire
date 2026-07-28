import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployee } from "../../contexts/Hr/EmployeeContext";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import FileUploadField from "../../components/common/FileUploadField";
import { useToast } from "../../contexts/ToastContext";
import { AuthContext } from "../../contexts/AuthContext";
import { authApi } from "../../api";

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  department: "",
  designation: "",
  dateOfJoining: "",
  reportingManager: "",
  employeeType: "Permanent",
  address: {
    street: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  },
  photo: null,
};

const ManageEmployees = () => {
  const { employees, loading, error, fetchEmployees, createEmployee } =
    useEmployee();
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canManage = user?.role === "hr";
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [hrUsers, setHrUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchEmployees();
    if (["hr", "superadmin"].includes(user?.role)) {
      authApi
        .getHrs()
        .then((res) => setHrUsers(res.data.data || []))
        .catch(() => setHrUsers([]));
    }
    if (["hr", "superadmin"].includes(user?.role)) {
      authApi
        .getDepartments()
        .then((res) => setDepartments(res.data.data || []))
        .catch(() => setDepartments([]));
    }
    // eslint-disable-next-line
  }, [user?.role]);

  const hrRows = hrUsers.map((hr) => ({
    ...hr,
    employeeId: "HR",
    department: "HR",
    designation: "HR",
    isHrAccount: true,
  }));
  const hrEmails = new Set(hrUsers.map((hr) => String(hr.email || "").toLowerCase()));
  const nonHrEmployees = employees.filter(
    (employee) => !hrEmails.has(String(employee.email || "").toLowerCase())
  );
  const displayEmployees = ["hr", "superadmin"].includes(user?.role)
    ? [...hrRows, ...nonHrEmployees]
    : employees;
  const departmentOptions = [
    ...new Set(departments.map((department) => String(department.name || "").trim()).filter(Boolean)),
  ].sort();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile" && !/^\d{0,10}$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    if (name === "pincode" && !/^\d{0,6}$/.test(value)) return;
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
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
    setForm((prev) => ({
      ...prev,
      photo: { dataUri, name: file.name, type: file.type },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createEmployee(form);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("Employee added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to add employee");
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (value) => value || "N/A";
  const isTeamLead = (user?.effectiveRole || user?.role) === "teamlead";
  const openEmployee = (employee) => {
    if (employee.isHrAccount) {
      if (user?.role === "hr") return;
      navigate("/admin/hrs");
      return;
    }
    navigate(
      user?.role === "superadmin"
        ? `/admin/employees/${employee._id}`
        : `/hr/employees/${employee._id}`
    );
  };

  if (loading) return <CommonLoader text="Fetching employees..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{isTeamLead ? "Your Team" : "Manage Employees"}</h1>
          <p className="text-sm text-gray-500">
            {isTeamLead
              ? "View employees assigned to your team."
              : "Add employees, create login access, and review documents."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-sm border border-[#ffd8cf] bg-white p-1">
            {[
              ["list", "List View"],
              ["card", "Card View"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-sm text-sm transition-colors ${
                  viewMode === mode
                    ? "bg-[#f84525] text-white"
                    : "text-gray-600 hover:text-[#f84525]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-sm bg-[#fff5f3] text-[#f84525] px-3 py-2 rounded-sm">
            {isTeamLead ? "Team Members" : "Total Employees"}: {employees.length}
          </span>
          {["hr", "superadmin"].includes(user?.role) && (
            <span className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-sm">
              Including HR: {displayEmployees.length}
            </span>
          )}
          {canManage && <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="bg-[#f84525] text-white px-4 py-2 rounded-sm text-sm"
          >
            {showForm ? "Close Form" : "Add Employee"}
          </button>}
        </div>
      </div>

      {canManage && showForm && (
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {[
          ["name", "Full Name"],
          ["email", "Email"],
          ["mobile", "Mobile"],
          ["password", "Temporary Password"],
          ["designation", "Designation"],
          ["dateOfJoining", "Joining Date"],
          ["reportingManager", "Reporting Manager"],
        ].map(([name, label]) => (
          <label key={name} className="text-sm font-medium text-gray-700">
            {label}
            <input
              type={
                name === "password"
                  ? "password"
                  : name === "dateOfJoining"
                  ? "date"
                  : name === "email"
                  ? "email"
                  : "text"
              }
              name={name}
              value={form[name]}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
              required={["name", "email", "mobile", "password"].includes(name)}
            />
          </label>
        ))}

        <label className="text-sm font-medium text-gray-700">
          Department
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
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
          Employee Type
          <select
            name="employeeType"
            value={form.employeeType}
            onChange={handleChange}
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
          >
            <option>Permanent</option>
            <option>Contract</option>
            <option>Intern</option>
          </select>
        </label>

        <FileUploadField
          label="Employee Photo"
          accept=".jpg,.jpeg,.png,.webp"
          hint="Upload JPG, PNG, WEBP"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
          fileName={form.photo?.name}
        />

        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-5 gap-3 border-t pt-3">
          {[
            ["street", "Address"],
            ["city", "City"],
            ["state", "State"],
            ["country", "Country"],
            ["pincode", "Pincode"],
          ].map(([name, label]) => (
            <label key={name} className="text-sm font-medium text-gray-700">
              {label}
              <input
                type="text"
                name={name}
                value={form.address[name]}
                onChange={handleAddressChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="md:col-span-3 bg-primary hover:bg-primary/80 text-white font-medium py-3 px-4 rounded-sm transition-all"
        >
          {saving ? "Adding..." : "Add Employee"}
        </button>
      </form>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {viewMode === "list" ? (
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="hidden md:grid grid-cols-7 bg-gray-100 text-xs uppercase text-gray-600 font-semibold">
            {["ID", "Name", "Email", "Mobile", "Department", "Designation", "Action"].map(
              (item) => (
                <div key={item} className="px-4 py-3">
                  {item}
                </div>
              )
            )}
          </div>

          {displayEmployees.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No employees found</p>
          ) : (
            displayEmployees.map((employee) => (
              <div
                key={employee._id}
                className="grid grid-cols-1 md:grid-cols-7 gap-2 border-t px-4 py-3 text-sm md:items-center"
              >
                <span className="font-medium">{employee.employeeId}</span>
                <span>{employee.name}</span>
                <span className="break-all">{employee.email}</span>
                <span>{employee.mobile}</span>
                <span>{formatValue(employee.department)}</span>
                <span>{formatValue(employee.designation)}</span>
                <Button text="View" className="text-xs" onClick={() => openEmployee(employee)} />
              </div>
            ))
          )}
        </div>
      ) : displayEmployees.length === 0 ? (
        <div className="bg-white rounded-sm shadow p-8 text-center text-gray-500">
          No employees found
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {displayEmployees.map((employee) => (
            <button
              key={employee._id}
              type="button"
              onClick={() => openEmployee(employee)}
              className="bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow text-left overflow-hidden border border-[#f7a08f] group"
            >
              <div className="relative aspect-[4/3.4] bg-gradient-to-br from-[#2d2a33] via-[#3e3440] to-[#18171d] overflow-hidden">
                {employee.documents?.photo?.url ? (
                  <img
                    src={employee.documents.photo.url}
                    alt={employee.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="w-20 h-20 rounded-full border border-white/40 bg-white/10 flex items-center justify-center text-3xl font-semibold">
                      {employee.name?.[0] || "E"}
                    </div>
                  </div>
                )}
                <div className="absolute inset-1 rounded-sm border border-[#f84525] pointer-events-none" />
              </div>
              <div className="p-2 text-center border-t border-[#f7a08f]">
                <p className="font-semibold text-[13px] text-gray-900 truncate">{employee.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {employee.designation || employee.department || employee.employeeId}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

export default ManageEmployees;
