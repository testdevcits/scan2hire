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
      </div>
      {fileName ? <span className="text-xs text-gray-500 mt-1">{fileName}</span> : null}
      {canShowImagePreview ? (
        <div className="mt-2 w-20 h-20 rounded-sm overflow-hidden border border-[#f7a08f] bg-[#fff5f3]">
          <img src={selectedPreviewUrl} alt={label} className="w-full h-full object-cover" />
        </div>
      ) : null}
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
