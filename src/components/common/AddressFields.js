import InputField from "./InputField";
import CustomDropdown from "./CustomDropdown";

const countries = ["India"];
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const addressFields = [
  ["street", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["country", "Country"],
  ["pincode", "Pincode"],
];

const AddressFields = ({ value = {}, onChange, errors = {}, className = "" }) => (
  <div className={`grid grid-cols-1 gap-3 border-t pt-3 md:grid-cols-5 ${className}`}>
    {addressFields.map(([name, label]) =>
      name === "state" ? (
        <CustomDropdown
          key={name}
          label={label}
          value={value[name] || ""}
          onChange={(nextValue) => onChange?.({ target: { name, value: nextValue } })}
          options={indianStates}
          error={errors[name]}
          placeholder="Select state"
          portalMenu
        />
      ) : name === "country" ? (
        <CustomDropdown
          key={name}
          label={label}
          value={value[name] || "India"}
          onChange={(nextValue) => onChange?.({ target: { name, value: nextValue } })}
          options={countries}
          error={errors[name]}
          showPlaceholder={false}
          portalMenu
        />
      ) : (
        <InputField
          key={name}
          label={label}
          type="text"
          name={name}
          value={value[name] || ""}
          onChange={onChange}
          error={errors[name]}
          maxLength={name === "pincode" ? 6 : 120}
          inputMode={name === "pincode" ? "numeric" : undefined}
        />
      )
    )}
  </div>
);

export default AddressFields;
