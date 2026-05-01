import React from "react";

function CommonTable({ columns, data, actions }) {
  return (
    <div className="bg-white shadow rounded-sm overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-[15px] text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
            <tr>
              {columns.map((col) => (
                <th key={col.accessor} className="px-4 py-3 font-semibold whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row._id || index}
                  className="border-t hover:bg-[#fff8f6]"
                >
                  {columns.map((col) => (
                    <td key={col.accessor} className="px-4 py-3 align-top max-w-xs">
                      {col.render
                        ? col.render(row[col.accessor], row)
                        : row[col.accessor]}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                      {actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => action.onClick(row)}
                          className={`px-3 py-1.5 text-xs rounded-sm font-semibold ${
                            action.className || "bg-blue-500 text-white"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden p-3 space-y-3">
        {data.length === 0 ? (
          <p className="text-center text-gray-500">No data found</p>
        ) : (
          data.map((row, index) => (
            <div
              key={row._id || index}
              className="border rounded-sm p-3 shadow-sm bg-gray-50"
            >
              {/* Data */}
              <div className="space-y-1 text-sm">
                {columns.map((col) => (
                  <div key={col.accessor} className="grid grid-cols-[105px_1fr] gap-2">
                    <span className="font-semibold text-gray-600">
                      {col.header}:
                    </span>
                    <span className="text-gray-900 text-right break-words">
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
                      className={`flex-1 px-3 py-2 text-xs rounded-sm font-semibold ${
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
