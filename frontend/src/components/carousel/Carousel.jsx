import React, { useCallback, useEffect, useState } from "react";
import { classNames } from "../../utils/classNames";
import PropTypes from "prop-types";

/**
 * A simple reusable Carousel component.
 *
 * @param {Array<Object>} items - An array of objects for the carousel. Each object must have an 'id' (string or int), a 'props' (object), and a 'Component' (React component).
 * @param {int} autoSlideDuration - Auto slide duration in milliseconds.
 * @param {string} className - Additional custom CSS classes.
 * @returns {JSX.Element} - The rendered carousel component.
 */

const Carousel = ({ items = [], autoSlideDuration = 5000, className = "" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        const isLastSlide = currentIndex === items.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, items.length]);

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
    };

    useEffect(() => {
        const slideInterval = setInterval(nextSlide, autoSlideDuration);

        return () => clearInterval(slideInterval);
    }, [nextSlide, autoSlideDuration]);

    if (!items || items.length === 0)
        return null;

    return (
        <div className={
            classNames(
                "relative h-96 rounded-xl overflow-hidden mb-12 shadow-2xl",
                className
            )}
        >
            <div className="relative w-full h-full flex transition-transform ease-in-out duration-500" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {items.map(item => (
                    <React.Fragment key={item.id}>
                        <item.Component {...item.props} />
                    </React.Fragment>
                ))}
            </div>
            <div className="absolute bottom-5 right-0 left-0 z-30 flex justify-center gap-2">
                {items.map((_, slideIndex) => (
                    <div
                        key={slideIndex}
                        onClick={() => goToSlide(slideIndex)}
                        className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${currentIndex === slideIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                    ></div>
                ))}
            </div>
        </div>
    );
};

// PropTypes for runtime type checking
Carousel.propTypes = {
    autoSlideDuration: PropTypes.number,
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        props: PropTypes.object.isRequired,
        Component: PropTypes.func.isRequired
    })).isRequired,
    className: PropTypes.string
};

// Default props (optional)
Carousel.defaultProps = {
    autoSlideDuration: 5000,
    items: [],
    className: ""
};

export default Carousel;
