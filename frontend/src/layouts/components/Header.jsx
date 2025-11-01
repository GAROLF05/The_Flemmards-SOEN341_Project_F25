import { useEffect, useRef, useState } from "react";
import { ArrowRightStartOnRectangleIcon, Bars3Icon, GlobeAltIcon, MoonIcon, SunIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "react-router-dom";

const Header = ({ accountType, onMenuClick }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const userDropdownRef = useRef(null);
    const langDropdownRef = useRef(null);
    const {theme, toggleTheme} = useTheme();
    const { translate, changeLanguage, currentLanguage, availableLanguages } = useLanguage();
    const navigate = useNavigate();

    const useOutsideAlerter = (ref, setOpenState) => {
        useEffect(() => {
            function handleClickOutside(event) {
                if (ref.current && !ref.current.contains(event.target))
                    setOpenState(false);
            }

            document.addEventListener("mousedown", handleClickOutside);

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [ref, setOpenState]);
    }

    const handleLanguageChange = (lang) => {
        changeLanguage(lang);
        setIsLangMenuOpen(false);
    };

    useOutsideAlerter(userDropdownRef, setIsUserMenuOpen);
    useOutsideAlerter(langDropdownRef, setIsLangMenuOpen);

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-100 transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-16">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <button onClick={onMenuClick} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors duration-300">
                            <Bars3Icon className="h-6 w-6"/>
                        </button>
                        <span className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => navigate(`/${accountType}`)}>{translate("appTitle")}</span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{translate(accountType)}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                            {theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}
                            <span className="font-medium text-sm hidden sm:block">{theme === 'light' ? translate("dark") : translate("light")}</span>
                        </button>

                        <div className="relative" ref={langDropdownRef}>
                            <button onClick={() => setIsLangMenuOpen(prev => !prev)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                                <GlobeAltIcon className="w-6 h-6"/>
                                <span className="font-medium text-sm">{currentLanguage.toUpperCase()}</span>
                            </button>

                            {isLangMenuOpen && (
                                <ul className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transition-colors duration-300">
                                    {availableLanguages.map(lang => (
                                        <li
                                            key={lang}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
                                            onClick={() => handleLanguageChange(lang)}
                                        >
                                            {lang.toUpperCase()}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="relative" ref={userDropdownRef}>
                            <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center gap-2 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-300 py-2 pl-2 pr-4">
                                <UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-300 transition-colors duration-300"/>
                                <span className="hidden sm:block font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300">Curtis</span>
                            </button>

                            {isUserMenuOpen && (
                                <ul className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                                    <li onClick={() =>navigate("profile")} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300" role="menuitem">
                                        <UserCircleIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400"/>
                                        {translate("profile")}
                                    </li>

                                    <li onClick={() =>navigate("/login")} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300" role="menuitem">
                                        <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400"/>
                                        {translate("logout")}
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
