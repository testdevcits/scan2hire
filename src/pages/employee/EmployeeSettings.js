/* eslint-disable */
import PersonalDocuments from "../../components/documents/PersonalDocuments";
import SubmittedProfileDetails from "../../components/common/SubmittedProfileDetails";
import { useApi } from "../../contexts/ApiContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiCamera, FiLock, FiShield } from "react-icons/fi";
import { Navigate, useLocation } from "react-router-dom";

import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import FilePreviewModal from "../../components/common/FilePreviewModal";
import FileUploadField from "../../components/common/FileUploadField";
import { useToast } from "../../contexts/ToastContext";

const docFields = [
  ["photo", "Photo"],
  ["aadhaarCard", "Aadhaar Card"],
  ["panCard", "PAN Card"],
  ["degree", "Degree"],
  ["resume", "Resume"],
];

const fileToDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getPastedImage = (event) =>
  Array.from(event.clipboardData?.items || [])
    .find((item) => item.kind === "file" && item.type.startsWith("image/"))
    ?.getAsFile();

const EmployeeSettings = ({ requireProfileAccess = false }) => {
  const { authApi, employeeApi } = useApi();
  const toast = useToast();
  const location = useLocation();
  const isHrSettings = location.pathname.startsWith("/hr/");
  const isProfilePage = location.pathname.endsWith("/profile");
  const showProfileTabs = isProfilePage || isHrSettings;
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [profileImageSaving, setProfileImageSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [docs, setDocs] = useState({});
  const [documentsSaving, setDocumentsSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState(isProfilePage ? "overview" : "password");
  const [profileDenied, setProfileDenied] = useState(false);
  const deniedNotified = useRef(false);

  const loadProfile = useCallback(async () => {
    setPageLoading(true);
    try {
      const res = isHrSettings ? await authApi.getProfile() : await employeeApi.getProfile();
      let data = res.data.data;
      // Keep permissions from the user profile as a fallback for older employee
      // profile responses that contain employee fields but omit moduleAccess.
      if (!isHrSettings) {
        const accessRes = await authApi.getProfile();
        const authData = accessRes.data.data;
        const authDocs = authData?.employeeProfile?.documents || authData?.documents;
        data = {
          ...data,
          moduleAccess: data?.moduleAccess || authData?.moduleAccess,
          documents: data?.documents,
        };
      }
      setProfile(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load settings");
    } finally {
      setPageLoading(false);
    }
  }, [isHrSettings, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!requireProfileAccess || isHrSettings || pageLoading || !profile) return;
    if (profile?.moduleAccess?.profile?.view === false) {
      if (!deniedNotified.current) {
        deniedNotified.current = true;
        toast.error("You do not have access for this page");
      }
      setProfileDenied(true);
    }
  }, [requireProfileAccess, isHrSettings, pageLoading, profile, toast]);

  const handleProfileImageFile = async (file) => {
    if (!canUpdateAvatar) return;
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
      await loadProfile();
      setProfileImagePreview("");
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
      if (isHrSettings) {
        await authApi.changePassword(passwordForm);
      } else {
        await employeeApi.changePassword(passwordForm);
      }
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast.success("Password updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDocumentFile = async (docKey, file) => {
    if (!file) return;
    const dataUri = await fileToDataUri(file);
    setDocs((prev) => ({
      ...prev,
      [docKey]: { dataUri, name: file.name, type: file.type },
    }));
  };

  const saveDocuments = async (e) => {
    e.preventDefault();
    setDocumentsSaving(true);
    try {
      const res = await authApi.updateMyDocuments(docs);
      setProfile(res.data.data);
      setDocs({});
      toast.success(res.data.message || "Documents updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update documents");
    } finally {
      setDocumentsSaving(false);
    }
  };

  const canUpdateAvatar = !isHrSettings && profile?.moduleAccess?.profileDocuments?.view === true && profile?.moduleAccess?.profileDocuments?.[profile?.documents?.photo?.url ? "edit" : "add"] === true;
  const profileDetails = profile?.employeeProfile || profile;
  const profileAccess = profile?.moduleAccess || {};
  const canViewProfileGroup = (key) => isHrSettings || profileAccess?.[key]?.view === true;
  const canDownloadProfileDocuments = isHrSettings || profileAccess?.profileDocuments?.download === true;
  const getDocumentUrl = (value) => Array.isArray(value) ? value.find((item) => item?.url)?.url : value?.url;
  const profilePhotoUrl = isHrSettings
    ? profile?.documents?.photo?.url || profileDetails?.documents?.photo?.url || ""
    : profileDetails?.documents?.photo?.url || profile?.documents?.photo?.url || "";

  if (pageLoading) return <CommonLoader text="Loading settings..." />;
  if (profileDenied) return <Navigate to="/employee/dashboard" replace />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <label
            tabIndex={0}
            onPaste={(e) => {
              const file = getPastedImage(e);
              if (!file) return;
              e.preventDefault();
              handleProfileImageFile(file);
            }}
            className="relative w-24 h-24 rounded-full overflow-hidden bg-[#fff5f3] flex items-center justify-center border border-[#ffd8cf] cursor-pointer group shrink-0 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
            title={canUpdateAvatar ? "Submit a new photo for HR/Admin approval" : "Profile photo"}
          >
            {profileImagePreview || profilePhotoUrl ? (
              <img src={profileImagePreview || profilePhotoUrl} alt={profileDetails?.name || profile?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold text-[#f84525]">{profileDetails?.name?.[0] || profile?.name?.[0] || "E"}</span>
            )}
            {canUpdateAvatar && <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white py-2 flex items-center justify-center">
              {profileImageSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCamera />
              )}
            </span>}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => handleProfileImageFile(e.target.files?.[0])}
              disabled={profileImageSaving || !canUpdateAvatar}
              className="sr-only"
            />
          </label>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isProfilePage ? "My Profile" : "Settings"}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {canUpdateAvatar ? "View your profile details and manage your account." : "View your profile details."}
            </p>
          </div>
        </div>
      </section>
      {showProfileTabs && <section className="rounded-sm bg-white p-2 shadow">
            <div className="grid grid-cols-1 gap-2 border-b pb-3 sm:grid-cols-3">
              {[{ key: "overview", label: "Overview", show: true }, { key: "profileDocuments", label: "Documents", show: canViewProfileGroup("profileDocuments") }, { key: "password", label: "Update Password", show: true }].filter((tab) => tab.show).map((tab) => <button type="button" key={tab.key} onClick={() => setActiveProfileTab(tab.key)} className={`relative flex min-h-16 w-full items-center justify-center rounded-lg border px-4 py-3 text-base font-semibold transition-colors ${activeProfileTab === tab.key ? "border-[#f84525] bg-[#fff5f3] text-[#f84525] after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-2/3 after:-translate-x-1/2 after:rounded-t-full after:bg-[#f84525]" : "border-gray-200 bg-white text-gray-600 hover:border-[#f84525] hover:bg-[#fffaf8]"}`}>{tab.label}</button>)}
            </div>
      </section>}

      {showProfileTabs && activeProfileTab !== "password" && (
        <section className="rounded-sm bg-white p-0 shadow-none">
              <div className="grid grid-cols-1 gap-4 rounded-sm bg-white p-2 text-sm lg:grid-cols-2">
                {activeProfileTab === "profileDocuments" && !isHrSettings && <div className="lg:col-span-2"><PersonalDocuments /></div>}
                {activeProfileTab === "profileDocuments" && isHrSettings && <div className="lg:col-span-2 space-y-3">{Object.entries(profileDetails?.documents || {}).map(([key, value]) => <div key={key} className="flex justify-between rounded border p-3"><span>{key.replace(/([A-Z])/g, " $1")}</span>{getDocumentUrl(value) && <button className="text-sm text-[#f84525]" onClick={() => setPreview({ title: key, url: getDocumentUrl(value) })}>View</button>}</div>)}</div>}
                {activeProfileTab === "overview" && <SubmittedProfileDetails employee={profileDetails || {}} canView={canViewProfileGroup} />}

              </div>
        </section>
      )}

      {isHrSettings && (
        <>
          <form onSubmit={saveDocuments} className="bg-white rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h2 className="font-semibold text-gray-900">Documents</h2>
              <p className="text-sm text-gray-500 mt-1">Upload or replace your account documents.</p>
            </div>
            {docFields.map(([name, label]) => (
              <FileUploadField
                key={name}
                label={label}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentFile(name, e.target.files?.[0])}
                fileName={docs[name]?.name}
                selectedPreviewUrl={docs[name]?.type?.startsWith("image/") ? docs[name]?.dataUri : undefined}
                previewText={profile?.documents?.[name]?.url ? "View uploaded" : ""}
                onPreview={profile?.documents?.[name]?.url ? () => setPreview({ title: label, url: profile.documents[name].url }) : undefined}
              />
            ))}
            <Button
              text="Save Documents"
              type="submit"
              loading={documentsSaving}
              disabled={Object.keys(docs).length === 0}
              className="md:col-span-2 justify-self-start"
            />
          </form>

          <section className="bg-white rounded-sm shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Document History</h2>
            </div>
            {profile?.documentHistory?.length ? (
              profile.documentHistory.slice().reverse().map((item, index) => (
                <div key={`${item.updatedAt}-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t px-4 py-3 text-sm">
                  <span>{new Date(item.updatedAt).toLocaleString()}</span>
                  <span>{item.documents?.join(", ") || "Documents"}</span>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500">No document update history.</p>
            )}
          </section>
        </>
      )}

      {activeProfileTab === "password" && <form onSubmit={changePassword} className="bg-white rounded-sm shadow overflow-hidden">
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
            Account
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
      </form>}

      {preview && (
        <FilePreviewModal
          title={preview.title}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

export default EmployeeSettings;
