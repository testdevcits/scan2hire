import { useCallback, useEffect, useState } from "react";
import { authApi, employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import FileUploadField from "../../components/common/FileUploadField";
import { useToast } from "../../contexts/ToastContext";

const docFields = [
  ["aadhaarCard", "Aadhaar Card", ".pdf,.jpg,.jpeg,.png", "Upload JPG, PNG, PDF"],
  ["panCard", "PAN Card", ".pdf,.jpg,.jpeg,.png", "Upload JPG, PNG, PDF"],
  ["passbook", "Passbook", ".pdf,.jpg,.jpeg,.png", "Upload JPG, PNG, PDF"],
  ["degree", "Degree", ".pdf,.jpg,.jpeg,.png", "Upload JPG, PNG, PDF"],
  ["resume", "Resume", ".pdf,.doc,.docx", "Upload PDF, DOC, DOCX"],
];

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
  const [docs, setDocs] = useState({});
  const [documentOtp, setDocumentOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [profileImageForm, setProfileImageForm] = useState(null);
  const [profileImageSaving, setProfileImageSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [preview, setPreview] = useState(null);

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

  const handleDocumentFile = async (docKey, file) => {
    if (!file) return;
    const dataUri = await fileToDataUri(file);
    setDocs((prev) => ({
      ...prev,
      [docKey]: {
        dataUri,
        name: file.name,
        type: file.type,
      },
    }));
  };

  const handleProfileImageFile = async (file) => {
    if (!file) return;
    const dataUri = await fileToDataUri(file);
    setProfileImageForm({
      dataUri,
      name: file.name,
      type: file.type,
    });
  };

  const requestDocumentOtp = async () => {
    setOtpSending(true);
    try {
      const res = await employeeApi.requestDocumentOtp();
      setOtpRequested(true);
      toast.success(res.data.message || "OTP sent to HR");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const saveDocuments = async (e) => {
    e.preventDefault();
    setDocumentSaving(true);
    try {
      const res = await employeeApi.updateDocuments({ ...docs, otp: documentOtp });
      setProfile(res.data.data);
      setDocs({});
      setDocumentOtp("");
      setOtpRequested(false);
      toast.success("Documents updated");
      await authApi.getProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update documents");
    } finally {
      setDocumentSaving(false);
    }
  };

  const saveProfileImage = async (e) => {
    e.preventDefault();
    if (!profileImageForm?.dataUri) {
      toast.error("Please select profile image");
      return;
    }
    setProfileImageSaving(true);
    try {
      const res = await employeeApi.updateProfileImage({ photo: profileImageForm });
      setProfile(res.data.data);
      setProfileImageForm(null);
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
          <div className="w-20 h-20 rounded-sm overflow-hidden bg-[#fff5f3] flex items-center justify-center">
            {profileImageForm?.dataUri || profile?.documents?.photo?.url ? (
              <img src={profileImageForm?.dataUri || profile.documents.photo.url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-[#f84525]">{profile?.name?.[0] || "E"}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Update profile image, required documents, and account password.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-sm">
              <p><b>Name:</b> {profile?.name || "N/A"}</p>
              <p><b>Email:</b> {profile?.email || "N/A"}</p>
              <p><b>Department:</b> {profile?.department || "N/A"}</p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={saveProfileImage} className="bg-white rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <h2 className="font-semibold">Profile Image</h2>
          <p className="text-sm text-gray-500 mt-1">Update your profile photo directly. No OTP needed.</p>
        </div>
        <FileUploadField
          label="Profile Image"
          accept=".jpg,.jpeg,.png,.webp"
          hint="Upload JPG, PNG, WEBP"
          onChange={(e) => handleProfileImageFile(e.target.files?.[0])}
          fileName={profileImageForm?.name}
          selectedPreviewUrl={profileImageForm?.dataUri || profile?.documents?.photo?.url}
        />
        <div className="md:col-span-2">
          <Button
            text={profileImageSaving ? "Saving..." : "Save Profile Image"}
            type="submit"
            loading={profileImageSaving}
            disabled={!profileImageForm}
            className="justify-self-start"
          />
        </div>
      </form>

      <form onSubmit={saveDocuments} className="bg-white rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <h2 className="font-semibold">Documents</h2>
          <p className="text-sm text-gray-500 mt-1">Send OTP to HR first, then upload and save your updated documents.</p>
        </div>
        {docFields.map(([key, label, accept, hint]) => (
          <FileUploadField
            key={key}
            label={label}
            accept={accept}
            hint={hint}
            onChange={(e) => handleDocumentFile(key, e.target.files?.[0])}
            fileName={docs[key]?.name}
            selectedPreviewUrl={docs[key]?.type?.startsWith("image/") ? docs[key]?.dataUri : undefined}
            previewText={profile?.documents?.[key]?.url ? "View uploaded" : ""}
            onPreview={profile?.documents?.[key]?.url ? () => setPreview({ title: label, url: profile.documents[key].url }) : undefined}
          />
        ))}
        <label className="md:col-span-2 text-sm font-medium text-gray-700">
          OTP from HR
          <input
            value={documentOtp}
            onChange={(e) => setDocumentOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
            placeholder="Enter 6 digit OTP"
            required
          />
        </label>
        <Button
          text={otpSending ? "Sending..." : "Send OTP to HR"}
          type="button"
          variant="secondary"
          onClick={requestDocumentOtp}
          loading={otpSending}
        />
        <Button
          text="Save Documents"
          type="submit"
          loading={documentSaving}
          disabled={!otpRequested || !documentOtp || Object.keys(docs).length === 0}
          className="justify-self-start"
        />
      </form>

      <form onSubmit={changePassword} className="bg-white rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <h2 className="font-semibold">Update Password</h2>
          <p className="text-sm text-gray-500 mt-1">Keep your account secure by updating your password here.</p>
        </div>
        <label className="text-sm font-medium text-gray-700">
          Current Password
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
            required
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          New Password
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
            required
          />
        </label>
        <Button text={passwordSaving ? "Updating..." : "Update Password"} loading={passwordSaving} type="submit" className="md:col-span-2 justify-self-start" />
      </form>

      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">{preview.title}</h2>
              <button type="button" onClick={() => setPreview(null)} className="text-gray-500">x</button>
            </div>
            <iframe title={preview.title} src={preview.url} className="w-full h-[70vh]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSettings;
