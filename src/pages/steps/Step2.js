import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";

const Step2 = ({
  formData,
  setFormData,
  errors,
  setErrors,
  handleCheckbox,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Reference Mobile field
    if (name === "referenceMobile") {
      // Allow only digits, max 10
      if (value === "" || (/^[0-9\b]+$/.test(value) && value.length <= 10)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error
    }
  };

  return (
    <div className="space-y-4">
      <InputField
        label="Certificate"
        name="certificate"
        value={formData.certificate}
        onChange={handleChange}
      />
      <InputField
        label="Reference Name"
        name="referenceName"
        value={formData.referenceName}
        onChange={handleChange}
      />
      <InputField
        label="Reference Mobile"
        name="referenceMobile"
        value={formData.referenceMobile}
        onChange={handleChange}
        placeholder="Enter 10-digit mobile"
        error={errors.referenceMobile}
      />

      <SelectField
        label="Apply for Job"
        name="jobRole"
        value={formData.jobRole}
        onChange={handleChange}
        options={[
          "Frontend Developer",
          "Backend Developer",
          "Fullstack Developer",
          "Designer",
          "QA Engineer",
          "Other",
        ]}
        error={errors.jobRole}
        required
      />
      {formData.jobRole === "Other" && (
        <InputField
          label="Other Role"
          name="otherJobRole"
          value={formData.otherJobRole}
          onChange={handleChange}
          error={errors.otherJobRole}
          required
        />
      )}

      <InputField
        label="Skills"
        name="skills"
        value={formData.skills}
        onChange={handleChange}
        error={errors.skills}
        required
      />

      <p className="font-medium mt-2">CMS</p>
      {["WordPress", "Shopify", "Drupal", "Magento"].map((item) => (
        <label key={item} className="block">
          <input
            type="checkbox"
            checked={formData.cms.includes(item)}
            onChange={() => {
              handleCheckbox("cms", item);
              setErrors((prev) => ({ ...prev, cms: "" }));
            }}
          />{" "}
          {item}
        </label>
      ))}

      <p className="font-medium mt-2">Framework</p>
      {["Laravel", "CodeIgniter", "Symfony"].map((item) => (
        <label key={item} className="block">
          <input
            type="checkbox"
            checked={formData.framework.includes(item)}
            onChange={() => {
              handleCheckbox("framework", item);
              setErrors((prev) => ({ ...prev, framework: "" }));
            }}
          />{" "}
          {item}
        </label>
      ))}

      <SelectField
        label="Night Shift"
        name="nightShift"
        value={formData.nightShift}
        onChange={handleChange}
        options={["Yes", "No"]}
        error={errors.nightShift}
        required
      />
    </div>
  );
};

export default Step2;
