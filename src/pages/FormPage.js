// src/pages/FormPage.js
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/common/Button";
import { apiRequest } from "../api";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";

const FormPage = () => {
  const { qrId: paramQrId } = useParams(); // Get QR ID from URL
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [qrId] = useState(paramQrId || ""); // QR ID state
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    qualification: "",
    mobile: "",
    altMobile: "",
    email: "",
    experience: "",
    currentSalary: "",
    currentCompany: "",
    expectedSalary: "",
    certificate: "",
    referenceName: "",
    referenceMobile: "",
    jobRole: "",
    otherJobRole: "",
    skills: "",
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

      // Only 10-digit Indian numbers starting with 6-9
      if (!formData.mobile) err.mobile = "Required";
      else if (!/^[6-9]\d{9}$/.test(formData.mobile))
        err.mobile = "Invalid mobile (10 digits starting with 6-9)";

      if (formData.altMobile && !/^[6-9]\d{9}$/.test(formData.altMobile))
        err.altMobile = "Invalid mobile (10 digits starting with 6-9)";

      if (!formData.email) err.email = "Required";
      else if (!/^\S+@\S+\.\S+$/.test(formData.email))
        err.email = "Invalid email";

      if (!formData.experience) err.experience = "Required";
      if (!formData.currentSalary) err.currentSalary = "Required";
      if (!formData.currentCompany) err.currentCompany = "Required";
      if (!formData.expectedSalary) err.expectedSalary = "Required";
    }

    if (step === 2) {
      if (!formData.jobRole) err.jobRole = "Select job role";
      if (formData.jobRole === "Other" && !formData.otherJobRole)
        err.otherJobRole = "Required";
      if (!formData.skills) err.skills = "Skills required";
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
    if (!qrId) return alert("QR ID missing. Please scan the QR code.");

    if (!formData.name || !formData.email || !formData.mobile) {
      return alert("Name, Email, and Mobile are required.");
    }

    if (!validateStep()) return;

    setLoading(true);
    try {
      const payload = {
        qrId,
        ...formData,
        jobRole:
          formData.jobRole === "Other"
            ? formData.otherJobRole
            : formData.jobRole,
      };

      // Save candidate data
      const saveData = await apiRequest("/candidates", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!saveData.success) {
        alert(saveData.message || "Save failed");
        return;
      }

      // Send OTP
      const otpData = await apiRequest("/candidates/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: formData.email, qrId }),
      });

      if (!otpData.success) {
        alert("OTP sending failed");
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
      alert("Something went wrong");
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
    <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark">
      <Header />
      <main className="flex flex-1 justify-center items-center p-4">
        <div className="w-full max-w-5xl bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Step {step} / 3
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
            <div className="flex gap-2 mt-4">
              {step > 1 && (
                <Button text="Back" onClick={prevStep} className="flex-1" />
              )}
              <Button text="Next" onClick={nextStep} className="flex-1" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FormPage;
