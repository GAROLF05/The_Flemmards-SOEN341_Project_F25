import { useLanguage } from "../../hooks/useLanguage";

const Footer = () => {
    const { translate } = useLanguage();

    return (
        <footer className="bg-white dark:bg-gray-800 mt-12 py-4 transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400 transition-colors duration-300">
                &copy; {translate("allRightsReserved", { date: new Date().getFullYear() })}
            </div>
        </footer>
    );
};

export default Footer;
