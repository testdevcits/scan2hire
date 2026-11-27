import React from "react";

export const employeeChecklistGroups = [
  {
    key: "joiningChecklist",
    title: "Joining Checklist",
    items: [
      ["idCard", "ID Card / Notepad / Pen"],
      ["credentials", "Credentials"],
      ["tshirtBag", "T-Shirt / Bag"],
      ["officeKeyPhoneSystem", "Office Key / Phone / System"],
    ],
  },
  {
    key: "leavingChecklist",
    title: "Leaving Checklist / Handover",
    items: [
      ["idCardNotepadPen", "ID Card / Notepad / Pen"],
      ["credentials", "Credentials"],
      ["tshirtBag", "T-Shirt / Bag"],
      ["officeKeyPhoneSystem", "Office Key / Phone / System"],
    ],
  },
  {
    key: "noDuesChecklist",
    title: "No Dues Checklist",
    items: [
      ["teamLeadProjectManager", "Team Lead / Project Manager"],
      ["itHead", "IT Head"],
      ["hrHead", "HR Head"],
    ],
  },
];

export default function EmployeeChecklist({ value = {}, onChange, disabled = false }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {employeeChecklistGroups.map((group) => (
        <fieldset
          key={group.key}
          className="rounded-sm border border-gray-200 p-3 dark:border-gray-700"
        >
          <legend className="px-1 text-sm font-semibold">{group.title}</legend>
          {group.items.map(([key, label]) => (
            <label key={key} className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(value[group.key]?.[key])}
                disabled={disabled}
                onChange={(event) => onChange?.(group.key, key, event.target.checked)}
                className="h-4 w-4 accent-[#f84525]"
              />
              {label}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
