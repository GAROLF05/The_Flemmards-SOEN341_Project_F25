import { CalendarDateRangeIcon, Cog8ToothIcon, HomeIcon, StarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "react-router-dom";

const MobileMenu = ({ isOpen, onClose }) => {
    const { translate } = useLanguage();
    const navigate = useNavigate();

    const handleMenuClick = (link) => {
        navigate(link);
        onClose();
    };

    return (
        <div className={`fixed inset-0 z-[150] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 transition-opacity duration-300"
                onClick={onClose}
                style={{ opacity: isOpen ? 1 : 0 }}
            ></div>

            {/* Menu Panel */}
            <div
                className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out"
                style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            >
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                    <h2 className="font-bold text-lg dark:text-white">{translate("menu")}</h2>

                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300 cursor-pointer">
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>

                <nav className="p-4 flex flex-col gap-2">
                    <li onClick={() => handleMenuClick("/student")} className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                        <HomeIcon className="w-6 h-6"/>{translate("home")}
                    </li>

                    <li onClick={() => handleMenuClick("/student/calendar")} className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                        <CalendarDateRangeIcon className="w-6 h-6"/>{translate("calendar")}
                    </li>

                    <li onClick={() => handleMenuClick("/student/events")} className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                        <StarIcon className="w-6 h-6"/>{translate("myEvents")}
                    </li>

                    <li onClick={() => handleMenuClick("/student/settings")} className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                        <Cog8ToothIcon className="w-6 h-6"/>{translate("settings")}
                    </li>
                </nav>
            </div>
        </div>
    );
};

export default MobileMenu;
