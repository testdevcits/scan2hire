/* eslint-disable */
// Shared employee data context used by HR and employee screens.
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useApi } from "./ApiContext";
import { AuthContext } from "./AuthContext";

const EMPLOYEE_QUERY_CACHE_LIMIT = 40;

const normalizeParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)));

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const { hrApi } = useApi();
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const currentParams = useRef({});
  const latestRequestId = useRef(0);
  const activeRequest = useRef(null);
  const queryCache = useRef(new Map());
  const inFlightRequests = useRef(new Map());
  const cacheScope = `${user?._id || user?.id || "anonymous"}:${user?.role || ""}:${user?.effectiveRole || ""}`;

  const abortActiveRequest = () => {
    if (!activeRequest.current) return;
    const { key, controller } = activeRequest.current;
    controller.abort();
    inFlightRequests.current.delete(key);
    activeRequest.current = null;
  };

  const invalidateEmployeesCache = useCallback(() => {
    queryCache.current.clear();
    inFlightRequests.current.clear();
    latestRequestId.current += 1;
    abortActiveRequest();
    setLoading(false);
  }, []);

  // -------------------------
  // Fetch all employees
  // -------------------------
  const fetchEmployees = useCallback(
    async (params = {}, { force = false } = {}) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;
      currentParams.current = params;
      const cacheKey = `${cacheScope}:${JSON.stringify(normalizeParams(params))}`;
      const cached = queryCache.current.get(cacheKey);

      if (!force && cached) {
        queryCache.current.delete(cacheKey);
        queryCache.current.set(cacheKey, cached);
        if (activeRequest.current?.key !== cacheKey) {
          abortActiveRequest();
        }
        setEmployees(cached.employees);
        setPagination(cached.pagination);
        setError(null);
        setLoading(false);
        return;
      }

      let request = inFlightRequests.current.get(cacheKey);
      if (!request) {
        if (activeRequest.current?.key !== cacheKey) {
          abortActiveRequest();
        }
        const controller = new AbortController();
        activeRequest.current = { key: cacheKey, controller };
        request = hrApi.getEmployees(params, { signal: controller.signal }).then((res) => ({
          employees: res.data.data || [],
          pagination: res.data.pagination || {
            page: 1,
            limit: Math.max((res.data.data || []).length, 1),
            totalItems: res.data.count ?? (res.data.data || []).length,
            totalPages: 1,
          },
        }));
        inFlightRequests.current.set(cacheKey, request);
      }

      try {
        setLoading(true);
        setError(null);

        const result = await request;
        if (requestId !== latestRequestId.current) return;

        setEmployees(result.employees);
        setPagination(result.pagination);
        queryCache.current.set(cacheKey, {
          employees: result.employees,
          pagination: result.pagination,
        });
        if (queryCache.current.size > EMPLOYEE_QUERY_CACHE_LIMIT) {
          const oldestKey = queryCache.current.keys().next().value;
          queryCache.current.delete(oldestKey);
        }
      } catch (err) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED" ||
          err.name === "AbortError"
        )
          return;
        if (requestId !== latestRequestId.current) return;
        console.error("Fetch Employees Error:", err);
        setError(err.response?.data?.message || "Something went wrong");
      } finally {
        if (inFlightRequests.current.get(cacheKey) === request) {
          inFlightRequests.current.delete(cacheKey);
        }
        if (activeRequest.current?.key === cacheKey) activeRequest.current = null;
        if (requestId === latestRequestId.current) setLoading(false);
      }
      // hrApi is a stable value supplied by ApiProvider.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [cacheScope]
  );

  const createEmployee = useCallback(
    async (payload) => {
      const res = await hrApi.createEmployee(payload);
      invalidateEmployeesCache();
      await fetchEmployees(currentParams.current, { force: true });
      return res.data;
    },
    [fetchEmployees, invalidateEmployeesCache, hrApi]
  );

  const updateEmployee = useCallback(
    async (employeeId, payload) => {
      const res = await hrApi.updateEmployee(employeeId, payload);
      invalidateEmployeesCache();
      await fetchEmployees(currentParams.current, { force: true });
      return res.data;
    },
    [fetchEmployees, invalidateEmployeesCache, hrApi]
  );

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
