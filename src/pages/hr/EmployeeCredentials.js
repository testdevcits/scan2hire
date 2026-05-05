import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
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
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const unlockVault = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const verifyRes = await authApi.verifyVaultPassword({ password: vaultPassword });
      if (!verifyRes.data.data?.isValid) {
        toast.error("Invalid vault password");
        return;
      }
      const [credentialsRes, employeesRes] = await Promise.all([
        hrApi.getEmployeeCredentials(vaultPassword),
        hrApi.getEmployees(),
      ]);
      const loadedCredentials = credentialsRes.data.data || [];
      const loadedEmployees = employeesRes.data.data || [];
      setCredentials(loadedCredentials);
      setEmployees(loadedEmployees);
      setSelectedEmployeeId(loadedCredentials[0]?.employee?.toString?.() || loadedEmployees[0]?._id || "");
      setUnlocked(true);
      toast.success("Credentials loaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to open credentials vault");
    } finally {
      setLoading(false);
    }
  };

  const selectedLoginCredential = useMemo(
    () =>
      credentials.find(
        (item) =>
          item.employee?.toString?.() === selectedEmployeeId ||
          item.employee === selectedEmployeeId
      ) || null,
    [credentials, selectedEmployeeId]
  );

  const selectedEmployee = useMemo(
    () => employees.find((item) => item._id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  useEffect(() => {
    if (unlocked && selectedEmployeeId) {
      loadAccountCredentials(selectedEmployeeId);
    }
    // eslint-disable-next-line
  }, [unlocked, selectedEmployeeId]);

  const loadAccountCredentials = async (employeeId) => {
    if (!employeeId) {
      setSelectedAccounts([]);
      return;
    }
    setAccountLoading(true);
    try {
      const res = await hrApi.getEmployeeAccountCredentials(employeeId);
      setSelectedAccounts(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load saved account credentials");
    } finally {
      setAccountLoading(false);
    }
  };

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Unable to copy");
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
        <div className="space-y-4">
          <section className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <label className="text-sm font-medium">
              Select Employee
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  loadAccountCredentials(e.target.value);
                }}
                className="mt-1 w-full border rounded-sm px-3 py-2"
              >
                <option value="">Select employee</option>
                {employees.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.employeeId} - {item.name}
                  </option>
                ))}
              </select>
            </label>
            <Button text="Load Saved Credentials" onClick={() => loadAccountCredentials(selectedEmployeeId)} disabled={!selectedEmployeeId || accountLoading} loading={accountLoading} />
          </section>

          {selectedEmployee && (
            <section className="bg-white rounded-sm shadow p-4">
              <h2 className="font-semibold">Employee Login Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 text-sm">
                <p><b>Employee ID:</b> {selectedEmployee.employeeId}</p>
                <p><b>Name:</b> {selectedEmployee.name}</p>
                <p><b>Email:</b> {selectedLoginCredential?.email || selectedEmployee.email}</p>
                <p><b>Password:</b> <span className="font-mono">{selectedLoginCredential?.password || "N/A"}</span></p>
              </div>
            </section>
          )}

          <section className="bg-white rounded-sm shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Saved Account Credentials</h2>
            </div>
            {!selectedEmployeeId ? (
              <p className="p-4 text-sm text-gray-500">Select an employee first.</p>
            ) : accountLoading ? (
              <p className="p-4 text-sm text-gray-500">Loading saved accounts...</p>
            ) : selectedAccounts.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No saved account credentials found.</p>
            ) : (
              selectedAccounts.map((item) => (
                <div key={item._id} className="border-t px-4 py-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.accountType}</p>
                    <p className="text-sm break-all mt-1">{item.loginId}</p>
                    <p className="text-sm mt-1">{revealedPasswords[item._id] ? item.password : "••••••••"}</p>
                    {item.notes ? <p className="text-xs text-gray-500 mt-1">{item.notes}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRevealedPasswords((prev) => ({ ...prev, [item._id]: !prev[item._id] }))} className="border rounded-sm px-3 py-2 text-sm">
                      {revealedPasswords[item._id] ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button type="button" onClick={() => copyValue(item.loginId, "Login")} className="border rounded-sm px-3 py-2 text-sm">
                      <FiCopy />
                    </button>
                    <button type="button" onClick={() => copyValue(item.password, "Password")} className="border rounded-sm px-3 py-2 text-sm">
                      <FiCopy />
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default EmployeeCredentials;
