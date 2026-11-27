import Checkbox from "../Checkbox";

const EmailConsentCheckbox = ({
  checked,
  onChange,
  recipient,
  disabled = false,
  label = "Send this update by email",
  description,
  className = "",
}) => (
  <Checkbox
    checked={checked}
    onChange={onChange}
    disabled={disabled || !recipient}
    label={label}
    description={recipient ? description : "Candidate email is missing."}
    className={className}
  />
);

export default EmailConsentCheckbox;
