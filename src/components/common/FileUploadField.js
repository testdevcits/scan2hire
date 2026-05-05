import { FiUploadCloud } from "react-icons/fi";

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
}) => {
  const canShowImagePreview =
    selectedPreviewUrl &&
    (String(accept).includes(".jpg") ||
      String(accept).includes(".jpeg") ||
      String(accept).includes(".png") ||
      String(accept).includes(".webp"));

  return (
    <label className="flex flex-col text-sm font-medium text-gray-700">
      <span>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <div className="mt-1 border border-dashed border-[#f7a08f] bg-[#fffaf8] rounded-sm px-3 py-3">
        <div className="flex items-center gap-2 text-[#f84525] mb-2">
          <FiUploadCloud />
          <span className="text-sm">{hint}</span>
        </div>
        <input
          type="file"
          name={name}
          accept={accept}
          onChange={onChange}
          required={required}
          className="w-full min-w-0 text-xs sm:text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-[#f84525] file:px-3 file:py-2 file:text-white"
        />
        {canShowImagePreview ? (
          <div className="mt-3 flex items-center gap-3 rounded-sm border border-[#f7a08f] bg-white p-2">
            <div className="w-16 h-16 rounded-sm overflow-hidden border border-[#ffd8cf] bg-[#fff5f3] shrink-0">
              <img src={selectedPreviewUrl} alt={label} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">Selected image</p>
              {fileName ? (
                <p className="text-xs text-gray-500 truncate mt-1">{fileName}</p>
              ) : (
                <p className="text-xs text-gray-500 truncate mt-1">Preview ready</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {fileName && !canShowImagePreview ? <span className="text-xs text-gray-500 mt-1">{fileName}</span> : null}
      {previewText && onPreview ? (
        <button
          type="button"
          onClick={onPreview}
          className="text-left text-xs text-[#f84525] underline mt-1"
        >
          {previewText}
        </button>
      ) : null}
      {error ? <span className="text-red-500 text-sm mt-1">{error}</span> : null}
    </label>
  );
};

export default FileUploadField;
