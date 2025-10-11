import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AdjustmentsHorizontalIcon, BuildingOfficeIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, MapPinIcon, MagnifyingGlassIcon, TagIcon, TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { HeartIcon as FilledHeartIcon } from "@heroicons/react/24/solid";
import Modal from '../../components/modal/Modal';
import Carousel from '../../components/carousel/Carousel';
import { useLanguage } from '../../hooks/useLanguage';

// --- MOCK DATA ---
const eventsData = [
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
    },
    {
        id: 9,
        title: 'Oktoberfest Montreal',
        category: 'Food & Drink',
        date: '2025-10-11T14:00:00',
        location: 'Lachine Canal, Montreal',
        organization: 'Les Amis du Canal',
        description: 'Enjoy a taste of Bavaria with craft beer, traditional food, and live oompah bands.',
        imageUrl: 'https://images.unsplash.com/photo-1598801269323-315159d84f83?q=80&w=2070&auto=format&fit=crop',
        price: 20,
    },
    {
        id: 10,
        title: 'Digital Marketing Conference',
        category: 'Education',
        date: '2025-11-22T09:00:00',
        location: 'Palais des congrès, Montreal',
        organization: 'Marketing Pro',
        description: 'Learn the latest trends in SEO, social media, and content marketing from industry experts.',
        imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop',
        price: 150,
    },
    {
        id: 11,
        title: 'Yoga & Mindfulness Retreat',
        category: 'Health & Wellness',
        date: '2025-12-06T10:00:00',
        location: 'Eastern Townships, QC',
        organization: 'ZenSpace Retreats',
        description: 'A full-day retreat to de-stress before exams. Includes guided meditation and yoga sessions.',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop',
        price: 120,
    },
    {
        id: 12,
        title: 'Holiday Baking Masterclass',
        category: 'Food & Drink',
        date: '2025-12-13T13:00:00',
        location: 'Ateliers & Saveurs, Montreal',
        organization: 'Ateliers & Saveurs',
        description: 'Learn how to create delicious holiday treats from a professional pastry chef.',
        imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1964&auto=format&fit=crop',
        price: 85,
    },
    {
        id: 13,
        title: 'Community Volunteer Day',
        category: 'Community',
        date: '2025-11-30T10:00:00',
        location: 'Multiple Locations, Montreal',
        organization: 'Je Vois Mtl',
        description: 'Join us in giving back to the community. Choose from various projects across the city.',
        imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop',
        price: 'Free',
    },
    {
        id: 14,
        title: 'Charity Soccer Tournament',
        category: 'Sports',
        date: '2025-11-15T09:00:00',
        location: 'Concordia Stadium, Montreal',
        organization: 'Concordia Athletics',
        description: 'Form a team and compete for a good cause. All proceeds go to local youth sports programs.',
        imageUrl: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2070&auto=format&fit=crop',
        price: 10,
    },
    {
        id: 15,
        title: 'Networking for Young Professionals',
        category: 'Business',
        date: '2025-11-28T18:30:00',
        location: 'Downtown Rooftop Bar, Montreal',
        organization: 'Young Professionals MTL',
        description: 'Expand your professional network in a relaxed and friendly atmosphere. Light appetizers provided.',
        imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop',
        price: 25,
    },
    {
        id: 16,
        title: 'Modern Art Exhibition Opening',
        category: 'Featured',
        date: '2025-12-05T19:00:00',
        location: 'Galerie d\'Art Contemporain, Montreal',
        organization: 'Art Contemporain Mtl',
        description: 'Be the first to see the new collection from groundbreaking international and local artists.',
        imageUrl: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=2070&auto=format&fit=crop',
        price: 'Free',
    },
    {
        id: 17,
        title: 'The Ethics of AI: A Public Debate',
        category: 'Technology',
        date: '2025-11-26T18:00:00',
        location: 'McGill University, Leacock 132',
        organization: 'McGill University',
        description: 'Leading experts debate the moral and ethical implications of artificial intelligence in our society.',
        imageUrl: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=2070&auto=format&fit=crop',
        price: 'Free',
    },
    {
        id: 18,
        title: 'Public Speaking Workshop',
        category: 'Education',
        date: '2025-12-02T13:00:00',
        location: 'Concordia University, Webster Library',
        organization: 'Concordia University',
        description: 'Conquer your fear of public speaking and learn to deliver presentations with confidence.',
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop',
        price: 50,
    }
];

const categories = ['All', 'Featured', 'Music', 'Technology', 'Business', 'Sports', 'Community', 'Arts & Culture', 'Food & Drink', 'Health & Wellness', 'Education'];
const uniqueLocations = [...new Set(eventsData.map(event => event.location))].sort();
const uniqueOrganizations = [...new Set(eventsData.map(event => event.organization))].sort();

// --- HOOKS ---
const useCountdown = (targetDate) => {
    const countDownDate = new Date(targetDate).getTime();
    const [countDown, setCountDown] = useState(countDownDate - new Date().getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setCountDown(countDownDate - new Date().getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [countDownDate]);
    return getReturnValues(countDown);
};

const getReturnValues = (countDown) => {
    const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

    return [days, hours, minutes, seconds];
};

const FeaturedEventSlide = ({ event, onViewDetails }) => {
    const { translate } = useLanguage();

    const [days, hours, minutes, seconds] = useCountdown(event.date);

    return (
        <div className="relative w-full h-96 flex-shrink-0">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
                <span className="inline-block bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">{translate("featuredEvents")}</span>
                <h2 className="text-4xl font-extrabold mb-4">{event.title}</h2>
                <p className="text-lg max-w-2xl mb-6">{event.description}</p>
                <div className="flex items-center space-x-4">
                    <div className="flex space-x-4 text-center">
                        <div><span className="text-4xl font-bold">{String(days).padStart(2, '0')}</span><span className="block text-xs">{translate("days")}</span></div>
                        <div><span className="text-4xl font-bold">{String(hours).padStart(2, '0')}</span><span className="block text-xs">{translate("hours")}</span></div>
                        <div><span className="text-4xl font-bold">{String(minutes).padStart(2, '0')}</span><span className="block text-xs">{translate("minutes")}</span></div>
                        <div><span className="text-4xl font-bold">{String(seconds).padStart(2, '0')}</span><span className="block text-xs">{translate("seconds")}</span></div>
                    </div>
                    <button onClick={() => onViewDetails(event)} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 transform hover:scale-105">
                        {translate("learnMore")}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EventCard = ({ event, onViewDetails }) => {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const [isLiked, setIsLiked] = useState(false);

    const handleLikeClick = (e) => {
        e.stopPropagation(); // Prevent triggering other click events on the card
        setIsLiked(!isLiked);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700/50 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl group flex flex-col">
            <div className="relative">
                <img className="h-48 w-full object-cover" src={event.imageUrl} alt={event.title} />
                <div className="absolute inset-0 bg-opacity-20 group-hover:bg-opacity-40 transition-opacity duration-300"></div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300">{event.category}</span>
                        <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300">
                            {typeof event.price === 'number' ? `$${event.price.toFixed(2)}` : event.price}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate transition-colors duration-300">{event.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 transition-colors duration-300">{event.description}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 transition-colors duration-300">
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4"/>
                            <span>{formattedDate} at {formattedTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4"/>
                            <span>{event.location}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4"/>
                            <span>{event.organization}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 transition-colors duration-300">
                    <button onClick={() => onViewDetails(event)} className="flex-grow bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        View Details
                    </button>
                    <button
                        onClick={handleLikeClick}
                        className="flex-shrink-0 p-2 rounded-full hover:bg-red-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-300"
                        aria-label="Like event"
                    >
                        {isLiked && ( <FilledHeartIcon className="w-6 h-6 text-red-500 transition-colors duration-200" /> )}
                        {!isLiked && ( <HeartIcon className="w-6 h-6 text-gray-400 transition-colors duration-200 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500" /> )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CategoryFilter = ({ categories, activeCategories, setActiveCategories }) => {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const checkForScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    }, []);

    const handleCategoryClick = (category) => {
        if (category === 'All') {
            setActiveCategories(['All']);
            return;
        }

        const newActiveCategories = activeCategories.filter(c => c !== 'All');

        if (newActiveCategories.includes(category)) {
            const updatedCategories = newActiveCategories.filter(c => c !== category);
            if (updatedCategories.length === 0) {
                setActiveCategories(['All']);
            } else {
                setActiveCategories(updatedCategories);
            }
        } else {
            setActiveCategories([...newActiveCategories, category]);
        }
    };


    useEffect(() => {
        const container = scrollContainerRef.current;

        if (container) {
            checkForScroll();
            container.addEventListener('scroll', checkForScroll, { passive: true });
            const resizeObserver = new ResizeObserver(checkForScroll);
            resizeObserver.observe(container);
            return () => {
                container.removeEventListener('scroll', checkForScroll);
                resizeObserver.unobserve(container);
            };
        }
    }, [checkForScroll]);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -350 : 350;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
         <div className="relative flex items-center mb-12">
            {canScrollLeft && ( <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300" aria-label="Scroll left"> <ChevronLeftIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" /> </button> )}
            <div ref={scrollContainerRef} className="flex overflow-x-auto gap-3 py-2 px-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.scroll-smooth::-webkit-scrollbar { display: none; }`}</style>
                {categories.map(category => ( <button key={category} onClick={() => handleCategoryClick(category)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 whitespace-nowrap ${activeCategories.includes(category) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}> {category} </button> ))}
            </div>
            {canScrollRight && ( <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300" aria-label="Scroll right"> <ChevronRightIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" /> </button> )}
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const { translate } = useLanguage();

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    if (totalPages <= 1)
        return null;

    return (
        <div className="mt-12 flex justify-center items-center space-x-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"> {translate("previous")} </button>
            {pageNumbers.map(number => ( <button key={number} onClick={() => onPageChange(number)} className={`px-4 py-2 rounded-md transition-colors duration-300 ${ currentPage === number ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600' }`}> {number} </button> ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"> {translate("next")} </button>
        </div>
    );
};

const FilterModal = ({ isOpen, onClose, filters, setFilters, applyFilters, clearFilters, maxPrice }) => {
    const { translate } = useLanguage();

    if (!isOpen)
        return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const modalEventTypes = categories.filter(c => c !== 'All' && c !== 'Featured');

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="small">
            <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{translate("filterEvents")}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 transition-colors duration-300">{translate("filterEventsSubtitle")}</p>

                <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
                    <div className="space-y-6">
                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">{translate("dateRange")}</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"/>
                                    <input type="date" name="fromDate" value={filters.fromDate} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2 bg-transparent dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 dark:[&::-webkit-calendar-picker-indicator]:invert"/>
                                </div>
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"/>
                                    <input type="date" name="toDate" value={filters.toDate} onChange={handleInputChange} className="test-blue-500 w-full pl-10 pr-3 py-2 bg-transparent dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 dark:[&::-webkit-calendar-picker-indicator]:invert"/>
                                </div>
                            </div>
                        </div>

                        {/* Event Type */}
                        <div className="relative">
                            <label htmlFor="eventType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">{translate("eventType")}</label>
                            <TagIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400 pointer-events-none"/>
                            <select name="eventType" id="eventType" value={filters.eventType} onChange={handleInputChange} className="w-full appearance-none pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 bg-white dark:bg-gray-800 dark:text-white">
                                <option value="">All Types</option>
                                {modalEventTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none transform rotate-90"/>
                        </div>

                        {/* Location */}
                        <div className="relative">
                            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">{translate("location")}</label>
                                <MapPinIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400 pointer-events-none"/>
                            <select name="location" id="location" value={filters.location} onChange={handleInputChange} className="w-full appearance-none pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 bg-white dark:bg-gray-800 dark:text-white">
                                <option value="">All Locations</option>
                                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none transform rotate-90"/>
                        </div>

                        {/* Organization */}
                        <div className="relative">
                            <label htmlFor="organization" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Organization</label>
                                <BuildingOfficeIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400 pointer-events-none"/>
                            <select name="organization" id="organization" value={filters.organization} onChange={handleInputChange} className="w-full appearance-none pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 bg-white dark:bg-gray-800 dark:text-white">
                                <option value="">All Organizations</option>
                                {uniqueOrganizations.map(org => <option key={org} value={org}>{org}</option>)}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none transform rotate-90"/>
                        </div>

                        {/* Price */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Price Range</label>
                                <span className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300 rounded-full">
                                    Up to ${filters.price}
                                </span>
                            </div>
                            <input
                                type="range"
                                id="price"
                                name="price"
                                min="0"
                                max={maxPrice}
                                value={filters.price}
                                onChange={handleInputChange}
                                className="w-full price-slider accent-indigo-700"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>Free</span>
                                <span>${maxPrice}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4 transition-colors duration-300">
                        <button type="button" onClick={clearFilters} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300">
                            {translate("clear")}
                        </button>
                        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300">
                            {translate("applyFilters")}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    )
};

const EventDetailModal = ({ event, isOpen, onClose }) => {
    const { translate } = useLanguage();

    if (!event)
        return null;

    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <>
                <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover rounded-t-xl"/>
                <div className="p-8">
                    <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-sm font-semibold px-3 py-1 rounded-full mb-4">{event.category}</span>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h2>
                    <div className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                        <div className="flex items-center gap-3">
                            <CalendarDaysIcon className="w-5 h-5 flex-shrink-0"/>
                            <span>{formattedDate} at {formattedTime}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPinIcon className="w-5 h-5 flex-shrink-0"/>
                            <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <BuildingOfficeIcon className="w-5 h-5 flex-shrink-0"/>
                            <span>{event.organization}</span>
                        </div>
                            <div className="flex items-center gap-3">
                                <TicketIcon className="w-5 h-5 flex-shrink-0"/>
                            <span>{typeof event.price === 'number' ? `$${event.price.toFixed(2)} CAD` : event.price}</span>
                        </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{event.description}</p>
                    <button className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 text-lg">
                        {translate("reserve")}
                    </button>
                </div>
            </>
        </Modal>
    )
};

const Student = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategories, setActiveCategories] = useState(['All']);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const initialFilters = { fromDate: '', toDate: '', eventType: '', location: '' };
    const [activeFilters, setActiveFilters] = useState(initialFilters);
    const [modalFilters, setModalFilters] = useState(initialFilters);

    const openEventModal = (event) => setSelectedEvent(event);
    const closeEventModal = () => setSelectedEvent(null);

    const eventsPerPage = 9;

    const maxPrice = useMemo(() =>
        Math.ceil(Math.max(...eventsData.map(e => typeof e.price === 'number' ? e.price : 0))),
    []);

    const featuredEvents = useMemo(() =>
        eventsData.filter(e => e.category === 'Featured'),
    []);

    const filteredEvents = useMemo(() => {
        let events = eventsData.filter(event => event.category !== 'Featured');

        // Category Filter (from main page)
        if (!activeCategories.includes('All')) {
            events = events.filter(event => activeCategories.includes(event.category));
        }

        // Advanced Filters (from modal)
        if (activeFilters.fromDate)
            events = events.filter(event => new Date(event.date) >= new Date(activeFilters.fromDate));

        if (activeFilters.toDate)
            events = events.filter(event => new Date(event.date) <= new Date(activeFilters.toDate).setHours(23, 59, 59, 999));

        if (activeFilters.eventType)
            events = events.filter(event => event.category === activeFilters.eventType);

        if (activeFilters.location)
            events = events.filter(event => event.location === activeFilters.location);

        if (activeFilters.organization)
            events = events.filter(event => event.organization === activeFilters.organization);

        if (activeFilters.price < maxPrice)
            events = events.filter(event => {
                const price = typeof event.price === 'number' ? event.price : 0;
                return price <= activeFilters.price;
            });

        // Search Term Filter
        if (searchTerm) {
            events = events.filter(event =>
                event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return events;
    }, [searchTerm, activeCategories, activeFilters, maxPrice]);

    let carouselData = featuredEvents.map(event => ({
        id: event.id,
        props: {
            event: event,
            onViewDetails: openEventModal
        },
        Component: FeaturedEventSlide
    }));

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeCategories, activeFilters]);

    const handleApplyFilters = () => {
        setActiveFilters(modalFilters);
        setIsFilterModalOpen(false);
    };

    const handleClearFilters = () => {
        setModalFilters(initialFilters);
        setActiveFilters(initialFilters);
        setIsFilterModalOpen(false);
    };

    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

    return (
        <>
            <Carousel items={carouselData} />

            <div className="mb-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow group w-full">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors duration-300" />

                    <input
                        type="text"
                        placeholder="Search for events, categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-300"
                    />

                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                            aria-label="Clear search"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <button onClick={() => setIsFilterModalOpen(true)} className="flex-shrink-0 p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            <CategoryFilter categories={categories} activeCategories={activeCategories} setActiveCategories={setActiveCategories} />

            {currentEvents.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {currentEvents.map(event => (
                    <EventCard key={event.id} event={event} onViewDetails={openEventModal} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">No Events Found</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 transition-colors duration-300">Try adjusting your search or filter.</p>
                </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={modalFilters}
                setFilters={setModalFilters}
                applyFilters={handleApplyFilters}
                clearFilters={handleClearFilters}
                maxPrice={maxPrice}
            />

            <EventDetailModal
                isOpen={!!selectedEvent}
                onClose={closeEventModal}
                event={selectedEvent}
            />
        </>
  );
}

export default Student;
