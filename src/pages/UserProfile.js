import { useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api";
import Button from "../components/common/Button";
import CommonLoader from "../components/common/CommonLoader";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.getProfile();
      setProfile(res.data.data);
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
        </div>
      </section>

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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">{preview.title}</h2>
              <button onClick={() => setPreview(null)} className="text-gray-500">x</button>
            </div>
            <iframe title={preview.title} src={preview.url} className="w-full h-[70vh]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
