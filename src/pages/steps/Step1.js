import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";

const degreeOptions = [
  "B.Tech / BE",
  "BCA",
  "MCA",
  "B.Sc",
  "M.Sc",
  "Diploma",
  "B.Des",
  "MBA",
  "Other",
];

const branchOptions = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "UI/UX Design",
  "Marketing",
  "Finance",
  "Other",
];

const salaryPeriodOptions = ["monthly", "annual"];

const Step1 = ({ formData, setFormData, errors, setErrors }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Numeric fields only
    if (["experience", "currentSalary", "expectedSalary"].includes(name)) {
      if (value === "" || /^[0-9\b]+$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error
      }
    }
    // Mobile number fields
    else if (["mobile", "altMobile"].includes(name)) {
      // Allow only digits, max 10
      if (value === "" || (/^[0-9\b]+$/.test(value) && value.length <= 10)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error
      }
    } else {
      if (name === "experienceType" && value === "fresher") {
        setFormData((prev) => ({
          ...prev,
          experienceType: value,
          experience: "0",
          currentSalary: "",
          currentCompany: "",
        }));
        setErrors((prev) => ({
          ...prev,
          experienceType: "",
          experience: "",
          currentSalary: "",
          currentCompany: "",
        }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "qualification" ? { branch: "" } : {}),
      }));
      setErrors((prev) => ({ ...prev, [name]: "", ...(name === "qualification" ? { branch: "" } : {}) })); // Clear error
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      <InputField
        label="Full Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter your name"
        error={errors.name}
        required
      />
      <SelectField
        label="Qualification"
        name="qualification"
        value={formData.qualification}
        onChange={handleChange}
        options={degreeOptions}
        error={errors.qualification}
        required
      />
      {formData.qualification === "Other" && (
        <InputField
          label="Other Qualification"
          name="otherQualification"
          value={formData.otherQualification}
          onChange={handleChange}
          placeholder="Enter qualification"
          error={errors.otherQualification}
          required
        />
      )}
      {formData.qualification && (
        <SelectField
          label="Branch / Specialization"
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          options={branchOptions}
          error={errors.branch}
          required
        />
      )}
      <InputField
        label="Mobile Number"
        name="mobile"
        value={formData.mobile}
        onChange={handleChange}
        placeholder="Enter 10-digit mobile"
        error={errors.mobile}
        required
      />
      <InputField
        label="Alternative Mobile"
        name="altMobile"
        value={formData.altMobile}
        onChange={handleChange}
        placeholder="Optional (10-digit mobile)"
        error={errors.altMobile}
      />
      <InputField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter email"
        error={errors.email}
        required
      />
      <SelectField
        label="Experience Type"
        name="experienceType"
        value={formData.experienceType}
        onChange={handleChange}
        options={["fresher", "experienced"]}
        error={errors.experienceType}
        required
      />
      {formData.experienceType === "experienced" && (
        <>
          <InputField
            label="Experience (Years)"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            placeholder="e.g. 2"
            error={errors.experience}
            required
          />
          <InputField
            label="Current Salary"
            name="currentSalary"
            value={formData.currentSalary}
            onChange={handleChange}
            placeholder="Enter current salary"
            error={errors.currentSalary}
            required
          />
          <SelectField
            label="Current Salary Period"
            name="currentSalaryPeriod"
            value={formData.currentSalaryPeriod}
            onChange={handleChange}
            options={salaryPeriodOptions}
          />
          <InputField
            label="Current Company"
            name="currentCompany"
            value={formData.currentCompany}
            onChange={handleChange}
            placeholder="Enter company name"
            error={errors.currentCompany}
            required
          />
        </>
      )}
      <InputField
        label="Expected Salary"
        name="expectedSalary"
        value={formData.expectedSalary}
        onChange={handleChange}
        placeholder="Enter expected salary"
        error={errors.expectedSalary}
        required
      />
      <SelectField
        label="Expected Salary Period"
        name="expectedSalaryPeriod"
        value={formData.expectedSalaryPeriod}
        onChange={handleChange}
        options={salaryPeriodOptions}
        required
      />
    </div>
  );
};

export default Step1;
