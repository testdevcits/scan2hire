import { useContext, useEffect, useState } from "react";
import { FiCopy, FiEye, FiEyeOff, FiKey, FiMapPin, FiMoon, FiPlus, FiSettings, FiSun, FiUser } from "react-icons/fi";
import { authApi } from "../../api";
import Button from "../../components/common/Button";
import FileUploadField from "../../components/common/FileUploadField";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";

// ---- shared card shell ----------------------------------------------------

const Card = ({ className = "", children }) => (
  <div
    className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ icon, title, subtitle, action }) => (
  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
    <div className="flex items-start gap-3">
      {icon && (
        <span className="w-9 h-9 rounded-xl bg-[#fff5f3] dark:bg-[#2a1712] text-[#f84525] flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
      )}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const inputClass =
  "mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525] disabled:bg-gray-50 dark:disabled:bg-gray-800/60 disabled:text-gray-500";

const ToggleRow = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 text-sm cursor-pointer">
    <span className="text-gray-700 dark:text-gray-300">{label}</span>
    <span className="relative inline-flex flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="w-10 h-6 rounded-full bg-gray-300 dark:bg-gray-700 peer-checked:bg-[#f84525] transition-colors" />
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
    </span>
  </label>
);

const AdminSettings = () => {
  const { mode, toggleMode } = useContext(ThemeContext);
  const toast = useToast();
  const [form, setForm] = useState({
    mailEnabled: true,
    notificationsEnabled: true,
    noticeNotificationsEnabled: true,
    adminApprovalEmail: "",
    employeeVaultPassword: "",
    officeLocation: {
      latitude: "",
      longitude: "",
      radiusMeters: 100,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locatingOffice, setLocatingOffice] = useState(false);
  const [hasVaultPassword, setHasVaultPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    mobile: "",
    photo: null,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [credentialForm, setCredentialForm] = useState({
    accountType: "Email",
    title: "",
    loginId: "",
    password: "",
    notes: "",
  });
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const fileToDataUri = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    Promise.all([authApi.getSettings(), authApi.getProfile(), authApi.getMyAccountCredentials()])
      .then(([settingsRes, profileRes, credentialsRes]) => {
        const data = settingsRes.data.data || {};
        const profile = profileRes.data.data || {};
        setForm((prev) => ({
          ...prev,
          mailEnabled: Boolean(data.mailEnabled),
          notificationsEnabled: Boolean(data.notificationsEnabled),
          noticeNotificationsEnabled: Boolean(data.noticeNotificationsEnabled),
          adminApprovalEmail: data.adminApprovalEmail || "",
          officeLocation: {
            latitude: data.officeLocation?.latitude ?? "",
            longitude: data.officeLocation?.longitude ?? "",
            radiusMeters: data.officeLocation?.radiusMeters ?? 100,
          },
        }));
        setHasVaultPassword(Boolean(data.hasEmployeeVaultPassword));
        setProfileForm({
          name: profile.name || "",
          email: profile.email || "",
          mobile: profile.mobile || "",
          photo: null,
        });
        setCredentials(credentialsRes.data.data || []);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Unable to load settings"))
      .finally(() => setLoading(false));
  }, [toast]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      const profile = res.data.data || {};
      setProfileForm((prev) => ({
        ...prev,
        name: profile.name || prev.name,
        email: profile.email || prev.email,
        mobile: profile.mobile || prev.mobile,
        photo: null,
      }));
      toast.success(res.data.message || "Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const latitude = String(form.officeLocation.latitude || "").trim();
      const longitude = String(form.officeLocation.longitude || "").trim();
      const radiusMeters = String(form.officeLocation.radiusMeters || "").trim();
      const hasOfficeLocationInput = latitude || longitude;

      if (hasOfficeLocationInput && (!latitude || !longitude)) {
        toast.error("Office latitude and longitude are required");
        return;
      }
      if (hasOfficeLocationInput && (!radiusMeters || Number(radiusMeters) < 25)) {
        toast.error("Office radius must be at least 25 meters");
        return;
      }

      const payload = {
        mailEnabled: form.mailEnabled,
        notificationsEnabled: form.notificationsEnabled,
        noticeNotificationsEnabled: form.noticeNotificationsEnabled,
        adminApprovalEmail: form.adminApprovalEmail,
        employeeVaultPassword: form.employeeVaultPassword,
      };

      if (latitude && longitude) {
        payload.officeLocation = {
          latitude,
          longitude,
          radiusMeters,
        };
      }

      const res = await authApi.updateSettings(payload);
      setHasVaultPassword(Boolean(res.data.data?.hasEmployeeVaultPassword));
      setForm((prev) => ({
        ...prev,
        employeeVaultPassword: "",
        officeLocation: {
          latitude: res.data.data?.officeLocation?.latitude ?? prev.officeLocation.latitude,
          longitude: res.data.data?.officeLocation?.longitude ?? prev.officeLocation.longitude,
          radiusMeters: res.data.data?.officeLocation?.radiusMeters ?? prev.officeLocation.radiusMeters,
        },
      }));
      toast.success(res.data.message || "Settings updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update settings");
    } finally {
      setSaving(false);
    }
  };

  const loadCredentials = async () => {
    const res = await authApi.getMyAccountCredentials();
    setCredentials(res.data.data || []);
  };

  const saveCredential = async (e) => {
    e.preventDefault();
    setCredentialSaving(true);
    try {
      await authApi.createMyAccountCredential(credentialForm);
      setCredentialForm({ accountType: "Email", title: "", loginId: "", password: "", notes: "" });
      setShowCredentialForm(false);
      await loadCredentials();
      toast.success("Credential saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save credential");
    } finally {
      setCredentialSaving(false);
    }
  };

  const deleteCredential = async (credentialId) => {
    try {
      await authApi.deleteMyAccountCredential(credentialId);
      await loadCredentials();
      toast.success("Credential deleted");
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

  const updateOfficeLocation = (key, value) => {
    setForm((prev) => ({
      ...prev,
      officeLocation: {
        ...prev.officeLocation,
        [key]: value,
      },
    }));
  };

  const useCurrentOfficeLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Current location is not supported in this browser");
      return;
    }

    setLocatingOffice(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          officeLocation: {
            ...prev.officeLocation,
            latitude: position.coords.latitude.toFixed(7),
            longitude: position.coords.longitude.toFixed(7),
          },
        }));
        toast.success("Current location added");
        setLocatingOffice(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Please allow location access to use current location"
            : "Unable to get current location";
        toast.error(message);
        setLocatingOffice(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Control mails, notifications, approval email and employee vault access.
        </p>
      </div>

      <div className="space-y-5 max-w-3xl">
        <Card>
          <CardHeader icon={<FiUser />} title="Admin Profile" subtitle="Your name, mobile number and photo." />
          <form onSubmit={saveProfile} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mobile
              <input
                type="text"
                value={profileForm.mobile}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                className={inputClass}
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
              Email
              <input type="email" value={profileForm.email} className={inputClass} disabled />
            </label>
            <div className="md:col-span-2">
              <FileUploadField
                label="Profile Image"
                accept=".jpg,.jpeg,.png,.webp"
                hint="Upload JPG, PNG, WEBP"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const dataUri = await fileToDataUri(file);
                  setProfileForm((prev) => ({
                    ...prev,
                    photo: { dataUri, name: file.name, type: file.type },
                  }));
                }}
                fileName={profileForm.photo?.name}
              />
            </div>
            <Button
              text={profileSaving ? "Saving..." : "Save Profile"}
              loading={profileSaving}
              type="submit"
              className="md:col-span-2 justify-self-start"
            />
          </form>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            icon={<FiKey />}
            title="My Saved Credentials"
            subtitle="Save your own admin logins and passwords."
            action={
              <button
                type="button"
                onClick={() => setShowCredentialForm((prev) => !prev)}
                className="w-10 h-10 rounded-xl bg-[#fff5f3] dark:bg-[#2a1712] text-[#f84525] flex items-center justify-center hover:bg-[#ffe7e0] dark:hover:bg-[#3a2018] transition-colors"
                aria-label="Add credential"
              >
                <FiPlus />
              </button>
            }
          />
          {showCredentialForm && (
            <form
              onSubmit={saveCredential}
              className="p-5 border-b border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Type
                <select
                  value={credentialForm.accountType}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, accountType: e.target.value }))}
                  className={inputClass}
                >
                  <option>Email</option>
                  <option>Hosting</option>
                  <option>Social</option>
                  <option>Client Panel</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
                <input
                  value={credentialForm.title}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={inputClass}
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Login / Email
                <input
                  value={credentialForm.loginId}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, loginId: e.target.value }))}
                  className={inputClass}
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
                <input
                  type="password"
                  value={credentialForm.password}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, password: e.target.value }))}
                  className={inputClass}
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Notes
                <textarea
                  value={credentialForm.notes}
                  onChange={(e) => setCredentialForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <Button
                text="Save Credential"
                type="submit"
                loading={credentialSaving}
                className="md:col-span-2 justify-self-start"
              />
            </form>
          )}
          {credentials.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No saved credentials yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {credentials.map((item) => (
                <div key={item._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.accountType}</p>
                    <p className="text-sm break-all mt-1 text-gray-800 dark:text-gray-200">{item.loginId}</p>
                    <p className="text-sm mt-1 tabular-nums text-gray-800 dark:text-gray-200">
                      {revealedPasswords[item._id] ? item.password : "••••••••"}
                    </p>
                    {item.notes ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedPasswords((prev) => ({ ...prev, [item._id]: !prev[item._id] }))
                      }
                      className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {revealedPasswords[item._id] ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyValue(item.loginId, "Login")}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <FiCopy />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyValue(item.password, "Password")}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <FiCopy />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCredential(item._id)}
                      className="border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <form onSubmit={saveSettings} className="space-y-5">
          <Card>
            <CardHeader icon={mode === "light" ? <FiMoon /> : <FiSun />} title="Appearance" />
            <div className="p-5">
              <div className="flex items-center justify-between border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">Current theme: {mode}</p>
                </div>
                <button
                  onClick={toggleMode}
                  type="button"
                  className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Toggle Theme
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<FiSettings />} title="Mail & Notification Controls" />
            <div className="p-5 space-y-3">
              <ToggleRow
                label="Allow mails from system"
                checked={form.mailEnabled}
                onChange={(e) => setForm((prev) => ({ ...prev, mailEnabled: e.target.checked }))}
              />
              <ToggleRow
                label="Allow notification drawer updates"
                checked={form.notificationsEnabled}
                onChange={(e) => setForm((prev) => ({ ...prev, notificationsEnabled: e.target.checked }))}
              />
              <ToggleRow
                label="Create notification on calendar notice/event"
                checked={form.noticeNotificationsEnabled}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, noticeNotificationsEnabled: e.target.checked }))
                }
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-1">
                Admin Approval Email
                <input
                  type="email"
                  value={form.adminApprovalEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, adminApprovalEmail: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={<FiMapPin />}
              title="Office Attendance Location"
              subtitle="Office-mode check-in will match employees within the selected radius."
              action={
                <button
                  type="button"
                  onClick={useCurrentOfficeLocation}
                  disabled={locatingOffice}
                  className="inline-flex items-center justify-center gap-2 border border-[#f84525] text-[#f84525] rounded-lg px-3 py-2 text-sm disabled:opacity-60 hover:bg-[#fff5f3] dark:hover:bg-[#2a1712] transition-colors"
                >
                  <FiMapPin />
                  {locatingOffice ? "Detecting..." : "Use Current Location"}
                </button>
              }
            />
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Latitude
                <input
                  type="number"
                  step="any"
                  value={form.officeLocation.latitude}
                  onChange={(e) => updateOfficeLocation("latitude", e.target.value)}
                  placeholder="22.7196"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Longitude
                <input
                  type="number"
                  step="any"
                  value={form.officeLocation.longitude}
                  onChange={(e) => updateOfficeLocation("longitude", e.target.value)}
                  placeholder="75.8577"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Radius (meters)
                <input
                  type="number"
                  min="25"
                  step="1"
                  value={form.officeLocation.radiusMeters}
                  onChange={(e) => updateOfficeLocation("radiusMeters", e.target.value)}
                  placeholder="300"
                  className={inputClass}
                />
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<FiKey />} title="Employee Credentials Vault" />
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasVaultPassword
                  ? "Vault password already set."
                  : "Set a vault password to open employee credentials pages."}
              </p>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {hasVaultPassword ? "Change Vault Password" : "Set Vault Password"}
                <input
                  type="password"
                  value={form.employeeVaultPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, employeeVaultPassword: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
          </Card>

          <Button text={saving ? "Saving..." : "Save Settings"} loading={saving} type="submit" />
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;