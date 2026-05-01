import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployee } from "../../contexts/Hr/EmployeeContext";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";
import { AuthContext } from "../../contexts/AuthContext";

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
};

const ManageEmployees = () => {
  const { employees, loading, error, fetchEmployees, createEmployee } =
    useEmployee();
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile" && !/^\d{0,10}$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createEmployee(form);
      setForm(emptyForm);
      toast.success("Employee added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to add employee");
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (value) => value || "N/A";
  if (loading) return <CommonLoader text="Fetching employees..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Manage Employees</h1>
          <p className="text-sm text-gray-500">
            Add employees, create login access, and review documents.
          </p>
        </div>
        <span className="text-sm bg-[#fff5f3] text-[#f84525] px-3 py-2 rounded-md">
          Total Employees: {employees.length}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {[
          ["name", "Full Name"],
          ["email", "Email"],
          ["mobile", "Mobile"],
          ["password", "Temporary Password"],
          ["department", "Department"],
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

        <button
          type="submit"
          disabled={saving}
          className="md:col-span-3 bg-primary hover:bg-primary/80 text-white font-medium py-3 px-4 rounded-md transition-all"
        >
          {saving ? "Adding..." : "Add Employee"}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="hidden md:grid grid-cols-7 bg-gray-100 text-xs uppercase text-gray-600 font-semibold">
          {["ID", "Name", "Email", "Mobile", "Department", "Designation", "Action"].map(
            (item) => (
              <div key={item} className="px-4 py-3">
                {item}
              </div>
            )
          )}
        </div>

        {employees.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No employees found</p>
        ) : (
          employees.map((employee) => (
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
              <button
                onClick={() =>
                  navigate(
                    user?.role === "superadmin"
                      ? `/admin/employees/${employee._id}`
                      : `/hr/employees/${employee._id}`
                  )
                }
                className="bg-[#f84525] text-white rounded-md px-3 py-2 text-xs"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default ManageEmployees;
