import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Modal from "../../src/components/modal/Modal";

describe("Modal component", () => {
    const mockOnClose = jest.fn();
    const modalContentText = "This is the modal content";
    const ModalContent = () => <div>{modalContentText}</div>;

    beforeEach(() => {
        mockOnClose.mockClear();
    });

    // test("does not render content and is invisible when isOpen is false", () => {
    //     const { container } = render(
    //         <Modal isOpen={false} onClose={mockOnClose}>
    //             <ModalContent />
    //         </Modal>
    //     );

    //     // The modal root div should be invisible
    //     expect(container.firstChild).toHaveClass("invisible");

    //     // The content should not be visible to the user
    //     expect(screen.queryByText(modalContentText)).toBeNull();
    // });

    // test("renders content and is visible when isOpen is true", async () => {
    //     const { container } = render(
    //         <Modal isOpen={true} onClose={mockOnClose}>
    //             <ModalContent />
    //         </Modal>
    //     );

    //     // The modal root div should be visible
    //     expect(container.firstChild).toHaveClass("visible");

    //     // The content should be in the document
    //     expect(screen.getByText(modalContentText)).toBeInTheDocument();

    //     // Check for opacity styles which indicate visibility
    //     const overlay = container.querySelector(".bg-black\\/70");
    //     const modalBody = screen.getByText(modalContentText).closest("div[style*='transform']");

    //     await waitFor(() => {
    //         expect(overlay).toHaveStyle("opacity: 1");
    //         expect(modalBody).toHaveStyle("opacity: 1");
    //         expect(modalBody).toHaveStyle("transform: scale(1)");
    //     });
    // });

    test("calls onClose when the overlay is clicked", () => {
        const { container } = render(
            <Modal isOpen={true} onClose={mockOnClose}>
                <ModalContent />
            </Modal>
        );

        const overlay = container.querySelector(".bg-black\\/70");
        fireEvent.click(overlay);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test("calls onClose when the close button is clicked", () => {
        render(
            <Modal isOpen={true} onClose={mockOnClose}>
                <ModalContent />
            </Modal>
        );

        const closeButton = screen.getByRole("button");
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test("does not call onClose when the modal content is clicked", () => {
        render(
            <Modal isOpen={true} onClose={mockOnClose}>
                <ModalContent />
            </Modal>
        );

        const content = screen.getByText(modalContentText);
        fireEvent.click(content);

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test("does not call onClose when the Escape key is pressed (feature not implemented)", () => {
        const { container } = render(
            <Modal isOpen={true} onClose={mockOnClose}>
                <ModalContent />
            </Modal>
        );

        fireEvent.keyDown(container, { key: "Escape", code: "Escape" });

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test.each([
        ["small", "w-lg"],
        ["medium", "w-xl"],
        ["large", "w-2xl"],
        ["xlarge", "w-4xl"],
        ["full", "w-full"],
    ])("applies the correct class for width '%s'", (width, expectedClass) => {
        render(
            <Modal isOpen={true} onClose={mockOnClose} width={width}>
                <ModalContent />
            </Modal>
        );

        const modalContentWrapper = screen.getByText(modalContentText).closest("[class*='-translate-x-1/2']");
        expect(modalContentWrapper).toHaveClass(expectedClass);
    });

    test("applies medium width class by default", () => {
        render(
            <Modal isOpen={true} onClose={mockOnClose}>
                <ModalContent />
            </Modal>
        );

        const modalContentWrapper = screen.getByText(modalContentText).closest("[class*='-translate-x-1/2']");
        expect(modalContentWrapper).toHaveClass("w-xl");
    });

    test("applies a custom className to the content wrapper", () => {
        const customClass = "my-custom-modal";
        render(
            <Modal isOpen={true} onClose={mockOnClose} className={customClass}>
                <ModalContent />
            </Modal>
        );

        const modalContentWrapper = screen.getByText(modalContentText).closest("[class*='-translate-x-1/2']");
        expect(modalContentWrapper).toHaveClass(customClass);
    });

    // test("throws an error if onClose is not provided and close button is clicked", () => {
    //     // Suppress console.error for this test because React will log a prop-type warning
    //     const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

    //     render(
    //         <Modal isOpen={true} onClose={undefined}>
    //             <ModalContent />
    //         </Modal>
    //     );

    //     const closeButton = screen.getByRole("button");
    //     // The component's onClick will try to call onClose, which is undefined, causing a TypeError.
    //     expect(() => fireEvent.click(closeButton)).toThrow();

    //     consoleErrorSpy.mockRestore();
    // });
});