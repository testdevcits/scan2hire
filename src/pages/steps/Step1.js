import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";

const degreeOptions = [
  "B.Tech / BE Computer Science",
  "B.Tech / BE Information Technology",
  "BCA",
  "MCA",
  "B.Sc Computer Science",
  "M.Sc Computer Science",
  "Diploma Computer Science",
  "B.Des UI/UX",
  "MBA IT",
  "Other",
];

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
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error
    }
  };

  const toggleDegree = (degree) => {
    setFormData((prev) => ({
      ...prev,
      degrees: prev.degrees.includes(degree)
        ? prev.degrees.filter((item) => item !== degree)
        : [...prev.degrees, degree],
    }));
    setErrors((prev) => ({ ...prev, degrees: "", otherDegree: "" }));
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
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          IT Degree
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {degreeOptions.map((degree) => (
            <label key={degree} className="flex items-center gap-2 border rounded-sm px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={formData.degrees.includes(degree)}
                onChange={() => toggleDegree(degree)}
              />
              {degree}
            </label>
          ))}
        </div>
        {errors.degrees && <span className="text-red-500 text-sm mt-1 block">{errors.degrees}</span>}
      </div>
      {formData.degrees.includes("Other") && (
        <InputField
          label="Other Degree"
          name="otherDegree"
          value={formData.otherDegree}
          onChange={handleChange}
          placeholder="Enter degree"
          error={errors.otherDegree}
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
        label="Candidate Type"
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
    </div>
  );
};

export default Step1;
