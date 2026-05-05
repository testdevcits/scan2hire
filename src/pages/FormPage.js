// src/pages/FormPage.js
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/common/Button";
import { candidateApi } from "../api";
import { useToast } from "../contexts/ToastContext";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";

const FormPage = () => {
  const { qrId: paramQrId } = useParams(); // Get QR ID from URL
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [qrId] = useState(paramQrId || ""); // QR ID state
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    qualification: "",
    otherQualification: "",
    branch: "",
    mobile: "",
    altMobile: "",
    email: "",
    experienceType: "fresher",
    experience: "",
    currentSalary: "",
    currentSalaryPeriod: "monthly",
    currentCompany: "",
    expectedSalary: "",
    expectedSalaryPeriod: "annual",
    certificate: "",
    certificateName: "",
    resume: "",
    resumeName: "",
    referenceName: "",
    referenceMobile: "",
    jobRole: "",
    otherJobRole: "",
    skills: [],
    otherSkills: "",
    cms: [],
    framework: [],
    nightShift: "",
  });

  // Checkbox handler
  const handleCheckbox = (field, value) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value],
      };
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Validation per step
  const validateStep = () => {
    const err = {};

    if (step === 1) {
      if (!formData.name) err.name = "Name required";
      if (!formData.qualification) err.qualification = "Required";
      if (formData.qualification === "Other" && !formData.otherQualification)
        err.otherQualification = "Required";
      if (formData.qualification && !formData.branch) err.branch = "Required";

      // Only 10-digit Indian numbers starting with 6-9
      if (!formData.mobile) err.mobile = "Required";
      else if (!/^[6-9]\d{9}$/.test(formData.mobile))
        err.mobile = "Invalid mobile (10 digits starting with 6-9)";

      if (formData.altMobile && !/^[6-9]\d{9}$/.test(formData.altMobile))
        err.altMobile = "Invalid mobile (10 digits starting with 6-9)";

      if (!formData.email) err.email = "Required";
      else if (!/^\S+@\S+\.\S+$/.test(formData.email))
        err.email = "Invalid email";

      if (!formData.experienceType) err.experienceType = "Required";
      if (formData.experienceType === "experienced") {
        if (!formData.experience) err.experience = "Required";
        if (!formData.currentSalary) err.currentSalary = "Required";
        if (!formData.currentCompany) err.currentCompany = "Required";
      }
      if (!formData.expectedSalary) err.expectedSalary = "Required";
    }

    if (step === 2) {
      if (!formData.jobRole) err.jobRole = "Select job role";
      if (formData.jobRole === "Other" && !formData.otherJobRole)
        err.otherJobRole = "Required";
      if (!formData.skills.length) err.skills = "Skills required";
      if (formData.skills.includes("Other") && !formData.otherSkills)
        err.otherSkills = "Required";
      if (!formData.resume) err.resume = "Resume required";
      if (!formData.nightShift) err.nightShift = "Required";

      if (
        formData.referenceMobile &&
        !/^[6-9]\d{9}$/.test(formData.referenceMobile)
      )
        err.referenceMobile = "Invalid mobile (10 digits starting with 6-9)";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((prev) => Math.min(prev + 1, 3));
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Submit form
  const handleSubmit = async () => {
    if (!qrId) {
      toast.error("QR ID missing. Please scan the QR code.");
      return;
    }

    if (!formData.name || !formData.email || !formData.mobile) {
      toast.error("Name, Email, and Mobile are required.");
      return;
    }

    if (!validateStep()) return;

    setLoading(true);
    try {
      const payload = {
        qrId,
        ...formData,
        qualification:
          formData.qualification === "Other"
            ? formData.otherQualification
            : formData.qualification,
        jobRole:
          formData.jobRole === "Other"
            ? formData.otherJobRole
            : formData.jobRole,
        skills: formData.skills.includes("Other")
          ? [
              ...formData.skills.filter((skill) => skill !== "Other"),
              formData.otherSkills,
            ].filter(Boolean)
          : formData.skills,
      };

      // Save candidate data
      const { data: saveData } = await candidateApi.save(payload);

      if (!saveData.success) {
        toast.error(saveData.message || "Save failed");
        return;
      }

      // Send OTP
      const { data: otpData } = await candidateApi.sendOtp({
        email: formData.email,
        qrId,
      });

      if (!otpData.success) {
        toast.error("OTP sending failed");
        return;
      }

      // Save candidate info for OTP page
      localStorage.setItem(
        "candidateForm",
        JSON.stringify({ email: formData.email, qrId })
      );

      // Redirect to OTP page automatically
      navigate("/otp");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // If QR ID missing in URL
  if (!qrId) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center">
        <p className="text-red-500">
          QR ID missing. Please scan the QR code to open the form.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-montserrat bg-[#f7f8fb] dark:bg-dark">
      <Header />
      <main className="flex flex-1 justify-center items-start px-3 py-4 sm:p-5 md:p-8">
        <div className="w-full max-w-5xl min-w-0">
          <div className="mb-4 sm:mb-5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Candidate Application
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Complete the details below. Fresher and experienced fields adjust automatically.
            </p>
          </div>

          <div className="bg-white rounded-sm shadow border border-gray-100 overflow-hidden">
            <div className="bg-[#fff5f3] px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-[#ffd8cf]">
              <div className="grid grid-cols-3 gap-2">
                {["Personal", "Role & Skills", "Review"].map((label, index) => {
                  const current = index + 1;
                  const active = current <= step;
                  return (
                    <div key={label} className="flex flex-col xs:flex-row items-center xs:items-center gap-1 xs:gap-2 min-w-0">
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0 ${
                          active ? "bg-[#f84525] text-white" : "bg-white text-gray-500 border"
                        }`}
                      >
                        {current}
                      </span>
                      <span className={`text-[10px] xs:text-xs sm:text-sm text-center xs:text-left leading-tight font-medium truncate ${active ? "text-[#f84525]" : "text-gray-500"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">
                Step {step} of 3
              </h2>

          {step === 1 && (
            <Step1
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          )}
          {step === 2 && (
            <Step2
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              handleCheckbox={handleCheckbox}
            />
          )}
          {step === 3 && (
            <Step3
              formData={formData}
              qrId={qrId}
              onBack={prevStep}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}

          {step < 3 && (
            <div className="sticky bottom-0 -mx-3 sm:mx-0 bg-white/95 backdrop-blur border-t sm:border-t-0 px-3 sm:px-0 py-3 sm:py-0 flex flex-col sm:flex-row gap-2 mt-6">
              {step > 1 && (
                <Button text="Back" variant="secondary" onClick={prevStep} className="flex-1" />
              )}
              <Button text="Next" onClick={nextStep} className="flex-1" />
            </div>
          )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FormPage;
