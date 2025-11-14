import { beforeEach, describe, test, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Checkbox from "../../src/components/checkbox/Checkbox";

describe("Checkbox component", () => {
    const mockOnChange = jest.fn();
    const requiredProps = {
        id: "test-checkbox",
        name: "test-checkbox-name",
        label: "Test Checkbox Label",
    };

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    test("renders correctly with required props", () => {
        render(<Checkbox {...requiredProps} onChange={mockOnChange} />);
        const checkbox = screen.getByLabelText("Test Checkbox Label");
        const label = screen.getByText("Test Checkbox Label");

        expect(checkbox).toBeInTheDocument();
        expect(label).toBeInTheDocument();
        expect(checkbox).toHaveAttribute("id", requiredProps.id);
        expect(checkbox).toHaveAttribute("name", requiredProps.name);
        expect(label).toHaveAttribute("for", requiredProps.id);
    });

    test("is unchecked by default", () => {
        render(<Checkbox {...requiredProps} />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        expect(checkbox).not.toBeChecked();
    });

    test("is checked when the checked prop is true", () => {
        render(<Checkbox {...requiredProps} checked={true} />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        expect(checkbox).toBeChecked();
    });

    test("calls onChange handler when the checkbox is clicked", () => {
        render(<Checkbox {...requiredProps} onChange={mockOnChange} />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        fireEvent.click(checkbox);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test("calls onChange handler when the label is clicked", () => {
        render(<Checkbox {...requiredProps} onChange={mockOnChange} />);
        const label = screen.getByText(requiredProps.label);
        fireEvent.click(label);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test("is disabled when the disabled prop is true", () => {
        render(<Checkbox {...requiredProps} disabled />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        expect(checkbox).toBeDisabled();
        expect(checkbox).toHaveClass("opacity-50 cursor-not-allowed");
    });

    test("does not call onChange handler when disabled and clicked", () => {
        render(<Checkbox {...requiredProps} onChange={mockOnChange} disabled />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        fireEvent.click(checkbox);
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    test("does not call onChange handler when disabled and label is clicked", () => {
        render(<Checkbox {...requiredProps} onChange={mockOnChange} disabled />);
        const label = screen.getByText(requiredProps.label);
        fireEvent.click(label);
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    test("applies default color and size classes", () => {
        render(<Checkbox {...requiredProps} />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        expect(checkbox).toHaveClass("accent-indigo-600"); // default color 'primary'
        expect(checkbox).toHaveClass("h-4 w-4"); // default size 'medium'
    });

    test.each([
        ["primary", "accent-indigo-600"],
        ["blue", "accent-blue-600"],
        ["green", "accent-green-600"],
        ["red", "accent-red-600"],
    ])("applies the correct class for color '%s'", (color, expectedClass) => {
        render(<Checkbox {...requiredProps} color={color} />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        expect(checkbox).toHaveClass(expectedClass);
    });

    test.each([
        ["small", "h-3 w-3"],
        ["medium", "h-4 w-4"],
        ["large", "h-5 w-5"],
    ])("applies the correct class for size '%s'", (size, expectedClass) => {
        render(<Checkbox {...requiredProps} size={size} />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        expect(checkbox).toHaveClass(expectedClass);
    });

    test("applies a custom className to the input element", () => {
        const customClass = "my-custom-checkbox";
        render(<Checkbox {...requiredProps} className={customClass} />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        expect(checkbox).toHaveClass(customClass);
    });

    test("passes through rest props to the input element", () => {
        render(<Checkbox {...requiredProps} data-testid="custom-checkbox" />);
        const checkbox = screen.getByTestId("custom-checkbox");
        expect(checkbox).toBeInTheDocument();
    });

    test("handles empty onChange prop gracefully without crashing", () => {
        render(<Checkbox {...requiredProps} onChange={undefined} />);
        const checkbox = screen.getByLabelText(requiredProps.label);
        expect(() => fireEvent.click(checkbox)).not.toThrow();
    });

    test("renders with empty string default values for required props", () => {
        // This test ensures the component doesn't crash with defaultProps
        const { container } = render(<Checkbox />);
        const checkbox = screen.getByRole("checkbox");
        const label = container.querySelector("label");

        expect(checkbox).toBeInTheDocument();
        expect(checkbox).toHaveAttribute("id", "");
        expect(checkbox).toHaveAttribute("name", "");
        expect(label).toHaveTextContent("");
    });

    test("toggles checked state correctly when controlled", () => {
        const { rerender } = render(<Checkbox {...requiredProps} checked={false} onChange={mockOnChange} />);
        const checkbox = screen.getByLabelText(requiredProps.label);

        expect(checkbox).not.toBeChecked();

        // Rerender with checked=true
        rerender(<Checkbox {...requiredProps} checked={true} onChange={mockOnChange} />);
        expect(checkbox).toBeChecked();

        // Rerender with checked=false
        rerender(<Checkbox {...requiredProps} checked={false} onChange={mockOnChange} />);
        expect(checkbox).not.toBeChecked();
    });
});