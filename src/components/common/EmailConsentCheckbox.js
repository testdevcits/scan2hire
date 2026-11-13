const EmailConsentCheckbox = ({
  checked,
  onChange,
  recipient,
  disabled = false,
  label = "Send this update by email",
  description,
  className = "",
}) => (
  <label className={`flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700 ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled || !recipient}
      onChange={(event) => onChange?.(event.target.checked)}
      className="mt-0.5 accent-[#f84525]"
    />
    <span>
      <span className="block font-medium">{label}</span>
      <span className="text-xs text-gray-500">
        {recipient ? description : "Candidate email is missing."}
      </span>
    </span>
  </label>
);

export default EmailConsentCheckbox;
