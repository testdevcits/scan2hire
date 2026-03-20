import React from "react";

function CommonTable({ columns, data, actions }) {
  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
          <tr>
            {columns.map((col) => (
              <th key={col.accessor} className="px-4 py-3">
                {col.header}
              </th>
            ))}
            {actions && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-4">
                No data found
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={row._id || index} className="border-t hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.accessor} className="px-4 py-2">
                    {col.render
                      ? col.render(row[col.accessor], row)
                      : row[col.accessor]}
                  </td>
                ))}

                {/* Actions */}
                {actions && (
                  <td className="px-4 py-2 flex gap-2">
                    {actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => action.onClick(row)}
                        className={`px-2 py-1 text-xs rounded ${
                          action.className || "bg-blue-500 text-white"
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CommonTable;
