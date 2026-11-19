import { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { authApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import InputField from "../../components/common/InputField";
import CustomDropdown from "../../components/common/CustomDropdown";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const emptyForm = {
  name: "",
  description: "",
  isActive: true,
};

const MasterOptionsSection = ({ type, title, description }) => {
  const toast = useToast(); const { confirm } = useModal(); const [items, setItems] = useState([]); const [name, setName] = useState(""); const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const res = await authApi.getMasterOptions(type, { includeInactive: true }); setItems(res.data.data || []); } catch (e) { toast.error(e.response?.data?.message || `Unable to load ${title}`); } finally { setLoading(false); } };
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
  const save = async (event) => { event.preventDefault(); if (!name.trim()) return; setSaving(true); try { if (editing) await authApi.updateMasterOption(type, editing._id, { name }); else await authApi.createMasterOption(type, { name }); toast.success(`${title} ${editing ? "updated" : "added"}`); setName(""); setEditing(null); await load(); } catch (e) { toast.error(e.response?.data?.message || `Unable to save ${title}`); } finally { setSaving(false); } };
  const remove = async (item) => { if (!(await confirm({ title: `Delete ${title}`, message: `Delete ${item.name}?`, confirmText: "Delete", tone: "danger" }))) return; try { await authApi.deleteMasterOption(type, item._id); await load(); toast.success(`${title} deleted`); } catch (e) { toast.error(e.response?.data?.message || "Unable to delete option"); } };
  return <section className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-end md:justify-between"><div><h2 className="font-semibold">{title}</h2><p className="text-xs text-gray-500">{description}</p></div><form onSubmit={save} className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Add ${title}`} className="rounded-sm border px-3 py-2 text-sm" required /><Button type="submit" loading={saving}>{editing ? "Save" : "Add"}</Button>{editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setName(""); }}>Cancel</Button>}</form></div>{loading ? <CommonLoader text={`Loading ${title}...`} /> : items.map((item) => <div key={item._id} className="flex items-center justify-between border-t px-4 py-3 text-sm"><span>{item.name}</span><span className="flex gap-2"><button type="button" onClick={() => { setEditing(item); setName(item.name); }} className="border px-2 py-1 text-xs">Edit</button><button type="button" onClick={() => remove(item)} className="border px-2 py-1 text-xs text-red-600">Delete</button></span></div>)}</section>;
};

const Departments = () => {
  const toast = useToast();
  const { confirm } = useModal();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(false);
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
    setShowForm(true);
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
    <div className="space-y-5 p-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Departments</h1>
          <p className="text-sm text-gray-500">Manage department master data used in employee forms.</p>
        </div>
        <div className="flex items-center gap-2"><Button variant="secondary" onClick={loadDepartments}><span className="inline-flex items-center gap-2"><FiRefreshCw /> Refresh</span></Button><Button onClick={() => { resetForm(); setShowForm(true); }}><span className="inline-flex items-center gap-2"><FiPlus /> Add Department</span></Button></div>
      </div>

      {showForm && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/35 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) resetForm(); }}>
        <form onSubmit={saveDepartment} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md space-y-4 rounded-lg border-2 border-gray-300 bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
            <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Update Department" : "Add Department"}</h2>
            <button type="button" aria-label="Close" onClick={resetForm} className="rounded px-2 py-1 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700">×</button>
          </div>
          <InputField label="Department Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          <InputField label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <CustomDropdown label="Status" value={form.isActive ? "active" : "inactive"} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value === "active" }))} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} showPlaceholder={false} />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button text="Cancel" variant="secondary" onClick={resetForm} />
            <Button type="submit" loading={saving}><span className="inline-flex items-center gap-2"><FiPlus /> {editingId ? "Save Department" : "Add Department"}</span></Button>
          </div>
        </form>
      </div>}

      <section className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
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
      <div className="grid gap-5 lg:grid-cols-2"><MasterOptionsSection type="bloodGroup" title="Blood Groups" description="Blood group master values used in employee forms." /><MasterOptionsSection type="employeeType" title="Employee Types" description="Employee type master values used in employee forms." /></div>
    </div>
  );
};

export default Departments;
