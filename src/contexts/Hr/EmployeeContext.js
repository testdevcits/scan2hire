/* eslint-disable */
// contexts/Hr/EmployeeContext.js
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useApi } from "../ApiContext";
import { AuthContext } from "../AuthContext";

const EMPLOYEE_QUERY_CACHE_TTL = 8000;
const EMPLOYEE_QUERY_CACHE_LIMIT = 40;

const normalizeParams = (params = {}) => Object.fromEntries(
  Object.entries(params).sort(([left], [right]) => left.localeCompare(right))
);

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const { hrApi } = useApi();
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalItems: 0, totalPages: 1 });
  const currentParams = useRef({});
  const latestRequestId = useRef(0);
  const activeRequest = useRef(null);
  const queryCache = useRef(new Map());
  const cacheScope = `${user?._id || user?.id || "anonymous"}:${user?.role || ""}:${user?.effectiveRole || ""}`;

  const invalidateEmployeesCache = useCallback(() => {
    queryCache.current.clear();
  }, []);

  // -------------------------
  // Fetch all employees
  // -------------------------
  const fetchEmployees = useCallback(async (params = {}, { force = false } = {}) => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    currentParams.current = params;
    const cacheKey = `${cacheScope}:${JSON.stringify(normalizeParams(params))}`;
    const cached = queryCache.current.get(cacheKey);

    if (!force && cached && Date.now() - cached.cachedAt < EMPLOYEE_QUERY_CACHE_TTL) {
      if (activeRequest.current) activeRequest.current.abort();
      setEmployees(cached.employees);
      setPagination(cached.pagination);
      setError(null);
      setLoading(false);
      return;
    }

    if (cached) queryCache.current.delete(cacheKey);
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
      const nextPagination = res.data.pagination || {
        page: 1,
        limit: Math.max(rows.length, 1),
        totalItems: res.data.count ?? rows.length,
        totalPages: 1,
      };
      setPagination(nextPagination);
      queryCache.current.set(cacheKey, {
        employees: rows,
        pagination: nextPagination,
        cachedAt: Date.now(),
      });
      if (queryCache.current.size > EMPLOYEE_QUERY_CACHE_LIMIT) {
        const oldestKey = queryCache.current.keys().next().value;
        queryCache.current.delete(oldestKey);
      }
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
  }, [cacheScope]);

  const createEmployee = useCallback(async (payload) => {
    const res = await hrApi.createEmployee(payload);
    invalidateEmployeesCache();
    await fetchEmployees(currentParams.current, { force: true });
    return res.data;
  }, [fetchEmployees, invalidateEmployeesCache, hrApi]);

  const updateEmployee = useCallback(async (employeeId, payload) => {
    const res = await hrApi.updateEmployee(employeeId, payload);
    invalidateEmployeesCache();
    await fetchEmployees(currentParams.current, { force: true });
    return res.data;
  }, [fetchEmployees, invalidateEmployeesCache, hrApi]);

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        loading,
        error,
        pagination,
        fetchEmployees,
        invalidateEmployeesCache,
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
