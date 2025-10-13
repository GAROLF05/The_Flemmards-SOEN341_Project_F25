import { MagnifyingGlassIcon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useMemo, useRef, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { useLanguage } from '../../hooks/useLanguage';

// --- MOCK DATA ---
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

const EventCard = ({ event, onViewAnalytics }) => {
    const { translate } = useLanguage();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700/50 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl group flex flex-col">
            <div className="relative">
                <img className="h-48 w-full object-cover" src={event.imageUrl} alt={event.title} />
                <div className="absolute inset-0 bg-opacity-20 group-hover:bg-opacity-40 transition-opacity duration-300"></div>
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {typeof event.price === 'number' ? `$${event.price.toFixed(2)}` : event.price}
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                 <div className="flex-grow">
                    <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 self-start">{event.category}</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate">{event.title}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        <p>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p>{event.location}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => onViewAnalytics(event)} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 capitalize cursor-pointer">
                        {translate("eventAnalytics")}
                    </button>
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

const CreateEventModal = ({ isOpen, onClose, onAddEvent, uniqueOrganizations: organizations, categories }) => {
    const [newEvent, setNewEvent] = useState({ title: '', category: 'Music', date: '', location: '', organization: organizations[0] || '', description: '', imageUrl: '', price: 0, capacity: 0 });
    const handleChange = (e) => { const { name, value, type } = e.target; setNewEvent(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value })); };
    const handleSubmit = (e) => { e.preventDefault(); onAddEvent({ ...newEvent, id: Date.now(), ticketsIssued: 0, attendees: 0 }); onClose(); };

    return (
        <div className={`fixed inset-0 z-[200] transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
            <div className="fixed inset-0 bg-black/70 transition-opacity duration-300" onClick={onClose} style={{ opacity: isOpen ? 1 : 0 }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 ease-in-out" style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}>
                    <form onSubmit={handleSubmit} className="p-8">
                        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"> <XMarkIcon className="h-6 w-6"/> </button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create New Event</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div> <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title</label> <input id="title" name="title" value={newEvent.title} onChange={handleChange} placeholder="e.g., Summer Music Fest" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label> <select id="category" name="category" value={newEvent.category} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200"> {categories.filter(c => c !== 'All' && c !== 'Featured').map(cat => <option key={cat} value={cat}>{cat}</option>)} </select> </div>
                            <div> <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date and Time</label> <input id="date" name="date" type="datetime-local" value={newEvent.date} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label> <input id="location" name="location" value={newEvent.location} onChange={handleChange} placeholder="e.g., Montreal" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div className="md:col-span-2">
                                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization</label>
                                <select id="organization" name="organization" value={newEvent.organization} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required>
                                    {organizations.map(org => <option key={org} value={org}>{org}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2"> <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label> <input id="imageUrl" name="imageUrl" value={newEvent.imageUrl} onChange={handleChange} placeholder="https://images.unsplash.com/..." className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" /> </div>
                            <div> <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label> <input id="price" name="price" type="number" value={newEvent.price} onChange={handleChange} placeholder="0 for free" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity</label> <input id="capacity" name="capacity" type="number" value={newEvent.capacity} onChange={handleChange} placeholder="e.g., 500" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div className="md:col-span-2"> <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label> <textarea id="description" name="description" value={newEvent.description} onChange={handleChange} placeholder="Tell us more about the event..." className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" rows="3" required></textarea> </div>
                        </div>
                        <div className="mt-8 flex justify-end"> <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors"> Create Event </button> </div>
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
    const [events, setEvents] = useState(initialEventsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { translate } = useLanguage();
    const [isInitialMount,setIsInitialMount] = useState(true);
    const eventsListRef = useRef(null);

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
        setEvents(prevEvents => [newEvent, ...prevEvents]);
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
                        <EventCard key={event.id} event={event} onViewAnalytics={setSelectedEvent} />
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

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onAddEvent={handleAddEvent}
                uniqueOrganizations={uniqueOrganizations}
                categories={categories}
            />
        </>
    );
}

export default DashboardPage;

