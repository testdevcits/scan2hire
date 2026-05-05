import { useCallback, useEffect, useState } from "react";
import { FiCopy, FiEye, FiEyeOff, FiPlus } from "react-icons/fi";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const emptyForm = {
  accountType: "Email",
  title: "",
  loginId: "",
  password: "",
  notes: "",
};

const EmployeeSavedCredentials = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [showForm, setShowForm] = useState(false);

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeApi.getMyAccountCredentials();
      setCredentials(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load credentials");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const saveCredential = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await employeeApi.createMyAccountCredential(form);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("Credential saved");
      await loadCredentials();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save credential");
    } finally {
      setSaving(false);
    }
  };

  const deleteCredential = async (credentialId) => {
    try {
      await employeeApi.deleteMyAccountCredential(credentialId);
      toast.success("Credential deleted");
      await loadCredentials();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete credential");
    }
  };

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Unable to copy");
    }
  };

  if (loading) return <CommonLoader text="Loading credentials..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Saved Account Credentials</h1>
            <p className="text-sm text-gray-500 mt-1">Save multiple account logins for your own work and copy them when needed.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="w-11 h-11 rounded-sm bg-[#fff5f3] text-[#f84525] flex items-center justify-center"
            aria-label={showForm ? "Close credential form" : "Open credential form"}
          >
            <FiPlus />
          </button>
        </div>
      </section>

      {showForm && (
      <form onSubmit={saveCredential} className="bg-white rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm font-medium text-gray-700">
          Account Type
          <select
            value={form.accountType}
            onChange={(e) => setForm((prev) => ({ ...prev, accountType: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
          >
            <option>Email</option>
            <option>Hosting</option>
            <option>Social</option>
            <option>Client Panel</option>
            <option>Other</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Title
          <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Login / Email
          <input value={form.loginId} onChange={(e) => setForm((prev) => ({ ...prev, loginId: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Password
          <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-gray-700 md:col-span-2">
          Notes
          <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 min-h-[96px]" />
        </label>
        <Button text="Save Credential" type="submit" loading={saving} className="md:col-span-2 justify-self-start" />
      </form>
      )}

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Your Saved Credentials</h2>
        </div>
        {credentials.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No saved credentials yet.</p>
        ) : (
          credentials.map((item) => (
            <div key={item._id} className="border-t px-4 py-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.accountType}</p>
                <p className="text-sm break-all mt-1">{item.loginId}</p>
                <p className="text-sm mt-1">{revealedPasswords[item._id] ? item.password : "••••••••"}</p>
                {item.notes ? <p className="text-xs text-gray-500 mt-1">{item.notes}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setRevealedPasswords((prev) => ({ ...prev, [item._id]: !prev[item._id] }))} className="border rounded-sm px-3 py-2 text-sm">
                  {revealedPasswords[item._id] ? <FiEyeOff /> : <FiEye />}
                </button>
                <button type="button" onClick={() => copyValue(item.loginId, "Login")} className="border rounded-sm px-3 py-2 text-sm">
                  <FiCopy />
                </button>
                <button type="button" onClick={() => copyValue(item.password, "Password")} className="border rounded-sm px-3 py-2 text-sm">
                  <FiCopy />
                </button>
                <button type="button" onClick={() => deleteCredential(item._id)} className="border rounded-sm px-3 py-2 text-sm text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default EmployeeSavedCredentials;
