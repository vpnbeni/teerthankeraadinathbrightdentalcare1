import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, mockPlans } from "../../../test/utils/test-utils";
import PlanSelector from "../PlanSelector";
import plansService from "../../../services/plans";

// Mock the plans service
vi.mock("../../../services/plans", () => ({
  default: {
    getPlans: vi.fn(),
  },
}));

// Mock the PlanCard component
vi.mock("../PlanCard", () => ({
  default: ({ plan, onSelect, isSelected }) => (
    <div
      data-testid={`plan-card-${plan._id}`}
      className={`plan-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(plan)}
    >
      <h3>{plan.name}</h3>
      <p>₹{plan.price}</p>
      <p>{plan.sessions} sessions</p>
    </div>
  ),
}));

describe("PlanSelector", () => {
  const mockOnPlanSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    plansService.getPlans.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<PlanSelector onPlanSelect={mockOnPlanSelect} />);

    expect(
      screen.getByText("Choose Your Dental Care Plan")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Select the plan that best fits your dental care needs")
    ).toBeInTheDocument();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders plans after successful fetch", async () => {
    plansService.getPlans.mockResolvedValue({
      data: { data: mockPlans },
    });

    renderWithProviders(<PlanSelector onPlanSelect={mockOnPlanSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId("plan-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("plan-card-2")).toBeInTheDocument();
    });

    expect(screen.getByText("6 Sessions Plan")).toBeInTheDocument();
    expect(screen.getByText("8 Sessions Plan")).toBeInTheDocument();
    expect(screen.getByText("₹5000")).toBeInTheDocument();
    expect(screen.getByText("₹7000")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    plansService.getPlans.mockRejectedValue(new Error("Network error"));

    renderWithProviders(<PlanSelector onPlanSelect={mockOnPlanSelect} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load subscription plans. Please try again.")
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId("plan-card-1")).not.toBeInTheDocument();
  });

  it("calls onPlanSelect when a plan is clicked", async () => {
    const user = userEvent.setup();
    plansService.getPlans.mockResolvedValue({
      data: { data: mockPlans },
    });

    renderWithProviders(<PlanSelector onPlanSelect={mockOnPlanSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId("plan-card-1")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("plan-card-1"));

    expect(mockOnPlanSelect).toHaveBeenCalledWith(mockPlans[0]);
  });

  it("highlights selected plan", async () => {
    plansService.getPlans.mockResolvedValue({
      data: { data: mockPlans },
    });

    renderWithProviders(
      <PlanSelector
        onPlanSelect={mockOnPlanSelect}
        selectedPlan={mockPlans[0]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("plan-card-1")).toBeInTheDocument();
    });

    const selectedCard = screen.getByTestId("plan-card-1");
    expect(selectedCard).toHaveClass("selected");
  });

  it("displays plan features information", async () => {
    plansService.getPlans.mockResolvedValue({
      data: { data: mockPlans },
    });

    renderWithProviders(<PlanSelector onPlanSelect={mockOnPlanSelect} />);

    await waitFor(() => {
      expect(
        screen.getByText("What's included in all plans:")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("• Comprehensive dental examination")
    ).toBeInTheDocument();
    expect(screen.getByText("• Digital health records")).toBeInTheDocument();
    expect(screen.getByText("• Priority booking system")).toBeInTheDocument();
    expect(
      screen.getByText("• Professional dental treatments")
    ).toBeInTheDocument();
    expect(screen.getByText("• Follow-up consultations")).toBeInTheDocument();
  });
});
