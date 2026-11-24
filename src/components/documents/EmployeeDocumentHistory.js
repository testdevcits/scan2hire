import { useEffect, useState } from "react";
import { hrApi } from "../../api";
import Button from "../common/Button";

export default function EmployeeDocumentHistory({ employee, documentItems, onView, onDownload, canDownload }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    hrApi.getEmployeeDocumentVersions(employee._id).then((response) => {
      if (active) setVersions(response.data.data || []);
    }).catch(() => { if (active) setError("Unable to load document versions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employee, attempt]);
  const labels = Object.fromEntries(documentItems);
  const labelFor = (key) => {
    if (labels[key]) return labels[key];
    const [kind, id, field] = key.split(":");
    if (kind === "employment") {
      const company = employee.previousEmployments?.find((item) => item.id === id);
      return `${company?.companyName || "Previous company"} — ${labels[field] || field}`;
    }
    if (kind === "qualification") {
      const qualification = employee.qualifications?.find((item) => item.id === id);
      return `${qualification?.level || "Qualification"} Marksheet`;
    }
    return key;
  };
  return <section className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-700">
    <h3 className="font-semibold">Version History</h3>
    <p className="mt-1 text-xs text-gray-500">Previous uploads remain available here. Latest marks the current version of each document.</p>
    {loading ? <p role="status" className="py-4 text-sm">Loading versions…</p> : error ? <div role="alert" className="py-4 text-sm text-red-600">{error} <Button text="Retry" onClick={() => setAttempt((value) => value + 1)} /></div> : !versions.length ? <p className="py-4 text-sm text-gray-500">No document versions recorded yet.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm">
      <thead><tr>{["Document", "Version", "Uploaded", "Uploaded by", "Actions"].map((label) => <th key={label} className="p-2">{label}</th>)}</tr></thead>
      <tbody>{versions.slice().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt) || b.version - a.version).map((version) => {
        const label = labelFor(version.documentKey);
        return <tr key={version._id || `${version.documentKey}-${version.version}`} className="border-t border-gray-200 dark:border-gray-700">
          <td className="p-2">{label}<p className="text-xs text-gray-500">{version.file?.name}</p></td>
          <td className="p-2">v{version.version} · {version.isLatest ? "Latest" : "Old"}</td>
          <td className="p-2">{version.uploadedAt ? new Date(version.uploadedAt).toLocaleString() : "Unknown"}</td>
          <td className="p-2">{version.uploadedByEmail || "Unknown"}</td>
          <td className="p-2"><div className="flex gap-2"><Button text="View" disabled={!version.file?.url} onClick={() => onView({ label: `${label} · v${version.version}`, url: version.file.url, type: version.file.resource_type || version.file.format })} />{canDownload && <Button text="Download" variant="secondary" disabled={!version.file?.url} onClick={() => onDownload(version.file.url, `${label} v${version.version}`)} />}</div></td>
        </tr>;
      })}</tbody>
    </table></div>}
  </section>;
}
