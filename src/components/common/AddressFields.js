import InputField from "./InputField";

const addressFields = [
  ["street", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["country", "Country"],
  ["pincode", "Pincode"],
];

const AddressFields = ({ value = {}, onChange, errors = {}, className = "" }) => (
  <div className={`grid grid-cols-1 gap-3 border-t pt-3 md:grid-cols-5 ${className}`}>
    {addressFields.map(([name, label]) => (
      <InputField key={name} label={label} type="text" name={name} value={value[name] || ""} onChange={onChange} error={errors[name]} maxLength={name === "pincode" ? 6 : 120} inputMode={name === "pincode" ? "numeric" : undefined} />
    ))}
  </div>
);

export default AddressFields;
