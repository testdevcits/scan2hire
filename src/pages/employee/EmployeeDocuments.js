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

const getPreviewType = (url = "") => {
  if (String(url).startsWith("data:image/")) return "image";
  if (String(url).startsWith("data:application/pdf")) return "pdf";
  const cleanUrl = String(url).split("?")[0].toLowerCase();
  if (cleanUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/)) return "image";
  if (cleanUrl.endsWith(".pdf")) return "pdf";
  return "file";
};

const UploadedDocumentPreview = ({ title, url, onOpen }) => {
  if (!url) return null;

  const previewType = getPreviewType(url);

  return (
    <div className="mb-3 overflow-hidden rounded-sm border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="h-44 w-full bg-gray-100 dark:bg-gray-950">
        {previewType === "image" ? (
          <img src={url} alt={title} className="h-full w-full object-contain" />
        ) : previewType === "pdf" ? (
          <iframe title={`${title} preview`} src={url} className="h-full w-full border-0 bg-white" />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-sm font-semibold text-gray-500">
            Preview not available
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-xs dark:border-gray-800">
        <span className="truncate font-semibold text-gray-700 dark:text-gray-200">Uploaded {title}</span>
        <button type="button" onClick={onOpen} className="shrink-0 font-semibold text-[#f84525]">
          Preview
        </button>
      </div>
    </div>
  );
};

const EmployeeDocuments = () => {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingDoc, setRequestingDoc] = useState("");
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

  const getLatestRequest = (docKey) =>
    (profile?.documentUpdateRequests || [])
      .filter((item) => item.documentKey === docKey)
      .sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0))[0];

  const requestDocumentUpdate = async (docKey) => {
    setRequestingDoc(docKey);
    try {
      const res = await employeeApi.requestDocumentUpdate({ documents: [docKey] });
      setProfile(res.data.data || profile);
      toast.success(res.data.message || "Document update request sent to HR");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send request");
    } finally {
      setRequestingDoc("");
    }
  };

  const saveDocuments = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await employeeApi.updateDocuments(docs);
      setProfile(res.data.data);
      setDocs({});
      toast.success(res.data.message || "Documents updated");
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
          First-time upload is open. Existing documents can be updated only after HR approval.
        </p>
      </section>

      <form onSubmit={saveDocuments} className="bg-white dark:bg-gray-900 rounded-sm shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {docFields.map(([name, label]) => {
          const hasDocument = Boolean(profile?.documents?.[name]?.url);
          const latestRequest = getLatestRequest(name);
          const isApproved = latestRequest?.status === "approved";
          const isPending = latestRequest?.status === "pending";
          const canUpload = !hasDocument || isApproved;
          const uploadedUrl = profile?.documents?.[name]?.url;

          return (
            <div key={name} className="rounded-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3">
              {hasDocument ? (
                <UploadedDocumentPreview
                  title={label}
                  url={uploadedUrl}
                  onOpen={() => setPreview({ title: label, url: uploadedUrl })}
                />
              ) : null}
              {canUpload ? (
                <FileUploadField
                  label={label}
                  accept=".pdf,.jpg,.jpeg,.png"
                  hint={hasDocument ? "Upload approved replacement" : "Upload JPG, PNG, PDF"}
                  onChange={(e) => handleFile(name, e.target.files?.[0])}
                  fileName={docs[name]?.name}
                  selectedPreviewUrl={docs[name]?.type?.startsWith("image/") ? docs[name]?.dataUri : undefined}
                  previewText={hasDocument ? "View uploaded" : ""}
                  onPreview={hasDocument ? () => setPreview({ title: label, url: profile.documents[name].url }) : undefined}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isPending ? "Update request pending with HR." : "Request HR approval to update this document."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview({ title: label, url: profile.documents[name].url })}
                      className="rounded-sm border border-[#ffd0c7] bg-white px-3 py-2 text-xs font-semibold text-[#f84525] hover:bg-[#fff1ed]"
                    >
                      View Uploaded
                    </button>
                    <Button
                      text={isPending ? "Requested" : "Request Update"}
                      type="button"
                      variant="secondary"
                      disabled={isPending}
                      loading={requestingDoc === name}
                      onClick={() => requestDocumentUpdate(name)}
                    />
                  </div>
                </div>
              )}
              {hasDocument && isApproved ? (
                <p className="mt-2 text-xs font-semibold text-green-700">HR approved. Upload replacement now.</p>
              ) : null}
            </div>
          );
        })}
        <Button
          text="Save Documents"
          type="submit"
          loading={saving}
          disabled={Object.keys(docs).length === 0}
          className="md:col-span-2 justify-self-start"
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
