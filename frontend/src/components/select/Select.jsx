import { useState, useRef, useEffect } from 'react';
import PropTypes from "prop-types";
import { classNames } from '../../utils/classNames';

/**
 * A simple reusable dropdown select component.
 *
 * @param {string} label - The label for the dropdown.
 * @param {string} value - The value of the selected dropdown option.
 * @param {function} onChange - Function to handle click events.
 * @param {Array<Object>} options - An array of option objects. Each object must have a 'value' (string) and a 'label' (string).
 * @param {string} className - Additional custom CSS classes.
 * @param {boolean} disabled - If true, the dropdown will be disabled.
 * @returns {JSX.Element} - The rendered dropdown component.
 */

const Select = ({ label, value, onChange, options = [], disabled = false, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    // This effect handles closing the dropdown when clicking outside of it.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target))
                setIsOpen(false);
        };

        // Add event listener when the dropdown is open
        if (isOpen)
            document.addEventListener('mousedown', handleClickOutside);
        // Cleanup the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleOptionClick = (optionValue) => {
        if (!disabled) {
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    const selectedOption = options.find(option => option.value === value);

    // Determines if the label should float up
    const isLabelFloated = isOpen || (value !== undefined && value !== null && value !== '');

    return (
        <div
            ref={selectRef}
            className={classNames(
                className
            )}
        >
            {/* The floating label */}
            <label
                htmlFor={`select-${label}`}
                className={classNames("absolute left-2 transition-all duration-200 ease-in-out pointer-events-none text-indigo-600",
                isLabelFloated
                    ? "-top-2 text-xs bg-white px-1 text-blue-600"
                    : "top-1/2 -translate-y-1/2 text-base text-gray-500"
                )}
            >
                {label}
            </label>

            {/* The main button that displays the selected value and toggles the dropdown */}
            <button
                id={`select-${label}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={`select-${label}`}
                disabled={disabled}
                className={
                    classNames(
                        "w-full text-left bg-white border rounded-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-opacity-50 focus:ring-indigo-600 flex justify-between items-center transition-all duration-200",
                        isOpen ? "border-blue-600 ring-blue-500" : "border-gray-400 hover:border-gray-600",
                        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )
                }
            >
                <span className="text-gray-900 truncate">
                    {selectedOption ? selectedOption.label : <span className="text-transparent">.</span>}
                </span>

                {/* Dropdown arrow icon */}
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                />
                </svg>
            </button>

            {/* The dropdown options panel */}
            {isOpen && (
                <ul
                    role="listbox"
                    aria-labelledby={`select-${label}`}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                    {options.map(option => (
                        <li
                            key={option.value}
                            onClick={() => handleOptionClick(option.value)}
                            role="option"
                            aria-selected={value === option.value}
                            className={`px-4 py-2 cursor-pointer transition-colors duration-150
                                ${value === option.value
                                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                : 'hover:bg-gray-100'
                                }`}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// PropTypes for runtime type checking
Select.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
    })).isRequired,
    disabled: PropTypes.bool,
    className: PropTypes.string
};

// Default props (optional)
Select.defaultProps = {
    label: "",
    value: "",
    onChange: undefined,
    options: [],
    disabled: false,
    className: ""
};

export default Select;
