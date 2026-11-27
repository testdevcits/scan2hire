// Keep encoded JSON below the hosted API request budget, including base64 overhead.
export const REQUEST_BUDGET = 4 * 1024 * 1024;
export function employeeUploadErrors(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (bytes <= REQUEST_BUDGET) return {};
  const files = [];
  const add = (name, file) => {
    if (file?.dataUri) files.push({ name, bytes: file.dataUri.length, file: file.name || name });
  };
  add("employee-photo", payload.photo);
  Object.entries(payload.documents || {}).forEach(([key, file]) => add(key, file));
  (payload.qualifications || []).forEach((item, index) =>
    add(`qualification-marksheet-${index}`, item.documents?.marksheet)
  );
  (payload.previousEmployments || []).forEach((item) =>
    Object.entries(item.documents || {}).forEach(([key, value]) =>
      (Array.isArray(value) ? value : [value]).forEach((file) => add(`${item.id}-${key}`, file))
    )
  );
  const errors = {};
  let excess = bytes - REQUEST_BUDGET;
  for (const file of files.sort((a, b) => b.bytes - a.bytes)) {
    errors[file.name] =
      `${file.file}: contributes ${(file.bytes / 1024 / 1024).toFixed(2)} MB to the request. Compress or replace this file. Total request: ${(bytes / 1024 / 1024).toFixed(2)} MB; upload budget: 4 MB.`;
    excess -= file.bytes;
    if (excess <= 0) break;
  }
  return errors;
}
