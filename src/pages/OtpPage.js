// src/pages/OtpPage.js
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OtpPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6-digit OTP
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);
  const storedData = JSON.parse(localStorage.getItem("candidateForm"));

  useEffect(() => {
    if (!storedData) {
      toast.error("No candidate data found. Please fill the form first.");
      navigate("/form");
    } else {
      inputsRef.current[0]?.focus();
    }
  }, [storedData, navigate]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasteData[i] || "";
    }
    setOtp(newOtp);

    const nextIndex = newOtp.findIndex((d) => d === "");
    if (nextIndex !== -1) {
      inputsRef.current[nextIndex]?.focus();
    } else {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (enteredOtp) => {
    const otpValue = enteredOtp || otp.join("");
    if (otpValue.length < 6) return;

    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:5000/api/candidates/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: storedData.email,
            qrId: storedData.qrId,
            otp: otpValue,
          }),
        }
      );
      const data = await res.json();

      if (data.success) {
        localStorage.removeItem("candidateForm");
        toast.success("OTP verified successfully!");
        setTimeout(() => {
          navigate("/thankyou", { state: data.data });
        }, 1000); // small delay to show toast
      } else {
        toast.error(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark text-systemText">
      <Header />

      <main className="flex flex-col flex-1 items-center justify-center px-4 py-16">
        {!storedData ? (
          <p className="text-red-500">No candidate data found.</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 max-w-md w-full p-6 rounded-xl shadow-md text-center space-y-4">
            <h2 className="text-3xl font-bold mb-2">Enter OTP</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-start max-w-md">
              Please enter the 6-digit OTP sent to your email.
            </p>

            <div
              className="flex space-x-2 mb-4 justify-center"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="number"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputsRef.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              ))}
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={otp.some((d) => d === "") || loading}
              className={`w-full py-3 rounded-xl font-medium text-white transition-all duration-300 ${
                otp.some((d) => d === "") || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/80"
              }`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}
      </main>

      <Footer />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
};

export default OtpPage;
