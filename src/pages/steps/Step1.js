import InputField from "../../components/common/InputField";

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
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField
        label="Full Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter your name"
        error={errors.name}
        required
      />
      <InputField
        label="Qualification"
        name="qualification"
        value={formData.qualification}
        onChange={handleChange}
        placeholder="Enter qualification"
        error={errors.qualification}
        required
      />
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
      <InputField
        label="Current Company"
        name="currentCompany"
        value={formData.currentCompany}
        onChange={handleChange}
        placeholder="Enter company name"
        error={errors.currentCompany}
        required
      />
      <InputField
        label="Expected Salary"
        name="expectedSalary"
        value={formData.expectedSalary}
        onChange={handleChange}
        placeholder="Enter expected salary"
        error={errors.expectedSalary}
        required
      />
    </div>
  );
};

export default Step1;
