import { BuildingOfficeIcon, CalendarDaysIcon, CheckCircleIcon, MagnifyingGlassIcon, MapPinIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import LoadingPage from '../../layouts/LoadingPage';
import { approveEvent, flagEvent, getAllEvents, rejectEvent } from '../../api/eventApi';

const moderationStatuses = ['all', 'pending_approval', 'approved', 'rejected', 'flagged'];

const StatusFilter = ({ activeStatus, setActiveStatus }) => {
    return (
        <div className="flex flex-wrap gap-3">
            {moderationStatuses.map(status => (
                <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 whitespace-nowrap capitalize cursor-pointer ${activeStatus === status
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}>
                    {status.replace("_", " ")}
                </button>
            ))}
        </div>
    );
};

const EventCard = ({ event, onApprove, onDeny, onFlag, isLoadingApproval }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700/50 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl group flex flex-col">
            <div className="relative">
                <img className="h-48 w-full object-cover" src={event.imageUrl} alt={event.title} onError={(e) => {
                    e.target.src = '/uploads/events/default-event-image.svg';
                }} />
                <div className="absolute inset-0 bg-opacity-20 group-hover:bg-opacity-40 transition-opacity duration-300"></div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300 capitalize">{event.category}</span>
                        <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300">
                            {typeof event.price === 'number' ? `$${event.price.toFixed(2)}` : event.price}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate transition-colors duration-300">{event.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 transition-colors duration-300">{event.description}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 transition-colors duration-300">
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            <span>{event.organization}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 transition-colors duration-300">
                    <button
                        onClick={() => event.moderationStatus === 'pending_approval' ? onDeny(event.id, event.title) : onFlag(event.id, event.title)}
                        disabled={['rejected', 'flagged'].includes(event.moderationStatus) || isLoadingApproval}
                        className="cursor-pointer flex-grow bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 dark:hover:bg-red-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
                    >
                        {event.moderationStatus === 'pending_approval' ? "Reject" : "Flag"}
                    </button>
                    <button
                        onClick={() => onApprove(event.id, event.title)}
                        disabled={event.moderationStatus === 'approved' || isLoadingApproval}
                        className="cursor-pointer flex-grow bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
                    >
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function EventModeration() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingApproval, setIsLoadingApproval] = useState(false);
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState('all');
    const { showNotification } = useNotification();
    const { translate } = useLanguage();

    const fetchPendingApprovalEvents = useCallback(() => {
        setIsLoading(true);

        getAllEvents()
            .then(response => {
                let data = response.events.map(x => ({
                    id: x._id,
                    title: x.title,
                    category: x.category,
                    date: x.start_at,
                    location: x.location.name,
                    organization: x.organization.name,
                    description: x.description,
                    imageUrl: x.image,
                    price: x.price || "Free",
                    status: x.status,
                    moderationStatus: x.moderationStatus,
                }));

                setEvents(data);
            })
            .catch(error => {
                console.error("Error fetching user's events:", error);
                showNotification(translate("anErrorHasOccured"), "error");
            })
            .finally(() => setIsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter(event =>
            (event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.organization.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (activeStatus === 'all' || event.moderationStatus.toLowerCase() === activeStatus.toLowerCase())
        );
    }, [searchTerm, events, activeStatus]);

    useEffect(() => {
        fetchPendingApprovalEvents();
    }, [fetchPendingApprovalEvents])

    const handleApprove = (id, title) => {
        if (!id)
            return;

        setIsLoadingApproval(true);

        approveEvent(id)
            .then(() => {
                showNotification(`The event ${title} has been approved successfully.`, "success");
                setEvents(prev => prev.map(event => ({ ...event, moderationStatus: event.id === id ? 'approved' : event.moderationStatus })));
            })
            .catch(() => {
                showNotification(translate("anErrorHasOccured"), "error");
            })
            .finally(() => setIsLoadingApproval(false));
    };

    const handleDeny = (id, title) => {
        if (!id)
            return;

        setIsLoadingApproval(true);

        rejectEvent(id)
            .then(() => {
                showNotification(`The event ${title} has been rejected successfully.`, "warning");
                setEvents(prev => prev.map(event => ({ ...event, moderationStatus: event.id === id ? 'rejected' : event.moderationStatus })));
            })
            .catch(() => {
                showNotification(translate("anErrorHasOccured"), "error");
            })
            .finally(() => setIsLoadingApproval(false));
    };

    const handleFlag = (id, title) => {
        if (!id)
            return;

        setIsLoadingApproval(true);

        flagEvent(id)
            .then(() => {
                showNotification(`The event ${title} has been rejected successfully.`, "info");
                setEvents(prev => prev.map(event => ({ ...event, moderationStatus: event.id === id ? 'flagged' : event.moderationStatus })));
            })
            .catch(() => {
                showNotification(translate("anErrorHasOccured"), "error");
            })
            .finally(() => setIsLoadingApproval(false));
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

            <div className="flex justify-between items-center mb-8">
                <StatusFilter activeStatus={activeStatus} setActiveStatus={setActiveStatus} />

                <div className="flex items-center gap-4">
                    <div className="relative flex-grow max-w-xs ml-4">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={translate("searchEvents")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {filteredEvents.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} onApprove={handleApprove} onDeny={handleDeny} onFlag={handleFlag} isLoadingApproval={isLoadingApproval} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">No Reserved Events</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">You haven't reserved any events yet. Go explore!</p>
                </div>
            )}
        </div>
    );
}
