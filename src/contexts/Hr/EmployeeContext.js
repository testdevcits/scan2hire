// contexts/Hr/EmployeeContext.js
import { createContext, useContext, useState } from "react";
import API from "../../api/axios";

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

      const res = await API.get("/hr/employees"); // endpoint from previous route

      setEmployees(res.data.data);
    } catch (err) {
      console.error("Fetch Employees Error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        loading,
        error,
        fetchEmployees,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

// Custom hook to use in components
export const useEmployee = () => useContext(EmployeeContext);
