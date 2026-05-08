import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { candidateApi } from "../api";
import { useToast } from "../contexts/ToastContext";

const OTP_LENGTH = 6;

const OtpPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const otpInputRef = useRef(null);
  const storedData = JSON.parse(localStorage.getItem("candidateForm"));

  useEffect(() => {
    if (!storedData) {
      toast.error("No candidate data found. Please fill the form first.");
      navigate("/form");
      return;
    }

    setTimeout(() => {
      otpInputRef.current?.focus();
    }, 100);
  }, [storedData, navigate, toast]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(value);
  };

  const handleBoxClick = () => {
    otpInputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (otp.length !== OTP_LENGTH) {
      toast.error("Please enter complete OTP");
      return;
    }

    try {
      setLoading(true);

      const { data } = await candidateApi.verifyOtp({
        email: storedData.email,
        candidateId: storedData.candidateId,
        otp,
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
        candidateId: storedData.candidateId,
      });

      if (data.success) {
        toast.success("OTP resent successfully!");
        setOtp("");
        setTimer(30);

        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 100);
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

            <div className="relative">
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={handleOtpChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                className="absolute opacity-0 pointer-events-none"
              />

              <div
                onClick={handleBoxClick}
                className="flex justify-center gap-2 cursor-text"
              >
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-12 h-12 flex items-center justify-center text-xl border rounded-md dark:bg-gray-700 dark:text-white ${
                      otp.length === index
                        ? "ring-2 ring-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {otp[index] || ""}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
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
                  type="button"
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
