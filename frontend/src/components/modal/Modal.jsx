import { XMarkIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../utils/classNames";
import PropTypes from "prop-types";

/**
 * A simple reusable Modal component.
 *
 * @param {boolean} isOpen - If true, the modal is open.
 * @param {function} onClose - Function to handle closing the modal.
 * @param {ReactNode} children - The content inside the modal.
 * @param {string} width - Width of the modal (e.g., "small", "medium", "large", "xlarge", "full").
 * @returns {JSX.Element} - The rendered modal component.
 */

const Modal = ({ isOpen, onClose, children, width = "medium", className }) => {
    return (
        <div className={`fixed inset-0 z-[200] transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/70 transition-opacity duration-300"
                onClick={onClose}
                style={{ opacity: isOpen ? 1 : 0 }}
            ></div>

            {/* Modal Content */}
            <div className={
                classNames(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 max-h-[90vh]",
                    width === "small" && "w-lg",
                    width === "medium" && "w-xl",
                    width === "large" && "w-2xl",
                    width === "xlarge" && "w-4xl",
                    width === "full" && "w-full",
                    Boolean(width) === false && "w-full max-w-2xl",
                    className
                )}
            >
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 ease-in-out max-h-full flex flex-col"
                    style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
                >
                    <div className="relative flex flex-col max-h-full">
                        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-gray-900 dark:text-white rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        {isOpen && children}
                    </div>
                </div>
            </div>
        </div>
    );
};

// PropTypes for runtime type checking
Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    width: PropTypes.oneOf(["small", "medium", "large", "xlarge", "full"]),
    className: PropTypes.string
};

// Default props (optional)
Modal.defaultProps = {
    isOpen: false,
    onClose: undefined,
    children: undefined,
    width: "medium",
    className: ""
};

export default Modal;
