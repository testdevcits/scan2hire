import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { candidateApi } from "../api";
import { useToast } from "../contexts/ToastContext";

const OtpPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);

  const inputsRef = useRef([]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

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
  }, [storedData, navigate, toast]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      } else {
        setOtp((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const nextOtp = [...Array(6)].map((_, index) => pasteData[index] || "");
    setOtp(nextOtp);
    const nextIndex = Math.min(pasteData.length, 5);
    inputsRef.current[nextIndex]?.focus();
  };

  const handleSubmit = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }

    try {
      setLoading(true);

      const { data } = await candidateApi.verifyOtp({
        email: storedData.email,
        qrId: storedData.qrId,
        otp: otpValue,
      });

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

      const { data } = await candidateApi.resendOtp({
        email: storedData.email,
        qrId: storedData.qrId,
      });

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
                  value={otp[index]}
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
    </div>
  );
};

export default OtpPage;
