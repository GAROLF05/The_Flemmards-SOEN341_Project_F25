import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-indigo-500 mb-4">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
);

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);


export default function PageNotFound() {
    const { translate } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
            <div className="text-center p-8">
                <div className="flex justify-center">
                    <SearchIcon />
                </div>
                <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
                <h2 className="mt-4 text-2xl font-semibold text-gray-800">{translate("pageNotFound")}</h2>
                <p className="mt-2 text-md text-gray-600 max-w-md mx-auto">
                    {translate("pageNotFoundMessage")}
                </p>
                <div className="mt-8">
                    <a
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all cursor-pointer"
                    >
                        <ArrowLeftIcon />
                        {translate("returnToHomePage")}
                    </a>
                </div>
            </div>
        </div>
    );
}
