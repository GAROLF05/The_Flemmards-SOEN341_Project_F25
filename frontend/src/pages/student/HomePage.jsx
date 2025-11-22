import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AdjustmentsHorizontalIcon, BuildingOfficeIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, MapPinIcon, MagnifyingGlassIcon, TagIcon, TicketIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { HeartIcon as FilledHeartIcon } from "@heroicons/react/24/solid";
import Modal from '../../components/modal/Modal';
import Carousel from '../../components/carousel/Carousel';
import { useLanguage } from '../../hooks/useLanguage';
import { browseEvents, registerToEvent } from '../../api/eventApi';
import { transformEventsForFrontend, getUniqueCategories, getUniqueLocations, getUniqueOrganizations } from '../../utils/eventTransform';
import LoadingPage from '../../layouts/LoadingPage';
import { useNotification } from '../../hooks/useNotification';

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

    const eventDate = event?.start_at || event?.date;
    const [days, hours, minutes, seconds] = useCountdown(eventDate || new Date().toISOString());

    if (!event) {
        console.error('FeaturedEventSlide: event is missing');
        return null;
    }

    if (!eventDate) {
        console.error('FeaturedEventSlide: event date is missing', event);
        return null;
    }

    return (
        <div className="relative w-full h-96 flex-shrink-0">
            <img
                src={event.imageUrl || '/uploads/events/default-event-image.svg'}
                alt={event.title || 'Event'}
                className="w-full h-full object-cover"
                onError={(e) => {
                    e.target.src = '/uploads/events/default-event-image.svg';
                }}
            />
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
    const { translate, currentLanguage } = useLanguage();
    const eventDate = new Date(event.start_at || event.date);
    const formattedDate = eventDate.toLocaleDateString(currentLanguage, { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString(currentLanguage, { hour: '2-digit', minute: '2-digit', hour12: true });
    const [isLiked, setIsLiked] = useState(false);

    const handleLikeClick = (e) => {
        e.stopPropagation(); // Prevent triggering other click events on the card
        setIsLiked(!isLiked);
    };

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
                        <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300">{translate(event.category.toLowerCase())}</span>
                        <div className="flex gap-2">
                            {event.organizationStatus === 'suspended' && (
                                <span className="inline-block bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300" title="Organization Suspended">
                                    {translate("suspended")}
                                </span>
                            )}
                            <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300">
                                {typeof event.price === 'number' ? `$${event.price.toFixed(2)}` : translate(event.price.toLowerCase())}
                            </span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate transition-colors duration-300">{event.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 transition-colors duration-300 line-clamp-2">{event.description}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 transition-colors duration-300">
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span className="capitalize">{formattedDate} {translate("at")} {formattedTime}</span>
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
                    <button onClick={() => onViewDetails(event)} className="flex-grow bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {translate("viewDetails")}
                    </button>
                    <button
                        onClick={handleLikeClick}
                        className="flex-shrink-0 p-2 rounded-full hover:bg-red-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-300"
                        aria-label="Like event"
                    >
                        {isLiked && (<FilledHeartIcon className="w-6 h-6 text-red-500 transition-colors duration-200" />)}
                        {!isLiked && (<HeartIcon className="w-6 h-6 text-gray-400 transition-colors duration-200 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500" />)}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CategoryFilter = ({ categories, activeCategories, setActiveCategories }) => {
    const { translate } = useLanguage();
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
            {canScrollLeft && (<button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300" aria-label="Scroll left"> <ChevronLeftIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" /> </button>)}
            <div ref={scrollContainerRef} className="flex overflow-x-auto gap-3 py-2 px-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.scroll-smooth::-webkit-scrollbar { display: none; }`}</style>
                {categories.map(category => (<button key={category} onClick={() => handleCategoryClick(category)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 whitespace-nowrap ${activeCategories.includes(category) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}> {translate(category.toLowerCase())} </button>))}
            </div>
            {canScrollRight && (<button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300" aria-label="Scroll right"> <ChevronRightIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" /> </button>)}
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
            {pageNumbers.map(number => (<button key={number} onClick={() => onPageChange(number)} className={`px-4 py-2 rounded-md transition-colors duration-300 ${currentPage === number ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}> {number} </button>))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"> {translate("next")} </button>
        </div>
    );
};

const FilterModal = ({ isOpen, onClose, filters, setFilters, applyFilters, clearFilters, maxPrice, categories, uniqueLocations, uniqueOrganizations }) => {
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
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    <input type="date" name="fromDate" value={filters.fromDate} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2 bg-transparent dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                                </div>
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    <input type="date" name="toDate" value={filters.toDate} onChange={handleInputChange} className="test-blue-500 w-full pl-10 pr-3 py-2 bg-transparent dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                                </div>
                            </div>
                        </div>

                        {/* Event Type */}
                        <div className="relative">
                            <label htmlFor="eventType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">{translate("eventType")}</label>
                            <TagIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select name="eventType" id="eventType" value={filters.eventType} onChange={handleInputChange} className="w-full appearance-none pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 bg-white dark:bg-gray-800 dark:text-white">
                                <option value="">All Types</option>
                                {modalEventTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none transform rotate-90" />
                        </div>

                        {/* Location */}
                        <div className="relative">
                            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">{translate("location")}</label>
                            <MapPinIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select name="location" id="location" value={filters.location} onChange={handleInputChange} className="w-full appearance-none pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 bg-white dark:bg-gray-800 dark:text-white">
                                <option value="">All Locations</option>
                                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none transform rotate-90" />
                        </div>

                        {/* Organization */}
                        <div className="relative">
                            <label htmlFor="organization" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Organization</label>
                            <BuildingOfficeIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select name="organization" id="organization" value={filters.organization} onChange={handleInputChange} className="w-full appearance-none pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 bg-white dark:bg-gray-800 dark:text-white">
                                <option value="">All Organizations</option>
                                {uniqueOrganizations.map(org => <option key={org} value={org}>{org}</option>)}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none transform rotate-90" />
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
    const { translate, currentLanguage } = useLanguage();
    const { showNotification } = useNotification();
    const [isLoadingRegistration, setIsLoadingRegistration] = useState(false);

    if (!event)
        return null;

    const eventDate = new Date(event.start_at || event.date);
    const formattedDate = eventDate.toLocaleDateString(currentLanguage, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString(currentLanguage, { hour: '2-digit', minute: '2-digit', hour12: true });

    const handleCloseModal = () => {
        setIsLoadingRegistration(false);
        onClose();
    };

    const handleEventRegistration = () => {
        registerToEvent(event.id)
            .then(() => {
                handleCloseModal();
                showNotification(translate("eventRegisteredSuccessfully"), "success");
            })
            .catch(error => {
                if ([403, 409].includes(error.status))
                    showNotification(error.response?.data?.message, "warning");
                else
                    showNotification(translate("anErrorHasOccured"), "error");
            })
            .finally(() => {
                setIsLoadingRegistration(false);
            });
    }

    return (
        <Modal isOpen={isOpen} onClose={handleCloseModal}>
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
                    <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-sm font-semibold px-3 py-1 rounded-full mb-4">{translate(event.category.toLowerCase())}</span>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h2>
                    <div className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                        <div className="flex items-center gap-3">
                            <CalendarDaysIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="capitalize">{formattedDate} {translate("at")} {formattedTime}</span>
                        </div>
                        {event.address && (
                            <div className="flex items-center gap-3">
                                <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                                <span>{event.location} - {event.address}</span>
                            </div>
                        )}
                        {!event.address && event.location && (
                            <div className="flex items-center gap-3">
                                <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                                <span>{event.location}</span>
                            </div>
                        )}
                        {event.organization && (
                            <div className="flex items-center gap-3">
                                <BuildingOfficeIcon className="w-5 h-5 flex-shrink-0" />
                                <span>{event.organization}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <TicketIcon className="w-5 h-5 flex-shrink-0" />
                            <span>{typeof event.price === 'number' ? `$${event.price.toFixed(2)} CAD` : translate(event.price.toLowerCase())}</span>
                        </div>
                        {event.capacity && (
                            <div className="flex items-center gap-3">
                                <UsersIcon className="w-5 h-5 flex-shrink-0" />
                                <span>{translate("capacity")}: {event.registeredUsers || 0} / {event.capacity}</span>
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
                                {translate("registrationUnavailable")}
                            </button>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                {translate("registrationUnavailableDescription")}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleEventRegistration}
                            disabled={isLoadingRegistration}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 dark:hover:bg-green-500 transition-colors duration-300 text-lg flex items-center justify-center gap-2 cursor-pointer capitalize"
                        >
                            {translate("reserveNow")}
                            {isLoadingRegistration && (
                                <span className="animate-spin ml-2 h-5 w-5 border-b-2 rounded-full" />
                            )}
                        </button>

                    )}
                </div>
            </>
        </Modal>
    )
};

const HomePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategories, setActiveCategories] = useState(['All']);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isInitialMount, setIsInitialMount] = useState(true);
    const eventsListRef = useRef(null);
    const { translate } = useLanguage();

    // State for events from API
    const [eventsData, setEventsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const initialFilters = { fromDate: '', toDate: '', eventType: '', location: '', organization: '', price: 0 };
    const [activeFilters, setActiveFilters] = useState(initialFilters);
    const [modalFilters, setModalFilters] = useState(initialFilters);

    const openEventModal = useCallback((event) => setSelectedEvent(event), []);
    const closeEventModal = () => setSelectedEvent(null);

    const eventsPerPage = 9;

    // Fetch events from API (public endpoint for students)
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await browseEvents({ limit: 100 }); // Get up to 100 events

                // Handle different response formats
                const events = response.events || response || [];

                if (!Array.isArray(events)) {
                    setError('Invalid response format from server');
                    setEventsData([]);
                    return;
                }

                const transformedEvents = transformEventsForFrontend(events);
                setEventsData(transformedEvents);
            } catch (err) {
                console.error('Error fetching events:', err);
                console.error('Error details:', {
                    message: err.message,
                    data: err.data,
                    status: err.status,
                    statusText: err.statusText,
                    response: err.response
                });

                // Check if it's an authentication error
                if (err.status === 401 || err.response?.status === 401) {
                    setError('Authentication required. Please log in as an admin to view events.');
                } else if (err.data?.message) {
                    setError(err.data.message);
                } else if (err.data?.error) {
                    setError(err.data.error);
                } else {
                    setError(err.message || 'Failed to load events. Check console for details.');
                }

                // Keep empty array on error - UI will show "no events found"
                setEventsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Extract dynamic categories, locations, and organizations from fetched events
    const categories = useMemo(() => getUniqueCategories(eventsData), [eventsData]);
    const uniqueLocations = useMemo(() => getUniqueLocations(eventsData), [eventsData]);
    const uniqueOrganizations = useMemo(() => getUniqueOrganizations(eventsData), [eventsData]);

    // Scroll to top

    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false);
        } else {
            const top = eventsListRef.current.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top, behavior: 'smooth' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const maxPrice = useMemo(() => {
        const prices = eventsData.map(e => typeof e.price === 'number' ? e.price : 0);
        return Math.max(100, ...prices); // Default to 100 if no prices
    }, [eventsData]);

    // Featured events - Smart algorithm to select the best events to feature
    const featuredEvents = useMemo(() => {
        const now = new Date();

        // Filter upcoming events
        const upcoming = eventsData.filter(e => {
            if (!e.start_at) {
                return false;
            }

            const eventDate = new Date(e.start_at);
            const isUpcoming = e.status === 'upcoming' && eventDate > now;

            return isUpcoming;
        });

        if (upcoming.length === 0) {
            // Fallback: show events even if status is not 'upcoming' or date is in past (for testing)
            const allFuture = eventsData.filter(e => {
                if (!e.start_at) return false;
                const eventDate = new Date(e.start_at);
                return eventDate > now;
            });

            if (allFuture.length > 0) {
                return allFuture.slice(0, 5).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
            }
            return [];
        }

        // Score each event for featuring
        const scoredEvents = upcoming.map(event => {
            let score = 0;
            const eventDate = new Date(event.start_at);
            const daysUntilEvent = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));

            // 1. Registration rate (popularity) - Higher registration = more popular
            const registrationRate = event.capacity > 0
                ? (event.registeredUsers || 0) / event.capacity
                : 0;
            score += registrationRate * 30; // Max 30 points

            // 2. Urgency (almost full events) - Creates FOMO
            if (registrationRate >= 0.8 && registrationRate < 1.0) {
                score += 25; // Bonus for nearly full events
            }

            // 3. Recency (happening soon) - Events in next 7 days get priority
            if (daysUntilEvent <= 7) {
                score += 20; // Happening soon bonus
            } else if (daysUntilEvent <= 14) {
                score += 10; // Happening in 2 weeks
            } else if (daysUntilEvent > 30) {
                score -= 5; // Too far in future, slightly reduce
            }

            // 4. Size (large capacity events) - Big events are more significant
            if (event.capacity >= 500) {
                score += 15; // Large events bonus
            } else if (event.capacity >= 100) {
                score += 8; // Medium events
            }

            // 5. Category diversity - Prefer popular categories
            const popularCategories = ['music', 'technology', 'sports', 'entertainment'];
            if (popularCategories.includes(event.category?.toLowerCase())) {
                score += 5;
            }

            // 6. Has custom image (not default) - Shows effort/quality
            if (event.imageUrl && !event.imageUrl.includes('default-event-image')) {
                score += 5;
            }

            return { ...event, _featureScore: score, daysUntilEvent };
        });

        // Sort by score (highest first), then by date (soonest first)
        scoredEvents.sort((a, b) => {
            if (Math.abs(a._featureScore - b._featureScore) > 5) {
                return b._featureScore - a._featureScore; // Higher score first
            }
            return new Date(a.start_at) - new Date(b.start_at); // Sooner first if scores are close
        });

        // Take top 5, ensuring some diversity (try to avoid all same category)
        const selected = [];
        const usedCategories = new Set();

        for (const event of scoredEvents) {
            if (selected.length >= 5) break;

            const eventCategory = event.category?.toLowerCase();
            // Allow 2 events from same category max, or if we have less than 3 total
            if (selected.length < 3 || !usedCategories.has(eventCategory) ||
                Array.from(usedCategories.values()).filter(c => c === eventCategory).length < 2) {
                selected.push(event);
                if (eventCategory) usedCategories.add(eventCategory);
            }
        }

        // Fill remaining slots if we don't have 5 yet
        if (selected.length < 5) {
            for (const event of scoredEvents) {
                if (selected.length >= 5) break;
                if (!selected.includes(event)) {
                    selected.push(event);
                }
            }
        }

        let result = selected.slice(0, 5);

        // Fallback 1: If no events selected by scoring, take first 5 upcoming events
        if (result.length === 0 && upcoming.length > 0) {
            result = upcoming
                .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
                .slice(0, 5);
        }

        // Fallback 2: If still no events, use any events from the data (for testing/debugging)
        if (result.length === 0 && eventsData.length > 0) {
            result = eventsData
                .slice(0, 5)
                .map(e => ({ ...e, _featureScore: 0 })); // Add dummy score
        }

        return result;
    }, [eventsData]);

    const filteredEvents = useMemo(() => {
        // Filter out featured events from main list (or just use all events)
        let events = eventsData.filter(event => {
            // Don't show featured events in main list, or show all if less than 10 events
            return !featuredEvents.some(f => f.id === event.id) || eventsData.length < 10;
        });

        // Category Filter (from main page)
        if (!activeCategories.includes('All')) {
            events = events.filter(event => activeCategories.includes(event.category));
        }

        // Advanced Filters (from modal)
        if (activeFilters.fromDate)
            events = events.filter(event => new Date(event.start_at || event.date) >= new Date(activeFilters.fromDate));

        if (activeFilters.toDate) {
            const endDate = new Date(activeFilters.toDate);
            endDate.setHours(23, 59, 59, 999);
            events = events.filter(event => new Date(event.start_at || event.date) <= endDate);
        }

        if (activeFilters.eventType)
            events = events.filter(event => event.category === activeFilters.eventType);

        if (activeFilters.location)
            events = events.filter(event => event.location === activeFilters.location);

        if (activeFilters.organization)
            events = events.filter(event => event.organization === activeFilters.organization);

        if (activeFilters.price > 0) {
            events = events.filter(event => {
                const price = typeof event.price === 'number' ? event.price : 0;
                return price <= activeFilters.price;
            });
        }

        // Search Term Filter
        if (searchTerm) {
            events = events.filter(event =>
                event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return events;
    }, [searchTerm, activeCategories, activeFilters, eventsData, featuredEvents]);

    // Prepare carousel data from featured events
    const carouselData = useMemo(() => {
        const data = featuredEvents.map(event => ({
            id: event.id,
            props: {
                event: event,
                onViewDetails: openEventModal
            },
            Component: FeaturedEventSlide
        }));

        return data;
    }, [featuredEvents, openEventModal]);

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
    };

    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

    // Show loading state
    if (loading) {
        return (
            <LoadingPage title="Loading Events" />
        );
    }

    // Show error state with message
    if (error && eventsData.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-16">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Events</h3>
                        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                        <p className="text-sm text-red-500 dark:text-red-400">
                            {error.includes('Authentication')
                                ? 'Note: This endpoint requires admin authentication. Please check the browser console for more details.'
                                : 'Please check your connection and try again. Check the browser console for more details.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {featuredEvents.length > 0 && carouselData.length > 0 && (
                <Carousel items={carouselData} />
            )}

            <div ref={eventsListRef} className="mb-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow group w-full">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors duration-300" />

                    <input
                        type="text"
                        placeholder={translate("searchEvents")}
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
                    <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">{translate("noEventsFound")}</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 transition-colors duration-300">{translate("noEventsFoundDescription")}</p>
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
                categories={categories}
                uniqueLocations={uniqueLocations}
                uniqueOrganizations={uniqueOrganizations}
            />

            <EventDetailModal
                isOpen={!!selectedEvent}
                onClose={closeEventModal}
                event={selectedEvent}
            />
        </>
    );
}

export default HomePage;
