import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

/** Shared dialog shell with a fixed header/footer and independently scrollable body. */
const CommonModal = ({
  title,
  subtitle,
  headerContent,
  onClose,
  children,
  footer,
  className = "",
  bodyClassName = "",
  as: Panel = "section",
  onSubmit,
  drawer = false,
  open = true,
  showClose = true,
}) => {
  return createPortal(
    <div
      className={`fixed inset-0 z-[140]  flex bg-black/45 ${drawer ? `transition-opacity duration-300 ease-in-out ${open ? "opacity-100" : "pointer-events-none opacity-0"}` : "items-center justify-center p-3 sm:p-5"}`}
      role="presentation"
      onMouseDown={(event) => {
        if (drawer && event.target === event.currentTarget) onClose?.();
      }}
    >
      <Panel
        onSubmit={onSubmit}
        className={`flex w-full flex-col overflow-hidden border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 ${drawer ? `absolute inset-y-0 right-0 m-0 h-dvh max-h-dvh w-full self-stretch rounded-none transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}` : "max-h-[92vh] rounded-lg"} ${className}`}
        onMouseDown={(event) => {
          if (drawer) event.stopPropagation();
        }}
        role={Panel === "form" ? undefined : "dialog"}
        aria-modal="true"
        aria-labelledby="common-modal-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
          <div className="min-w-0">
            <h2 id="common-modal-title" className="font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {headerContent}
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              aria-label="Close dialog"
            >
              <FiX />
            </button>
          )}
        </header>
        <div className={`min-h-0 flex-1 overflow-auto p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
            {footer}
          </footer>
        )}
      </Panel>
    </div>,
    document.body
  );
};

export default CommonModal;
