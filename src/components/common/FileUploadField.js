import { FiEye, FiFileText, FiUploadCloud } from "react-icons/fi";

const FileUploadField = ({
  label,
  name,
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
  currentStatus,
  onCurrentAction,
  currentActionLabel,
  currentActionLoading = false,
}) => {
  const acceptsImage = /image|jpg|jpeg|png|webp/i.test(String(accept || ""));

  const handlePaste = (event) => {
    if (!acceptsImage) return;
    const imageFile = Array.from(event.clipboardData?.items || [])
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();
    if (!imageFile) return;

    event.preventDefault();
    onChange?.({
      target: {
        name,
        files: [imageFile],
      },
    });
  };

  const isPdfPreview = previewType === "pdf" || String(selectedPreviewUrl || "").startsWith("data:application/pdf") || /\.pdf(?:$|[?#])/i.test(String(selectedPreviewUrl || ""));
  const canShowImagePreview = Boolean(
    selectedPreviewUrl && !isPdfPreview && (
      previewType === "image" ||
      String(selectedPreviewUrl).startsWith("data:image/") ||
      /\.(jpg|jpeg|png|webp|gif|bmp)(?:$|[?#])/i.test(String(selectedPreviewUrl))
    )
  );
  const canShowPdfPreview = Boolean(selectedPreviewUrl && isPdfPreview);

  return (
    <div className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
      <label htmlFor={`${name}-file-upload`} className="cursor-pointer">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div
        tabIndex={0}
        onPaste={handlePaste}
        className="mt-1 cursor-pointer rounded-sm border border-dashed border-[#f7a08f] bg-[#fffaf8] px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#f84525] dark:border-gray-600 dark:bg-gray-800"
      >
        <div className="mb-2 flex items-center gap-2 text-[#f84525] dark:text-[#ff8066]">
          <FiUploadCloud />
          <span className="text-sm">{hint}</span>
        </div>
        <input
          id={`${name}-file-upload`}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="w-full min-w-0 cursor-pointer text-xs text-gray-700 sm:text-sm dark:text-gray-200 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-[#f84525] file:px-3 file:py-2 file:text-white hover:file:bg-[#e93819] disabled:cursor-not-allowed disabled:opacity-60"
        />
        {acceptsImage ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">You can paste a copied image here.</p>
        ) : null}
        {currentFileLabel && !selectedPreviewUrl ? (
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
        {canShowImagePreview ? (
          <div className="mt-3 flex items-center gap-3 rounded-sm border border-[#f7a08f] bg-white p-2 dark:border-gray-600 dark:bg-gray-900">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-[#ffd8cf] bg-[#fff5f3] dark:border-gray-700 dark:bg-gray-800">
              <img src={selectedPreviewUrl} alt={label} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{previewTitle}</p>
              <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                {fileName || (currentFileLabel ? "Saved image" : "Preview ready")}
              </p>
            </div>
            {onPreviewCurrent ? (
              <button type="button" onClick={onPreviewCurrent} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-[#ffd0c7] px-2.5 py-1 text-xs font-semibold text-[#f84525] hover:bg-[#fff1ed] dark:border-gray-600 dark:text-[#ff8066] dark:hover:bg-gray-800">
                <FiEye /> Preview
              </button>
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
              <button type="button" onClick={onPreviewCurrent} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-[#ffd0c7] px-2.5 py-1 text-xs font-semibold text-[#f84525] hover:bg-[#fff1ed] dark:border-gray-600 dark:text-[#ff8066] dark:hover:bg-gray-800">
                <FiEye /> Preview
              </button>
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
      {error ? <span className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</span> : null}
    </div>
  );
};

export default FileUploadField;
