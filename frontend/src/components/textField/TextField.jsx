import PropTypes from "prop-types";
import { classNames } from "../../utils/classNames";

/**
 * A simple reusable text field component.
 *
 * @param {string} value - The current value of the text field.
 * @param {string} name - The name of the text field.
 * @param {string} id - The ID of the text field.
 * @param {string} placeholder - The placeholder text for the text field.
 * @param {function} onChange - Function to handle change events.
 * @param {ReactNode} IconLeft - The icon to display on the left side of the text field.
 * @param {string} type - The type of text field (e.g., "text", "email", "password").
 * @param {boolean} required - If true, the text field is required.
 * @param {string} autocomplete - The autocomplete attribute for the text field.
 * @param {string} className - Additional custom CSS classes.
 * @param {string} iconLeftClasses - Additional custom CSS classes for the icon on the left.
 * @param {boolean} disabled - If true, the text field will be disabled.
 * @param {object} rest - Remaining props to pass to the text field element.
 * @returns {JSX.Element} - The rendered text field component.
 */

const TextField = ({ value, name, id, placeholder, onChange, IconLeft, type = "text", required = false, autocomplete = "off", className = "", iconLeftClasses = "", disabled = false, ...rest }) => {
    const handleChange = (e) => {
        if (disabled)
            e.preventDefault();
        else
            onChange(e)
    }

    return (
        <div className="relative">
            {IconLeft && (
                <IconLeft
                    className={classNames(
                        "h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400",
                        iconLeftClasses
                    )}
                />
            )}

            <input
                id={id}
                name={name}
                type={type}
                value={value}
                placeholder={placeholder}
                required={required}
                onChange={handleChange}
                autoComplete={autocomplete}
                disabled={disabled}
                className={classNames(
                    "pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all",
                    className
                )}
                {...rest}
            />
        </div>
    );
};

// PropTypes for runtime type checking
TextField.propTypes = {
    value: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    IconLeft: PropTypes.node,
    type: PropTypes.oneOf(["text", "email", "password"]),
    required: PropTypes.bool,
    autocomplete: PropTypes.string,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    iconLeftClasses: PropTypes.string,
    disabled: PropTypes.bool,
    rest: PropTypes.object
};

// Default props (optional)
TextField.defaultProps = {
    value: "",
    name: "",
    id: "",
    onChange: undefined,
    IconLeft: undefined,
    type: "text",
    required: false,
    autocomplete: "off",
    placeholder: "",
    className: "",
    iconLeftClasses: "",
    disabled: false,
    rest: {}
};

export default TextField;
