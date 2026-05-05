import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { candidateApi } from "../api";
import { useToast } from "../contexts/ToastContext";

const OtpPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // State Management
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const inputsRef = useRef([]);

  // Get stored candidate data
  const storedData = JSON.parse(localStorage.getItem("candidateForm")) || null;

  // ==================== EFFECTS ====================

  // Initialize - Check if data exists and focus first input
  useEffect(() => {
    if (!storedData) {
      toast.error("No candidate data found. Please fill the form first.");
      navigate("/form");
      return;
    }

    const focusTimer = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 100);

    return () => clearTimeout(focusTimer);
  }, [storedData, navigate, toast]);

  // Timer countdown effect
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // ==================== HANDLERS ====================

  /**
   * Handle OTP input change
   * Allows only digits and auto-focuses to next input
   */
  const handleChange = useCallback((index, value) => {
    // Validate - only allow single digits
    if (!/^\d?$/.test(value)) return;

    setError("");

    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    // Auto-focus to next input if digit was entered
    if (value && index < 5) {
      setTimeout(() => {
        inputsRef.current[index + 1]?.focus();
      }, 50);
    }
  }, []);

  /**
   * Handle keyboard navigation and deletion
   * Supports: Backspace, ArrowLeft, ArrowRight
   */
  const handleKeyDown = useCallback(
    (e, index) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        setError("");

        // If current input is empty, move to previous and clear it
        if (!otp[index] && index > 0) {
          inputsRef.current[index - 1]?.focus();
          setOtp((prev) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
        } else {
          // Clear current input
          setOtp((prev) => {
            const next = [...prev];
            next[index] = "";
            return next;
          });
        }
      }

      // Arrow key navigation
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputsRef.current[index - 1]?.focus();
      }

      if (e.key === "ArrowRight" && index < 5) {
        e.preventDefault();
        inputsRef.current[index + 1]?.focus();
      }

      // Handle Tab key to stay within OTP inputs
      if (e.key === "Tab") {
        if (e.shiftKey && index === 0) {
          // Shift+Tab on first input - let it go to previous element
          return;
        }
        if (!e.shiftKey && index === 5) {
          // Tab on last input - let it go to next element
          return;
        }

        e.preventDefault();
        if (e.shiftKey && index > 0) {
          inputsRef.current[index - 1]?.focus();
        } else if (!e.shiftKey && index < 5) {
          inputsRef.current[index + 1]?.focus();
        }
      }
    },
    [otp]
  );

  /**
   * Handle paste functionality
   * Supports pasting entire 6-digit OTP at once
   */
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      setError("");

      // Extract digits from pasted content
      const pasteData = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);

      if (pasteData.length === 0) {
        setError("Please paste only numbers");
        toast.error("Please paste only numbers");
        return;
      }

      // Fill OTP inputs with pasted data
      const nextOtp = [...Array(6)].map((_, i) => pasteData[i] || "");
      setOtp(nextOtp);

      // Focus on the last filled input
      const focusIndex = Math.min(pasteData.length, 5);
      setTimeout(() => {
        inputsRef.current[focusIndex]?.focus();
      }, 50);

      if (pasteData.length === 6) {
        toast.success("OTP pasted successfully!");
      }
    },
    [toast]
  );

  /**
   * Handle OTP submission and verification
   */
  const handleSubmit = useCallback(async () => {
    const otpValue = otp.join("");

    // Validation
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits");
      toast.error("Please enter all 6 digits");
      return;
    }

    if (!storedData?.email || !storedData?.qrId) {
      setError("Invalid session. Please fill the form again.");
      toast.error("Invalid session. Please fill the form again.");
      navigate("/form");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await candidateApi.verifyOtp({
        email: storedData.email,
        qrId: storedData.qrId,
        otp: otpValue,
      });

      if (data.success) {
        setIsVerified(true);
        toast.success("OTP verified successfully!");
        localStorage.removeItem("candidateForm");

        // Navigate after a brief delay for user feedback
        setTimeout(() => {
          navigate("/thankyou", { state: data.data });
        }, 1000);
      } else {
        const errorMsg = data.message || "Invalid OTP. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg);

        // Clear and reset on error
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => {
          inputsRef.current[0]?.focus();
        }, 50);
      }
    } catch (err) {
      console.error("OTP Verification Error:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);

      // Clear inputs on error
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 50);
    } finally {
      setLoading(false);
    }
  }, [otp, storedData, navigate, toast]);

  /**
   * Handle OTP resend
   */
  const handleResendOtp = useCallback(async () => {
    if (!storedData?.email || !storedData?.qrId) {
      toast.error("Invalid session. Please fill the form again.");
      navigate("/form");
      return;
    }

    try {
      setResendLoading(true);
      setError("");

      const { data } = await candidateApi.resendOtp({
        email: storedData.email,
        qrId: storedData.qrId,
      });

      if (data.success) {
        setTimer(30);
        setOtp(["", "", "", "", "", ""]);
        toast.success("OTP resent successfully!");

        setTimeout(() => {
          inputsRef.current[0]?.focus();
        }, 50);
      } else {
        const errorMsg = data.message || "Failed to resend OTP";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Resend OTP Error:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to resend OTP. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setResendLoading(false);
    }
  }, [storedData, navigate, toast]);

  /**
   * Handle Enter key to submit OTP
   */
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && otp.join("").length === 6 && !loading) {
        handleSubmit();
      }
    },
    [otp, loading, handleSubmit]
  );

  // ==================== RENDER ====================

  if (!storedData) {
    return (
      <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark text-systemText">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="bg-white dark:bg-gray-800 max-w-md w-full p-8 rounded-2xl shadow-lg text-center">
            <p className="text-red-500 font-semibold">
              No candidate data found.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Please fill the form first.
            </p>
            <button
              onClick={() => navigate("/form")}
              className="mt-6 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
            >
              Go to Form
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const otpValue = otp.join("");
  const isOtpComplete = otpValue.length === 6;
  const canSubmit = isOtpComplete && !loading;

  return (
    <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark text-systemText">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-8 md:py-16">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
            {/* Header Section */}
            <div className="relative overflow-hidden px-6 pt-8 pb-6 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-b border-primary/10 dark:border-primary/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Verify OTP
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-primary">
                    {storedData?.email}
                  </span>
                </p>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-6 py-8 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 animate-in fade-in duration-300">
                  <span className="text-xl mt-0.5">⚠️</span>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {isVerified && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3 animate-in fade-in duration-300">
                  <span className="text-xl mt-0.5">✅</span>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    OTP verified successfully!
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  💡 <span className="font-medium">Tip:</span> You can paste the
                  entire OTP code into any field
                </p>
              </div>

              {/* OTP Input Fields */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  6-Digit Code
                </label>
                <div className="flex justify-between gap-2 md:gap-3">
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      ref={(el) => (inputsRef.current[index] = el)}
                      value={otp[index]}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onKeyPress={handleKeyPress}
                      onPaste={handlePaste}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(-1)}
                      disabled={loading || isVerified}
                      placeholder="•"
                      className={`
                        flex-1 h-14 md:h-16 text-center text-2xl md:text-3xl font-bold
                        rounded-lg border-2 transition-all duration-200 ease-out
                        placeholder-gray-400 dark:placeholder-gray-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                          focusedIndex === index
                            ? "border-primary ring-2 ring-primary/30 shadow-md bg-primary/5"
                            : error && otp[index]
                            ? "border-red-300 dark:border-red-600"
                            : otp[index]
                            ? "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/10"
                            : "border-gray-300 dark:border-gray-600"
                        }
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none
                      `}
                    />
                  ))}
                </div>
              </div>

              {/* OTP Status Indicator */}
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {otpValue.length}/6 digits entered
                </span>
                <span
                  className={`font-medium ${
                    isOtpComplete
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500"
                  }`}
                >
                  {isOtpComplete ? "✓ Complete" : "Incomplete"}
                </span>
              </div>

              {/* Verify Button */}
              <button
                onClick={handleSubmit}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                disabled={!canSubmit}
                className={`
                  w-full py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg
                  transition-all duration-200 ease-out
                  flex items-center justify-center gap-2
                  ${
                    canSubmit
                      ? "bg-primary text-white hover:bg-primary/90 active:scale-98 shadow-md hover:shadow-lg cursor-pointer"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-60"
                  }
                `}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    <span>Verifying...</span>
                  </>
                ) : isVerified ? (
                  <>
                    <span>✅</span>
                    <span>Verified</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span>Verify OTP</span>
                  </>
                )}
              </button>

              {/* Resend Section */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                {timer > 0 ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resend OTP in{" "}
                      <span
                        className={`font-bold text-lg ${
                          timer <= 10 ? "text-red-500" : "text-primary"
                        }`}
                      >
                        {timer}s
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResendOtp}
                      disabled={resendLoading || timer > 0}
                      className={`
                        w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                        ${
                          resendLoading || timer > 0
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                            : "bg-gray-100 dark:bg-gray-700 text-primary dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }
                      `}
                    >
                      {resendLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block animate-spin">⏳</span>
                          <span>Sending...</span>
                        </span>
                      ) : (
                        <span>📨 Resend OTP</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Info */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                🔒 Your data is secure and encrypted. This code expires in 10
                minutes.
              </p>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Need help?
            </p>
            <button
              onClick={() => navigate("/form")}
              className="text-xs text-primary hover:underline font-medium"
            >
              Return to form
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OtpPage;
