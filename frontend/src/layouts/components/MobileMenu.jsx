import { CalendarIcon, Cog8ToothIcon, HomeIcon, XMarkIcon } from "@heroicons/react/24/outline";

const MobileMenu = ({ isOpen, onClose }) => {
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
                    <h2 className="font-bold text-lg dark:text-white">Menu</h2>
                    
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300 cursor-pointer">
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="p-4 flex flex-col gap-2">
                    <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300">
                        <HomeIcon className="w-6 h-6"/> Home
                    </a>

                    <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300">
                        <CalendarIcon className="w-6 h-6"/> My Events
                    </a>

                    <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300">
                        <Cog8ToothIcon className="w-6 h-6"/> Settings
                    </a>
                </nav>
            </div>
        </div>
    );
};

export default MobileMenu;
