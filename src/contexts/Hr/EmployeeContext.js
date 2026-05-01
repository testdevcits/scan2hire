// contexts/Hr/EmployeeContext.js
import { createContext, useContext, useState } from "react";
import { hrApi } from "../../api";

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -------------------------
  // Fetch all employees
  // -------------------------
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await hrApi.getEmployees();

      setEmployees(res.data.data);
    } catch (err) {
      console.error("Fetch Employees Error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (payload) => {
    const res = await hrApi.createEmployee(payload);
    await fetchEmployees();
    return res.data;
  };

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        loading,
        error,
        fetchEmployees,
        createEmployee,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

// Custom hook to use in components
export const useEmployee = () => useContext(EmployeeContext);
