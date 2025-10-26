/**
 * Responsive and Accessible Table Component
 * Provides mobile-friendly table display with accessibility features
 */

import React, { useState, useRef, useEffect } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAccessibility, useResponsive } from "../hooks";
import { keyboardNavigation, focusManagement } from "../utils/accessibility";

const ResponsiveTable = ({
  data = [],
  columns = [],
  caption,
  sortable = false,
  selectable = false,
  onSort,
  onSelect,
  selectedRows = [],
  loading = false,
  emptyMessage = "No data available",
  className = "",
  mobileBreakpoint = "md",
  ...props
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [focusedCell, setFocusedCell] = useState({ row: -1, col: -1 });
  const tableRef = useRef(null);

  const { announce } = useAccessibility();
  const { isBreakpoint } = useResponsive();

  const isMobile = !isBreakpoint(mobileBreakpoint);

  // Handle sorting
  const handleSort = (columnKey) => {
    if (!sortable || !onSort) return;

    let direction = "asc";
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key: columnKey, direction });
    onSort(columnKey, direction);

    announce(`Table sorted by ${columnKey} in ${direction}ending order`);
  };

  // Handle row selection
  const handleRowSelect = (rowIndex, rowData) => {
    if (!selectable || !onSelect) return;

    onSelect(rowIndex, rowData);

    const isSelected = selectedRows.includes(rowIndex);
    announce(`Row ${rowIndex + 1} ${isSelected ? "deselected" : "selected"}`);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!tableRef.current) return;

    const rows = tableRef.current.querySelectorAll("tbody tr");
    const cells = tableRef.current.querySelectorAll("tbody td, tbody th");

    keyboardNavigation.handleKeyDown(event, {
      [keyboardNavigation.keys.ARROW_DOWN]: () => {
        const nextRow = Math.min(focusedCell.row + 1, rows.length - 1);
        setFocusedCell({ ...focusedCell, row: nextRow });
        focusCellAt(nextRow, focusedCell.col);
      },
      [keyboardNavigation.keys.ARROW_UP]: () => {
        const prevRow = Math.max(focusedCell.row - 1, 0);
        setFocusedCell({ ...focusedCell, row: prevRow });
        focusCellAt(prevRow, focusedCell.col);
      },
      [keyboardNavigation.keys.ARROW_RIGHT]: () => {
        const nextCol = Math.min(focusedCell.col + 1, columns.length - 1);
        setFocusedCell({ ...focusedCell, col: nextCol });
        focusCellAt(focusedCell.row, nextCol);
      },
      [keyboardNavigation.keys.ARROW_LEFT]: () => {
        const prevCol = Math.max(focusedCell.col - 1, 0);
        setFocusedCell({ ...focusedCell, col: prevCol });
        focusCellAt(focusedCell.row, prevCol);
      },
      [keyboardNavigation.keys.HOME]: () => {
        setFocusedCell({ row: 0, col: 0 });
        focusCellAt(0, 0);
      },
      [keyboardNavigation.keys.END]: () => {
        const lastRow = rows.length - 1;
        const lastCol = columns.length - 1;
        setFocusedCell({ row: lastRow, col: lastCol });
        focusCellAt(lastRow, lastCol);
      },
      [keyboardNavigation.keys.SPACE]: () => {
        if (selectable && focusedCell.row >= 0) {
          handleRowSelect(focusedCell.row, data[focusedCell.row]);
        }
      },
    });
  };

  const focusCellAt = (row, col) => {
    const cell = tableRef.current?.querySelector(
      `tbody tr:nth-child(${row + 1}) td:nth-child(${
        col + 1
      }), tbody tr:nth-child(${row + 1}) th:nth-child(${col + 1})`
    );
    if (cell) {
      cell.focus();
    }
  };

  // Render sort indicator
  const renderSortIndicator = (columnKey) => {
    if (!sortable || sortConfig.key !== columnKey) {
      return <span className="sr-only">Not sorted</span>;
    }

    return (
      <span className="ml-2 flex-shrink-0">
        {sortConfig.direction === "asc" ? (
          <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="sr-only">
          Sorted {sortConfig.direction === "asc" ? "ascending" : "descending"}
        </span>
      </span>
    );
  };

  // Mobile card view
  const renderMobileView = () => (
    <div className="space-y-4" role="list" aria-label={caption}>
      {data.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`bg-white rounded-lg border p-4 shadow-sm ${
            selectable ? "cursor-pointer hover:bg-gray-50" : ""
          } ${selectedRows.includes(rowIndex) ? "ring-2 ring-primary" : ""}`}
          role="listitem"
          onClick={() => selectable && handleRowSelect(rowIndex, row)}
          onKeyDown={(e) => {
            if (selectable && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleRowSelect(rowIndex, row);
            }
          }}
          tabIndex={selectable ? 0 : -1}
          aria-selected={
            selectable ? selectedRows.includes(rowIndex) : undefined
          }
        >
          {columns.map((column, colIndex) => (
            <div
              key={colIndex}
              className="flex justify-between py-2 border-b border-gray-100 last:border-b-0"
            >
              <dt className="text-sm font-medium text-gray-600 flex-shrink-0 w-1/3">
                {column.header}
              </dt>
              <dd className="text-sm text-gray-900 flex-1 text-right">
                {column.render
                  ? column.render(row[column.key], row, rowIndex)
                  : row[column.key]}
              </dd>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  // Desktop table view
  const renderTableView = () => (
    <div
      className="overflow-x-auto custom-scrollbar"
      role="region"
      aria-label={caption || "Data table"}
    >
      <table
        ref={tableRef}
        className={`min-w-full divide-y divide-gray-200 accessible-table ${className}`}
        onKeyDown={handleKeyDown}
        role="table"
        aria-label={caption}
        {...props}
      >
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead className="bg-gray-50">
          <tr role="row">
            {selectable && (
              <th
                scope="col"
                className="relative w-12 px-6 sm:w-16 sm:px-8"
                role="columnheader"
              >
                <span className="sr-only">Select rows</span>
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider admin-focus mobile-tap-target ${
                  sortable && column.sortable !== false
                    ? "cursor-pointer hover:bg-gray-100"
                    : ""
                }`}
                onClick={() =>
                  sortable &&
                  column.sortable !== false &&
                  handleSort(column.key)
                }
                onKeyDown={(e) => {
                  if (
                    sortable &&
                    column.sortable !== false &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    handleSort(column.key);
                  }
                }}
                tabIndex={sortable && column.sortable !== false ? 0 : -1}
                role={
                  sortable && column.sortable !== false
                    ? "button"
                    : "columnheader"
                }
                aria-sort={
                  sortable && sortConfig.key === column.key
                    ? sortConfig.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : sortable && column.sortable !== false
                    ? "none"
                    : undefined
                }
                aria-label={
                  sortable && column.sortable !== false
                    ? `Sort by ${column.header}`
                    : column.header
                }
              >
                <div className="flex items-center">
                  {column.header}
                  {sortable &&
                    column.sortable !== false &&
                    renderSortIndicator(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              role="row"
              className={`admin-focus mobile-tap-target ${
                selectable ? "cursor-pointer hover:bg-gray-50" : ""
              } ${selectedRows.includes(rowIndex) ? "bg-blue-50" : ""}`}
              onClick={() => selectable && handleRowSelect(rowIndex, row)}
              onKeyDown={(e) => {
                if (selectable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleRowSelect(rowIndex, row);
                }
              }}
              tabIndex={selectable ? 0 : -1}
              aria-selected={
                selectable ? selectedRows.includes(rowIndex) : undefined
              }
              aria-label={
                selectable ? `Row ${rowIndex + 1}, click to select` : undefined
              }
            >
              {selectable && (
                <td className="relative w-12 px-6 sm:w-16 sm:px-8" role="cell">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary admin-focus mobile-tap-target"
                    checked={selectedRows.includes(rowIndex)}
                    onChange={() => handleRowSelect(rowIndex, row)}
                    aria-label={`Select row ${rowIndex + 1}`}
                  />
                </td>
              )}
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  role="cell"
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 admin-focus"
                  tabIndex={-1}
                  onFocus={() =>
                    setFocusedCell({ row: rowIndex, col: colIndex })
                  }
                  aria-label={`${column.header}: ${
                    column.render
                      ? "Custom content"
                      : row[column.key] || "Empty"
                  }`}
                >
                  {column.render
                    ? column.render(row[column.key], row, rowIndex)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        {isMobile ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="responsive-table">
      {isMobile ? renderMobileView() : renderTableView()}
    </div>
  );
};

// Specialized table components
export const UserTable = ({ users, ...props }) => {
  const columns = [
    {
      key: "name",
      header: "Name",
      render: (value, user) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-gray-500 text-xs">{user.email}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <ResponsiveTable
      data={users}
      columns={columns}
      caption="Users table"
      {...props}
    />
  );
};

export const AppointmentTable = ({ appointments, ...props }) => {
  const columns = [
    {
      key: "patientName",
      header: "Patient",
    },
    {
      key: "date",
      header: "Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "time",
      header: "Time",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === "confirmed"
              ? "bg-green-100 text-green-800"
              : value === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <ResponsiveTable
      data={appointments}
      columns={columns}
      caption="Appointments table"
      {...props}
    />
  );
};

export default ResponsiveTable;
