import { useEffect, useState } from "react";
import { useApi } from "../../contexts/ApiContext";
import { useToast } from "../../contexts/ToastContext";
import Button from "./Button";
export default function DefaultEmployeePasswordSettings() {
  const { API } = useApi();
  const toast = useToast();
  const [password, setPassword] = useState(""),
    [configured, setConfigured] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    API.get("/hr/default-employee-password")
      .then((res) => setConfigured(res.data.configured))
      .catch(() => {});
  }, [API]);
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await API.put("/hr/default-employee-password", { password });
      setConfigured(true);
      setPassword("");
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update default password");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      onSubmit={save}
      className="mb-5 rounded-lg border bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
    >
      <h2 className="font-semibold">Default Employee Temporary Password</h2>
      <p className="mt-2 text-sm text-gray-500">
        {configured
          ? "A default password is configured. Enter a new value to replace it."
          : "Set a default password for new employees."}{" "}
        HR/Admin can choose it during employee creation. Existing accounts are unchanged.
      </p>
      <label className="mt-4 block text-sm font-medium">
        {configured ? "New default password" : "Default password"}
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          disabled={busy}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 block w-full max-w-md rounded border p-2"
        />
      </label>
      <Button
        type="submit"
        text="Save Default Password"
        loading={busy}
        disabled={password.length < 8}
        className="mt-4"
      />
    </form>
  );
}
