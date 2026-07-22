import { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { authApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const emptyForm = {
  name: "",
  description: "",
  isActive: true,
};

const Departments = () => {
  const toast = useToast();
  const { confirm } = useModal();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await authApi.getDepartments({ includeInactive: true });
      setDepartments(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const saveDepartment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await authApi.updateDepartment(editingId, form);
        toast.success("Department updated");
      } else {
        await authApi.createDepartment(form);
        toast.success("Department added");
      }
      resetForm();
      await loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save department");
    } finally {
      setSaving(false);
    }
  };

  const editDepartment = (department) => {
    setEditingId(department._id);
    setForm({
      name: department.name || "",
      description: department.description || "",
      isActive: department.isActive !== false,
    });
  };

  const toggleDepartment = async (department) => {
    try {
      await authApi.updateDepartment(department._id, { isActive: !department.isActive });
      toast.success(department.isActive ? "Department disabled" : "Department enabled");
      await loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update department");
    }
  };

  const deleteDepartment = async (department) => {
    const ok = await confirm({
      title: "Delete Department",
      message: `Delete ${department.name}? Existing employee records will keep their saved department text.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await authApi.deleteDepartment(department._id);
      toast.success("Department deleted");
      if (editingId === department._id) resetForm();
      await loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete department");
    }
  };

  if (loading) return <CommonLoader text="Loading departments..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Departments</h1>
          <p className="text-sm text-gray-500">Manage department master data used in employee forms.</p>
        </div>
        <Button variant="secondary" onClick={loadDepartments}>
          <span className="inline-flex items-center gap-2">
            <FiRefreshCw /> Refresh
          </span>
        </Button>
      </div>

      <form onSubmit={saveDepartment} className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <h2 className="font-semibold md:col-span-4">{editingId ? "Update Department" : "Add Department"}</h2>
        <label className="text-sm font-medium text-gray-700">
          Department Name
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
            required
          />
        </label>
        <label className="text-sm font-medium text-gray-700 md:col-span-2">
          Description
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Status
          <select
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value === "active" }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="md:col-span-4 flex flex-col sm:flex-row gap-2">
          <Button type="submit" loading={saving}>
            <span className="inline-flex items-center gap-2">
              <FiPlus /> {editingId ? "Save Department" : "Add Department"}
            </span>
          </Button>
          {editingId && <Button text="Cancel" variant="secondary" onClick={resetForm} />}
        </div>
      </form>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="hidden md:grid grid-cols-5 bg-gray-100 text-xs uppercase text-gray-600 font-semibold">
          {["Department", "Description", "Status", "Updated", "Action"].map((item) => (
            <div key={item} className="px-4 py-3">{item}</div>
          ))}
        </div>
        {departments.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500">No departments added yet.</p>
        ) : (
          departments.map((department) => (
            <div key={department._id} className="grid grid-cols-1 md:grid-cols-5 gap-2 border-t px-4 py-3 text-sm md:items-center">
              <span className="font-medium text-gray-900">{department.name}</span>
              <span className="text-gray-600">{department.description || "-"}</span>
              <span>
                <button
                  type="button"
                  onClick={() => toggleDepartment(department)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-medium ${
                    department.isActive
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                >
                  {department.isActive ? "Active" : "Inactive"}
                </button>
              </span>
              <span className="text-gray-500">
                {department.updatedAt ? new Date(department.updatedAt).toLocaleDateString() : "-"}
              </span>
              <span className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => editDepartment(department)}
                  className="inline-flex items-center gap-1 border rounded-sm px-2.5 py-1.5 text-xs text-gray-700 hover:text-[#f84525]"
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteDepartment(department)}
                  className="inline-flex items-center gap-1 border rounded-sm px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 /> Delete
                </button>
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default Departments;
