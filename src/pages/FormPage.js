// src/pages/FormPage.js
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const FormPage = () => {
  const navigate = useNavigate();
  const { qrId: routeQrId } = useParams();

  const [qrId, setQrId] = useState(routeQrId || "");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    position: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch QR ID if not present in route
  useEffect(() => {
    const fetchQrId = async () => {
      if (!qrId) {
        try {
          const res = await fetch("/api/qr-ids", { method: "POST" });
          const data = await res.json();
          if (data.success && data.qrId) {
            setQrId(data.qrId);
          }
        } catch (err) {
          console.error("Error fetching QR ID:", err);
        }
      }
    };
    fetchQrId();
  }, [qrId]);

  // Validate fields
  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First Name is required";
    if (!formData.lastName) newErrors.lastName = "Last Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.mobile) newErrors.mobile = "Mobile is required";
    if (!formData.position) newErrors.position = "Position is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form -> save candidate -> send OTP -> store in localStorage
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      //  Save candidate in backend
      const saveRes = await fetch("http://localhost:5000/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrId, ...formData }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) {
        alert(saveData.message || "Failed to save candidate");
        setLoading(false);
        return;
      }

      //  Send OTP
      const otpRes = await fetch(
        "http://localhost:5000/api/candidates/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, qrId }),
        }
      );
      const otpData = await otpRes.json();
      if (!otpData.success) {
        alert(otpData.message || "Failed to send OTP");
        setLoading(false);
        return;
      }

      //  Save candidate info in localStorage for OTPPage
      localStorage.setItem(
        "candidateForm",
        JSON.stringify({ email: formData.email, qrId })
      );

      //  Navigate to OTP page
      navigate("/otp");
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark text-systemText">
      <Header />
      <main className="flex flex-col flex-1 items-center justify-center px-4 py-16">
        <h2 className="text-3xl font-bold mb-2 animate-slide-fade-in">
          Candidate Form
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-8 animate-slide-fade-in">
          Your QR ID: <span className="font-medium">{qrId}</span>
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4 animate-slide-fade-in"
        >
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className={`p-2 rounded border w-full focus:outline-none focus:ring-2 ${
              errors.firstName
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm">{errors.firstName}</p>
          )}

          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className={`p-2 rounded border w-full focus:outline-none focus:ring-2 ${
              errors.lastName
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm">{errors.lastName}</p>
          )}

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className={`p-2 rounded border w-full focus:outline-none focus:ring-2 ${
              errors.email
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}

          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Mobile"
            className={`p-2 rounded border w-full focus:outline-none focus:ring-2 ${
              errors.mobile
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.mobile && (
            <p className="text-red-500 text-sm">{errors.mobile}</p>
          )}

          <select
            name="position"
            value={formData.position}
            onChange={handleChange}
            className={`p-2 rounded border w-full focus:outline-none focus:ring-2 ${
              errors.position
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            <option value="">Select Position</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Fullstack Developer">Fullstack Developer</option>
            <option value="Designer">Designer</option>
            <option value="QA Engineer">QA Engineer</option>
          </select>
          {errors.position && (
            <p className="text-red-500 text-sm">{errors.position}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit & Verify Email"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default FormPage;
