import React from "react";

function CommonTable({ columns, data, actions }) {
  return (
    <div className="bg-white shadow rounded-lg">
      {/* ✅ Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
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
                <tr
                  key={row._id || index}
                  className="border-t hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <td key={col.accessor} className="px-4 py-2">
                      {col.render
                        ? col.render(row[col.accessor], row)
                        : row[col.accessor]}
                    </td>
                  ))}

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

      {/* ✅ Mobile Card View */}
      <div className="md:hidden p-3 space-y-3">
        {data.length === 0 ? (
          <p className="text-center text-gray-500">No data found</p>
        ) : (
          data.map((row, index) => (
            <div
              key={row._id || index}
              className="border rounded-lg p-3 shadow-sm bg-gray-50"
            >
              {/* Data */}
              <div className="space-y-1 text-sm">
                {columns.map((col) => (
                  <div key={col.accessor} className="flex justify-between">
                    <span className="font-medium text-gray-600">
                      {col.header}:
                    </span>
                    <span className="text-gray-800 text-right">
                      {col.render
                        ? col.render(row[col.accessor], row)
                        : row[col.accessor] || "N/A"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {actions && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {actions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => action.onClick(row)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${
                        action.className || "bg-blue-500 text-white"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommonTable;
