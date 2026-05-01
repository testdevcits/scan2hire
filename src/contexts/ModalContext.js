import { createContext, useCallback, useContext, useState } from "react";
import ConfirmationModal from "../components/common/ConfirmationModal";

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  const closeModal = useCallback(() => setModal(null), []);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setModal({
        title: options.title || "Confirm action",
        message: options.message || "Are you sure?",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        tone: options.tone || "primary",
        fields: options.fields || [],
        initialValues: options.initialValues || {},
        onCancel: () => {
          setModal(null);
          resolve(null);
        },
        onConfirm: (values) => {
          setModal(null);
          resolve(values || true);
        },
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, closeModal }}>
      {children}
      {modal && <ConfirmationModal {...modal} />}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used inside ModalProvider");
  }
  return context;
};
