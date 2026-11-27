import { Fragment } from "react";
import { FiCheck, FiClock } from "react-icons/fi";
import { getCompletedRounds, roundLabels, roundOrder } from "../../../utils/candidateInterview";

const CandidateInterviewProgress = ({ candidate }) => {
  const completedRounds = getCompletedRounds(candidate);

  return (
    <div className="grid items-start" style={{ gridTemplateColumns: `repeat(${roundOrder.length * 2 - 1}, minmax(0, 1fr))` }}>
      {roundOrder.map((status, index) => {
        const completed = completedRounds.has(status);
        const active = (candidate.interviewStatus === status || (status === "final" && candidate.interviewStatus === "third_round")) && !completed;
        const stateLabel = completed ? "Completed" : active ? "In progress" : "Pending";

        return (
          <Fragment key={status}>
            <div className="flex min-w-0 flex-col items-center text-center" aria-current={active ? "step" : undefined}>
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900 ${completed ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300" : active ? "bg-[#fff0ec] text-[#f84525] shadow-sm dark:bg-[#f84525]/15" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                {completed ? <FiCheck aria-label="Completed" className="h-4 w-4" /> : active ? <FiClock aria-label="In progress" className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`mt-2 text-xs font-semibold leading-tight sm:text-sm ${completed ? "text-green-700 dark:text-green-300" : active ? "text-[#f84525]" : "text-gray-600 dark:text-gray-300"}`}>
                {roundLabels[status]}
              </span>
              <span className={`mt-1 text-[11px] sm:text-xs ${completed ? "text-green-700 dark:text-green-300" : active ? "text-[#f84525]" : "text-gray-500 dark:text-gray-400"}`}>
                {stateLabel}
              </span>
            </div>
            {index < roundOrder.length - 1 && (
              <span aria-hidden="true" className={`mt-4 h-0.5 rounded-full ${completed ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default CandidateInterviewProgress;
