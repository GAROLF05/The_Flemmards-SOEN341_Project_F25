import { CheckCircleIcon, XCircleIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import { useOrganizerNotifications } from '../../hooks/useOrganizerNotifications';
import { adminApi } from '../../api/adminApi';

// --- MOCK DATA ---
const eventsData = [
    { id: 1, title: 'Summer Rooftop Party', organization: 'Evenko', date: '2026-07-10T19:00:00', category: 'Music', status: 'pending' },
    { id: 2, title: 'AI Ethics Debate', organization: 'McGill University', date: '2025-11-26T18:00:00', category: 'Technology', status: 'pending' },
    { id: 3, title: 'Osheaga 2026 Pre-sale', organization: 'Osheaga', date: '2026-03-01T10:00:00', category: 'Music', status: 'approved' },
    { id: 4, title: 'Winter Coding Bootcamp', organization: 'Concordia Continuing Education', date: '2026-01-10T09:00:00', category: 'Education', status: 'rejected' },
    { id: 5, title: 'New Investor Meetup', organization: 'Startup Montreal', date: '2025-12-01T17:00:00', category: 'Business', status: 'pending' },
    { id: 6, title: 'Tech Conference 2026', organization: 'Tech Summit Inc.', date: '2026-06-15T09:00:00', category: 'Technology', status: 'approved' },
    { id: 7, title: 'Art Film Festival', organization: 'Cinéma du Parc', date: '2026-02-20T14:00:00', category: 'Arts', status: 'pending' },
    { id: 8, title: 'Career Fair', organization: 'McGill University', date: '2025-11-30T10:00:00', category: 'Education', status: 'approved' },
    { id: 9, title: 'Startup Pitch Night', organization: 'Startup Montreal', date: '2025-12-15T18:00:00', category: 'Business', status: 'rejected' },
    { id: 10, title: 'Winter Music Festival', organization: 'Evenko', date: '2026-01-25T17:00:00', category: 'Music', status: 'pending' },
];

const EventStatusBadge = ({ status }) => {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default function EventModeration() {
    const [events, setEvents] = useState(eventsData);
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const { showNotification } = useNotification();
    const { translate } = useLanguage();
    const { notifyOrganizer } = useOrganizerNotifications();

    const categories = ['all', ...new Set(events.map(event => event.category))];

    const filteredEvents = events.filter(event => {
        const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
        const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
        return matchesStatus && matchesCategory;
    });

    const handleStatusChange = async (eventId, newStatus) => {
        try {
            const event = events.find(e => e.id === eventId);
            if (!event) return;

            // Update local state
            setEvents(prev => prev.map(e =>
                e.id === eventId ? { ...e, status: newStatus } : e
            ));

            // Send notification to organizer
            await notifyOrganizer({
                organizerEmail: event.organization.toLowerCase().replace(/\s+/g, '.') + '@example.com', // Mock email
                organizerName: event.organization,
                eventTitle: event.title,
                status: newStatus,
                feedback: newStatus === 'rejected'
                    ? translate('eventRejectionDefaultFeedback')
                    : ''
            });

            showNotification(
                'success',
                translate(
                    newStatus === 'approved'
                        ? 'eventApprovedSuccessfully'
                        : 'eventRejectedSuccessfully'
                )
            );
        } catch (error) {
            console.error('Error updating event status:', error);
            showNotification('error', translate('errorUpdatingEventStatus'));
        }
    }; return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                    {translate("eventModeration")}
                </h1>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    {translate("eventModerationDescription")}
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-colors duration-300">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <FunnelIcon className="h-5 w-5 inline-block mr-2" />
                                {translate("filterByStatus")}
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="all">{translate("all")}</option>
                                <option value="pending">{translate("pending")}</option>
                                <option value="approved">{translate("approved")}</option>
                                <option value="rejected">{translate("rejected")}</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <FunnelIcon className="h-5 w-5 inline-block mr-2" />
                                {translate("filterByCategory")}
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("event")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("organization")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("category")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("date")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("status")}</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event) => (
                                    <tr key={event.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{event.organization}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{event.category}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(event.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <EventStatusBadge status={event.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {event.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(event.id, 'approved')}
                                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                    >
                                                        <CheckCircleIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(event.id, 'rejected')}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <XCircleIcon className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {translate("noEventsFound")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
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
                                        <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300">
                                            {event.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleDeny(event.id, event.title)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer transition-colors duration-300">
                                            <span className="sr-only">{translate("deny")}</span>
                                            <XCircleIcon className="w-6 h-6" />
                                        </button>

                                        <button onClick={() => handleApprove(event.id, event.title)} className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-all cursor-pointer transition-colors duration-300">
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
