import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassPlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../hooks/useLanguage';

export default function PageNotFound() {
    const { translate } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
            <div className="text-center p-8">
                <div className="flex justify-center">
                    <MagnifyingGlassPlusIcon className="h-16 w-16 text-indigo-500 mb-4"/>
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
                        <ArrowLeftIcon className="mr-2 h-5 w-5" />
                        {translate("returnToHomePage")}
                    </a>
                </div>
            </div>
        </div>
    );
}
