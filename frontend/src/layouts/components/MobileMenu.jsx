import { CalendarDateRangeIcon, CogIcon, FolderOpenIcon, HomeIcon, Squares2X2Icon, StarIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "react-router-dom";

const MobileMenu = ({ isOpen, onClose, accountType }) => {
    const { translate } = useLanguage();
    const navigate = useNavigate();

    const handleMenuClick = (link) => {
        navigate(link);
        onClose();
    };

    const menuOptions = [];

    if (accountType === "student")
        menuOptions.push(...[
            {
                title: translate("home"),
                Icon: HomeIcon,
                link: "/student",
            },
            {
                title: translate("calendar"),
                Icon: CalendarDateRangeIcon,
                link: "/student/calendar",
            },
            {
                title: translate("myEvents"),
                Icon: StarIcon,
                link: "/student/events",
            }
        ]);

    if (accountType === "organizer")
        menuOptions.push(...[
            {
                title: translate("dashboard"),
                Icon: Squares2X2Icon,
                link: "/organizer",
            },
        ]);

    if (accountType === "admin")
        menuOptions.push(...[
            {
                title: translate("dashboard"),
                Icon: Squares2X2Icon,
                link: "/admin",
            },
            {
                title: translate("approveOrganizers"),
                Icon: UserPlusIcon,
                link: "/admin/approveOrganizers",
            },
            {
                title: translate("eventModeration"),
                Icon: CogIcon,
                link: "/admin/eventModeration",
            },
            {
                title: translate("organizations"),
                Icon: FolderOpenIcon,
                link: "/admin/organizations",
            },
        ]);

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
                    {menuOptions.map(option => (
                        <li key={option.title} onClick={() => handleMenuClick(option.link)} className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                            <option.Icon className="w-6 h-6"/>{option.title}
                        </li>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default MobileMenu;
