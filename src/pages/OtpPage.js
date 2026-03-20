import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OtpPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);

  const inputsRef = useRef([]);
  const otpRef = useRef(["", "", "", "", "", ""]);

  const storedData = JSON.parse(localStorage.getItem("candidateForm"));

  useEffect(() => {
    if (!storedData) {
      toast.error("No candidate data found. Please fill the form first.");
      navigate("/form");
    } else {
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [storedData, navigate]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    otpRef.current[index] = value;

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otpRef.current[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      } else {
        otpRef.current[index] = "";
        if (inputsRef.current[index]) {
          inputsRef.current[index].value = "";
        }
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");

    for (let i = 0; i < 6; i++) {
      const digit = pasteData[i] || "";
      otpRef.current[i] = digit;

      if (inputsRef.current[i]) {
        inputsRef.current[i].value = digit;
      }
    }

    const nextIndex = pasteData.length < 6 ? pasteData.length : 5;
    inputsRef.current[nextIndex]?.focus();
  };

  const handleSubmit = async () => {
    const otpValue = otpRef.current.join("");

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
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);

      const res = await fetch(
        "https://scan2hire-backend.vercel.app/api/candidates/resend-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: storedData.email,
            qrId: storedData.qrId,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success("OTP resent successfully!");
        setTimer(30); // reset timer
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark text-systemText">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        {!storedData ? (
          <p className="text-red-500">No candidate data found.</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 max-w-md w-full p-6 rounded-xl shadow-md text-center space-y-5">
            <h2 className="text-3xl font-bold">Enter OTP</h2>

            <p className="text-gray-700 dark:text-gray-300 text-start">
              Please enter the 6-digit OTP sent to your email.
            </p>

            {/* OTP Inputs */}
            <div className="flex justify-center gap-2">
              {[...Array(6)].map((_, index) => (
                <input
                  key={index}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  ref={(el) => (inputsRef.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/80"
              }`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="text-sm">
              {timer > 0 ? (
                <p className="text-gray-500">
                  Resend OTP in <span className="font-semibold">{timer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-primary font-medium hover:underline"
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default OtpPage;
