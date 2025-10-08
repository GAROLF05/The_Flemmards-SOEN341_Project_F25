import PropTypes from "prop-types";
import { classNames } from "../../utils/classNames";

/**
 * A simple reusable checkbox component.
 *
 * @param {string} label - The label for the checkbox.
 * @param {string} name - The name of the checkbox.
 * @param {string} id - The ID of the checkbox.
 * @param {function} onChange - Function to handle change events.
 * @param {boolean} checked - If true, the checkbox is checked.
 * @param {string} color - The color of the checkbox (primary, blue, green, red).
 * @param {string} size - The size of the checkbox (small, medium, large).
 * @param {string} className - Additional custom CSS classes.
 * @param {boolean} disabled - If true, the checkbox will be disabled.
 * @param {object} rest - Remaining props to pass to the checkbox element.
 * @returns {JSX.Element} - The rendered checkbox component.
 */

const Checkbox = ({ label, name, id, onChange, checked = false, color = "primary", size = "medium", className = "", disabled = false, ...rest }) => {
    const handleChange = (e) => {
        if (disabled)
            e.preventDefault();
        else
            onChange(e)
    }

    return (
        <div className="flex items-center">
            <input
                id={id}
                name={name}
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                disabled={disabled}
                className={classNames(
                    "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded",
                    color === "primary" && "accent-indigo-600",
                    color === "blue" && "accent-blue-600",
                    color === "green" && "accent-green-600",
                    color === "red" && "accent-red-600",
                    size === "small" && "h-3 w-3",
                    size === "medium" && "h-4 w-4",
                    size === "large" && "h-5 w-5",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                    className
                )}
                {...rest}
            />

            <label
                htmlFor={id}
                className="ml-2 block text-sm text-gray-900"
            >
                {label}
            </label>
        </div>
    );
};

// PropTypes for runtime type checking
Checkbox.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    checked: PropTypes.bool,
    color: PropTypes.oneOf(["primary", "blue", "green", "red"]),
    size: PropTypes.oneOf(["small", "medium", "large"]),
    className: PropTypes.string,
    disabled: PropTypes.bool,
    rest: PropTypes.object
};

// Default props (optional)
Checkbox.defaultProps = {
    label: "",
    name: "",
    id: "",
    onChange: undefined,
    checked: false,
    color: "primary",
    size: "medium",
    className: "",
    disabled: false,
    rest: {}
};

export default Checkbox;
