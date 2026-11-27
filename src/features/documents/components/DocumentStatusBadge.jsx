export const documentStatusLabels = {
  draft: "Set Placement",
  pending: "Pending",
  awaiting_verification: "Awaiting Verification",
  needs_correction: "Needs Correction",
  done: "Done",
  cancelled: "Cancelled",
};
export default function DocumentStatusBadge({ status }) {
  const tone =
    status === "done"
      ? "bg-green-100 text-green-800"
      : status === "awaiting_verification"
        ? "bg-blue-100 text-blue-800"
        : ["pending", "needs_correction"].includes(status)
          ? "bg-amber-100 text-amber-800"
          : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {documentStatusLabels[status] || status}
    </span>
  );
}
