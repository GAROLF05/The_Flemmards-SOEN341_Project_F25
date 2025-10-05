import { CheckBadgeIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function Notification({ message, type, onClose, isExiting }) {
    const styles = {
        info: {
            bg: 'bg-blue-500',
            icon: (
                <InformationCircleIcon className="h-6 w-6" />
            ),
        },
        success: {
            bg: 'bg-green-500',
            icon: (
                <CheckBadgeIcon className="h-6 w-6" />
            ),
        },
        warning: {
            bg: 'bg-yellow-500',
            icon: (
                <ExclamationTriangleIcon className="h-6 w-6" />
            ),
        },
        error: {
            bg: 'bg-red-500',
            icon: (
                <XCircleIcon className="h-6 w-6" />
            ),
        },
    };

    const { bg, icon } = styles[type];

    return (
        <div className={`
            ${bg} text-white rounded-lg shadow-2xl p-4 flex items-start gap-4 mb-4
            transform transition-all duration-500 ease-in-out
            ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        `}>
            <div className="flex-shrink-0">{icon}</div>
            <div className="flex-grow text-sm sm:text-base">{message}</div>
            <button onClick={onClose} className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

