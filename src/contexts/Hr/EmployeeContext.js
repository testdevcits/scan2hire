/* eslint-disable */
// contexts/Hr/EmployeeContext.js
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useApi } from "../ApiContext";

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const { hrApi } = useApi();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalItems: 0, totalPages: 1 });
  const currentParams = useRef({});
  const latestRequestId = useRef(0);
  const activeRequest = useRef(null);

  // -------------------------
  // Fetch all employees
  // -------------------------
  const fetchEmployees = useCallback(async (params = {}) => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    currentParams.current = params;
    try {
      if (activeRequest.current) activeRequest.current.abort();
      const controller = new AbortController();
      activeRequest.current = controller;
      setLoading(true);
      setError(null);

      const res = await hrApi.getEmployees(params, { signal: controller.signal });
      if (requestId !== latestRequestId.current) return;

      const rows = res.data.data || [];
      setEmployees(rows);
      setPagination(res.data.pagination || {
        page: 1,
        limit: Math.max(rows.length, 1),
        totalItems: res.data.count ?? rows.length,
        totalPages: 1,
      });
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED" || err.name === "AbortError") return;
      if (requestId !== latestRequestId.current) return;
      console.error("Fetch Employees Error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  // hrApi is a stable value supplied by ApiProvider.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createEmployee = useCallback(async (payload) => {
    const res = await hrApi.createEmployee(payload);
    await fetchEmployees(currentParams.current);
    return res.data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEmployees]);

  const updateEmployee = useCallback(async (employeeId, payload) => {
    const res = await hrApi.updateEmployee(employeeId, payload);
    await fetchEmployees(currentParams.current);
    return res.data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEmployees]);

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        loading,
        error,
        pagination,
        fetchEmployees,
        createEmployee,
        updateEmployee,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

// Custom hook to use in components
export const useEmployee = () => useContext(EmployeeContext);
