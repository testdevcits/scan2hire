import { useContext, useEffect, useState } from "react";
import { authApi } from "../../api";
import Button from "../../components/common/Button";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";

const AdminSettings = () => {
  const { mode, toggleMode } = useContext(ThemeContext);
  const toast = useToast();
  const [form, setForm] = useState({
    mailEnabled: true,
    notificationsEnabled: true,
    noticeNotificationsEnabled: true,
    adminApprovalEmail: "",
    employeeVaultPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasVaultPassword, setHasVaultPassword] = useState(false);

  useEffect(() => {
    authApi
      .getSettings()
      .then((res) => {
        const data = res.data.data || {};
        setForm((prev) => ({
          ...prev,
          mailEnabled: Boolean(data.mailEnabled),
          notificationsEnabled: Boolean(data.notificationsEnabled),
          noticeNotificationsEnabled: Boolean(data.noticeNotificationsEnabled),
          adminApprovalEmail: data.adminApprovalEmail || "",
        }));
        setHasVaultPassword(Boolean(data.hasEmployeeVaultPassword));
      })
      .catch((err) => toast.error(err.response?.data?.message || "Unable to load settings"))
      .finally(() => setLoading(false));
  }, [toast]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateSettings(form);
      setHasVaultPassword(Boolean(res.data.data?.hasEmployeeVaultPassword));
      setForm((prev) => ({ ...prev, employeeVaultPassword: "" }));
      toast.success(res.data.message || "Settings updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">Control mails, notifications, approval email and employee vault access.</p>
      </div>

      <form onSubmit={saveSettings} className="space-y-4 max-w-3xl">
        <section className="bg-white rounded-sm shadow p-4">
          <h2 className="font-semibold mb-3">Appearance</h2>
          <div className="flex items-center justify-between border rounded-sm p-3">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-gray-500">Current theme: {mode}</p>
            </div>
            <button onClick={toggleMode} type="button" className="bg-black text-white rounded-sm px-4 py-2 text-sm">
              Toggle Theme
            </button>
          </div>
        </section>

        <section className="bg-white rounded-sm shadow p-4 space-y-3">
          <h2 className="font-semibold">Mail & Notification Controls</h2>
          {[
            ["mailEnabled", "Allow mails from system"],
            ["notificationsEnabled", "Allow notification drawer updates"],
            ["noticeNotificationsEnabled", "Create notification on calendar notice/event"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between border rounded-sm p-3 text-sm">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
            </label>
          ))}
          <label className="block text-sm font-medium">
            Admin Approval Email
            <input
              type="email"
              value={form.adminApprovalEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, adminApprovalEmail: e.target.value }))}
              className="mt-1 w-full border rounded-sm px-3 py-2"
            />
          </label>
        </section>

        <section className="bg-white rounded-sm shadow p-4 space-y-3">
          <h2 className="font-semibold">Employee Credentials Vault</h2>
          <p className="text-sm text-gray-500">
            {hasVaultPassword ? "Vault password already set." : "Set a vault password to open employee credentials pages."}
          </p>
          <label className="block text-sm font-medium">
            {hasVaultPassword ? "Change Vault Password" : "Set Vault Password"}
            <input
              type="password"
              value={form.employeeVaultPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, employeeVaultPassword: e.target.value }))}
              className="mt-1 w-full border rounded-sm px-3 py-2"
            />
          </label>
        </section>

        <Button text={saving ? "Saving..." : "Save Settings"} loading={saving} type="submit" />
      </form>
    </div>
  );
};

export default AdminSettings;
