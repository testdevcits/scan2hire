import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import Button from "../components/common/Button";
import { useToast } from "../contexts/ToastContext";

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  role: "hr",
  otp: "",
};

const Signup = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile" && !/^\d{0,10}$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.requestSignupOtp(form);
      toast.success("Approval OTP sent to admin email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to request OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifySignupOtp(form);
      toast.success("Account created. Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-montserrat">
      <div className="bg-white p-8 rounded-sm shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2">Request Signup</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Admin approval OTP will be sent to testdevcits@gmail.com.
        </p>

        <form onSubmit={step === 1 ? requestOtp : verifyOtp} className="space-y-4">
          {[
            ["name", "Name", "text"],
            ["email", "Email", "email"],
            ["mobile", "Mobile", "text"],
            ["password", "Password", "password"],
          ].map(([name, label, type]) => (
            <label key={name} className="block text-sm font-medium">
              {label}
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={step === 2}
                className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                required
              />
            </label>
          ))}

          <label className="block text-sm font-medium">
            Role
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={step === 2}
              className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
            >
              <option value="superadmin">Super Admin</option>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
          </label>

          {step === 2 && (
            <label className="block text-sm font-medium">
              Admin OTP
              <input
                name="otp"
                value={form.otp}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-sm px-3 py-2"
                required
              />
            </label>
          )}

          <Button
            text={loading ? "Processing..." : step === 1 ? "Send Admin OTP" : "Create Account"}
            type="submit"
            disabled={loading}
            className="w-full"
          />
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
