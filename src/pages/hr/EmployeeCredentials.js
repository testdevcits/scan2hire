import { useState } from "react";
import { authApi, hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const EmployeeCredentials = () => {
  const toast = useToast();
  const [vaultPassword, setVaultPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState([]);

  const unlockVault = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const verifyRes = await authApi.verifyVaultPassword({ password: vaultPassword });
      if (!verifyRes.data.data?.isValid) {
        toast.error("Invalid vault password");
        return;
      }
      const res = await hrApi.getEmployeeCredentials(vaultPassword);
      setCredentials(res.data.data || []);
      setUnlocked(true);
      toast.success("Credentials loaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to open credentials vault");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !unlocked) return <CommonLoader text="Opening credentials vault..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Employee Credentials</h1>
        <p className="text-sm text-gray-500">Protected employee login records for HR and super admin use.</p>
      </div>

      {!unlocked ? (
        <form onSubmit={unlockVault} className="bg-white rounded-sm shadow p-4 max-w-xl space-y-3">
          <label className="block text-sm font-medium">
            Vault Password
            <input
              type="password"
              value={vaultPassword}
              onChange={(e) => setVaultPassword(e.target.value)}
              className="mt-1 w-full border rounded-sm px-3 py-2"
              required
            />
          </label>
          <Button text={loading ? "Opening..." : "Open Credentials"} loading={loading} type="submit" />
        </form>
      ) : (
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="grid grid-cols-4 bg-gray-100 text-xs uppercase text-gray-600 font-semibold">
            {["Employee ID", "Name", "Email", "Password"].map((item) => (
              <div key={item} className="px-4 py-3">{item}</div>
            ))}
          </div>
          {credentials.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No employee credentials found.</p>
          ) : (
            credentials.map((item) => (
              <div key={item._id} className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t px-4 py-3 text-sm">
                <span>{item.employeeId}</span>
                <span>{item.name}</span>
                <span className="break-all">{item.email}</span>
                <span className="font-mono">{item.password}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeCredentials;
