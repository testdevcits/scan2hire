import { useContext, useEffect, useState } from "react";
import { FiCopy, FiEye, FiEyeOff, FiMapPin, FiPlus } from "react-icons/fi";
import { authApi } from "../../api";
import Button from "../../components/common/Button";
import FileUploadField from "../../components/common/FileUploadField";
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
    officeLocation: {
      latitude: "",
      longitude: "",
      radiusMeters: "100",
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
            radiusMeters: data.officeLocation?.radiusMeters ?? "100",
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
          radiusMeters: radiusMeters || "100",
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
            radiusMeters: prev.officeLocation.radiusMeters || "100",
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
    return <div className="text-sm text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">Control mails, notifications, approval email and employee vault access.</p>
      </div>

      <div className="space-y-4 max-w-3xl">
        <form onSubmit={saveProfile} className="bg-white rounded-sm shadow p-4 space-y-3">
          <h2 className="font-semibold">Admin Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Name
              <input type="text" value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
            </label>
            <label className="text-sm font-medium">
              Mobile
              <input type="text" value={profileForm.mobile} onChange={(e) => setProfileForm((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Email
              <input type="email" value={profileForm.email} className="mt-1 w-full border rounded-sm px-3 py-2 bg-gray-50" disabled />
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
            <Button text={profileSaving ? "Saving..." : "Save Profile"} loading={profileSaving} type="submit" className="md:col-span-2" />
          </div>
        </form>

        <section className="bg-white rounded-sm shadow overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">My Saved Credentials</h2>
              <p className="text-sm text-gray-500 mt-1">Save your own admin logins and passwords.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCredentialForm((prev) => !prev)}
              className="w-10 h-10 rounded-sm bg-[#fff5f3] text-[#f84525] flex items-center justify-center"
              aria-label="Add credential"
            >
              <FiPlus />
            </button>
          </div>
          {showCredentialForm && (
            <form onSubmit={saveCredential} className="p-4 border-b grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Account Type
                <select value={credentialForm.accountType} onChange={(e) => setCredentialForm((prev) => ({ ...prev, accountType: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2">
                  <option>Email</option>
                  <option>Hosting</option>
                  <option>Social</option>
                  <option>Client Panel</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Title
                <input value={credentialForm.title} onChange={(e) => setCredentialForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
              </label>
              <label className="text-sm font-medium">
                Login / Email
                <input value={credentialForm.loginId} onChange={(e) => setCredentialForm((prev) => ({ ...prev, loginId: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
              </label>
              <label className="text-sm font-medium">
                Password
                <input type="password" value={credentialForm.password} onChange={(e) => setCredentialForm((prev) => ({ ...prev, password: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
              </label>
              <label className="text-sm font-medium md:col-span-2">
                Notes
                <textarea value={credentialForm.notes} onChange={(e) => setCredentialForm((prev) => ({ ...prev, notes: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" />
              </label>
              <Button text="Save Credential" type="submit" loading={credentialSaving} className="md:col-span-2 justify-self-start" />
            </form>
          )}
          {credentials.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No saved credentials yet.</p>
          ) : (
            credentials.map((item) => (
              <div key={item._id} className="border-t px-4 py-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.accountType}</p>
                  <p className="text-sm break-all mt-1">{item.loginId}</p>
                  <p className="text-sm mt-1">{revealedPasswords[item._id] ? item.password : "••••••••"}</p>
                  {item.notes ? <p className="text-xs text-gray-500 mt-1">{item.notes}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setRevealedPasswords((prev) => ({ ...prev, [item._id]: !prev[item._id] }))} className="border rounded-sm px-3 py-2 text-sm">
                    {revealedPasswords[item._id] ? <FiEyeOff /> : <FiEye />}
                  </button>
                  <button type="button" onClick={() => copyValue(item.loginId, "Login")} className="border rounded-sm px-3 py-2 text-sm"><FiCopy /></button>
                  <button type="button" onClick={() => copyValue(item.password, "Password")} className="border rounded-sm px-3 py-2 text-sm"><FiCopy /></button>
                  <button type="button" onClick={() => deleteCredential(item._id)} className="border rounded-sm px-3 py-2 text-sm text-red-600">Delete</button>
                </div>
              </div>
            ))
          )}
        </section>

        <form onSubmit={saveSettings} className="space-y-4">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-semibold">Office Attendance Location</h2>
              <p className="text-sm text-gray-500 mt-1">
                App check-in will be allowed only inside this radius.
              </p>
            </div>
            <button
              type="button"
              onClick={useCurrentOfficeLocation}
              disabled={locatingOffice}
              className="inline-flex items-center justify-center gap-2 border border-[#f84525] text-[#f84525] rounded-sm px-3 py-2 text-sm disabled:opacity-60"
            >
              <FiMapPin />
              {locatingOffice ? "Detecting..." : "Use Current Location"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-sm font-medium">
              Latitude
              <input
                type="number"
                step="any"
                value={form.officeLocation.latitude}
                onChange={(e) => updateOfficeLocation("latitude", e.target.value)}
                placeholder="22.7196"
                className="mt-1 w-full border rounded-sm px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Longitude
              <input
                type="number"
                step="any"
                value={form.officeLocation.longitude}
                onChange={(e) => updateOfficeLocation("longitude", e.target.value)}
                placeholder="75.8577"
                className="mt-1 w-full border rounded-sm px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Radius in meters
              <input
                type="number"
                min="50"
                step="1"
                value={form.officeLocation.radiusMeters}
                onChange={(e) => updateOfficeLocation("radiusMeters", e.target.value)}
                placeholder="100"
                className="mt-1 w-full border rounded-sm px-3 py-2"
              />
            </label>
          </div>
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
    </div>
  );
};

export default AdminSettings;
