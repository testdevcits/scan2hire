const LeaveReviewDetails = ({ leave }) => {
  if (!leave || !["approved", "rejected"].includes(leave.status)) return null;
  const reviewer = typeof leave.reviewedBy === "object" ? leave.reviewedBy : null;
  const reviewedAt = leave.reviewedAt ? new Date(leave.reviewedAt) : null;
  return (
    <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
      <span className="font-semibold text-gray-700 dark:text-gray-300">{leave.status === "approved" ? "Approved by" : "Rejected by"}:</span>{" "}
      <span>{reviewer?.name || "Reviewer not recorded"}</span>
      {reviewer?.email && <span> · {reviewer.email}</span>}
      <span> · {reviewedAt && !Number.isNaN(reviewedAt.getTime()) ? reviewedAt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST" : "Review time not recorded"}</span>
    </div>
  );
};

export default LeaveReviewDetails;
