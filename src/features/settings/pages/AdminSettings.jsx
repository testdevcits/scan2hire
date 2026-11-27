import DefaultEmployeePasswordSettings from "../components/DefaultEmployeePasswordSettings";
/* eslint-disable */
import { useApi } from "../../../contexts/ApiContext";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LeaveSettings from "../../leave/pages/LeaveSettings";
import {
  FiCopy,
  FiEye,
  FiEyeOff,
  FiKey,
  FiMapPin,
  FiMoon,
  FiPlus,
  FiSettings,
  FiSun,
  FiUser,
} from "react-icons/fi";

import Button from "../../../components/ui/Button";
import FileUploadField from "../../../components/ui/FormField/FileUploadField";
import CommonLoader from "../../../components/ui/CommonLoader";
import { ThemeContext } from "../../../contexts/ThemeContext";
import { useToast } from "../../../contexts/ToastContext";

// ---- shared card shell ----------------------------------------------------

const Card = ({ className = "", children }) => (
  <div
    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ icon, title, subtitle, action }) => (
  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
    <div className="flex items-start gap-3">
      {icon && (
        <span className="w-9 h-9 rounded-xl bg-[#fff5f3] dark:bg-[#2a1712] text-[#f84525] flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
      )}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const inputClass =
  "mt-1.5 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f84525]/40 focus:border-[#f84525] disabled:bg-gray-50 dark:disabled:bg-gray-800/60 disabled:text-gray-500";

const ToggleRow = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 text-sm cursor-pointer">
    <span className="text-gray-700 dark:text-gray-300">{label}</span>
    <span className="relative inline-flex flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="w-10 h-6 rounded-full bg-gray-300 dark:bg-gray-700 peer-checked:bg-[#f84525] transition-colors" />
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
    </span>
  </label>
);

const GeneralSettings = () => {
  const { authApi } = useApi();
  const { mode, toggleMode } = useContext(ThemeContext);
  const toast = useToast();
  const [form, setForm] = useState({
    mailEnabled: true,
    notificationsEnabled: true,
    noticeNotificationsEnabled: true,
    autoApplyScheduledSalaryIncrements: false,
    adminApprovalEmail: "",
    employeeVaultPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          autoApplyScheduledSalaryIncrements: Boolean(data.autoApplyScheduledSalaryIncrements),
          adminApprovalEmail: data.adminApprovalEmail || "",
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
      const payload = {
        mailEnabled: form.mailEnabled,
        notificationsEnabled: form.notificationsEnabled,
        noticeNotificationsEnabled: form.noticeNotificationsEnabled,
        autoApplyScheduledSalaryIncrements: form.autoApplyScheduledSalaryIncrements,
        adminApprovalEmail: form.adminApprovalEmail,
        employeeVaultPassword: form.employeeVaultPassword,
      };

      const res = await authApi.updateSettings(payload);
      setHasVaultPassword(Boolean(res.data.data?.hasEmployeeVaultPassword));
      setForm((prev) => ({
        ...prev,
        employeeVaultPassword: "",
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

  if (loading) {
    return <CommonLoader text="Loading settings..." />;
  }

  return (
    <div className="admin-settings-page space-y-6 rounded-2xl bg-[#f0f0f0] p-4 dark:bg-gray-950 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Control mails, notifications, approval email and employee vault access.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              icon={<FiUser />}
              title="Admin Profile"
              subtitle="Your name, mobile number and photo."
            />
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
                variant="secondary"
                className="md:col-span-2 justify-self-start !rounded-xl !border !border-gray-300 !bg-white !text-gray-900"
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
                    onChange={(e) =>
                      setCredentialForm((prev) => ({ ...prev, accountType: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setCredentialForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className={inputClass}
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Login / Email
                  <input
                    value={credentialForm.loginId}
                    onChange={(e) =>
                      setCredentialForm((prev) => ({ ...prev, loginId: e.target.value }))
                    }
                    className={inputClass}
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                  <input
                    type="password"
                    value={credentialForm.password}
                    onChange={(e) =>
                      setCredentialForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className={inputClass}
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                  Notes
                  <textarea
                    value={credentialForm.notes}
                    onChange={(e) =>
                      setCredentialForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
                <Button
                  text="Save Credential"
                  type="submit"
                  loading={credentialSaving}
                  variant="secondary"
                  className="md:col-span-2 justify-self-start !rounded-xl !border !border-gray-300 !bg-white !text-gray-900"
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
                  <div
                    key={item._id}
                    className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.accountType}</p>
                      <p className="text-sm break-all mt-1 text-gray-800 dark:text-gray-200">
                        {item.loginId}
                      </p>
                      <p className="text-sm mt-1 tabular-nums text-gray-800 dark:text-gray-200">
                        {revealedPasswords[item._id] ? item.password : "••••••••"}
                      </p>
                      {item.notes ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.notes}
                        </p>
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

          <Card>
            <CardHeader icon={mode === "light" ? <FiMoon /> : <FiSun />} title="Appearance" />
            <div className="p-5">
              <div className="flex items-center justify-between border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    Current theme: {mode}
                  </p>
                </div>
                <button
                  onClick={toggleMode}
                  type="button"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  Toggle Theme
                </button>
              </div>
            </div>
          </Card>
        </div>
        <DefaultEmployeePasswordSettings />
        <form id="admin-settings-form" onSubmit={saveSettings} className="min-w-0 space-y-5">
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notificationsEnabled: e.target.checked }))
                }
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, adminApprovalEmail: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={<FiSettings />}
              title="Salary Review Automation"
              subtitle="Choose how scheduled salary increments are applied."
            />
            <div className="space-y-3 p-5">
              <ToggleRow
                label="Automatically apply scheduled salary increments"
                checked={form.autoApplyScheduledSalaryIncrements}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    autoApplyScheduledSalaryIncrements: e.target.checked,
                  }))
                }
              />
              <p className="pl-4 text-xs text-gray-500 dark:text-gray-400">
                When enabled, due increments update the employee’s current salary automatically.
                When disabled, HR must select Mark Done.
              </p>
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, employeeVaultPassword: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
            </div>
          </Card>
        </form>
      </div>
      <Button
        text={saving ? "Saving..." : "Save Settings"}
        loading={saving}
        type="submit"
        form="admin-settings-form"
        variant="secondary"
        className="!rounded-xl !border !border-gray-300 !bg-transparent !px-6 !py-3 !text-gray-900 dark:!text-gray-100"
      />
    </div>
  );
};

const AttendanceLocationSettings = () => {
  const { authApi } = useApi();
  const toast = useToast();
  const [form, setForm] = useState({
    officeLocation: { latitude: "", longitude: "", radiusMeters: 100 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locatingOffice, setLocatingOffice] = useState(false);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    authApi
      .getSettings()
      .then((response) => {
        if (!active) return;
        const location = response.data.data?.officeLocation || {};
        setForm({
          officeLocation: {
            latitude: location.latitude ?? "",
            longitude: location.longitude ?? "",
            radiusMeters: location.radiusMeters ?? 100,
          },
        });
      })
      .catch((error) => {
        if (active) {
          setLoadError(true);
          toast.error(error.response?.data?.message || "Unable to load attendance location");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);
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

  const saveLocation = async (event) => {
    event.preventDefault();
    const { latitude, longitude, radiusMeters } = form.officeLocation;
    if (
      String(latitude).trim() === "" ||
      String(longitude).trim() === "" ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude)) ||
      Number(latitude) < -90 ||
      Number(latitude) > 90 ||
      Number(longitude) < -180 ||
      Number(longitude) > 180
    )
      return toast.error("Enter valid latitude and longitude.");
    if (!Number.isFinite(Number(radiusMeters)) || Number(radiusMeters) < 25)
      return toast.error("Office radius must be at least 25 meters.");
    setSaving(true);
    try {
      await authApi.updateSettings({
        officeLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
        },
      });
      toast.success("Attendance location saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save attendance location");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <CommonLoader text="Loading settings..." />;
  if (loadError)
    return (
      <p className="p-5 text-sm text-gray-500">
        Unable to load attendance location. Refresh to try again.
      </p>
    );
  return (
    <form onSubmit={saveLocation} className="space-y-5">
      <fieldset disabled={saving || locatingOffice} className="min-w-0">
        <Card>
          <div className="flex flex-col gap-5 border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffe9e5] text-[#f84525] dark:bg-orange-950/30">
                <FiMapPin className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Office Attendance Location
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Office-mode check-in will match employees within the selected radius.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={useCurrentOfficeLocation}
              disabled={locatingOffice}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {locatingOffice ? "Detecting..." : "Use Current Location"}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3 sm:p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Latitude
              <input
                type="number"
                step="any"
                value={form.officeLocation.latitude}
                onChange={(e) => updateOfficeLocation("latitude", e.target.value)}
                placeholder="22.7196"
                className={`${inputClass} !mt-2 !h-12 !rounded-xl !border-gray-200 !px-4 !text-base dark:!border-gray-700`}
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
                className={`${inputClass} !mt-2 !h-12 !rounded-xl !border-gray-200 !px-4 !text-base dark:!border-gray-700`}
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
                className={`${inputClass} !mt-2 !h-12 !rounded-xl !border-gray-200 !px-4 !text-base dark:!border-gray-700`}
              />
            </label>
          </div>
        </Card>
      </fieldset>
      <Button
        text="Save Attendance Location"
        type="submit"
        loading={saving}
        disabled={locatingOffice}
        variant="secondary"
        className="!rounded-xl !border !border-gray-300 !bg-transparent !px-6 !py-3 !text-gray-900 dark:!text-gray-100"
      />
    </form>
  );
};

const AdminSettings = () => {
  const { authApi } = useApi();
  const [params, setParams] = useSearchParams();
  const activeTab = ["leave", "attendance"].includes(params.get("tab"))
    ? params.get("tab")
    : "general";
  return (
    <div className="admin-settings-page space-y-5 rounded-2xl bg-[#f0f0f0] p-4 dark:bg-gray-950 sm:p-6">
      <nav
        aria-label="Settings sections"
        className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-gray-900"
      >
        {[
          { key: "general", label: "General Settings" },
          { key: "leave", label: "Leave Settings" },
          { key: "attendance", label: "Attendance Location" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-current={activeTab === tab.key ? "page" : undefined}
            onClick={() =>
              setParams((current) => {
                current.set("tab", tab.key);
                return current;
              })
            }
            className={`rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${activeTab === tab.key ? "border-[#f84525]/40 bg-[#fff5f2] text-[#d93a1e] dark:bg-orange-950/20 dark:text-orange-300" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === "leave" ? (
        <LeaveSettings />
      ) : activeTab === "attendance" ? (
        <AttendanceLocationSettings />
      ) : (
        <GeneralSettings />
      )}
    </div>
  );
};

export default AdminSettings;
