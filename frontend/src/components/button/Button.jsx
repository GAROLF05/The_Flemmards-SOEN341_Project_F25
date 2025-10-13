import PropTypes from "prop-types";
import { classNames } from "../../utils/classNames";

/**
 * A simple reusable button component.
 *
 * @param {ReactNode} children - The content inside the button (text or elements).
 * @param {function} onClick - Function to handle click events.
 * @param {string} type - Button type (e.g., "button", "submit", "reset").
 * @param {string} variant - Button variant (e.g., "contained", "outlined", "text", "none").
 * @param {string} className - Additional custom CSS classes.
 * @param {boolean} borderRouned - If true, the button will have rounded borders.
 * @param {boolean} disabled - If true, the button will be disabled.
 * @param {object} rest - Remaining props to pass to the button element.
 * @returns {JSX.Element} - The rendered button component.
 */

const Button = ({ children, onClick, type = "button", variant = "contained", className = "", borderRouned = false, disabled = false, ...rest }) => {
    const handleClick = (e) => {
        if (disabled)
            e.preventDefault();
        else if (onClick)
            onClick(e);
    }

    return (
        <button
            type={type}
            onClick={handleClick}
            className={classNames(
                "text-sm font-semibold rounded-lg transition-transform transform",
                borderRouned && "",
                variant === "contained" && `text-white bg-indigo-600 border border-transparent py-3 px-4 ${disabled ? "" : "hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"}`,
                variant === "outlined" && `text-indigo-600 border border-indigo-600 py-3 px-4 ${disabled ? "" : "hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"}`,
                variant === "text" && `text-indigo-600 py-1 px-1 ${disabled ? "" : "hover:bg-indigo-50 focus:outline-none focus:bg-indigo-100"}`,
                variant === "none" && "",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                className
            )}
            {...rest}
        >
            {children}
        </button>
    );
};

// PropTypes for runtime type checking
Button.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(["button", "submit", "reset"]),
    variant: PropTypes.oneOf(["contained", "outlined", "text", "none"]),
    className: PropTypes.string,
    borderRouned: PropTypes.bool,
    disabled: PropTypes.bool,
    rest: PropTypes.object
};

// Default props (optional)
Button.defaultProps = {
    onClick: undefined,
    type: "button",
    variant: "contained",
    className: "",
    borderRouned: false,
    disabled: false,
    rest: {}
};

export default Button;
