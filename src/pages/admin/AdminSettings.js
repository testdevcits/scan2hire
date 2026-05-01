import { useContext } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";

const AdminSettings = () => {
  const { mode, toggleMode } = useContext(ThemeContext);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">Basic admin preferences for this panel.</p>
      </div>

      <section className="bg-white rounded-sm shadow p-4 max-w-2xl">
        <h2 className="font-semibold mb-3">Appearance</h2>
        <div className="flex items-center justify-between border rounded-sm p-3">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-gray-500">Current theme: {mode}</p>
          </div>
          <button
            onClick={toggleMode}
            className="bg-black text-white rounded-sm px-4 py-2 text-sm"
          >
            Toggle Theme
          </button>
        </div>
      </section>

      <section className="bg-white rounded-sm shadow p-4 max-w-2xl">
        <h2 className="font-semibold mb-3">Workflow</h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p>1. Super Admin creates HR accounts.</p>
          <p>2. HR creates employees and assigns candidates for interviews.</p>
          <p>3. Assigned employee receives email and submits interview report.</p>
          <p>4. HR completes final status and can convert selected candidate to employee.</p>
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
