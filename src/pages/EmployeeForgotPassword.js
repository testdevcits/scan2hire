import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { employeeApi } from "../api";
import { useToast } from "../contexts/ToastContext";

const EmployeeForgotPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", otp: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await employeeApi.forgotPassword({
        email: form.email,
      });
      toast.success(res.data.message);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await employeeApi.resetPassword(form);
      toast.success("Password changed successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-montserrat">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          Employee Password Reset
        </h2>
        <form
          onSubmit={step === 1 ? requestOtp : resetPassword}
          className="space-y-4"
        >
          <label className="block text-sm font-medium">
            Employee Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              required
              disabled={step === 2}
            />
          </label>

          {step === 2 && (
            <>
              <label className="block text-sm font-medium">
                OTP from HR
                <input
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                New Password
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-primary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>
            </>
          )}

          <button
            disabled={loading}
            className="bg-primary hover:bg-primary/80 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 w-full"
          >
            {loading
              ? "Please wait..."
              : step === 1
              ? "Send OTP to HR"
              : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForgotPassword;
