import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import LoadingPage from '../../layouts/LoadingPage';
import { getPendingApprovalEvents } from '../../api/eventApi';

// --- MOCK DATA ---
export default function EventModeration() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingApproval, setIsLoadingApproval] = useState(false);
    const [pendingEvents, setPendingEvents] = useState([]);
    const { showNotification } = useNotification();
    const { translate } = useLanguage();

    const fetchPendingApprovalEvents = useCallback(() => {
        setIsLoading(true);

        getPendingApprovalEvents()
            .then(response => {
                let data = response.events.map(x => ({
                    id: x._id,
                    title: x.title,
                    category: x.category,
                    date: x.start_at,
                    organization: x.organization.name,
                }));

                setPendingEvents(data);
                console.log('the response', data);
            })
            .catch(error => {
                console.error("Error fetching user's events:", error);
                showNotification(translate("anErrorHasOccured"), "error");
            })
            .finally(() => setIsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchPendingApprovalEvents();
    }, [fetchPendingApprovalEvents])

    const handleApprove = (id, title) => {
        console.log('the event id', id)
        showNotification(`The event ${title} has been approved successfully.`, 'success');
        setPendingEvents(prev => prev.filter(event => event.id !== id));
    };

    const handleDeny = (id, title) => {
        showNotification(`The event ${title} has been denied successfully.`, 'success');
        setPendingEvents(prev => prev.filter(event => event.id !== id));
    };

    const formatEventDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    if (isLoading)
        return (
            <LoadingPage title="Loading events..." />
        )

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans transition-colors duration-300 transition-colors duration-300">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 transition-colors duration-300">{translate("eventModeration")}</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400 transition-colors duration-300">{translate("eventModerationSubtitle")}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("eventTitle")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("organization")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("eventDate")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("category")}</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("actions")}</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                            {pendingEvents.length > 0 ? (
                                pendingEvents.map((event) => (
                                    <tr key={event.id} className="transition-colors duration-300">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">{event.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{event.organization}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{formatEventDate(event.date)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize transition-colors duration-300">
                                                {event.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button disabled={isLoadingApproval} onClick={() => handleDeny(event.id, event.title)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer transition-colors duration-300">
                                                <span className="sr-only">{translate("deny")}</span>
                                                <XCircleIcon className="w-6 h-6" />
                                            </button>

                                            <button disabled={isLoadingApproval} onClick={() => handleApprove(event.id, event.title)} className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-all cursor-pointer transition-colors duration-300">
                                                <span className="sr-only">{translate("approve")}</span>
                                                <CheckCircleIcon className="w-6 h-6" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">{translate("noPendingEvents")}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
