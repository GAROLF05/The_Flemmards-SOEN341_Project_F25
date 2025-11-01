import { BuildingOfficeIcon, CalendarDateRangeIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon, TicketIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import Modal from '../../components/modal/Modal';
import { browseEvents } from '../../api/eventApi';
import { transformEventsForFrontend } from '../../utils/eventTransform';

const EventDetailModal = ({ event, isOpen, onClose }) => {
    const { translate } = useLanguage();

    if (!event)
        return null;

    const eventDate = new Date(event.date || event.start_at);
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="medium">
            <>
                <img 
                    src={event.imageUrl} 
                    alt={event.title} 
                    className="w-full h-64 object-cover rounded-t-xl"
                    onError={(e) => {
                        e.target.src = '/uploads/events/default-event-image.svg';
                    }}
                />
                <div className="p-8">
                    <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-sm font-semibold px-3 py-1 rounded-full mb-4">{event.category}</span>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h2>
                    <div className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                        <div className="flex items-center gap-3">
                            <CalendarDateRangeIcon className="w-5 h-5 flex-shrink-0"/>
                            <span>{formattedDate} at {formattedTime}</span>
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-3">
                                <MapPinIcon className="w-5 h-5 flex-shrink-0"/>
                                <span>{event.location}</span>
                            </div>
                        )}
                        {event.organization && (
                            <div className="flex items-center gap-3">
                                <BuildingOfficeIcon className="w-5 h-5 flex-shrink-0"/>
                                <span>{event.organization}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <TicketIcon className="w-5 h-5 flex-shrink-0"/>
                            <span>{typeof event.price === 'number' ? `$${event.price.toFixed(2)} CAD` : event.price || 'Free'}</span>
                        </div>
                        {event.capacity && (
                            <div className="flex items-center gap-3">
                                <UsersIcon className="w-5 h-5 flex-shrink-0"/>
                                <span>Capacity: {event.registeredUsers || 0} / {event.capacity}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{event.description}</p>
                    {event.organizationStatus === 'suspended' ? (
                        <div className="w-full">
                            <button 
                                disabled 
                                className="w-full bg-gray-400 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed opacity-60 text-lg"
                            >
                                Registration Unavailable
                            </button>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                This event's organization has been suspended. Registration is currently unavailable.
                            </p>
                        </div>
                    ) : (
                        <button className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 text-lg">
                            {translate("reserveNow")}
                        </button>
                    )}
                </div>
            </>
        </Modal>
    );
};

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date('2025-10-11T12:00:00'));
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventsData, setEventsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { translate, currentLanguage } = useLanguage();

    const openEventModal = (event) => setSelectedEvent(event);
    const closeEventModal = () => setSelectedEvent(null);

    // Fetch events from API
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await browseEvents({ limit: 200 }); // Get up to 200 events for calendar
                console.log('Calendar API Response:', response);
                
                // Handle different response formats
                const events = response.events || response || [];
                
                if (!Array.isArray(events)) {
                    console.error('Events is not an array:', events);
                    setError('Invalid response format from server');
                    setEventsData([]);
                    return;
                }
                
                // Transform events to frontend format
                const transformedEvents = transformEventsForFrontend(events);
                console.log('Calendar Events transformed:', transformedEvents.length);
                setEventsData(transformedEvents);
            } catch (err) {
                console.error('Error fetching events for calendar:', err);
                setError(err.message || 'Failed to load events');
                setEventsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        .map(day => translate(day))
        .map(day => day.slice(0, 3));

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDay = firstDayOfMonth.getDay();

    const calendarDays = useMemo(() => {
        const days = [];
        const prevLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        for (let i = startingDay; i > 0; i--) {
            days.push({ key: `prev-${i}`, date: new Date(currentDate.getFullYear(), currentDate.getMonth() -1, prevLastDay - i + 1), isPadding: true });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ key: `current-${i}`, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i), isPadding: false });
        }
        const nextDays = 42 - days.length;
        for (let i = 1; i <= nextDays; i++) {
            days.push({ key: `next-${i}`, date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i), isPadding: true });
        }
        return days;
    }, [currentDate, daysInMonth, startingDay]);

    const eventsByDate = useMemo(() => {
        return eventsData.reduce((acc, event) => {
            const eventDate = event.date || event.start_at;
            if (!eventDate) return acc;
            
            const dateKey = new Date(eventDate).toDateString();
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            return acc;
        }, {});
    }, [eventsData]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const today = new Date();

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-grow flex items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <p className="text-red-600 dark:text-red-400">Error: {error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex-grow flex flex-col bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-300">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight transition-colors duration-300 capitalize">
                        {translate("eventCalendar")}
                    </h1>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 capitalize">
                        {currentDate.toLocaleString(currentLanguage, { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                            <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                        </button>
                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                            <ChevronRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-px flex-shrink-0">
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2 uppercase transition-colors duration-300">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="flex-grow grid grid-rows-6 grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    {calendarDays.map((day) => {
                        const isToday = day.date && day.date.toDateString() === today.toDateString();
                        const dayEvents = day.date ? eventsByDate[day.date.toDateString()] || [] : [];

                        return (
                            <div
                                key={day.key}
                                className={`bg-white dark:bg-gray-800 p-2 h-36 flex flex-col overflow-hidden transition-colors duration-300 ${day.isPadding ? 'opacity-50' : ''}`}
                            >
                                <span className={`font-semibold mb-1 ${isToday ? 'bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {day.date ? day.date.getDate() : ''}
                                </span>
                                <div className="flex-grow overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent transition-colors duration-300">
                                    {dayEvents.slice(0, 2).map(event => (
                                        <button
                                            key={event.id}
                                            onClick={() => openEventModal(event)}
                                            className="w-full text-left text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 p-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 truncate transition-colors duration-300 cursor-pointer"
                                        >
                                            {event.title}
                                        </button>
                                    ))}
                                    {dayEvents.length > 2 && (
                                        <button className="w-full text-left text-xs text-gray-500 dark:text-gray-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 cursor-pointer">
                                            {translate("plusMore", {count : dayEvents.length - 2})}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <EventDetailModal
                isOpen={!!selectedEvent}
                onClose={closeEventModal}
                event={selectedEvent}
            />
        </>
    );
}

export default CalendarPage;
