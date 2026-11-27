import DocumentStatusBadge from "./DocumentStatusBadge";
import { FiEye } from "react-icons/fi";
import Button from "../../../components/ui/Button";

export default function DocumentTableCell({ document, onView, busy }) {
  if (!document) return <span className="text-xs text-gray-400">Not uploaded</span>;
  const status = document.status;
  return (
    <div className="flex items-center gap-2">
      <DocumentStatusBadge status={status} />
      <Button
        disabled={busy}
        title="View document"
        variant="secondary"
        onClick={onView}
        className="inline-flex h-7 w-7 items-center justify-center !p-0"
      >
        <FiEye size={15} />
        <span className="sr-only">View document</span>
      </Button>
    </div>
  );
}
