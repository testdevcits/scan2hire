// src/pages/FormPage.js
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiRequest, generateQrId } from "../api";

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
          const data = await generateQrId();
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

  // Validate form
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // Save candidate
      const saveData = await apiRequest("/candidates", {
        method: "POST",
        body: JSON.stringify({ qrId, ...formData }),
      });

      if (!saveData.success) {
        alert(saveData.message || "Failed to save candidate");
        setLoading(false);
        return;
      }

      // Send OTP
      const otpData = await apiRequest("/candidates/send-otp", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          qrId,
        }),
      });

      if (!otpData.success) {
        alert(otpData.message || "Failed to send OTP");
        setLoading(false);
        return;
      }

      // Save data for OTP page
      localStorage.setItem(
        "candidateForm",
        JSON.stringify({
          email: formData.email,
          qrId,
        })
      );

      navigate("/otp");
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Something went wrong");
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

        <p className="text-gray-700 dark:text-gray-300 mb-8">
          Your QR ID: <span className="font-medium">{qrId}</span>
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4"
        >
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="p-2 rounded border w-full"
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
            className="p-2 rounded border w-full"
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
            className="p-2 rounded border w-full"
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
            className="p-2 rounded border w-full"
          />
          {errors.mobile && (
            <p className="text-red-500 text-sm">{errors.mobile}</p>
          )}

          <select
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="p-2 rounded border w-full"
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
            className="w-full bg-primary text-white py-3 rounded-xl"
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
