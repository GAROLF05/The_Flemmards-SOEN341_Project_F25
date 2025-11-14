import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Select from "../../src/components/select/Select";

describe("Select component", () => {
    const mockOnChange = jest.fn();
    const mockOptions = [
        { value: "opt1", label: "Option 1" },
        { value: "opt2", label: "Option 2" },
        { value: "opt3", label: "Option 3" },
    ];
    const requiredProps = {
        label: "Test Select",
        options: mockOptions,
        onChange: mockOnChange,
    };

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    test("renders correctly with label and initial value", () => {
        render(<Select {...requiredProps} value="opt1" />);
        const button = screen.getByRole("button", { name: "Test Select" });
        expect(button).toBeInTheDocument();
        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.getByText("Test Select")).toBeInTheDocument();
    });

    test("opens dropdown on button click", () => {
        render(<Select {...requiredProps} value="opt1" />);
        const button = screen.getByRole("button");
        fireEvent.click(button);

        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByText("Option 2")).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "true");
    });

    test("closes dropdown when an option is clicked", () => {
        render(<Select {...requiredProps} value="opt1" />);
        const button = screen.getByRole("button");
        fireEvent.click(button); // Open dropdown

        const optionToClick = screen.getByText("Option 3");
        fireEvent.click(optionToClick);

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "false");
    });

    test("calls onChange with the correct value when an option is clicked", () => {
        render(<Select {...requiredProps} value="opt1" />);
        fireEvent.click(screen.getByRole("button")); // Open dropdown

        const optionToClick = screen.getByText("Option 2");
        fireEvent.click(optionToClick);

        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith("opt2");
    });

    test("closes dropdown when clicking outside the component", () => {
        render(
            <div>
                <Select {...requiredProps} value="opt1" />
                <button>Outside</button>
            </div>
        );
        const selectButton = screen.getByRole("button", { name: "Test Select" });
        fireEvent.click(selectButton); // Open dropdown

        expect(screen.getByRole("listbox")).toBeInTheDocument();

        const outsideButton = screen.getByText("Outside");
        fireEvent.mouseDown(outsideButton); // Use mouseDown to match the event listener

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    test("does not open dropdown when disabled", () => {
        render(<Select {...requiredProps} value="opt1" disabled />);
        const button = screen.getByRole("button");
        expect(button).toBeDisabled();

        fireEvent.click(button);
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    test("applies custom className to the root element", () => {
        const customClass = "my-custom-select";
        const { container } = render(<Select {...requiredProps} value="opt1" className={customClass} />);
        expect(container.firstChild).toHaveClass(customClass);
    });

    // test("highlights the selected option in the dropdown", () => {
    //     render(<Select {...requiredProps} value="opt2" />);
    //     fireEvent.click(screen.getByRole("button"));

    //     const selectedOption = screen.getByText("Option 2");
    //     expect(selectedOption).toHaveClass("bg-indigo-50 text-indigo-600 font-semibold");
    //     expect(selectedOption).toHaveAttribute("aria-selected", "true");

    //     const unselectedOption = screen.getByText("Option 1");
    //     expect(unselectedOption).not.toHaveClass("bg-indigo-50");
    // });

    test("label floats up when a value is present", () => {
        render(<Select {...requiredProps} value="opt1" />);
        const label = screen.getByText("Test Select");
        expect(label).toHaveClass("-top-2 text-xs");
    });

    test("label is in default position when no value is present", () => {
        render(<Select {...requiredProps} value="" />);
        const label = screen.getByText("Test Select");
        expect(label).toHaveClass("top-1/2 -translate-y-1/2");
    });

    test("label floats up when dropdown is opened, even without a value", () => {
        render(<Select {...requiredProps} value="" />);
        const label = screen.getByText("Test Select");
        expect(label).toHaveClass("top-1/2"); // Initial state

        fireEvent.click(screen.getByRole("button"));

        expect(label).toHaveClass("-top-2 text-xs");
    });

    test("renders with empty options array without crashing", () => {
        render(<Select {...requiredProps} options={[]} value="" />);
        fireEvent.click(screen.getByRole("button"));

        const listbox = screen.getByRole("listbox");
        expect(listbox.children).toHaveLength(0);
    });

    test("handles a value that does not exist in options", () => {
        render(<Select {...requiredProps} value="nonexistent" />);
        const button = screen.getByRole("button");
        // The button should be empty because no option matches the value
        expect(button.firstChild).not.toHaveTextContent();

        fireEvent.click(button);
        const options = screen.getAllByRole("option");
        options.forEach(option => {
            expect(option).toHaveAttribute("aria-selected", "false");
        });
    });

    test("handles undefined onChange gracefully", () => {
        // Suppress console.error for this test because React will log a prop-type warning
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        render(<Select {...requiredProps} onChange={undefined} value="opt1" />);
        fireEvent.click(screen.getByRole("button"));
        const option = screen.getByText("Option 2");

        // The component's handleOptionClick will try to call onChange, which is undefined.
        // This should not crash the component.
        expect(() => fireEvent.click(option)).not.toThrow();

        consoleErrorSpy.mockRestore();
    });

    test("renders correctly with default props", () => {
        const { container } = render(<Select />);
        const button = screen.getByRole("button");
        const label = container.querySelector("label");

        expect(button).toBeInTheDocument();
        expect(label).toHaveTextContent("");
        expect(button).not.toBeDisabled();
    });
});