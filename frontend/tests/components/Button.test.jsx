import { describe, test, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Button from "../../src/components/button/Button";

describe("Button component", () => {
    test("renders with children", () => {
        render(<Button>Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toBeInTheDocument();
    });

    test("calls onClick handler when clicked", () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        fireEvent.click(buttonElement);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test("does not call onClick handler when disabled", () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick} disabled>Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        fireEvent.click(buttonElement);
        expect(handleClick).not.toHaveBeenCalled();
    });

    test("is disabled when disabled prop is true", () => {
        render(<Button disabled>Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toBeDisabled();
        expect(buttonElement).toHaveClass("opacity-50 cursor-not-allowed");
    });

    test("has default type 'button'", () => {
        render(<Button>Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toHaveAttribute("type", "button");
    });

    test("applies the correct type when specified", () => {
        render(<Button type="submit">Submit</Button>);
        const buttonElement = screen.getByRole("button", { name: /submit/i });
        expect(buttonElement).toHaveAttribute("type", "submit");
    });

    test("has default 'contained' variant styles", () => {
        render(<Button>Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toHaveClass("bg-indigo-600");
    });

    test("applies 'outlined' variant styles", () => {
        render(<Button variant="outlined">Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toHaveClass("text-indigo-600 border-indigo-600");
        expect(buttonElement).not.toHaveClass("bg-indigo-600");
    });

    test("applies 'text' variant styles", () => {
        render(<Button variant="text">Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toHaveClass("text-indigo-600");
        expect(buttonElement).not.toHaveClass("border");
    });

    test("applies no variant styles for 'none'", () => {
        render(<Button variant="none">Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        // It should have base classes but not variant-specific ones like bg-color or border
        expect(buttonElement).not.toHaveClass("bg-indigo-600");
        expect(buttonElement).not.toHaveClass("border-indigo-600");
    });

    test("applies custom className", () => {
        render(<Button className="my-custom-class">Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).toHaveClass("my-custom-class");
    });

    test("passes rest props to the button element", () => {
        render(<Button data-testid="custom-button">Click Me</Button>);
        const buttonElement = screen.getByTestId("custom-button");
        expect(buttonElement).toBeInTheDocument();
    });

    test("handles borderRouned prop without adding extra classes", () => {
        // Note: The current implementation for `borderRouned` is `borderRouned && ""`,
        // which results in no class being added. This test verifies that behavior.
        // If the intention was to add a class like 'rounded-full', the component logic should be updated.
        const { rerender } = render(<Button borderRouned={false}>Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        const classesWithoutProp = buttonElement.className;

        rerender(<Button borderRouned={true}>Click Me</Button>);
        const classesWithProp = buttonElement.className;

        // The classes should be identical since the prop doesn't add any.
        expect(classesWithProp).toBe(classesWithoutProp);
    });

    test("does not apply hover/focus styles when disabled", () => {
        render(<Button variant="contained" disabled>Click Me</Button>);
        const buttonElement = screen.getByRole("button", { name: /click me/i });
        expect(buttonElement).not.toHaveClass("hover:bg-indigo-700");
    });
});