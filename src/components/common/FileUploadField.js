import { useEffect, useRef, useState } from "react";
import { FiDownload, FiEye, FiFileText, FiUploadCloud } from "react-icons/fi";

const FileUploadField = ({
  label,
  name,
  maxSizeBytes = 5 * 1024 * 1024,
  hint = "Upload JPG, PNG, PDF",
  accept = ".pdf,.jpg,.jpeg,.png",
  onChange,
  fileName,
  error,
  required = false,
  previewText,
  onPreview,
  selectedPreviewUrl,
  previewTitle = "Selected image",
  previewType,
  disabled = false,
  multiple = false,
  currentFileLabel,
  onPreviewCurrent,
  onDownloadCurrent,
  currentStatus,
  onCurrentAction,
  currentActionLabel,
  currentActionLoading = false,
  uploaded = false,
  selectedFile = null,
  className = "",
}) => {
  const [sizeError, setSizeError] = useState("");
  const handleChange = (event) => {
    const oversized = Array.from(event.target.files || []).find((file) => file.size > maxSizeBytes);
    if (oversized) {
      setSizeError(`${oversized.name}: ${(oversized.size / 1024 / 1024).toFixed(2)} MB. Maximum file size is ${(maxSizeBytes / 1024 / 1024).toFixed(1)} MB. Choose a smaller file.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setSizeError("");
    onChange?.(event);
  };
  const acceptsImage = /image|jpg|jpeg|png|webp/i.test(String(accept || ""));
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  useEffect(() => {
    if (!selectedFile) { setLocalPreviewUrl(""); return undefined; }
    const url = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);
  const activePreviewUrl = selectedPreviewUrl || localPreviewUrl;

  const handlePaste = (event) => {
    if (!acceptsImage) return;
    const imageFile = Array.from(event.clipboardData?.items || [])
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();
    if (!imageFile) return;

    event.preventDefault();
    handleChange({
      target: {
        name,
        files: [imageFile],
      },
    });
  };
  const emitFile = (file) => file && handleChange({ target: { name, files: [file] } });

  const isPdfPreview = previewType === "pdf" || String(activePreviewUrl || "").startsWith("data:application/pdf") || /\.pdf(?:$|[?#])/i.test(String(activePreviewUrl || ""));
  const canShowImagePreview = Boolean(
    activePreviewUrl && !isPdfPreview && (
      previewType === "image" ||
      String(activePreviewUrl).startsWith("data:image/") ||
      /\.(jpg|jpeg|png|webp|gif|bmp)(?:$|[?#])/i.test(String(activePreviewUrl))
    )
  );
  const canShowPdfPreview = Boolean(activePreviewUrl && isPdfPreview);

  return (
    <div className={`${uploaded && !selectedFile ? "hidden" : "flex"} flex-col text-sm font-medium text-gray-700 dark:text-gray-200 ${className}`}>
      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); emitFile(event.dataTransfer.files?.[0]); }}
        className={`mt-1 cursor-pointer rounded-lg border border-dashed p-3 focus:outline-none focus:ring-2 focus:ring-[#f84525] ${dragging ? "border-[#f84525] bg-orange-50" : uploaded ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/20" : "border-[#f7a08f] bg-[#fffaf8] dark:border-gray-600 dark:bg-gray-800"}`}
      >
        <div className="flex min-w-0 flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
          <label className="flex min-w-0 items-center gap-2 text-sm font-semibold leading-5 text-gray-800 dark:text-gray-100 lg:flex-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#f84525] shadow-sm dark:bg-gray-900">
              <FiUploadCloud className="h-4 w-4" />
            </span>
            <span className="min-w-0">{label}{required ? <span className="text-red-500"> *</span> : null}</span>
          </label>
          <input
            ref={inputRef}
            id={`${name}-file-upload`}
            type="file"
            name={name}
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            required={required}
            disabled={disabled}
            className="hidden"
          />
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:flex-1">
            <span className="min-w-0 flex-1 truncate rounded-md bg-white px-2.5 py-2 text-xs text-gray-600 ring-1 ring-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700">{fileName || "No file chosen"}</span>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="h-9 w-full shrink-0 rounded-md bg-[#f84525] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#de391a] disabled:opacity-60 sm:w-auto">Choose file</button>
          </div>
        </div>
        <p className="mt-2 border-t border-[#f1d7cf] pt-2 text-[11px] leading-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">{hint}</p>
        {currentFileLabel && !activePreviewUrl ? (
          <p className="mt-3 rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300">
            {currentFileLabel}
          </p>
        ) : null}
        {currentStatus || onCurrentAction ? (
          <div className="mt-3 flex items-center justify-end gap-2">
            {currentStatus ? (
              <span className={`rounded-sm px-2 py-1 text-[11px] font-semibold capitalize ${
                currentStatus === "pending"
                  ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : currentStatus === "approved"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}>
                {currentStatus}
              </span>
            ) : null}
            {onCurrentAction ? (
              <button
                type="button"
                onClick={onCurrentAction}
                disabled={currentActionLoading}
                className="shrink-0 cursor-pointer rounded-sm bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
              >
                {currentActionLoading ? "Approving..." : currentActionLabel || "Approve"}
              </button>
            ) : null}
          </div>
        ) : null}
        {selectedFile && localPreviewUrl && !selectedPreviewUrl ? <div className="mt-2 flex items-center gap-2 text-xs text-green-700"><FiEye /> Preview ready</div> : null}
        {canShowImagePreview ? (
          <div className="mt-3 flex items-center gap-3 rounded-sm border border-[#f7a08f] bg-white p-2 dark:border-gray-600 dark:bg-gray-900">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-[#ffd8cf] bg-[#fff5f3] dark:border-gray-700 dark:bg-gray-800">
              <img src={activePreviewUrl} alt={label} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{previewTitle}</p>
              <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                {fileName || (currentFileLabel ? "Saved image" : "Preview ready")}
              </p>
            </div>
            {onPreviewCurrent ? (
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={onPreviewCurrent} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-[#ffd0c7] px-2.5 py-1 text-xs font-semibold text-[#f84525] hover:bg-[#fff1ed] dark:border-gray-600 dark:text-[#ff8066] dark:hover:bg-gray-800">
                  <FiEye /> Preview
                </button>
                {onDownloadCurrent ? <button type="button" onClick={onDownloadCurrent} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-blue-300"><FiDownload /> Download</button> : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {canShowPdfPreview ? (
          <div className="mt-3 flex items-center gap-3 rounded-sm border border-[#f7a08f] bg-white p-2 dark:border-gray-600 dark:bg-gray-900">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-red-100 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              <div className="flex flex-col items-center gap-0.5">
                <FiFileText className="text-lg" />
                <span className="text-[9px] font-bold uppercase">PDF</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{previewTitle === "Selected image" ? "PDF preview" : previewTitle}</p>
              <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{fileName || (currentFileLabel ? "Saved PDF · Preview opens in modal" : "PDF · Preview opens in modal")}</p>
            </div>
            {onPreviewCurrent ? (
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={onPreviewCurrent} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-[#ffd0c7] px-2.5 py-1 text-xs font-semibold text-[#f84525] hover:bg-[#fff1ed] dark:border-gray-600 dark:text-[#ff8066] dark:hover:bg-gray-800">
                  <FiEye /> Preview
                </button>
                {onDownloadCurrent ? <button type="button" onClick={onDownloadCurrent} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-blue-300"><FiDownload /> Download</button> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {fileName && !canShowImagePreview && !canShowPdfPreview ? <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fileName}</span> : null}
      {previewText && onPreview ? (
        <button
          type="button"
          onClick={onPreview}
          className="mt-1 cursor-pointer text-left text-xs text-[#f84525] underline dark:text-[#ff8066]"
        >
          {previewText}
        </button>
      ) : null}
      {sizeError || error ? <span role="alert" className="mt-1 text-sm text-red-500 dark:text-red-400">{sizeError || error}</span> : null}
    </div>
  );
};

export default FileUploadField;
