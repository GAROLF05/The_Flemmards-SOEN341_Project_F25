import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Carousel from "../../src/components/carousel/Carousel";

// A dummy component to render inside the carousel for testing
const DummySlideComponent = ({ title, content }) => (
    <div className="w-full flex-shrink-0">
        <h1>{title}</h1>
        <p>{content}</p>
    </div>
);

describe("Carousel component", () => {
    const mockItems = [
        { id: 1, Component: DummySlideComponent, props: { title: "Slide 1", content: "Content 1" } },
        { id: 2, Component: DummySlideComponent, props: { title: "Slide 2", content: "Content 2" } },
        { id: 3, Component: DummySlideComponent, props: { title: "Slide 3", content: "Content 3" } },
    ];

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("renders null if the items array is empty", () => {
        const { container } = render(<Carousel items={[]} />);
        expect(container.firstChild).toBeNull();
    });

    test("renders null if items prop is not provided", () => {
        const { container } = render(<Carousel />);
        expect(container.firstChild).toBeNull();
    });

    test("renders the carousel with the correct number of slides and dots", () => {
        render(<Carousel items={mockItems} />);
        // All slides are in the DOM, but only one is visible due to transform
        expect(screen.getByText("Slide 1")).toBeInTheDocument();
        expect(screen.getByText("Slide 2")).toBeInTheDocument();
        expect(screen.getByText("Slide 3")).toBeInTheDocument();

        const dots = screen.getByText("Slide 1").parentElement.parentElement.nextSibling.children;
        expect(dots).toHaveLength(mockItems.length);
    });

    test("displays the first slide by default", () => {
        render(<Carousel items={mockItems} />);
        const slideContainer = screen.getByText("Slide 1").parentElement.parentElement;
        expect(slideContainer).toHaveStyle("transform: translateX(-0%)");

        const dots = slideContainer.nextSibling.children;
        expect(dots[0]).toHaveClass("bg-white w-6");
        expect(dots[1]).toHaveClass("bg-white/50");
    });

    test("navigates to the next slide automatically after autoSlideDuration", () => {
        render(<Carousel items={mockItems} autoSlideDuration={3000} />);
        const slideContainer = screen.getByText("Slide 1").parentElement.parentElement;

        expect(slideContainer).toHaveStyle("transform: translateX(-0%)");

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        expect(slideContainer).toHaveStyle("transform: translateX(-100%)");
        const dots = slideContainer.nextSibling.children;
        expect(dots[1]).toHaveClass("bg-white w-6");
    });

    // test("loops back to the first slide from the last slide on auto-slide", () => {
    //     render(<Carousel items={mockItems} autoSlideDuration={3000} />);
    //     const slideContainer = screen.getByText("Slide 1").parentElement.parentElement;

    //     act(() => {
    //         jest.advanceTimersByTime(3000 * mockItems.length); // Go through all slides
    //     });

    //     expect(slideContainer).toHaveStyle("transform: translateX(-0%)");
    //     const dots = slideContainer.nextSibling.children;
    //     expect(dots[0]).toHaveClass("bg-white w-6");
    // });

    test("navigates to a specific slide when a dot is clicked", () => {
        render(<Carousel items={mockItems} />);
        const slideContainer = screen.getByText("Slide 1").parentElement.parentElement;
        const dots = slideContainer.nextSibling.children;

        fireEvent.click(dots[2]);

        expect(slideContainer).toHaveStyle("transform: translateX(-200%)");
        expect(dots[2]).toHaveClass("bg-white w-6");
        expect(dots[0]).not.toHaveClass("bg-white w-6");
    });

    test("resets the auto-slide timer when a dot is clicked", () => {
        render(<Carousel items={mockItems} autoSlideDuration={5000} />);
        const slideContainer = screen.getByText("Slide 1").parentElement.parentElement;
        const dots = slideContainer.nextSibling.children;

        act(() => {
            jest.advanceTimersByTime(4000); // Almost time for auto-slide
        });

        // Still on the first slide
        expect(slideContainer).toHaveStyle("transform: translateX(-0%)");

        // User clicks a dot, which should reset the interval
        fireEvent.click(dots[1]);
        expect(slideContainer).toHaveStyle("transform: translateX(-100%)");

        // Advance timer again, but not enough for a full slide duration
        act(() => {
            jest.advanceTimersByTime(4000);
        });

        // Should still be on the second slide
        expect(slideContainer).toHaveStyle("transform: translateX(-100%)");

        // Advance timer past the threshold to confirm it moves
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(slideContainer).toHaveStyle("transform: translateX(-200%)");
    });

    test("applies a custom className to the container", () => {
        const customClass = "my-custom-carousel";
        render(<Carousel items={mockItems} className={customClass} />);
        const carouselElement = screen.getByText("Slide 1").parentElement.parentElement.parentElement;
        expect(carouselElement).toHaveClass(customClass);
    });
});