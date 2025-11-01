import { BuildingOfficeIcon, CalendarDaysIcon, MapPinIcon, QrCodeIcon, TicketIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import Modal from '../../components/modal/Modal';
import { generateRandomTicketNumber } from '../../utils/mockData';
import { useNotification } from '../../hooks/useNotification';
import { getEventsByUser } from '../../api/eventApi';
import LoadingPage from '../../layouts/LoadingPage';
import { useLanguage } from '../../hooks/useLanguage';
import { decodeToken } from '../../utils/jwt';

// --- MOCK DATA ---
// A smaller list representing events the student has reserved
// const myReservedEventsData = [
//     {
//         id: 3,
//         title: 'Startup Pitch Night',
//         category: 'Business',
//         date: '2025-11-05T19:00:00',
//         location: 'Innovation Hub, Montreal',
//         organization: 'Startup Montreal',
//         description: 'Watch the city\'s brightest entrepreneurs pitch their ideas to a panel of venture capitalists.',
//         imageUrl: 'https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=2070&auto=format&fit=crop',
//         price: 15,
//     },
//     {
//         id: 4,
//         title: 'Advanced React Workshop',
//         category: 'Technology',
//         date: '2025-11-18T10:00:00',
//         location: 'Online',
//         organization: 'Concordia Continuing Education',
//         description: 'Deep dive into advanced React patterns, hooks, and performance optimization techniques.',
//         imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop',
//         price: 250,
//     },
//     {
//         id: 17,
//         title: 'Stand-up Comedy Night',
//         category: 'Arts & Culture',
//         date: '2025-12-12T20:00:00',
//         location: 'The Comedy Nest, Montreal',
//         organization: 'The Comedy Nest',
//         description: 'A night of laughs with some of Montreal\'s best up-and-coming comedians.',
//         imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop',
//         price: 20,
//     },
// ];

const EventCard = ({ event, onViewDetails }) => {
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
                        <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-300">{event.category}</span>
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
                    <button onClick={() => onViewDetails(event)} className="flex-grow bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

const EventDetailModal = ({ event, isOpen, onClose }) => {
    const { showNotification } = useNotification();
    const [isLoadingQRGeneration, setIsLoadingQRGeneration] = useState(false);

    if (!event)
        return null;

    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const handleDownloadQRCode = async () => {
        const ticketNumber = generateRandomTicketNumber(); // Random ticket number for now

        // Construct the API URL. We request a 400x400 pixel image.
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticketNumber)}`;

        try {
            setIsLoadingQRGeneration(true);

            // Fetch the image data from the API URL
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch QR code image.');
            }

            // Convert the response to a Blob (binary data)
            const blob = await response.blob();

            // Create a temporary URL for the Blob
            const objectUrl = URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = `ticket-${ticketNumber}.png`; // Set the desired filename

            // Append the link to the body, click it, and then remove it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the temporary object URL
            URL.revokeObjectURL(objectUrl);

        } catch (error) {
            console.error('Error downloading QR code:', error);
            showNotification("Download failed", "error");
        } finally {
            setIsLoadingQRGeneration(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover rounded-t-xl" />

            <div className="p-8">
                <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-sm font-semibold px-3 py-1 rounded-full mb-4">{event.category}</span>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-3">
                        <CalendarDaysIcon className="w-5 h-5 flex-shrink-0" />
                        <span>{formattedDate} at {formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                        <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <BuildingOfficeIcon className="w-5 h-5 flex-shrink-0" />
                        <span>{event.organization}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <TicketIcon className="w-5 h-5 flex-shrink-0" />
                        <span>{typeof event.price === 'number' ? `$${event.price.toFixed(2)} CAD` : event.price}</span>
                    </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{event.description}</p>

                <button
                    onClick={handleDownloadQRCode}
                    disabled={isLoadingQRGeneration}
                    className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 dark:hover:bg-green-500 transition-colors duration-300 text-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                    <QrCodeIcon className="w-6 h-6" />
                    Download Ticket QR Code
                    {isLoadingQRGeneration && (
                        <span className="animate-spin ml-2 h-5 w-5 border-b-2 rounded-full" />
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default function MyEventsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [myEvents, setMyEvents] = useState([]);
    const { translate } = useLanguage();
    const { showNotification } = useNotification();

    const openEventModal = (event) => setSelectedEvent(event);
    const closeEventModal = () => setSelectedEvent(null);

    const fetchMyEvents = useCallback(() => {
        const user = decodeToken();
        const userId = user.userId;

        setIsLoading(true);
        getEventsByUser(userId)
            .then(response => {
                console.log('the response', response)
                let data = response.events.map(x => ({
                    id: x.event._id,
                    title: x.event.title,
                    category: x.category,
                    date: x.event.start_at,
                    location: x.event.location,
                    organization: x.event.organization.name,
                    description: x.event.description,
                    imageUrl: x.event.image,
                    price: "Free",
                }));

                setMyEvents(data);
            })
            .catch(error => {
                if (error.response.status !== 404) {
                    console.error("Error fetching user's events:", error);
                    showNotification(translate("anErrorHasOccured"), "error");
                }
            })
            .finally(() => setIsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchMyEvents();
    }, [fetchMyEvents])

    if (isLoading)
        return (
            <LoadingPage text="Loading my events..." />
        )

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">My Reserved Events</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">All the events you're scheduled to attend.</p>
            </div>

            {myEvents.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {myEvents.map(event => (
                        <EventCard key={event.id} event={event} onViewDetails={openEventModal} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">No Reserved Events</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">You haven't reserved any events yet. Go explore!</p>
                </div>
            )}

            <EventDetailModal
                isOpen={!!selectedEvent}
                onClose={closeEventModal}
                event={selectedEvent}
            />
        </>
    );
}
