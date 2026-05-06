import { useCallback, useEffect, useState } from "react";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import FilePreviewModal from "../../components/common/FilePreviewModal";
import FileUploadField from "../../components/common/FileUploadField";
import { useToast } from "../../contexts/ToastContext";

const docFields = [
  ["photo", "Photo"],
  ["aadhaarCard", "Aadhaar Card"],
  ["panCard", "PAN Card"],
  ["passbook", "Passbook"],
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

const EmployeeDocuments = () => {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documentOtp, setDocumentOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [preview, setPreview] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeApi.getProfile();
      setProfile(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load documents");
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
    setSaving(true);
    try {
      const res = await employeeApi.updateDocuments({ ...docs, otp: documentOtp });
      setProfile(res.data.data);
      setDocs({});
      setDocumentOtp("");
      setOtpRequested(false);
      toast.success("Documents updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update documents");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CommonLoader text="Loading documents..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-gray-900 rounded-sm shadow p-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Send OTP to HR, then upload and save your employee documents.
        </p>
      </section>

      <form onSubmit={saveDocuments} className="bg-white dark:bg-gray-900 rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {docFields.map(([name, label]) => (
          <FileUploadField
            key={name}
            label={label}
            accept=".pdf,.jpg,.jpeg,.png"
            hint="Upload JPG, PNG, PDF"
            onChange={(e) => handleFile(name, e.target.files?.[0])}
            fileName={docs[name]?.name}
            selectedPreviewUrl={docs[name]?.type?.startsWith("image/") ? docs[name]?.dataUri : undefined}
            previewText={profile?.documents?.[name]?.url ? "View uploaded" : ""}
            onPreview={profile?.documents?.[name]?.url ? () => setPreview({ title: label, url: profile.documents[name].url }) : undefined}
          />
        ))}
        <label className="md:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          OTP from HR
          <input
            value={documentOtp}
            onChange={(e) => setDocumentOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-white rounded-sm px-3 py-2"
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
          loading={saving}
          disabled={!otpRequested || !documentOtp || Object.keys(docs).length === 0}
          className="justify-self-start"
        />
      </form>

      <section className="bg-white dark:bg-gray-900 rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-800">
          <h2 className="font-semibold dark:text-white">Document History</h2>
        </div>
        {profile?.documentHistory?.length ? (
          profile.documentHistory.slice().reverse().map((item, index) => (
            <div key={`${item.updatedAt}-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t dark:border-gray-800 px-4 py-3 text-sm dark:text-gray-200">
              <span>{new Date(item.updatedAt).toLocaleString()}</span>
              <span>{item.documents?.join(", ") || "Documents"}</span>
              <span>{item.verifiedByEmail || "HR verified"}</span>
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No document update history.</p>
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

export default EmployeeDocuments;
