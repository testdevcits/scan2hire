import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";
import FileUploadField from "../../components/common/FileUploadField";

const Step2 = ({
  formData,
  setFormData,
  errors,
  setErrors,
  handleCheckbox,
}) => {
  const skillOptionsByRole = {
    "Frontend Developer": ["HTML/CSS", "JavaScript", "React", "Vue", "Angular", "Tailwind CSS", "TypeScript", "Other"],
    "Backend Developer": ["Node.js", "Express", "PHP", "Laravel", "Python", "Django", "MongoDB", "MySQL", "Other"],
    "Fullstack Developer": ["HTML/CSS", "JavaScript", "React", "Node.js", "Express", "MongoDB", "MySQL", "Other"],
    Designer: ["UI/UX Design", "Figma", "Adobe XD", "Photoshop", "Illustrator", "Wireframing", "Other"],
    "QA Engineer": ["Manual Testing", "Automation Testing", "Selenium", "API Testing", "Postman", "Jira", "Other"],
    Other: ["HTML/CSS", "JavaScript", "React", "Node.js", "PHP", "Laravel", "UI/UX Design", "Digital Marketing", "Other"],
  };

  const skillOptions = skillOptionsByRole[formData.jobRole] || skillOptionsByRole.Other;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "certificate" || name === "resume") {
      const file = files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [name]: reader.result,
          [`${name}Name`]: file.name,
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
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
      setFormData((prev) => ({ ...prev, [name]: value, ...(name === "jobRole" ? { skills: [], otherSkills: "" } : {}) }));
      setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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

      <div className="md:col-span-2 border rounded-sm p-3 sm:p-4">
        <p className="font-medium mb-3">
          Skills <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2">
          {skillOptions.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm bg-gray-50 rounded-sm px-3 py-2 min-h-10">
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
      <FileUploadField
        label="Resume Upload"
        name="resume"
        accept=".pdf,.doc,.docx"
        hint="Upload PDF, DOC, DOCX"
        required
        onChange={(e) => handleChange(e)}
        fileName={formData.resumeName}
        error={errors.resume}
      />
      <FileUploadField
        label="Certificate Upload (Optional)"
        name="certificate"
        accept=".pdf,.jpg,.jpeg,.png"
        hint="Upload JPG, PNG, PDF"
        onChange={(e) => handleChange(e)}
        fileName={formData.certificateName}
      />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="border rounded-sm p-3 sm:p-4">
          <p className="font-medium mb-3">CMS</p>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
            {["WordPress", "Shopify", "Drupal", "Magento"].map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm bg-gray-50 rounded-sm px-3 py-2 min-h-10">
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

        <div className="border rounded-sm p-3 sm:p-4">
          <p className="font-medium mb-3">Framework</p>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
            {["Laravel", "CodeIgniter", "Symfony", "React"].map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm bg-gray-50 rounded-sm px-3 py-2 min-h-10">
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
