/**
 * ResponsiveTable Component Tests
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ResponsiveTable from "../../shared/components/ResponsiveTable";

// Mock the hooks
vi.mock("../../shared/hooks", () => ({
  useAccessibility: () => ({
    announce: vi.fn(),
  }),
  useResponsive: () => ({
    isBreakpoint: vi.fn(() => true),
  }),
}));

describe("ResponsiveTable", () => {
  const mockData = [
    { id: 1, name: "John Doe", email: "john@example.com", status: "active" },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "inactive",
    },
  ];

  const mockColumns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "status", header: "Status" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with data", () => {
    render(
      <ResponsiveTable
        data={mockData}
        columns={mockColumns}
        caption="Test table"
      />
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(
      <ResponsiveTable
        data={[]}
        columns={mockColumns}
        emptyMessage="No users found"
      />
    );

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <ResponsiveTable data={mockData} columns={mockColumns} loading={true} />
    );

    expect(screen.getByRole("table")).toHaveClass("animate-pulse");
  });

  it("handles sorting when enabled", () => {
    const mockOnSort = vi.fn();

    render(
      <ResponsiveTable
        data={mockData}
        columns={mockColumns}
        sortable={true}
        onSort={mockOnSort}
      />
    );

    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader);

    expect(mockOnSort).toHaveBeenCalledWith("name", "asc");
  });

  it("handles row selection when enabled", () => {
    const mockOnSelect = vi.fn();

    render(
      <ResponsiveTable
        data={mockData}
        columns={mockColumns}
        selectable={true}
        onSelect={mockOnSelect}
        selectedRows={[]}
      />
    );

    const firstRow = screen.getAllByRole("row")[1]; // Skip header row
    fireEvent.click(firstRow);

    expect(mockOnSelect).toHaveBeenCalledWith(0, mockData[0]);
  });

  it("handles keyboard navigation", () => {
    render(
      <ResponsiveTable
        data={mockData}
        columns={mockColumns}
        selectable={true}
        onSelect={vi.fn()}
      />
    );

    const table = screen.getByRole("table");

    // Test arrow key navigation
    fireEvent.keyDown(table, { key: "ArrowDown" });
    fireEvent.keyDown(table, { key: "ArrowRight" });
    fireEvent.keyDown(table, { key: "Home" });
    fireEvent.keyDown(table, { key: "End" });

    // Should not throw errors
    expect(table).toBeInTheDocument();
  });

  it("renders custom cell content", () => {
    const columnsWithRender = [
      {
        key: "name",
        header: "Name",
        render: (value) => <strong>{value}</strong>,
      },
      { key: "email", header: "Email" },
    ];

    render(<ResponsiveTable data={mockData} columns={columnsWithRender} />);

    expect(screen.getByText("John Doe")).toHaveStyle("font-weight: bold");
  });

  it("shows sort indicators", () => {
    render(
      <ResponsiveTable
        data={mockData}
        columns={mockColumns}
        sortable={true}
        onSort={vi.fn()}
      />
    );

    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader);

    // Should show sort indicator (screen reader text)
    expect(screen.getByText("Sorted ascending")).toBeInTheDocument();
  });

  it("handles checkbox selection", () => {
    const mockOnSelect = vi.fn();

    render(
      <ResponsiveTable
        data={mockData}
        columns={mockColumns}
        selectable={true}
        onSelect={mockOnSelect}
        selectedRows={[]}
      />
    );

    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.change(checkbox, { target: { checked: true } });

    expect(mockOnSelect).toHaveBeenCalledWith(0, mockData[0]);
  });

  it("applies accessibility attributes", () => {
    render(
      <ResponsiveTable
        data={mockData}
        columns={mockColumns}
        caption="Accessible table"
        sortable={true}
      />
    );

    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-label", "Accessible table");

    const headers = screen.getAllByRole("columnheader");
    headers.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("handles mobile responsive layout", () => {
    // Mock mobile breakpoint
    const { useResponsive } = require("../../shared/hooks");
    useResponsive.mockReturnValue({
      isBreakpoint: vi.fn(() => false), // Mobile
    });

    render(
      <ResponsiveTable
        data={mockData}
        columns={mockColumns}
        mobileBreakpoint="md"
      />
    );

    // Should render mobile card view instead of table
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
