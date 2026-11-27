import { useState } from "react";
import { useApi } from "../../contexts/ApiContext";
import { useToast } from "../../contexts/ToastContext";
import FilePreviewModal from "../common/FilePreviewModal";
import Button from "../common/Button";
export default function EmployeeDocumentReview({ employee, canReview, onChanged }) {
  const { hrApi } = useApi();
  const toast = useToast();
  const [busy, setBusy] = useState(""),
    [reasons, setReasons] = useState({}),
    [preview, setPreview] = useState(null);
  const requests = (employee.documentUpdateRequests || []).filter(
    (item) => item.submittedFile && item.status === "pending"
  );
  const review = async (item, action) => {
    setBusy(item._id);
    try {
      const res = await hrApi.approveDocumentUpdateRequest(employee._id, {
        requestId: item._id,
        action,
        reason: reasons[item._id] || "",
      });
      await onChanged();
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to review document");
    } finally {
      setBusy("");
    }
  };
  return (
    <section className="mb-6 rounded-lg border border-orange-200 bg-orange-50/30 p-4">
      <h3 className="font-semibold">Employee Submissions ({requests.length})</h3>
      <p className="mt-1 text-xs text-gray-500">
        Review the uploaded file before approval. Approval saves it to the official employee record.
      </p>
      {!requests.length && (
        <p className="mt-3 text-sm text-gray-500">No documents awaiting review.</p>
      )}
      {requests.map((item) => (
        <div key={item._id} className="mt-4 rounded border bg-white p-4">
          <p className="mb-3 text-sm font-semibold capitalize">
            {item.documentKey.replace(/([A-Z])/g, " $1")}
          </p>
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(item.submittedFile) ? item.submittedFile : [item.submittedFile]).map(
              (file, i) => (
                <Button
                  key={i}
                  text={`View submitted file ${i + 1}`}
                  variant="secondary"
                  onClick={() => setPreview({ title: item.documentKey, url: file.url })}
                />
              )
            )}
            {employee.documents?.[item.documentKey]?.url && (
              <Button
                text="View current record"
                variant="secondary"
                onClick={() =>
                  setPreview({
                    title: "Current saved document",
                    url: employee.documents[item.documentKey].url,
                  })
                }
              />
            )}
          </div>
          {canReview && (
            <>
              <textarea
                className="mt-3 w-full rounded border p-2 text-sm"
                placeholder="Reason required only for rejection"
                value={reasons[item._id] || ""}
                disabled={!!busy}
                onChange={(event) =>
                  setReasons((current) => ({ ...current, [item._id]: event.target.value }))
                }
                maxLength={1000}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  text="Approve & Save to Record"
                  disabled={!!busy}
                  onClick={() => review(item, "approve")}
                />
                <Button
                  text="Reject"
                  variant="secondary"
                  disabled={!!busy || !reasons[item._id]?.trim()}
                  onClick={() => review(item, "reject")}
                />
              </div>
            </>
          )}
        </div>
      ))}
      {preview && <FilePreviewModal {...preview} onClose={() => setPreview(null)} />}
    </section>
  );
}
