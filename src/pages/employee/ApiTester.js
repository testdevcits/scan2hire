import axios from "axios";
import { useMemo, useState } from "react";
import Button from "../../components/common/Button";

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const defaultHeaders = `{
  "Content-Type": "application/json"
}`;

const defaultBody = `{
  
}`;

const formatJson = (value) => {
  if (value === undefined || value === null || value === "") return "";
  try {
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value);
  }
};

const parseJsonField = (value, fallback) => {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return fallback;
  return JSON.parse(cleanValue);
};

const ApiTester = () => {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [headers, setHeaders] = useState(defaultHeaders);
  const [body, setBody] = useState(defaultBody);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const canSendBody = !["GET", "DELETE"].includes(method);

  const resultTone = useMemo(() => {
    if (!result) return "border-gray-200 bg-white";
    if (result.type === "success") return "border-green-200 bg-green-50";
    if (result.type === "reject") return "border-amber-200 bg-amber-50";
    return "border-red-200 bg-red-50";
  }, [result]);

  const runRequest = async (e) => {
    e.preventDefault();
    const startedAt = performance.now();
    setLoading(true);
    setResult(null);

    try {
      const parsedHeaders = parseJsonField(headers, {});
      const finalHeaders = {
        ...parsedHeaders,
        ...(token.trim() ? { Authorization: token.trim().startsWith("Bearer ") ? token.trim() : `Bearer ${token.trim()}` } : {}),
      };

      const response = await axios({
        method,
        url,
        headers: finalHeaders,
        data: canSendBody ? parseJsonField(body, {}) : undefined,
        validateStatus: () => true,
      });

      const durationMs = Math.round(performance.now() - startedAt);
      const rejected = response.status >= 400;
      setResult({
        type: rejected ? "reject" : "success",
        status: response.status,
        statusText: response.statusText,
        durationMs,
        headers: response.headers,
        data: response.data,
      });
    } catch (err) {
      const durationMs = Math.round(performance.now() - startedAt);
      setResult({
        type: "error",
        status: err.response?.status || "Network/Error",
        statusText: err.response?.statusText || err.message,
        durationMs,
        headers: err.response?.headers || {},
        data: err.response?.data || {
          message: err.message,
          note: "CORS, network, invalid URL, invalid JSON, or blocked request can cause this.",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">API Tester</h1>
            <p className="text-sm text-gray-500 mt-1">
              Test API requests with method, URL, token, headers, body, response status, and timing.
            </p>
          </div>
          {result && (
            <div className={`rounded-sm border px-4 py-2 text-sm ${resultTone}`}>
              <span className="block text-xs font-semibold uppercase">Last Result</span>
              <span className="font-bold">{result.status}</span>
              <span className="ml-2">{result.durationMs} ms</span>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
        <form onSubmit={runRequest} className="bg-white rounded-sm shadow p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[130px_minmax(0,1fr)] gap-3">
            <label className="text-sm font-medium text-gray-700">
              Method
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full border rounded-sm px-3 py-2">
                {methodOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              API URL
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/api/users"
                className="mt-1 w-full border rounded-sm px-3 py-2"
                required
              />
            </label>
          </div>

          <label className="text-sm font-medium text-gray-700">
            Bearer Token
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token without Bearer, or paste full Bearer token"
              className="mt-1 w-full border rounded-sm px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Headers JSON
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[130px] font-mono text-xs"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Body JSON
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={!canSendBody}
              className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[180px] font-mono text-xs disabled:bg-gray-100"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button text="Send Request" type="submit" loading={loading} />
            <Button
              text="Use Login Token"
              variant="secondary"
              onClick={() => setToken(sessionStorage.getItem("token") || "")}
            />
            <Button
              text="Clear"
              variant="secondary"
              onClick={() => {
                setResult(null);
                setBody(defaultBody);
                setHeaders(defaultHeaders);
                setToken("");
              }}
            />
          </div>
        </form>

        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Response</h2>
            <p className="text-xs text-gray-500 mt-1">
              Accepted responses, rejected HTTP status, and request errors appear here.
            </p>
          </div>

          {!result ? (
            <p className="p-6 text-center text-sm text-gray-500">No request sent yet.</p>
          ) : (
            <div className="p-4 space-y-3">
              <div className={`rounded-sm border p-3 text-sm ${resultTone}`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <p><b>Type:</b> {result.type}</p>
                  <p><b>Status:</b> {result.status}</p>
                  <p><b>Timing:</b> {result.durationMs} ms</p>
                </div>
                <p className="mt-2 break-words"><b>Message:</b> {result.statusText || "-"}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Response Data</h3>
                <pre className="max-h-[420px] overflow-auto rounded-sm bg-gray-950 p-3 text-xs text-green-100 whitespace-pre-wrap">
                  {formatJson(result.data)}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Response Headers</h3>
                <pre className="max-h-[180px] overflow-auto rounded-sm bg-gray-100 p-3 text-xs text-gray-700 whitespace-pre-wrap">
                  {formatJson(result.headers)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ApiTester;
