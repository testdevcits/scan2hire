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
    const { name, value, files } = e.target;

    if (name === "certificate") {
      const file = files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          certificate: reader.result,
          certificateName: file.name,
        }));
      };
      reader.readAsDataURL(file);
      return;
    }

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
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="md:col-span-2 border rounded-lg p-4">
        <p className="font-medium mb-3">
          Skills <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            "HTML/CSS",
            "JavaScript",
            "React",
            "Node.js",
            "PHP",
            "Laravel",
            "UI/UX Design",
            "Digital Marketing",
            "Other",
          ].map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm bg-gray-50 rounded-md px-3 py-2">
              <input
                type="checkbox"
                checked={formData.skills.includes(item)}
                onChange={() => {
                  handleCheckbox("skills", item);
                  setErrors((prev) => ({ ...prev, skills: "" }));
                }}
              />
              {item}
            </label>
          ))}
        </div>
        {errors.skills && <span className="text-red-500 text-sm mt-1 block">{errors.skills}</span>}
      </div>
      {formData.skills.includes("Other") && (
        <InputField
          label="Other Skill"
          name="otherSkills"
          value={formData.otherSkills}
          onChange={handleChange}
          error={errors.otherSkills}
          required
        />
      )}
      <label className="flex flex-col text-sm font-medium text-gray-700">
        Certificate Upload
        <input
          type="file"
          name="certificate"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f84525]"
        />
        {formData.certificateName && (
          <span className="text-xs text-gray-500 mt-1">{formData.certificateName}</span>
        )}
      </label>
      <InputField
        label="Reference Name"
        name="referenceName"
        value={formData.referenceName}
        onChange={handleChange}
        placeholder="Optional"
      />
      <InputField
        label="Reference Mobile"
        name="referenceMobile"
        value={formData.referenceMobile}
        onChange={handleChange}
        placeholder="Optional 10-digit mobile"
        error={errors.referenceMobile}
      />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <p className="font-medium mb-3">CMS</p>
          <div className="grid grid-cols-2 gap-2">
            {["WordPress", "Shopify", "Drupal", "Magento"].map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm bg-gray-50 rounded-md px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.cms.includes(item)}
                  onChange={() => {
                    handleCheckbox("cms", item);
                    setErrors((prev) => ({ ...prev, cms: "" }));
                  }}
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <p className="font-medium mb-3">Framework</p>
          <div className="grid grid-cols-2 gap-2">
            {["Laravel", "CodeIgniter", "Symfony", "React"].map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm bg-gray-50 rounded-md px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.framework.includes(item)}
                  onChange={() => {
                    handleCheckbox("framework", item);
                    setErrors((prev) => ({ ...prev, framework: "" }));
                  }}
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
