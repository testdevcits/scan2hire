const getPreviewType = (url = "") => {
  if (String(url).startsWith("data:image/")) return "image";
  if (String(url).startsWith("data:application/pdf")) return "pdf";
  const cleanUrl = String(url).split("?")[0].toLowerCase();
  if (cleanUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/)) return "image";
  if (cleanUrl.endsWith(".pdf")) return "pdf";
  return "file";
};

const FilePreviewModal = ({ title, url, onClose }) => {
  if (!url) return null;

  const previewType = getPreviewType(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-2 sm:p-4">
      <div className="flex h-[78vh] w-full max-w-4xl flex-col overflow-hidden rounded-sm bg-white shadow-xl dark:bg-gray-900">
        <div className="px-4 py-3 border-b dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate">
            {title || "Preview"}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#f84525] underline"
            >
              Open
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-[#f84525] text-lg px-2"
              aria-label="Close preview"
            >
              x
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-white dark:bg-gray-900">
          {previewType === "image" ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-3">
              <img
                src={url}
                alt={title || "Preview"}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <iframe
              title={title || "Preview"}
              src={url}
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
