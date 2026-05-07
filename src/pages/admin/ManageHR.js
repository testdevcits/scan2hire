import { useCallback, useEffect, useState } from "react";
import { authApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const emptyForm = { name: "", email: "", mobile: "", password: "" };

const ManageHR = () => {
  const toast = useToast();
  const { confirm } = useModal();
  const [hrs, setHrs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const roleLabel = "HR";

  const loadHrs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.getHrs();
      setHrs(res.data.data || []);
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
        : `Are you sure you want to create this ${roleLabel} account?`,
      confirmText: editingId ? "Update" : "Create",
    });
    if (!ok) return;
    setSaving(true);
    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await authApi.updateUser(editingId, payload);
      } else {
        await authApi.createHr({ ...form, role: "hr" });
      }
      setForm(emptyForm);
      setEditingId("");
      setShowForm(false);
      toast.success(`${roleLabel} account ${editingId ? "updated" : "created"}`);
      await loadHrs();
    } catch (err) {
      toast.error(err.response?.data?.message || `Unable to save ${roleLabel}`);
    } finally {
      setSaving(false);
    }
  };

  const editHr = async (hr) => {
    const ok = await confirm({
      title: `Edit ${roleLabel}`,
      message: `Are you sure you want to edit ${hr.name}?`,
      confirmText: "Edit",
    });
    if (!ok) return;
    setEditingId(hr._id);
    setForm({ name: hr.name || "", email: hr.email || "", mobile: hr.mobile || "", password: "" });
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

  const deleteHr = async (hr) => {
    const ok = await confirm({
      title: `Delete ${roleLabel}`,
      message: `${hr.name} will be permanently deleted.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await authApi.deleteUser(hr._id);
      toast.success(`${roleLabel} deleted`);
      await loadHrs();
    } catch (err) {
      toast.error(err.response?.data?.message || `Unable to delete ${roleLabel}`);
    }
  };

  if (loading) return <CommonLoader text={`Loading ${roleLabel} accounts...`} />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage {roleLabel}</h1>
            <p className="text-sm text-gray-500 mt-1">Create, view, update, activate, deactivate, and delete {roleLabel} accounts.</p>
          </div>
          <Button
            text={showForm ? "Close Form" : `Add New ${roleLabel}`}
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
        <h2 className="font-semibold mb-3">{editingId ? "Update" : "Create"} {roleLabel} Login</h2>
        <form onSubmit={saveHr} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            ["name", "Full Name"],
            ["email", "Email"],
            ["mobile", "Mobile"],
            ["password", "Temporary Password"],
          ].map(([name, label]) => (
            <label key={name} className="text-sm font-medium text-gray-700">
              {label}
              <input
                type={name === "password" ? "password" : name === "email" ? "email" : "text"}
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                required={name !== "password" || !editingId}
              />
            </label>
          ))}
          <Button text={editingId ? `Update ${roleLabel}` : `Create ${roleLabel}`} type="submit" loading={saving} className="md:col-span-4" />
        </form>
      </section>
      )}

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 px-4 py-3 text-xs uppercase font-semibold text-gray-600">
          <span>Name</span><span>Email</span><span>Mobile</span><span>Status</span><span>Actions</span>
        </div>
        {hrs.map((hr) => (
          <div key={hr._id} className="grid grid-cols-1 md:grid-cols-5 gap-2 border-t px-4 py-3 text-sm md:items-center">
            <span className="font-medium">{hr.name}</span>
            <span className="break-all">{hr.email}</span>
            <span>{hr.mobile}</span>
            <span className={hr.isActive ? "text-green-600 font-semibold" : "text-gray-500 font-semibold"}>
              {hr.isActive ? "Active" : "Inactive"}
            </span>
            <span className="flex gap-2 flex-wrap">
              <button onClick={() => editHr(hr)} className="px-3 py-1.5 rounded-sm text-xs text-white bg-blue-600">
                Edit
              </button>
              <button onClick={() => toggleHr(hr)} className={`px-3 py-1.5 rounded-sm text-xs text-white ${hr.isActive ? "bg-gray-900" : "bg-green-600"}`}>
                {hr.isActive ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => deleteHr(hr)} className="px-3 py-1.5 rounded-sm text-xs text-white bg-red-600">
                Delete
              </button>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ManageHR;
