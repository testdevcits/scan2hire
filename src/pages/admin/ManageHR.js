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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadHrs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.getHrs();
      setHrs(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load HR users");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadHrs();
  }, [loadHrs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile" && !/^\d{0,10}$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const createHr = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.createHr({ ...form, role: "hr" });
      setForm(emptyForm);
      setShowForm(false);
      toast.success("HR account created");
      await loadHrs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to add HR");
    } finally {
      setSaving(false);
    }
  };

  const toggleHr = async (hr) => {
    const action = hr.isActive ? "deactivate" : "activate";
    if (hr.isActive) {
      const ok = await confirm({
        title: "Deactivate HR",
        message: `${hr.name} will not be able to login.`,
        confirmText: "Deactivate",
        tone: "danger",
      });
      if (!ok) return;
    }
    try {
      if (hr.isActive) await authApi.deactivateUser(hr._id);
      else await authApi.activateUser(hr._id);
      toast.success(`HR ${action}d`);
      await loadHrs();
    } catch (err) {
      toast.error(err.response?.data?.message || `Unable to ${action} HR`);
    }
  };

  const deleteHr = async (hr) => {
    const ok = await confirm({
      title: "Delete HR",
      message: `${hr.name} will be permanently deleted.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await authApi.deleteUser(hr._id);
      toast.success("HR deleted");
      await loadHrs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete HR");
    }
  };

  if (loading) return <CommonLoader text="Loading HR accounts..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage HR</h1>
            <p className="text-sm text-gray-500 mt-1">Create, activate, deactivate, and delete HR accounts.</p>
          </div>
          <Button
            text={showForm ? "Close Form" : "Add New HR"}
            variant={showForm ? "secondary" : "primary"}
            onClick={() => setShowForm((prev) => !prev)}
          />
        </div>
      </section>

      {showForm && (
      <section className="bg-white rounded-sm shadow p-4">
        <h2 className="font-semibold mb-3">Create HR Login</h2>
        <form onSubmit={createHr} className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                required
              />
            </label>
          ))}
          <Button text="Create HR" type="submit" loading={saving} className="md:col-span-4" />
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
