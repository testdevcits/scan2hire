import { useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api";
import Button from "../components/common/Button";
import CommonLoader from "../components/common/CommonLoader";
import FilePreviewModal from "../components/common/FilePreviewModal";
import FileUploadField from "../components/common/FileUploadField";
import { ThemeContext } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";

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

const UserProfile = ({ title = "My Profile" }) => {
  const toast = useToast();
  const { mode } = useContext(ThemeContext);
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState({});
  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [preview, setPreview] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.getProfile();
      const data = res.data.data;
      setProfile(data);
      setProfileForm({
        name: data.name || "",
        mobile: data.mobile || "",
        address: {
          street: data.employeeProfile?.address?.street || "",
          city: data.employeeProfile?.address?.city || "",
          state: data.employeeProfile?.address?.state || "",
          country: data.employeeProfile?.address?.country || "",
          pincode: data.employeeProfile?.address?.pincode || "",
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFile = async (docKey, file) => {
    if (!file) return;
    const dataUri = await fileToDataUri(file);
    setDocs((prev) => ({
      ...prev,
      [docKey]: { dataUri, name: file.name, type: file.type },
    }));
  };

  const saveDocuments = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMyDocuments(docs);
      setProfile(res.data.data);
      setDocs({});
      toast.success("Documents updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update documents");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      setProfile(res.data.data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileChange = (field, value) => {
    if (field === "mobile" && !/^\d{0,10}$/.test(value)) return;
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    if (field === "pincode" && !/^\d{0,6}$/.test(value)) return;
    setProfileForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  if (loading) return <CommonLoader text="Loading profile..." />;

  return (
    <div className="space-y-5">
      <section className={`${mode === "dark" ? "bg-gray-900 text-white" : "bg-white"} rounded-sm shadow p-5`}>
        <h1 className={`text-2xl font-bold ${mode === "dark" ? "text-white" : "text-gray-900"}`}>{title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-sm">
          <p><b>Name:</b> {profile?.name}</p>
          <p><b>Email:</b> {profile?.email}</p>
          <p><b>Mobile:</b> {profile?.mobile}</p>
          <p><b>Role:</b> {profile?.role}</p>
          <p className="md:col-span-4">
            <b>Address:</b>{" "}
            {[
              profile?.employeeProfile?.address?.street,
              profile?.employeeProfile?.address?.city,
              profile?.employeeProfile?.address?.state,
              profile?.employeeProfile?.address?.country,
              profile?.employeeProfile?.address?.pincode,
            ].filter(Boolean).join(", ") || "N/A"}
          </p>
        </div>
      </section>

      <form onSubmit={saveProfile} className={`${mode === "dark" ? "bg-gray-900 text-white" : "bg-white"} rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-3 gap-4`}>
        <h2 className="font-semibold md:col-span-3">Update Profile</h2>
        <label className="text-sm font-medium">
          Full Name
          <input
            type="text"
            value={profileForm.name}
            onChange={(e) => handleProfileChange("name", e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 text-gray-900"
            required
          />
        </label>
        <label className="text-sm font-medium">
          Mobile
          <input
            type="text"
            value={profileForm.mobile}
            onChange={(e) => handleProfileChange("mobile", e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 text-gray-900"
            required
          />
        </label>
        {[
          ["street", "Address"],
          ["city", "City"],
          ["state", "State"],
          ["country", "Country"],
          ["pincode", "Pincode"],
        ].map(([field, label]) => (
          <label key={field} className="text-sm font-medium">
            {label}
            <input
              type="text"
              value={profileForm.address[field]}
              onChange={(e) => handleAddressChange(field, e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2 text-gray-900"
            />
          </label>
        ))}
        <Button text="Save Profile" type="submit" loading={savingProfile} className="md:col-span-3" />
      </form>

      <form onSubmit={saveDocuments} className={`${mode === "dark" ? "bg-gray-900 text-white" : "bg-white"} rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4`}>
        <h2 className="font-semibold md:col-span-2">Documents</h2>
        {docFields.map(([name, label]) => (
          <FileUploadField
            key={name}
            label={label}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFile(name, e.target.files?.[0])}
            fileName={docs[name]?.name}
            selectedPreviewUrl={docs[name]?.type?.startsWith("image/") ? docs[name]?.dataUri : undefined}
            previewText={profile?.documents?.[name]?.url ? "View uploaded" : ""}
            onPreview={profile?.documents?.[name]?.url ? () => setPreview({ title: label, url: profile.documents[name].url }) : undefined}
          />
        ))}
        <Button text="Save Documents" type="submit" loading={saving} className="md:col-span-2" />
      </form>

      <section className={`${mode === "dark" ? "bg-gray-900 text-white" : "bg-white"} rounded-sm shadow overflow-hidden`}>
        <div className={`p-4 border-b ${mode === "dark" ? "border-gray-800" : ""}`}>
          <h2 className="font-semibold">Document History</h2>
        </div>
        {profile?.documentHistory?.length ? (
          profile.documentHistory.slice().reverse().map((item, index) => (
            <div key={`${item.updatedAt}-${index}`} className={`grid grid-cols-1 md:grid-cols-2 gap-2 border-t px-4 py-3 text-sm ${mode === "dark" ? "border-gray-800 text-gray-200" : ""}`}>
              <span>{new Date(item.updatedAt).toLocaleString()}</span>
              <span>{item.documents?.join(", ")}</span>
            </div>
          ))
        ) : (
          <p className={`p-4 text-sm ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>No document update history.</p>
        )}
      </section>

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

export default UserProfile;
