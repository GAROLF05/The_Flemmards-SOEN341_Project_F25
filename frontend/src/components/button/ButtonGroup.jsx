import PropTypes from "prop-types";
import { classNames } from "../../utils/classNames";

/**
 * A simple reusable button group component.
 *
 * @param {string} value - The value of the selected button group option.
 * @param {function} onChange - Function to handle click events.
 * @param {Array<Object>} options - An array of option objects. Each object must have a 'value' (string) and a 'label' (string).
 * @param {string} className - Additional custom CSS classes.
 * @param {boolean} disabled - If true, the button will be disabled.
 * @returns {JSX.Element} - The rendered button component.
 */

const ButtonGroup = ({ value, onChange, options = [], disabled = false, className = "" }) => {
    const handleClick = (e, value) => {
        if (disabled)
            e.preventDefault();
        else
            onChange(value);
    }

    return (
        <div
            className={classNames(
                "flex w-full rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6 transition-colors duration-300",
                className
            )
            }>
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    onClick={e => handleClick(e, option.value)}
                    className={`w-full py-2.5 text-sm font-semibold text-center rounded-md transition-all duration-300 ease-in-out cursor-pointer
                    ${value === option.value
                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-gray-900/50'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

// PropTypes for runtime type checking
ButtonGroup.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
    })).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
    disabled: PropTypes.bool
};

// Default props (optional)
ButtonGroup.defaultProps = {
    options: [],
    value: "",
    onChange: undefined,
    className: "",
    disabled: false
};

export default ButtonGroup;
