import { useEffect, useState } from "react";
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
}) => {
  const [entered, setEntered] = useState(!drawer);

  useEffect(() => {
    if (!drawer || !open) {
      setEntered(!drawer);
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [drawer, open]);

  const visible = !drawer || (open && entered);
  return createPortal(
    <div
      className={`fixed inset-0 z-[140] flex bg-black/45 transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${drawer ? `items-stretch justify-end ${visible ? "opacity-100" : "pointer-events-none opacity-0"}` : "items-center justify-center p-3 sm:p-5"}`}
      role="presentation"
      onMouseDown={(event) => { if (drawer && event.target === event.currentTarget) onClose?.(); }}
    >
      <Panel
        onSubmit={onSubmit}
        className={`flex w-full flex-col overflow-hidden border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 ${drawer ? "m-0 h-dvh max-h-dvh self-stretch rounded-none" : "max-h-[92vh] rounded-lg"} ${className}`}
        style={drawer ? { transform: visible ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)", transition: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)" } : undefined}
        role={Panel === "form" ? undefined : "dialog"}
        aria-modal="true"
        aria-labelledby="common-modal-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
          <div className="min-w-0">
            <h2 id="common-modal-title" className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {headerContent}
          <button type="button" onClick={onClose} className="rounded-sm p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100" aria-label="Close dialog">
            <FiX />
          </button>
        </header>
        <div className={`min-h-0 flex-1 overflow-auto p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
        {footer && <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">{footer}</footer>}
      </Panel>
    </div>,
    document.body
  );
};

export default CommonModal;
