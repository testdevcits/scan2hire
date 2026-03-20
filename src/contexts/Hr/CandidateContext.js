import { createContext, useContext, useState } from "react";
import API from "../../api/axios";

const CandidateContext = createContext();

export const CandidateProvider = ({ children }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await API.get("/hr/candidates");

      setCandidates(res.data.data);
    } catch (err) {
      console.error("Fetch Candidates Error:", err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CandidateContext.Provider
      value={{
        candidates,
        loading,
        error,
        fetchCandidates,
      }}
    >
      {children}
    </CandidateContext.Provider>
  );
};

export const useCandidate = () => useContext(CandidateContext);
