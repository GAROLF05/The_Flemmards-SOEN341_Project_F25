import { beforeEach, describe, test, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ButtonGroup from "../../src/components/button/ButtonGroup";

describe("ButtonGroup component", () => {
    const mockOptions = [
        { value: "opt1", label: "Option 1" },
        { value: "opt2", label: "Option 2" },
        { value: "opt3", label: "Option 3" },
    ];
    const mockOnChange = jest.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    test("renders the correct number of buttons based on options", () => {
        render(<ButtonGroup options={mockOptions} value="opt1" onChange={mockOnChange} />);
        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(mockOptions.length);
    });

    test("renders button labels correctly", () => {
        render(<ButtonGroup options={mockOptions} value="opt1" onChange={mockOnChange} />);
        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.getByText("Option 2")).toBeInTheDocument();
        expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    test("applies active styles to the button matching the current value", () => {
        render(<ButtonGroup options={mockOptions} value="opt2" onChange={mockOnChange} />);
        const activeButton = screen.getByText("Option 2");
        const inactiveButton = screen.getByText("Option 1");

        expect(activeButton).toHaveClass("bg-white text-indigo-600 shadow-sm");
        expect(inactiveButton).not.toHaveClass("bg-white text-indigo-600 shadow-sm");
    });

    test("applies inactive styles to non-selected buttons", () => {
        render(<ButtonGroup options={mockOptions} value="opt1" onChange={mockOnChange} />);
        const inactiveButton = screen.getByText("Option 2");
        expect(inactiveButton).toHaveClass("text-gray-500 hover:bg-gray-200");
    });

    test("calls onChange with the correct value when a button is clicked", () => {
        render(<ButtonGroup options={mockOptions} value="opt1" onChange={mockOnChange} />);
        const buttonToClick = screen.getByText("Option 3");
        fireEvent.click(buttonToClick);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith("opt3");
    });

    test("does not call onChange when a disabled button group is clicked", () => {
        render(<ButtonGroup options={mockOptions} value="opt1" onChange={mockOnChange} disabled />);
        const buttonToClick = screen.getByText("Option 2");
        fireEvent.click(buttonToClick);
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    test("applies custom className to the container", () => {
        const customClass = "my-extra-class";
        render(<ButtonGroup options={mockOptions} value="opt1" onChange={mockOnChange} className={customClass} />);
        const container = screen.getByText("Option 1").parentElement;
        expect(container).toHaveClass(customClass);
    });

    test("renders nothing inside the container if options array is empty", () => {
        render(<ButtonGroup options={[]} value="" onChange={mockOnChange} />);
        const buttons = screen.queryAllByRole("button");
        expect(buttons).toHaveLength(0);
    });

    test("handles a value that does not match any option", () => {
        render(<ButtonGroup options={mockOptions} value="nonexistent-value" onChange={mockOnChange} />);
        const buttons = screen.getAllByRole("button");
        buttons.forEach(button => {
            expect(button).not.toHaveClass("bg-white text-indigo-600 shadow-sm");
            expect(button).toHaveClass("text-gray-500 hover:bg-gray-200");
        });
    });

    test("clicking the already active button still triggers onChange", () => {
        render(<ButtonGroup options={mockOptions} value="opt1" onChange={mockOnChange} />);
        const activeButton = screen.getByText("Option 1");
        fireEvent.click(activeButton);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith("opt1");
    });

    // test("throws an error if onChange is not provided and a button is clicked", () => {
    //     // Suppress console.error for this test because React will log a prop-type warning
    //     const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

    //     render(<ButtonGroup options={mockOptions} value="opt1" />);
    //     const buttonToClick = screen.getByText("Option 2");

    //     // The component's handleClick will try to call onChange, which is undefined, causing a TypeError.
    //     expect(() => fireEvent.click(buttonToClick)).toThrow();

    //     consoleErrorSpy.mockRestore();
    // });

    test("renders correctly with default props when only required props are passed", () => {
        // This test ensures the component doesn't crash with defaultProps
        render(<ButtonGroup options={mockOptions} value="opt1" onChange={mockOnChange} />);
        const container = screen.getByText("Option 1").parentElement;
        expect(container).toBeInTheDocument();
        // Check for default classes
        expect(container).toHaveClass("flex w-full rounded-lg bg-gray-100 p-1 mb-6");
    });
});