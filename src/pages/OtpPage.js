// src/pages/OtpPage.js
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const OtpPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6-digit OTP
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false); // user consent
  const [loading, setLoading] = useState(false); // for verify button
  const [showThankYou, setShowThankYou] = useState(false);

  const inputsRef = useRef([]);

  // get candidate data from localStorage
  const storedData = JSON.parse(localStorage.getItem("candidateForm"));

  // Agree button just shows OTP input, no OTP send
  const handleAgree = () => {
    if (!storedData) {
      alert("No candidate data found. Please fill the form first.");
      navigate("/form");
      return;
    }
    setAgreed(true); // only show OTP fields
  };

  // Handle single digit input
  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }

    // Auto-submit when all digits are filled
    if (index === 5 && value && newOtp.every((d) => d !== "")) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  // OTP verification
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
        setShowThankYou(true);

        // Redirect after 10 seconds
        setTimeout(() => {
          navigate("/");
        }, 10000);
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark text-systemText">
      <Header />

      <main className="flex flex-col flex-1 items-center justify-center px-4 py-16">
        {!agreed ? (
          <div className="bg-white dark:bg-gray-800 max-w-md w-full p-6 rounded-xl shadow-md text-center space-y-4">
            <h2 className="text-2xl font-bold">Email Verification Required</h2>
            <p className="text-gray-700 dark:text-gray-300 text-start mb-4">
              We need to verify your email to securely contact you regarding
              your interview and updates. Please agree to continue.
            </p>
            <button
              onClick={handleAgree}
              className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl font-medium transition-all duration-300"
            >
              I Agree
            </button>
          </div>
        ) : showThankYou ? (
          <div className="bg-white dark:bg-gray-800 max-w-md w-full p-6 rounded-xl shadow-md text-center space-y-4">
            <h2 className="text-3xl font-bold mb-2 text-green-600">
              Thank You!
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Your email has been verified successfully. Redirecting to
              confirmation page...
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 max-w-md w-full p-6 rounded-xl shadow-md text-center space-y-4">
            <h2 className="text-3xl font-bold mb-2">Enter OTP</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-start max-w-md">
              Please enter the 6-digit OTP that was sent to your email.
            </p>

            <div className="flex space-x-2 mb-4 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputsRef.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

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
    </div>
  );
};

export default OtpPage;
