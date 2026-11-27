import { TextEncoder } from "util";
import { employeeUploadErrors, REQUEST_BUDGET } from "./employeeUploadSize";
global.TextEncoder = TextEncoder;
test("small uploads pass; large combined requests identify the largest company field", () => {
  expect(employeeUploadErrors({ documents: {} })).toEqual({});
  const payload = {
    previousEmployments: [
      {
        id: "last",
        documents: { salarySlips: [{ name: "salary.pdf", dataUri: "x".repeat(REQUEST_BUDGET) }] },
      },
    ],
  };
  expect(employeeUploadErrors(payload)["last-salarySlips"]).toMatch(/salary.pdf/);
});
