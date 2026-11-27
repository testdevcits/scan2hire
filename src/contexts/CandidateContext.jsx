/* eslint-disable */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useApi } from "./ApiContext";

const CandidateContext = createContext();

export const CandidateProvider = ({ children }) => {
  const { hrApi } = useApi();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const latestRequestId = useRef(0);

  const fetchCandidates = useCallback(async (params = {}) => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    try {
      setLoading(true);
      setError(null);

      const res = await hrApi.getCandidates(params);
      if (requestId !== latestRequestId.current) return;

      const rows = Array.isArray(res.data.data) ? res.data.data : [];
      setCandidates(rows);
      setPagination(
        res.data.pagination || {
          page: 1,
          limit: Math.max(rows.length, 1),
          totalItems: rows.length,
          totalPages: 1,
        }
      );
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      console.error("Fetch Candidates Error:", err);
      setCandidates([]);
      setPagination({
        page: Math.max(1, Number(params.page) || 1),
        limit: Math.min(100, Math.max(1, Number(params.limit) || 20)),
        totalItems: 0,
        totalPages: 1,
      });
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
    // hrApi is a stable value supplied by ApiProvider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CandidateContext.Provider
      value={{
        candidates,
        loading,
        error,
        pagination,
        fetchCandidates,
      }}
    >
      {children}
    </CandidateContext.Provider>
  );
};

export const useCandidate = () => useContext(CandidateContext);
