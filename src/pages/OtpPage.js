import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OtpPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
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
    if (!/^\d?$/.test(value)) return; // only single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");

    if (pasteData.length === 0) return;

    const newOtp = [...otp];

    pasteData.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });

    setOtp(newOtp);

    const nextIndex = newOtp.findIndex((d) => d === "");
    if (nextIndex !== -1) {
      inputsRef.current[nextIndex]?.focus();
    } else {
      inputsRef.current[5]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "https://scan2hire-backend.vercel.app/api/candidates/verify-otp",
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
        }, 1000);
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("OTP error:", err);
      toast.error("Something went wrong");
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
            <h2 className="text-3xl font-bold">Enter OTP</h2>
            <p className="text-gray-700 dark:text-gray-300 text-start">
              Please enter the 6-digit OTP sent to your email.
            </p>

            <div
              className="flex space-x-2 justify-center"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text" // ✅ FIXED
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  ref={(el) => (inputsRef.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-white ${
                loading ? "bg-gray-400" : "bg-primary hover:bg-primary/80"
              }`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}
      </main>

      <Footer />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default OtpPage;
