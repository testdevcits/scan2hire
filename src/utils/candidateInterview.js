export const roundOrder = ["hr_round", "first_round", "second_round", "final"];

export const roundLabels = {
  hr_round: "HR Round",
  first_round: "Technical Round",
  second_round: "Machine Test",
  final: "Final Round",
  third_round: "Final Round",
  selected: "Selected",
  rejected: "Rejected",
};

export const getDefaultRoundType = (status) => {
  if (status === "hr_round") return "hr";
  if (status === "second_round") return "machine_test";
  if (["final", "third_round"].includes(status)) return "final";
  return "technical";
};

export const getCompletedRounds = (candidate) =>
  new Set(
    (candidate?.interviewRounds || [])
      .filter((round) => round.status === "completed")
      .map((round) => (round.round === "third_round" ? "final" : round.round))
  );

export const getAllowedStatuses = (candidate) => {
  const completed = getCompletedRounds(candidate);
  const nextIncompleteRound = roundOrder.find((status) => !completed.has(status));
  const allowed = nextIncompleteRound ? [nextIncompleteRound] : ["selected", "rejected"];
  const currentStatus =
    candidate?.interviewStatus === "third_round" ? "final" : candidate?.interviewStatus;

  if (
    roundOrder.includes(currentStatus) &&
    completed.has(currentStatus) &&
    !allowed.includes(currentStatus)
  ) {
    allowed.unshift(currentStatus);
  }
  if (["selected", "rejected"].includes(currentStatus) && !allowed.includes(currentStatus)) {
    allowed.push(currentStatus);
  }

  return allowed;
};
