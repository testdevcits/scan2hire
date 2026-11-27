import { useEffect, useState } from "react";
import { useApi } from "../../../contexts/ApiContext";
import { useToast } from "../../../contexts/ToastContext";
import { employeeDocumentFields } from "../utils/employeeDocumentFields";
import Button from "../../../components/ui/Button";
import FileUploadField from "../../../components/ui/FormField/FileUploadField";
import FilePreviewModal from "../../../components/ui/Modal/FilePreviewModal";
import CommonLoader from "../../../components/ui/CommonLoader";

export default function PersonalDocuments() {
  const { employeeApi } = useApi();
  const toast = useToast();
  const [loadError, setLoadError] = useState(false);
  const [profile, setProfile] = useState(null),
    [files, setFiles] = useState({}),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(null);
  const load = async () => {
    const res = await employeeApi.getProfile();
    setProfile(res.data.data);
  };
  useEffect(() => {
    load().catch(() => {
      setLoadError(true);
      toast.error("Unable to load documents");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const permission = profile?.moduleAccess?.profileDocuments || {};
  const fields = [
    ["photo", "Photo"],
    ...employeeDocumentFields,
    ["drivingLicense", "Driving License"],
    ["salarySlips", "Salary Slips"],
    ...(profile?.qualifications || [])
      .filter((item) => item.id)
      .map((item) => [`qualification:${item.id}:marksheet`, `${item.level} — Marksheet`]),
    ...(profile?.previousEmployments || [])
      .filter((item) => item.id)
      .flatMap((item) =>
        [
          "offerLetter",
          "experienceLetter",
          ...(item.isLastCompany ? ["bankStatement", "salarySlips"] : []),
        ].map((key) => [
          `employment:${item.id}:${key}`,
          `${item.companyName} — ${key.replace(/([A-Z])/g, " $1")}`,
        ])
      ),
  ];
  const isMultiple = (key) => key.split(":").pop() === "salarySlips";
  const savedFile = (key) => {
    const [kind, id, field] = key.split(":");
    if (!id) return profile?.documents?.[key];
    return (
      kind === "qualification" ? profile?.qualifications : profile?.previousEmployments
    )?.find((item) => item.id === id)?.documents?.[field];
  };
  const choose = async (key, list) => {
    const selected = Array.from(list || []);
    if (!selected.length) return;
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("Each file must be 5 MB or smaller");
      return;
    }
    const converted = await Promise.all(
      selected.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ dataUri: reader.result, name: file.name });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );
    setFiles((current) => ({ ...current, [key]: isMultiple(key) ? converted : converted[0] }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await employeeApi.updateDocuments(files);
      setFiles({});
      await load();
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to submit documents");
    } finally {
      setBusy(false);
    }
  };
  if (loadError)
    return (
      <Button
        text="Retry loading documents"
        onClick={() => {
          setLoadError(false);
          load().catch(() => setLoadError(true));
        }}
      />
    );
  if (!profile) return <CommonLoader text="Loading documents…" />;
  if (permission.view !== true)
    return (
      <p className="rounded border bg-white p-5 text-sm text-gray-500">
        Personal document access is disabled. Contact your administrator.
      </p>
    );
  return (
    <section className="space-y-4">
      <div className="rounded border bg-white p-5">
        <h2 className="text-lg font-semibold">Personal Documents</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload missing files or submit replacements. HR/Admin reviews each submission before it
          becomes part of your record.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(([key, label]) => {
            const saved = savedFile(key);
            const urls = Array.isArray(saved) ? saved : saved?.url ? [saved] : [];
            const requests = (profile.documentUpdateRequests || []).filter(
              (item) => item.documentKey === key && item.submittedFile
            );
            const latest = requests[requests.length - 1];
            const pending = latest?.status === "pending";
            const allowed = permission[urls.length ? "edit" : "add"] === true;
            return (
              <div key={key} className="rounded-lg border bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <span
                    className={`rounded px-2 py-1 text-xs ${pending ? "bg-amber-50 text-amber-800" : urls.length ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {pending ? "Pending review" : urls.length ? "Saved in record" : "Not uploaded"}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap gap-3">
                  {urls.map((file, i) => (
                    <span key={i} className="inline-flex gap-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#f84525]"
                        onClick={() => setPreview({ title: label, url: file.url })}
                      >
                        View saved{urls.length > 1 ? ` ${i + 1}` : ""}
                      </button>
                      {permission.download === true && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="text-xs font-semibold text-blue-600"
                        >
                          Download
                        </a>
                      )}
                    </span>
                  ))}
                </div>
                {pending ? (
                  <div className="text-sm text-gray-500">
                    <p>Awaiting HR/Admin review. The saved file stays unchanged.</p>
                    {(Array.isArray(latest.submittedFile)
                      ? latest.submittedFile
                      : [latest.submittedFile]
                    ).map((file, i) => (
                      <button
                        key={i}
                        type="button"
                        className="mt-2 mr-3 text-xs font-semibold text-[#f84525]"
                        onClick={() => setPreview({ title: `Submitted ${label}`, url: file.url })}
                      >
                        View submission {i + 1}
                      </button>
                    ))}
                  </div>
                ) : allowed ? (
                  <>
                    {latest?.status === "rejected" && (
                      <p className="mb-3 text-xs text-red-600">
                        Rejected: {latest.rejectionReason}. Upload a corrected file.
                      </p>
                    )}
                    <FileUploadField
                      label={urls.length ? "Submit replacement" : "Upload document"}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      multiple={isMultiple(key)}
                      hint="PDF, JPG, PNG, WEBP · max 5 MB each"
                      disabled={busy}
                      fileName={
                        Array.isArray(files[key])
                          ? files[key].map((file) => file.name).join(", ")
                          : files[key]?.name
                      }
                      onChange={(event) => choose(key, event.target.files)}
                    />
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    Your administrator has disabled {urls.length ? "replacement" : "upload"} access.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <Button
          text="Submit for Approval"
          type="submit"
          loading={busy}
          disabled={!Object.keys(files).length}
        />
      </form>
      <div className="rounded border bg-white p-4">
        <h3 className="mb-3 font-semibold">Submission History</h3>
        {(profile.documentUpdateRequests || [])
          .filter((item) => item.submittedFile)
          .slice()
          .reverse()
          .map((item) => (
            <div
              key={item._id}
              className="flex flex-wrap justify-between gap-2 border-t py-3 text-sm"
            >
              <span>{item.documentKey.replace(/([A-Z])/g, " $1")}</span>
              <span>{item.status === "completed" ? "Approved & saved" : item.status}</span>
              <span className="text-gray-500">
                {new Date(item.requestedAt).toLocaleString()}
                {item.rejectionReason ? ` · ${item.rejectionReason}` : ""}
              </span>
            </div>
          ))}
      </div>
      {preview && <FilePreviewModal {...preview} onClose={() => setPreview(null)} />}
    </section>
  );
}
