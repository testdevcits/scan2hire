import API from "./axios";

const MCP_PROTOCOL_VERSION = "2025-03-26";
let requestId = 0;

const getMcpUrl = () => {
  const baseUrl = String(API.defaults.baseURL || "").replace(/\/$/, "");
  return `${baseUrl.replace(/\/api$/, "")}/mcp`;
};

const parseToolResult = (payload) => {
  if (payload?.error) throw new Error(payload.error.message || "Unable to complete the request");

  const toolResult = payload?.result;
  if (toolResult?.isError) {
    throw new Error(toolResult.content?.[0]?.text || "You do not have permission to view this information.");
  }

  const text = toolResult?.content?.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("The assistant returned an invalid response.");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The assistant returned an invalid response.");
  }
};

const callTool = async (name, args = {}) => {
  const response = await API.post(
    getMcpUrl(),
    {
      jsonrpc: "2.0",
      id: ++requestId,
      method: "tools/call",
      params: { name, arguments: args },
    },
    { headers: { "MCP-Protocol-Version": MCP_PROTOCOL_VERSION } }
  );

  return parseToolResult(response.data);
};

export const mcpApi = {
  searchEmployees: (search, limit = 10) => callTool("search_employees", { search, limit }),
  searchCandidates: (search, limit = 10) => callTool("search_candidates", { search, limit }),
  getLeaveSummary: (month) => callTool("get_leave_summary", month ? { month } : {}),
};

