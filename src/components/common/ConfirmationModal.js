import { useState } from "react";
import Button from "./Button";

const ConfirmationModal = ({
  title,
  message,
  confirmText,
  cancelText,
  tone = "primary",
  fields = [],
  initialValues = {},
  onCancel,
  onConfirm,
}) => {
  const [values, setValues] = useState(initialValues);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-100">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
        </div>

        {fields.length > 0 && (
          <div className="px-5 py-4 space-y-3">
            {fields.map((field) => (
              <label key={field.name} className="block text-sm font-medium">
                {field.label}
                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={values[field.name] || ""}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                    required={field.required}
                  >
                    <option value="">Select</option>
                    {(field.options || []).map((option) => (
                      <option
                        key={option.value || option}
                        value={option.value || option}
                      >
                        {option.label || option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={values[field.name] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
                    required={field.required}
                  />
                )}
              </label>
            ))}
          </div>
        )}

        <div className="px-5 py-4 border-t flex flex-col sm:flex-row justify-end gap-2">
          <Button text={cancelText} variant="secondary" onClick={onCancel} />
          <Button
            text={confirmText}
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={() => onConfirm(values)}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
