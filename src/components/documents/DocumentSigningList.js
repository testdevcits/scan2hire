/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import CommonLoader from "../common/CommonLoader";
import DocumentStatusBadge from "./DocumentStatusBadge";
import EmployeeSigningDocuments from "./EmployeeSigningDocuments";
import { FiDownload, FiEdit2, FiClock, FiX, FiTrash2 } from "react-icons/fi";
import DocumentTableCell from "./DocumentTableCell";
import { lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";

import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

import CommonModal from "../common/CommonModal";
import CommonTable from "../common/CommonTable";
import CustomDropdown from "../common/CustomDropdown";
import FileUploadField from "../common/FileUploadField";
import Button from "../common/Button";

const PageSigningModal = lazy(() => import("./PageSigningModal"));

const labels = { appointment_letter: "Appointment Letter", hr_policy: "HR Policy" };
const fileData = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function DocumentSigningList({
  managed = false,
  employeeFilterId = "",
  moduleAccess = null,
}) {
  const { API } = useApi();
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const isHr = ["hr", "superadmin"].includes(user?.role);
  const documentAccess =
    user?.role === "hr" ? moduleAccess?.documents || user?.moduleAccess?.documents : null;
  const canDocument = (action) =>
    user?.role === "superadmin" || (documentAccess ? documentAccess[action] === true : false);
  const ownAccess = moduleAccess || user?.moduleAccess || {};
  const canSignOwn = isHr
    ? ownAccess.ownDocuments?.edit === true
    : ownAccess.documents?.edit === true;
  const canDownloadOwn = isHr
    ? ownAccess.ownDocuments?.download === true
    : ownAccess.documents?.download === true;
  const canDelete = managed && isHr && canDocument("delete");
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState("appointment_letter");
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState({});
  const [preview, setPreview] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const previewUrl = useRef(null);
  const [editTarget, setEditTarget] = useState(null);
  const [history, setHistory] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await API.get(!managed && isHr ? "/documents?self=true" : "/documents");
      const rows = result.data.data || [];
      const ownEmployeeId = user?.employeeProfile?._id || user?.employeeProfile;
      setDocuments(
        !managed && isHr && ownEmployeeId
          ? rows.filter(
              (doc) => String(doc.employee?._id || doc.employee) === String(ownEmployeeId)
            )
          : rows
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load documents");
    } finally {
      setLoading(false);
    }
  }, [API, isHr, managed, user?.employeeProfile]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!managed || !isHr) return;
    API.get("/hr/employees")
      .then((res) => setEmployees(res.data.data || []))
      .catch(() => setError("Unable to load employees. Please refresh."));
  }, [API, managed, isHr]);
  useEffect(() => {
    if (employeeFilterId) setEmployeeId(String(employeeFilterId));
  }, [employeeFilterId]);
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    []
  );

  const close = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
  };
  const open = async (doc, signed = false, version = null) => {
    if (
      !version &&
      ["draft", "pending", "needs_correction", "awaiting_verification"].includes(doc.status)
    ) {
      const workflowAction =
        doc.status === "draft"
          ? "placement"
          : doc.status === "awaiting_verification"
            ? "review"
            : "update";
      if (managed && isHr && canDocument(workflowAction)) {
        setWorkflow(doc);
        return;
      }
      if (!managed || !isHr) {
        setWorkflow(doc);
        return;
      }
    }
    setBusy(true);
    try {
      const res = await API.get(`/documents/${doc._id}/file`, {
        params: { signed, ...(version ? { version: version._id } : {}) },
        responseType: "blob",
      });
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      previewUrl.current = url;
      setHistory(null);
      setPreview({ doc: version ? { ...doc, ...version, status: "archived" } : doc, signed, url });
    } catch {
      toast.error("Unable to open document");
    } finally {
      setBusy(false);
    }
  };
  const downloadSigned = async (doc) => {
    setBusy(true);
    try {
      const res = await API.get(`/documents/${doc._id}/file`, {
        params: { signed: true, download: true },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      const employee = String(doc.employee?.employeeId || doc.employee?.name || "employee").replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      link.href = url;
      link.download = `${employee}-${doc.type}-signed.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Unable to download signed PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const upload = async (e) => {
    e.preventDefault();
    if (!employeeId) return toast.error("Select an employee");
    const selected = editTarget
      ? [[type, file]]
      : Object.keys(labels)
          .filter((key) => !employeeDocuments.some((doc) => doc.type === key))
          .map((key) => [key, files[key]]);
    if (!selected.length)
      return toast.error("Both documents already exist. Use Update on the existing entry.");
    if (
      selected.some(
        ([, pdf]) => !pdf || pdf.size > 5 * 1024 * 1024 || !pdf.name.toLowerCase().endsWith(".pdf")
      )
    )
      return toast.error("Select both required PDFs, each up to 5 MB");
    setBusy(true);
    let saved = 0;
    try {
      // Read all files before sending so a local read failure cannot partially submit the form.
      const payloads = await Promise.all(
        selected.map(async ([documentType, pdf]) => ({
          employeeId,
          type: documentType,
          filename: pdf.name,
          dataUri: await fileData(pdf),
          updatedAt: editTarget?.updatedAt,
        }))
      );
      for (const payload of payloads) {
        if (editTarget) await API.patch(`/documents/${editTarget._id}`, payload);
        else await API.post("/documents", payload);
        saved += 1;
      }
      setFile(null);
      setFiles({});
      setUploadOpen(false);
      setEmployeeId("");
      toast.success(
        editTarget
          ? "Draft updated. Open its view icon to set page placements."
          : "Drafts saved. Open each document to set placements and send."
      );
    } catch (err) {
      toast.error(
        saved
          ? "One document was saved. Submit again to send the remaining PDF."
          : err.response?.data?.message || "Upload failed"
      );
    } finally {
      await load();
      setBusy(false);
    }
  };
  const cancel = async (doc) => {
    setBusy(true);
    try {
      await API.post(`/documents/${doc._id}/cancel`);
      setCancelTarget(null);
      toast.success("Request cancelled");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to cancel");
    } finally {
      setBusy(false);
    }
  };
  const deleteDocument = async (doc) => {
    setBusy(true);
    try {
      await API.delete(`/documents/${doc._id}`);
      setDeleteTarget(null);
      close();
      setWorkflow(null);
      toast.success("Document deleted. Signature and version history are retained.");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete document");
    } finally {
      setBusy(false);
    }
  };
  const employeeDocuments = documents.filter(
    (doc) => String(doc.employee?._id || doc.employee) === employeeId
  );
  const edit = (doc) => {
    setEditTarget(doc);
    setEmployeeId(String(doc.employee?._id || doc.employee));
    setType(doc.type);
    setFile(null);
    setUploadOpen(true);
  };
  const showHistory = async (doc) => {
    setBusy(true);
    try {
      const res = await API.get(`/documents/${doc._id}/history`);
      setHistory({ doc, rows: res.data.data || [] });
    } catch {
      toast.error("Unable to load document history");
    } finally {
      setBusy(false);
    }
  };
  const groups = Object.values(
    documents.reduce((result, doc) => {
      const key = String(doc.employee?._id || doc.employee || doc._id);
      if (!result[key]) result[key] = { _id: key, employee: doc.employee, documents: [] };
      result[key].documents.push(doc);
      return result;
    }, {})
  ).map((group) => ({
    ...group,
    status: Object.keys(labels).every((key) =>
      group.documents.some((doc) => doc.type === key && doc.status === "done")
    )
      ? "done"
      : group.documents.some((doc) => doc.status === "needs_correction")
        ? "needs_correction"
        : group.documents.some((doc) => doc.status === "draft")
          ? "draft"
          : group.documents.some((doc) => doc.status === "awaiting_verification")
            ? "awaiting_verification"
            : group.documents.every((doc) => doc.status === "cancelled")
              ? "cancelled"
              : "pending",
  }));
  const selectedGroups = employeeFilterId
    ? groups.filter((group) =>
        [group._id, group.employee?._id, group.employee?.employeeId].some(
          (value) => String(value || "") === String(employeeFilterId)
        )
      )
    : groups;
  const selectedVisible = selectedGroups.filter(
    (group) => filter === "all" || group.status === filter
  );
  const documentCell = (row, documentType) => {
    const doc = row.documents.find((item) => item.type === documentType);
    return (
      <DocumentTableCell
        document={doc}
        onView={() => open(doc, doc.status === "done")}
        busy={busy}
      />
    );
  };
  const columns = [
    ...(managed
      ? [
          {
            accessor: "employee",
            header: "Employee",
            headerClassName: "w-[28%]",
            cellClassName: "!py-2 !align-middle",
            render: (_, row) => (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" title={row.employee?.name}>
                  {row.employee?.name || "Employee unavailable"}
                </p>
                <p className="text-[11px] text-gray-500">{row.employee?.employeeId}</p>
              </div>
            ),
          },
        ]
      : []),
    ...Object.entries(labels).map(([key, label]) => ({
      accessor: key,
      header: label,
      headerClassName: managed ? "w-[26%]" : "w-[36%]",
      cellClassName: "!py-2 !align-middle",
      render: (_, row) => documentCell(row, key),
    })),
    {
      accessor: "status",
      header: "Overall Status",
      headerClassName: managed ? "w-[20%]" : "w-[28%]",
      cellClassName: "!py-2 !align-middle",
      render: (value) => <DocumentStatusBadge status={value} />,
    },
  ];
  return (
    <section className="space-y-5 dark:text-white">
      {managed && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm bg-white p-5 shadow-sm dark:bg-gray-900">
            <div>
              <h1 className="text-xl font-bold">
                {managed ? "Documents & Signatures" : "Documents to Sign"}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {managed
                  ? "Send appointment letters and HR policies. Track employee signatures here."
                  : "Open your document, read it and sign. Completed copies stay available here."}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {[
                ["all", "All"],
                ["draft", "Set Placement"],
                ["pending", "Pending"],
                ["awaiting_verification", "Verify"],
                ["needs_correction", "Needs Correction"],
                ["done", "Done"],
                ["cancelled", "Cancelled"],
              ].map(([key, label]) => (
                <Button
                  key={key}
                  text={`${label} (${key === "all" ? selectedGroups.length : selectedGroups.filter((group) => group.status === key).length})`}
                  variant={filter === key ? "primary" : "secondary"}
                  onClick={() => setFilter(key)}
                  className="text-sm"
                />
              ))}
            </div>
            {managed && isHr && canDocument("add") && !employeeFilterId && (
              <Button
                text="+ Add Employee Documents"
                onClick={() => {
                  setEditTarget(null);
                  setEmployeeId("");
                  setFile(null);
                  setFiles({});
                  setUploadOpen(true);
                }}
                disabled={busy}
              />
            )}
          </div>
        </>
      )}
      {!managed && (
        <EmployeeSigningDocuments
          documents={documents}
          loading={loading}
          error={error}
          busy={busy}
          onRefresh={load}
          onOpen={open}
          onDownload={downloadSigned}
          canSign={canSignOwn}
          canDownload={canDownloadOwn}
        />
      )}
      {managed && employeeFilterId && isHr && canDocument("add") && (
        <div className="mb-4 rounded-sm border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 font-semibold">Upload employee documents</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(labels).map(([key, label]) => (
              <FileUploadField
                key={key}
                label={label}
                name={key}
                accept=".pdf,application/pdf"
                hint="PDF only · Maximum 5 MB"
                required
                disabled={busy}
                fileName={files[key]?.name}
                onChange={(e) =>
                  setFiles((currentFiles) => ({
                    ...currentFiles,
                    [key]: e.target.files?.[0] || null,
                  }))
                }
              />
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              text="Save Documents"
              loading={busy}
              onClick={upload}
              disabled={Object.keys(labels).some((key) => !files[key])}
            />
          </div>
        </div>
      )}
      {managed && (
        <CommonTable
          tableClassName="table-fixed min-w-[640px]"
          mobileLayout="stack"
          columns={columns}
          data={selectedVisible}
          loading={loading}
          loadingText="Loading documents…"
          error={error}
          errorAction={<Button text="Try again" onClick={load} variant="secondary" />}
          emptyText={
            filter === "pending"
              ? "No pending signatures. You are all caught up."
              : "No documents found."
          }
          toolbar={
            <div className="flex justify-end border-b border-gray-100 p-3 dark:border-gray-800">
              <Button
                text="Refresh"
                variant="secondary"
                disabled={loading || busy}
                onClick={load}
              />
            </div>
          }
        />
      )}
      {workflow && (
        <Suspense fallback={<CommonLoader compact text="Opening signing screen…" />}>
          <PageSigningModal
            document={workflow}
            managed={managed}
            canSign={canSignOwn}
            canDelete={canDelete}
            canPlacement={canDocument("placement")}
            canReview={canDocument("review")}
            onDelete={() => setDeleteTarget(workflow)}
            onClose={() => setWorkflow(null)}
            onChanged={load}
          />
        </Suspense>
      )}
      {uploadOpen && (
        <CommonModal
          title={editTarget ? `Update ${labels[type]}` : "Add employee documents"}
          subtitle={
            editTarget
              ? "Upload a replacement PDF. The previous copy stays in history."
              : "Select an employee once and upload both PDFs together."
          }
          className="max-w-2xl"
          as="form"
          onSubmit={upload}
          onClose={() => {
            if (!busy) setUploadOpen(false);
          }}
          footer={
            <>
              <Button
                text="Back"
                variant="secondary"
                disabled={busy}
                onClick={() => setUploadOpen(false)}
              />
              <Button
                text={editTarget ? "Save Updated Draft" : "Save Documents"}
                type="submit"
                loading={busy}
                disabled={
                  !employeeId ||
                  (editTarget
                    ? !file
                    : !Object.keys(labels).some(
                        (key) => !employeeDocuments.some((doc) => doc.type === key)
                      ) ||
                      Object.keys(labels).some(
                        (key) => !employeeDocuments.some((doc) => doc.type === key) && !files[key]
                      ))
                }
              />
            </>
          }
        >
          <div className="space-y-5">
            {employeeFilterId ? (
              <div className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <span className="font-medium">Employee:</span>{" "}
                {employees.find((emp) => String(emp._id) === String(employeeFilterId))?.name ||
                  "Selected employee"}
              </div>
            ) : (
              <CustomDropdown
                label="Employee"
                searchable
                required
                disabled={busy || Boolean(editTarget)}
                value={employeeId}
                onChange={(value) => {
                  setEmployeeId(value);
                  setFiles({});
                }}
                placeholder="Search and select an employee"
                options={employees.map((emp) => ({
                  value: emp._id,
                  label: `${emp.name} (${emp.employeeId || emp.email})`,
                }))}
                portalMenu
              />
            )}
            {editTarget ? (
              <FileUploadField
                label={labels[type]}
                name="replacementDocument"
                accept=".pdf,application/pdf"
                hint="PDF only · Maximum 5 MB"
                required
                disabled={busy}
                fileName={file?.name}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(labels).map(([key, label]) => {
                  const current = employeeDocuments.find((doc) => doc.type === key);
                  return current ? (
                    <div
                      key={key}
                      className="rounded-sm border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <p className="font-semibold">{label}</p>
                      <p className="my-2 text-sm text-gray-500">Already added for this employee.</p>
                      {["draft", "pending"].includes(current.status) ? (
                        <Button
                          text="Update PDF"
                          variant="secondary"
                          onClick={() => edit(current)}
                          disabled={busy}
                        />
                      ) : (
                        <p className="text-xs text-gray-500">Locked after employee signing.</p>
                      )}
                    </div>
                  ) : (
                    <FileUploadField
                      key={`${employeeId}-${key}`}
                      label={label}
                      name={key}
                      accept=".pdf,application/pdf"
                      hint="PDF only · Maximum 5 MB"
                      required
                      disabled={busy || !employeeId}
                      fileName={files[key]?.name}
                      onChange={(e) =>
                        setFiles((currentFiles) => ({
                          ...currentFiles,
                          [key]: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  );
                })}
              </div>
            )}
            <p className="rounded-sm bg-orange-50 p-3 text-sm text-orange-900 dark:bg-orange-950/30 dark:text-orange-200">
              {editTarget
                ? "The replacement is a draft. Set page placements and send again. Previous signed copies stay in History."
                : "Save both PDFs here. Then open each document to set page placements and send for signatures. Done requires HR/Admin approval."}
            </p>
          </div>
        </CommonModal>
      )}
      {history && (
        <CommonModal
          title="Document history"
          subtitle={labels[history.doc.type]}
          className="max-w-2xl"
          onClose={() => setHistory(null)}
        >
          <CommonTable
            data={history.rows}
            columns={[
              { accessor: "revision", header: "Version", render: (value) => value || 1 },
              { accessor: "filename", header: "File" },
              { accessor: "status", header: "Status" },
              {
                accessor: "signedAt",
                header: "Signed on",
                render: (value) => (value ? new Date(value).toLocaleString() : "—"),
              },
              {
                accessor: "_id",
                header: "Copies",
                render: (_, version) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      text="Original"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => open(history.doc, false, version)}
                    />
                    {["done", "awaiting_verification"].includes(version.status) && (
                      <Button
                        text="Signed Copy"
                        variant="success"
                        disabled={busy}
                        onClick={() => open(history.doc, true, version)}
                      />
                    )}
                  </div>
                ),
              },
            ]}
            emptyText="No previous versions."
          />
        </CommonModal>
      )}
      {cancelTarget && (
        <CommonModal
          title="Cancel signature request?"
          className="max-w-md"
          onClose={() => {
            if (!busy) setCancelTarget(null);
          }}
          footer={
            <>
              <Button
                text="Keep Request"
                variant="secondary"
                disabled={busy}
                onClick={() => setCancelTarget(null)}
              />
              <Button
                text="Cancel Request"
                variant="danger"
                loading={busy}
                onClick={() => cancel(cancelTarget)}
              />
            </>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {labels[cancelTarget.type]} for {cancelTarget.employee?.name || "this employee"} will no
            longer be available for signing. You can send a new document later.
          </p>
        </CommonModal>
      )}
      {deleteTarget && (
        <CommonModal
          title="Delete employee document?"
          className="max-w-md"
          onClose={() => {
            if (!busy) setDeleteTarget(null);
          }}
          footer={
            <>
              <Button
                text="Keep Document"
                variant="secondary"
                disabled={busy}
                onClick={() => setDeleteTarget(null)}
              />
              <Button
                text="Delete Document"
                variant="danger"
                loading={busy}
                onClick={() => deleteDocument(deleteTarget)}
              />
            </>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {labels[deleteTarget.type]} for {deleteTarget.employee?.name || "this employee"} will
            disappear from active lists and signing access. Existing signed copies and
            version/signature audit records will be retained.
          </p>
        </CommonModal>
      )}
      {preview && (
        <CommonModal
          title={`${labels[preview.doc.type]}${preview.signed ? " · Signed copy" : ""}`}
          subtitle={preview.doc.filename}
          className="max-w-4xl"
          bodyClassName="space-y-4"
          onClose={() => {
            if (!busy) close();
          }}
          footer={
            <>
              {(managed ? canDocument("download") : canDownloadOwn) && (
                <a
                  href={preview.url}
                  download={`${preview.signed ? "signed-" : ""}${preview.doc.filename}`}
                  className="mr-auto inline-flex items-center rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  Download PDF
                </a>
              )}
              <Button text="Close" variant="secondary" disabled={busy} onClick={close} />
            </>
          }
        >
          {preview.doc.status !== "archived" && (
            <div className="flex flex-wrap items-center gap-2">
              {preview.doc.status === "done" && (
                <Button
                  text={preview.signed ? "View Original" : "View Signed PDF"}
                  variant="secondary"
                  disabled={busy}
                  onClick={() => open(preview.doc, !preview.signed)}
                  className="text-xs"
                />
              )}
              {managed && canDocument("download") && preview.doc.status === "done" && (
                <Button
                  disabled={busy}
                  onClick={() => downloadSigned(preview.doc)}
                  className="inline-flex items-center gap-1.5 text-xs"
                >
                  <FiDownload />
                  Download Signed PDF
                </Button>
              )}
              {managed &&
                isHr &&
                canDocument("update") &&
                ["draft", "pending"].includes(preview.doc.status) && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      const doc = preview.doc;
                      close();
                      edit(doc);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs"
                  >
                    <FiEdit2 />
                    Update PDF
                  </Button>
                )}
              {(preview.doc.revision || 1) > 1 && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    const doc = preview.doc;
                    close();
                    showHistory(doc);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs"
                >
                  <FiClock />
                  History
                </Button>
              )}
              {managed && isHr && canDocument("cancel") && preview.doc.status === "pending" && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    const doc = preview.doc;
                    close();
                    setCancelTarget(doc);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs !text-red-600"
                >
                  <FiX />
                  Cancel Request
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => setDeleteTarget(preview.doc)}
                  className="inline-flex items-center gap-1.5 text-xs"
                >
                  <FiTrash2 />
                  Delete
                </Button>
              )}
            </div>
          )}
          <iframe
            title="Document PDF"
            src={preview.url}
            className="h-[45vh] w-full rounded-sm border bg-white dark:border-gray-700"
          />
        </CommonModal>
      )}
    </section>
  );
}
