import { useCallback, useEffect, useState } from "react";
import { FiCamera, FiLock, FiShield } from "react-icons/fi";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const fileToDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const EmployeeSettings = () => {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [profileImageSaving, setProfileImageSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setPageLoading(true);
    try {
      const res = await employeeApi.getProfile();
      setProfile(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load settings");
    } finally {
      setPageLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleProfileImageFile = async (file) => {
    if (!file) return;
    const photo = {
      dataUri: await fileToDataUri(file),
      name: file.name,
      type: file.type,
    };
    setProfileImagePreview(photo.dataUri);
    setProfileImageSaving(true);
    try {
      const res = await employeeApi.updateProfileImage({ photo });
      setProfile(res.data.data);
      if (res.data.data?.documents?.photo?.url) {
        window.dispatchEvent(
          new CustomEvent("profile-image-updated", {
            detail: { url: res.data.data.documents.photo.url },
          })
        );
      }
      toast.success(res.data.message || "Profile image updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update profile image");
      setProfileImagePreview("");
    } finally {
      setProfileImageSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    try {
      await employeeApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast.success("Password updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (pageLoading) return <CommonLoader text="Loading settings..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <label className="relative w-24 h-24 rounded-full overflow-hidden bg-[#fff5f3] flex items-center justify-center border border-[#ffd8cf] cursor-pointer group shrink-0">
            {profileImagePreview || profile?.documents?.photo?.url ? (
              <img src={profileImagePreview || profile.documents.photo.url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold text-[#f84525]">{profile?.name?.[0] || "E"}</span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white py-2 flex items-center justify-center">
              {profileImageSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCamera />
              )}
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => handleProfileImageFile(e.target.files?.[0])}
              disabled={profileImageSaving}
              className="sr-only"
            />
          </label>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Update your avatar and account password.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-sm">
              <p><b>Name:</b> {profile?.name || "N/A"}</p>
              <p><b>Email:</b> {profile?.email || "N/A"}</p>
              <p><b>Department:</b> {profile?.department || "N/A"}</p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={changePassword} className="bg-white rounded-sm shadow overflow-hidden">
        <div className="border-b border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#fff5f3] text-[#f84525] flex items-center justify-center shrink-0">
              <FiShield />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Update Password</h2>
              <p className="text-sm text-gray-500 mt-1">Change your login password securely.</p>
            </div>
          </div>
          <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-sm px-3 py-2 w-fit">
            Employee Account
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">
            Current Password
            <div className="mt-1 relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-sm pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525] focus:border-[#f84525]"
                placeholder="Enter current password"
                required
              />
            </div>
          </label>
          <label className="text-sm font-medium text-gray-700">
            New Password
            <div className="mt-1 relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-sm pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525] focus:border-[#f84525]"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>
          </label>
          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <p className="text-xs text-gray-500">Use at least 6 characters.</p>
            <Button
              text={passwordSaving ? "Updating..." : "Update Password"}
              loading={passwordSaving}
              type="submit"
              className="w-full sm:w-auto"
              disabled={!passwordForm.currentPassword || !passwordForm.newPassword}
            />
          </div>
        </div>
      </form>

    </div>
  );
};

export default EmployeeSettings;
