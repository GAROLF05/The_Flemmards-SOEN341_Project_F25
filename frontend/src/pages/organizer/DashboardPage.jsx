import { MagnifyingGlassIcon, PlusCircleIcon, XMarkIcon, CalendarDaysIcon, MapPinIcon, UsersIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState, useMemo, useRef, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { useLanguage } from '../../hooks/useLanguage';
import { getUserProfile } from '../../api/authenticationApi';
import { getEventsByOrganization, createEvent } from '../../api/eventApi';
import { transformEventsForFrontend, transformEventForFrontend } from '../../utils/eventTransform';

// --- MOCK DATA (fallback) ---
const initialEventsData = [
    {
        id: 1,
        title: 'Montreal International Jazz Festival',
        category: 'Featured',
        date: '2026-06-25T19:00:00',
        location: 'Place des Arts, Montreal',
        organization: 'Evenko',
        description: 'Experience the world\'s largest jazz festival, featuring legendary artists and rising stars in the heart of downtown Montreal.',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop',
        price: 55,
        capacity: 5000,
        ticketsIssued: 4500,
        attendees: 4200,
    },
    {
        id: 2,
        title: 'Indie Music Festival',
        category: 'Music',
        date: '2025-11-12T18:00:00',
        location: 'Parc Jean-Drapeau, Montreal',
        organization: 'Osheaga',
        description: 'A two-day festival showcasing the best up-and-coming indie bands from across the country.',
        imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=2070&auto=format&fit=crop',
        price: 75,
        capacity: 10000,
        ticketsIssued: 8500,
        attendees: 8000,
    },
    {
        id: 3,
        title: 'Startup Pitch Night',
        category: 'Business',
        date: '2025-11-05T19:00:00',
        location: 'Innovation Hub, Montreal',
        organization: 'Startup Montreal',
        description: 'Watch the city\'s brightest entrepreneurs pitch their ideas to a panel of venture capitalists.',
        imageUrl: 'https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=2070&auto=format&fit=crop',
        price: 15,
        capacity: 200,
        ticketsIssued: 180,
        attendees: 175,
    },
    {
        id: 4,
        title: 'Advanced React Workshop',
        category: 'Technology',
        date: '2025-11-18T10:00:00',
        location: 'Online',
        organization: 'Concordia Continuing Education',
        description: 'Deep dive into advanced React patterns, hooks, and performance optimization techniques.',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop',
        price: 250,
        capacity: 50,
        ticketsIssued: 45,
        attendees: 40,
    },
    {
        id: 5,
        title: 'City Marathon 2025',
        category: 'Sports',
        date: '2025-10-19T07:00:00',
        location: 'Mount Royal Park, Montreal',
        organization: 'Run Montreal',
        description: 'Join thousands of runners in the annual city marathon. All skill levels welcome.',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop',
        price: 40,
        capacity: 2000,
        ticketsIssued: 1500,
        attendees: 1400,
    },
    {
        id: 6,
        title: 'Artisan Market Fair',
        category: 'Community',
        date: '2025-10-26T11:00:00',
        location: 'Old Port, Montreal',
        organization: 'City of Montreal',
        description: 'Discover unique handmade crafts, local food, and live music at our weekend market.',
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
        price: 'Free',
        capacity: 1000,
        ticketsIssued: 0,
        attendees: 800,
    },
    {
        id: 7,
        title: 'Annual Tech Summit 2025',
        category: 'Featured',
        date: '2025-10-25T09:00:00',
        location: 'Convention Center, Montreal',
        organization: 'Tech Summit Inc.',
        description: 'Join industry leaders to discuss the future of technology, from AI to quantum computing.',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
        price: 499,
        capacity: 1500,
        ticketsIssued: 1200,
        attendees: 1150,
    },
    {
        id: 8,
        title: 'Cinephile\'s Dream: Film Noir Retrospective',
        category: 'Arts & Culture',
        date: '2025-11-20T19:00:00',
        location: 'Cinéma du Parc, Montreal',
        organization: 'Cinéma du Parc',
        description: 'A month-long retrospective celebrating the dark and stylish world of classic film noir.',
        imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963e?q=80&w=2070&auto=format&fit=crop',
        price: 12,
        capacity: 150,
        ticketsIssued: 140,
        attendees: 130,
    },
        {
        id: 9,
        title: 'AI & The Future of Work',
        category: 'Featured',
        date: '2025-11-01T09:00:00',
        location: 'Palais des congrès, Montreal',
        organization: 'McGill University',
        description: 'A conference exploring the impact of artificial intelligence on the modern workforce and society.',
        imageUrl: 'https://images.unsplash.com/photo-1620712943543-95c636139b8c?q=80&w=2070&auto=format&fit=crop',
        price: 125,
        capacity: 800,
        ticketsIssued: 750,
        attendees: 700,
    },
    {
        id: 10,
        title: 'Montreal Mural Festival Tour',
        category: 'Arts & Culture',
        date: '2026-06-15T14:00:00',
        location: 'Saint-Laurent Boulevard, Montreal',
        organization: 'MURAL Festival',
        description: 'A guided walking tour of the stunning murals from this year\'s festival.',
        imageUrl: 'https://images.unsplash.com/photo-1589719335606-38493155792c?q=80&w=1974&auto=format&fit=crop',
        price: 25,
        capacity: 30,
        ticketsIssued: 30,
        attendees: 28,
    },
    {
        id: 11,
        title: 'Fall Foliage Hike',
        category: 'Community',
        date: '2025-10-18T10:00:00',
        location: 'Mont-Tremblant National Park',
        organization: 'Quebec Hiking Association',
        description: 'Enjoy the beautiful autumn colors on a guided hike through Mont-Tremblant.',
        imageUrl: 'https://images.unsplash.com/photo-1507502707543-7b2121b49463?q=80&w=2070&auto=format&fit=crop',
        price: 'Free',
        capacity: 100,
        ticketsIssued: 0,
        attendees: 85,
    },
    {
        id: 12,
        title: 'Gourmet Food Truck Festival',
        category: 'Food & Drink',
        date: '2026-07-20T12:00:00',
        location: 'Olympic Stadium Esplanade, Montreal',
        organization: 'Evenko',
        description: 'Sample a wide variety of delicious street food from Montreal\'s best food trucks.',
        imageUrl: 'https://images.unsplash.com/photo-1579887829281-79e57816f1a8?q=80&w=2070&auto=format&fit=crop',
        price: 'Free',
        capacity: 3000,
        ticketsIssued: 0,
        attendees: 2500,
    },
    {
        id: 13,
        title: 'E-Sports Tournament: League of Legends',
        category: 'Technology',
        date: '2025-12-06T11:00:00',
        location: 'Bell Centre, Montreal',
        organization: 'Osheaga',
        description: 'Watch the top teams battle it out for the championship title in this exciting e-sports event.',
        imageUrl: 'https://images.unsplash.com/photo-1593301386214-1b521b7a2a68?q=80&w=2070&auto=format&fit=crop',
        price: 45,
        capacity: 15000,
        ticketsIssued: 12000,
        attendees: 11000,
    },
    {
        id: 14,
        title: 'Financial Literacy for Students',
        category: 'Education',
        date: '2025-11-08T18:00:00',
        location: 'Concordia University, Webster Library',
        organization: 'Concordia University',
        description: 'Learn the basics of budgeting, saving, and investing to secure your financial future.',
        imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070&auto=format&fit=crop',
        price: 'Free',
        capacity: 100,
        ticketsIssued: 90,
        attendees: 85,
    },
    {
        id: 15,
        title: 'Classical Music Night',
        category: 'Music',
        date: '2026-01-15T19:30:00',
        location: 'Maison symphonique, Montreal',
        organization: 'Orchestre symphonique de Montréal',
        description: 'An evening of beautiful classical music performed by a world-renowned orchestra.',
        imageUrl: 'https://images.unsplash.com/photo-1588500249443-4131584c6c2c?q=80&w=2070&auto=format&fit=crop',
        price: 80,
        capacity: 2100,
        ticketsIssued: 1800,
        attendees: 1750,
    },
    {
        id: 16,
        title: 'Mental Health First Aid Workshop',
        category: 'Health & Wellness',
        date: '2025-11-29T09:00:00',
        location: 'Online',
        organization: 'McGill University',
        description: 'Learn how to provide initial support to someone experiencing a mental health problem.',
        imageUrl: 'https://images.unsplash.com/photo-1532187643621-4a4731c36537?q=80&w=1969&auto=format&fit=crop',
        price: 35,
        capacity: 40,
        ticketsIssued: 40,
        attendees: 38,
    },
    {
        id: 17,
        title: 'Stand-up Comedy Night',
        category: 'Arts & Culture',
        date: '2025-12-12T20:00:00',
        location: 'The Comedy Nest, Montreal',
        organization: 'The Comedy Nest',
        description: 'A night of laughs with some of Montreal\'s best up-and-coming comedians.',
        imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop',
        price: 20,
        capacity: 120,
        ticketsIssued: 110,
        attendees: 105,
    },
    {
        id: 18,
        title: 'Rock Climbing Introduction',
        category: 'Sports',
        date: '2025-11-23T13:00:00',
        location: 'Allez Up, Montreal',
        organization: 'Allez Up',
        description: 'Learn the basics of rock climbing in a safe and fun environment.',
        imageUrl: 'https://images.unsplash.com/photo-1593348128229-1a74a161b369?q=80&w=1974&auto=format&fit=crop',
        price: 30,
        capacity: 20,
        ticketsIssued: 20,
        attendees: 18,
    }
];

const categories = ['All', 'Featured', 'Music', 'Technology', 'Business', 'Sports', 'Community', 'Arts & Culture', 'Food & Drink', 'Health & Wellness', 'Education'];

const EventCard = ({ event, onViewAnalytics, onViewDetails }) => {
    const { translate } = useLanguage();

    // Calculate analytics from backend data
    const ticketsIssued = event.registeredUsers || 0;
    const attendees = ticketsIssued; // For now, assume all registered attended
    const capacity = event.capacity || 0;

    // Add calculated fields for analytics
    const eventWithAnalytics = {
        ...event,
        ticketsIssued,
        attendees,
        capacity,
    };

    const eventDate = new Date(event.start_at || event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700/50 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl group flex flex-col">
            <div className="relative">
                <img 
                    className="h-48 w-full object-cover" 
                    src={event.imageUrl} 
                    alt={event.title}
                    onError={(e) => {
                        e.target.src = '/uploads/events/default-event-image.svg';
                    }}
                />
                <div className="absolute inset-0 bg-opacity-20 group-hover:bg-opacity-40 transition-opacity duration-300"></div>
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {typeof event.price === 'number' ? `$${event.price.toFixed(2)}` : event.price || 'Free'}
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                 <div className="flex-grow">
                    <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 self-start">{event.category}</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate">{event.title}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        <p>{formattedDate}</p>
                        <p>{event.location}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2">
                        <button onClick={() => onViewDetails(event)} className="flex-1 bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 capitalize cursor-pointer flex items-center justify-center gap-2">
                            <InformationCircleIcon className="w-5 h-5" />
                            Details
                        </button>
                        <button onClick={() => onViewAnalytics(eventWithAnalytics)} className="flex-1 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 capitalize cursor-pointer">
                            {translate("eventAnalytics")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalyticsModal = ({ event, isOpen, onClose }) => {
    const { translate } = useLanguage();

    if (!event)
        return null;

    const attendanceRate = parseFloat((event.ticketsIssued > 0 ? (event.attendees / event.ticketsIssued) * 100 : 0).toFixed(1));
    const capacityFilled = parseFloat((event.capacity > 0 ? (event.ticketsIssued / event.capacity) * 100 : 0).toFixed(1));
    const remainingCapacity = event.capacity - event.ticketsIssued;

    const capacityData = [{ name: 'Filled', value: capacityFilled, fill: '#4f46e5' }];
    const attendanceData = [{ name: 'Attended', value: attendanceRate, fill: '#10b981' }];

    const ChartLabel = ({ value, label, colorClass }) => (
        <>
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className={`fill-current text-3xl font-bold ${colorClass}`}> {value} </text>
            <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-current text-sm text-gray-500 dark:text-gray-400"> {label} </text>
        </>
    );

    return (
        <div className={`fixed inset-0 z-[200] transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
            <div className="fixed inset-0 bg-black/70 transition-opacity duration-300" onClick={onClose} style={{ opacity: isOpen ? 1 : 0 }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl p-4">
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 ease-in-out" style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}>
                    <div className="p-8">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"> <XMarkIcon className="h-6 w-6"/> </button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 capitalize">{translate("eventAnalytics")}</h2>
                        <p className="text-lg text-indigo-600 dark:text-indigo-400 mb-8">{event.title}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 capitalize">{translate("capacityFilled")}</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <RadialBarChart innerRadius="70%" outerRadius="85%" data={capacityData} startAngle={90} endAngle={-270}>
                                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                        <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                                        <ChartLabel value={`${capacityFilled.toFixed(1)}%`} label={translate("filled")} colorClass="text-indigo-600 dark:text-indigo-400" />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4">{translate("numTickets", {count : `${event.ticketsIssued} / ${event.capacity}`})}</p>
                            </div>
                             <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 capitalize">{translate("attendanceRate")}</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <RadialBarChart innerRadius="70%" outerRadius="85%" data={attendanceData} startAngle={90} endAngle={-270}>
                                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                        <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                                        <ChartLabel value={`${attendanceRate}%`} label={translate("attended")} colorClass="text-green-600 dark:text-green-400" />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4">{translate("numAttended", {count : `${event.attendees} / ${event.ticketsIssued}`})}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg flex flex-col items-center justify-center space-y-4">
                                <div className="text-center"> <p className="text-5xl font-bold text-gray-900 dark:text-white">{remainingCapacity}</p> <p className="text-md text-gray-500 dark:text-gray-400 mt-1 capitalize">{translate("remainingCapacity")}</p> </div>
                                <div className="text-center"> <p className="text-5xl font-bold text-gray-900 dark:text-white">{event.attendees}</p> <p className="text-md text-gray-500 dark:text-gray-400 mt-1 capitalize">{translate("totalAttendees")}</p> </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventDetailsModal = ({ event, isOpen, onClose }) => {
    const { translate } = useLanguage();

    if (!event)
        return null;

    const startDate = event.start_at || event.date;
    const endDate = event.end_at;
    const eventStart = startDate ? new Date(startDate) : null;
    const eventEnd = endDate ? new Date(endDate) : null;

    const formatDateTime = (date) => {
        if (!date) return 'Not specified';
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (date) => {
        if (!date) return '';
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`fixed inset-0 z-[200] transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
            <div className="fixed inset-0 bg-black/70 transition-opacity duration-300" onClick={onClose} style={{ opacity: isOpen ? 1 : 0 }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl p-4 max-h-[90vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 ease-in-out" style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}>
                    <div className="p-8">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer">
                            <XMarkIcon className="h-6 w-6"/>
                        </button>

                        {/* Event Image */}
                        {event.imageUrl && (
                            <div className="mb-6 rounded-lg overflow-hidden">
                                <img 
                                    src={event.imageUrl} 
                                    alt={event.title}
                                    className="w-full h-64 object-cover"
                                    onError={(e) => {
                                        e.target.src = '/uploads/events/default-event-image.svg';
                                    }}
                                />
                            </div>
                        )}

                        {/* Event Title */}
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h2>
                        
                        {/* Category Badge */}
                        <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-sm font-semibold px-3 py-1 rounded-full mb-6">
                            {event.category}
                        </span>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Date & Time */}
                            <div className="flex items-start gap-3">
                                <CalendarDaysIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Date & Time</p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {formatDateTime(eventStart)}
                                    </p>
                                    {eventEnd && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Ends: {formatDateTime(eventEnd)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-3">
                                <MapPinIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Location</p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {event.location || 'Not specified'}
                                    </p>
                                    {event.address && event.address !== event.location && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {event.address}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Capacity */}
                            <div className="flex items-start gap-3">
                                <UsersIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Capacity</p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {event.registeredUsers || 0} / {event.capacity || 0} registered
                                    </p>
                                    {event.capacity && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {event.capacity - (event.registeredUsers || 0)} spots remaining
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-start gap-3">
                                <ClockIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Price</p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {typeof event.price === 'number' ? `$${event.price.toFixed(2)}` : event.price || 'Free'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </p>
                            </div>
                        )}

                        {/* Organization */}
                        {event.organization && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Organization</h3>
                                <p className="text-gray-600 dark:text-gray-300">{event.organization.toString()}</p>
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                event.status === 'upcoming' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                event.status === 'ongoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                event.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateEventModal = ({ isOpen, onClose, onAddEvent, organizationId, categories }) => {
    const [newEvent, setNewEvent] = useState({ title: '', category: 'Music', startAt: '', endAt: '', location: '', locationAddress: '', description: '', price: 0, capacity: 0 });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handleChange = (e) => { 
        const { name, value, type } = e.target; 
        setNewEvent(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value })); 
    };

    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file (jpeg, jpg, png, gif, webp)');
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => { 
        e.preventDefault();
        
        // Check for missing organization ID first (this is a system issue, not user input)
        if (!organizationId) {
            alert('Unable to create event: Your organization information is not available. Please refresh the page or contact support.');
            return;
        }
        
        // Validate required fields with specific messages
        const missingFields = [];
        if (!newEvent.title || !newEvent.title.trim()) missingFields.push('Event Title');
        if (!newEvent.startAt) missingFields.push('Starts At');
        if (!newEvent.endAt) missingFields.push('Ends At');
        if (!newEvent.location || !newEvent.location.trim()) missingFields.push('Location Name');
        if (!newEvent.locationAddress || !newEvent.locationAddress.trim()) missingFields.push('Location Address');
        if (!newEvent.description || !newEvent.description.trim()) missingFields.push('Description');
        if (!newEvent.capacity || newEvent.capacity <= 0) missingFields.push('Capacity (must be greater than 0)');
        
        if (missingFields.length > 0) {
            alert(`Please fill in the following required fields:\n- ${missingFields.join('\n- ')}`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Parse start and end dates
            const startDateTime = new Date(newEvent.startAt);
            const endDateTime = new Date(newEvent.endAt);
            
            if (isNaN(startDateTime.getTime())) {
                alert('Please enter a valid start date and time');
                setIsSubmitting(false);
                return;
            }
            
            if (isNaN(endDateTime.getTime())) {
                alert('Please enter a valid end date and time');
                setIsSubmitting(false);
                return;
            }
            
            if (endDateTime <= startDateTime) {
                alert('End date and time must be after start date and time');
                setIsSubmitting(false);
                return;
            }

            // Prepare event data for API
            const eventData = {
                organization: organizationId,
                title: newEvent.title,
                category: newEvent.category,
                start_at: startDateTime.toISOString(),
                end_at: endDateTime.toISOString(),
                capacity: newEvent.capacity || 0,
                description: newEvent.description || '',
                location: {
                    name: newEvent.location.trim(),
                    address: newEvent.locationAddress.trim()
                }
            };

            // Use the API function with image file if provided
            const response = await createEvent(eventData, imageFile);
            
            // Transform the backend response to frontend format
            const backendEvent = response.event || response;
            const transformedEvent = transformEventForFrontend(backendEvent);

            // Call the callback with the transformed event
            onAddEvent(transformedEvent);
            
            // Reset form
            setNewEvent({ title: '', category: 'Music', startAt: '', endAt: '', location: '', locationAddress: '', description: '', price: 0, capacity: 0 });
            setImageFile(null);
            setImagePreview(null);
            setIsSubmitting(false);
            onClose();
        } catch (error) {
            console.error('Error creating event:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            // Extract error message from response
            let errorMessage = 'Failed to create event. Please try again.';
            
            // Try multiple ways to extract error message
            const errorData = error.response?.data;
            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.details) {
                    errorMessage = `${errorData.error || 'Error'}: ${errorData.details}`;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Show detailed error in development
            if (import.meta.env.DEV && error.response?.data) {
                console.error('Full error details:', JSON.stringify(error.response.data, null, 2));
            }
            
            alert(errorMessage);
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[200] transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
            <div className="fixed inset-0 bg-black/70 transition-opacity duration-300" onClick={onClose} style={{ opacity: isOpen ? 1 : 0 }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4 max-h-[90vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 ease-in-out" style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}>
                    <form onSubmit={handleSubmit} className="p-8">
                        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"> <XMarkIcon className="h-6 w-6"/> </button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create New Event</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div> <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title</label> <input id="title" name="title" value={newEvent.title} onChange={handleChange} placeholder="e.g., Summer Music Fest" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label> <select id="category" name="category" value={newEvent.category} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200"> {categories.filter(c => c !== 'All' && c !== 'Featured').map(cat => <option key={cat} value={cat}>{cat}</option>)} </select> </div>
                            <div> <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starts At</label> <input id="startAt" name="startAt" type="datetime-local" value={newEvent.startAt} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="endAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ends At</label> <input id="endAt" name="endAt" type="datetime-local" value={newEvent.endAt} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Name</label> <input id="location" name="location" value={newEvent.location} onChange={handleChange} placeholder="e.g., Place des Arts" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Address</label> <input id="locationAddress" name="locationAddress" value={newEvent.locationAddress} onChange={handleChange} placeholder="e.g., 175 Sainte-Catherine St W, Montreal, QC" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Image</label>
                                {imagePreview ? (
                                    <div className="relative">
                                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                            isDragging 
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                                        }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileInputChange}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label htmlFor="image-upload" className="cursor-pointer">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h4m-4-4v4m0-4h-4m-4 0h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PNG, JPG, GIF or WEBP (Max 5MB)</p>
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div> <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label> <input id="price" name="price" type="number" value={newEvent.price} onChange={handleChange} placeholder="0 for free" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity</label> <input id="capacity" name="capacity" type="number" value={newEvent.capacity} onChange={handleChange} placeholder="e.g., 500" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div className="md:col-span-2"> <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label> <textarea id="description" name="description" value={newEvent.description} onChange={handleChange} placeholder="Tell us more about the event..." className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" rows="3" required></textarea> </div>
                        </div>
                        <div className="mt-8 flex justify-end"> 
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={`bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            > 
                                {isSubmitting ? 'Creating...' : 'Create Event'} 
                            </button> 
                        </div>
                    </form>
                 </div>
            </div>
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    if (totalPages <= 1)
        return null;

    return (
        <div className="mt-12 flex justify-center items-center space-x-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"> Previous </button>
                {pageNumbers.map(number => ( <button key={number} onClick={() => onPageChange(number)} className={`px-4 py-2 rounded-md transition-colors duration-300 ${ currentPage === number ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600' }`}> {number} </button> ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"> Next </button>
        </div>
    );
};

const DashboardPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedEventDetails, setSelectedEventDetails] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [organizationId, setOrganizationId] = useState(null);
    const { translate } = useLanguage();
    const [isInitialMount,setIsInitialMount] = useState(true);
    const eventsListRef = useRef(null);

    // Fetch events from API
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);

                const userProfileResponse = await getUserProfile();
                console.log('User profile response:', userProfileResponse); // Debug
                
                // axios wraps the response in .data
                const userProfile = userProfileResponse?.data || userProfileResponse;
                const user = userProfile?.user || userProfile;
                
                console.log('User object:', user); // Debug
                console.log('User organization:', user?.organization); // Debug
                
                if (!user) {
                    console.error('User not found in response');
                    setEvents([]);
                    setLoading(false);
                    return;
                }

                if (!user.organization) {
                    console.warn('User does not have an organization. User data:', {
                        _id: user._id,
                        email: user.email,
                        role: user.role,
                        organization: user.organization
                    });
                    setEvents([]);
                    setLoading(false);
                    return;
                }

                // Extract organization ID - handle both populated object and string ObjectId
                let orgId;
                if (typeof user.organization === 'string') {
                    orgId = user.organization;
                } else if (user.organization && user.organization._id) {
                    orgId = user.organization._id;
                } else if (user.organization && typeof user.organization === 'object') {
                    // Try to extract _id or convert to string
                    orgId = user.organization._id || user.organization.toString();
                }
                
                console.log('Extracted organization ID:', orgId); // Debug
                console.log('Organization type:', typeof user.organization); // Debug
                
                if (!orgId) {
                    console.error('Organization ID not found. Organization value:', user.organization);
                    setEvents([]);
                    setLoading(false);
                    return;
                }

                // Store organization ID for event creation
                setOrganizationId(orgId);

                const response = await getEventsByOrganization(orgId);
                console.log('API Response (raw):', response); // Debug log
                
                // axios wraps the response in .data
                const responseData = response?.data || response;
                console.log('API Response (unwrapped):', responseData); // Debug log
                
                // Handle different response formats
                const eventsArray = responseData?.events || responseData || [];
                console.log('Events extracted:', eventsArray.length, eventsArray); // Debug log
                
                if (!Array.isArray(eventsArray)) {
                    console.error('Events is not an array:', eventsArray);
                    setEvents([]);
                    return;
                }
                
                const transformedEvents = transformEventsForFrontend(eventsArray);
                console.log('Transformed events:', transformedEvents.length, transformedEvents); // Debug log
                
                // Debug: Check location data in transformed events
                if (transformedEvents.length > 0) {
                    console.log('First event location check:', {
                        original: eventsArray[0]?.location,
                        transformed: transformedEvents[0]?.location,
                        address: transformedEvents[0]?.address,
                        fullEvent: transformedEvents[0]
                    });
                }
                
                setEvents(transformedEvents);
            } catch (err) {
                console.error('Error fetching events:', err);
                console.error('Error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    statusText: err.response?.statusText
                });
                
                // Fallback to empty array on error
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const uniqueOrganizations = useMemo(() => [...new Set(events.map(event => event.organization))].sort(), [events]);

    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false);
        } else {
            const top = eventsListRef.current.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        eventsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleAddEvent = (newEvent) => {
        // Add the new event to the beginning of the events list
        setEvents(prevEvents => [newEvent, ...prevEvents]);
        // Optionally refresh the events list to ensure consistency with backend
        // This could be useful if the backend adds additional data
    };

    const filteredEvents = useMemo(() => {
        return events.filter(event =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.organization.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, events]);

    const eventsPerPage = 9;
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-8" ref={eventsListRef}>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">{translate("eventsDashboard")}</h1>

                    <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300">
                        <PlusCircleIcon className="w-5 h-5"/>
                        <span>{translate("createEvent")}</span>
                    </button>
                </div>

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

            {currentEvents.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {currentEvents.map(event => (
                        <EventCard 
                            key={event.id} 
                            event={event} 
                            onViewAnalytics={setSelectedEvent}
                            onViewDetails={setSelectedEventDetails}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">{translate("noEventsFound")}</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">{translate("noEventsFoundDescription")}</p>
                </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            <AnalyticsModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
            />

            <EventDetailsModal
                isOpen={!!selectedEventDetails}
                onClose={() => setSelectedEventDetails(null)}
                event={selectedEventDetails}
            />

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onAddEvent={handleAddEvent}
                organizationId={organizationId}
                categories={categories}
            />
        </>
    );
}

export default DashboardPage;

