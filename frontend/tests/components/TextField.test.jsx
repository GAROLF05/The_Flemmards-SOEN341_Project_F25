import { beforeEach, describe, test, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TextField from "../../src/components/textField/TextField";

// A dummy icon component for testing
const DummyIcon = (props) => <svg data-testid="dummy-icon" {...props} />;

describe("TextField component", () => {
    const mockOnChange = jest.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    test("renders the input element with default props", () => {
        render(<TextField />);
        const inputElement = screen.getByRole("textbox");
        expect(inputElement).toBeInTheDocument();
        expect(inputElement).toHaveAttribute("type", "text");
        expect(inputElement).toHaveAttribute("autocomplete", "off");
        expect(inputElement).not.toBeRequired();
        expect(inputElement).not.toBeDisabled();
    });

    test("renders with provided value, name, id, and placeholder", () => {
        render(
            <TextField
                id="test-id"
                name="test-name"
                value="test value"
                placeholder="Enter text"
            />
        );
        const inputElement = screen.getByPlaceholderText("Enter text");
        expect(inputElement).toHaveAttribute("id", "test-id");
        expect(inputElement).toHaveAttribute("name", "test-name");
        expect(inputElement).toHaveValue("test value");
    });

    test("calls onChange handler when the user types", () => {
        render(<TextField id="test" name="test" onChange={mockOnChange} />);
        const inputElement = screen.getByRole("textbox");
        fireEvent.change(inputElement, { target: { value: "new text" } });
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test("does not call onChange handler when disabled", () => {
        render(<TextField id="test" name="test" onChange={mockOnChange} disabled />);
        const inputElement = screen.getByRole("textbox");
        fireEvent.change(inputElement, { target: { value: "new text" } });
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    test("renders with IconLeft when provided", () => {
        render(<TextField id="test" name="test" IconLeft={DummyIcon} />);
        const iconElement = screen.getByTestId("dummy-icon");
        expect(iconElement).toBeInTheDocument();
        expect(iconElement).toHaveClass("absolute left-3");
    });

    test("applies custom classes to the left icon", () => {
        render(
            <TextField
                id="test"
                name="test"
                IconLeft={DummyIcon}
                iconLeftClasses="text-red-500"
            />
        );
        const iconElement = screen.getByTestId("dummy-icon");
        expect(iconElement).toHaveClass("text-red-500");
    });

    test("is disabled when the disabled prop is true", () => {
        render(<TextField id="test" name="test" disabled />);
        const inputElement = screen.getByRole("textbox");
        expect(inputElement).toBeDisabled();
    });

    test("is required when the required prop is true", () => {
        render(<TextField id="test" name="test" required />);
        const inputElement = screen.getByRole("textbox");
        expect(inputElement).toBeRequired();
    });

    test("applies the correct type when specified (e.g., password)", () => {
        render(
            <TextField
                id="test"
                name="test"
                type="password"
                data-testid="password-input"
            />
        );
        const inputElement = screen.getByTestId("password-input");
        expect(inputElement).toHaveAttribute("type", "password");
    });

    test("applies a custom autocomplete value", () => {
        render(<TextField id="test" name="test" autocomplete="current-password" />);
        const inputElement = screen.getByRole("textbox");
        expect(inputElement).toHaveAttribute("autocomplete", "current-password");
    });

    test("applies a custom className to the input element", () => {
        render(<TextField id="test" name="test" className="my-custom-class" />);
        const inputElement = screen.getByRole("textbox");
        expect(inputElement).toHaveClass("my-custom-class");
    });

    test("passes through rest props to the input element", () => {
        render(<TextField id="test" name="test" data-testid="custom-input" />);
        const inputElement = screen.getByTestId("custom-input");
        expect(inputElement).toBeInTheDocument();
    });

    test("has correct padding when an icon is present", () => {
        render(<TextField id="test" name="test" IconLeft={DummyIcon} />);
        const inputElement = screen.getByRole("textbox");
        expect(inputElement).toHaveClass("pl-10");
    });

    test("handles empty onChange prop gracefully", () => {
        render(<TextField id="test" name="test" onChange={undefined} />);
        const inputElement = screen.getByRole("textbox");
        // This should not throw an error
        expect(() =>
            fireEvent.change(inputElement, { target: { value: "no-op" } })
        ).not.toThrow();
    });

    test("renders with empty string default values for props", () => {
        // This test ensures the component doesn't crash with defaultProps
        render(<TextField />);
        const inputElement = screen.getByRole("textbox");
        expect(inputElement).toHaveValue("");
        expect(inputElement).toHaveAttribute("name", "");
        expect(inputElement).toHaveAttribute("id", "");
        expect(inputElement).toHaveAttribute("placeholder", "");
    });
});