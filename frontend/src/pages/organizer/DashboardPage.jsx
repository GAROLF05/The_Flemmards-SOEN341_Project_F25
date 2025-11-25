import { MagnifyingGlassIcon, PlusCircleIcon, XMarkIcon, CalendarDaysIcon, MapPinIcon, UsersIcon, ClockIcon, InformationCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useState, useMemo, useRef, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { useLanguage } from '../../hooks/useLanguage';
import { getUserProfile } from '../../api/authenticationApi';
import { getEventsByOrganization, createEvent, exportAttendeesCSV } from '../../api/eventApi';
import { transformEventsForFrontend, transformEventForFrontend } from '../../utils/eventTransform';
import { useNotification } from '../../hooks/useNotification';
import LoadingPage from '../../layouts/LoadingPage';

const categories = ['All', 'Featured', 'Music', 'Technology', 'Business', 'Sports', 'Community', 'Arts & Culture', 'Food & Drink', 'Health & Wellness', 'Education'];

const EventCard = ({ event, onViewAnalytics, onViewDetails }) => {
    const { translate, currentLanguage} = useLanguage();
    const { showNotification } = useNotification();
    const [isExporting, setIsExporting] = useState(false);

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
    const formattedDate = eventDate.toLocaleDateString(currentLanguage, { month: 'short', day: 'numeric', year: 'numeric' });

    const handleExportAttendees = async () => {
        if (!event.id && !event._id) {
            showNotification(translate("errorExportingCSV"), 'error');
            return;
        }

        setIsExporting(true);
        try {
            const eventId = event.id || event._id;

            if (!eventId) {
                throw new Error('Event ID is missing');
            }

            const response = await exportAttendeesCSV(eventId);

            // Handle blob response from backend CSV export
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Get filename from Content-Disposition header or use default
            // Headers may be in different case, so check both
            const headers = response.headers || {};
            const contentDisposition = headers['content-disposition'] || headers['Content-Disposition'] || '';
            let filename = `attendees_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            } else {
                // Generate filename from event data if header not available
                const dateStr = event.start_at || event.date
                    ? new Date(event.start_at || event.date).toISOString().split('T')[0]
                    : '';
                filename = `attendees_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}${dateStr ? '_' + dateStr : ''}.csv`;
            }

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showNotification(translate("exportAttendeesCSVSuccessful"), 'success');
        } catch (error) {
            console.error('Error exporting attendees:', error);
            // Error message is already formatted in the exportAttendeesCSV function
            const errorMessage = error.message || 'Failed to export attendees';
            showNotification(errorMessage, 'error');
        } finally {
            setIsExporting(false);
        }
    };

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
                    {typeof event.price === 'number' ? `$${event.price.toFixed(2)}` : translate(event.price.toLowerCase())}
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                 <div className="flex-grow">
                    <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 self-start">{translate(event.category.toLowerCase())}</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate">{event.title}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 capitalize">
                        <p>{formattedDate}</p>
                        <p>{event.location}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button onClick={() => onViewDetails(event)} className="flex-1 bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 capitalize cursor-pointer flex items-center justify-center gap-2">
                                <InformationCircleIcon className="w-5 h-5" />
                                {translate("details")}
                            </button>
                            <button onClick={() => onViewAnalytics(eventWithAnalytics)} className="flex-1 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                                {translate("eventAnalytics")}
                            </button>
                        </div>
                        <button
                            onClick={handleExportAttendees}
                            disabled={isExporting}
                            className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            {translate(isExporting ? "exporting..." : "exportAttendeesCSV")}
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
    const { translate, currentLanguage } = useLanguage();

    if (!event)
        return null;

    const startDate = event.start_at || event.date;
    const endDate = event.end_at;
    const eventStart = startDate ? new Date(startDate) : null;
    const eventEnd = endDate ? new Date(endDate) : null;

    const formatDateTime = (date) => {
        if (!date)
            return translate("notSpecified");

        return date.toLocaleDateString(currentLanguage, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                            {translate(event.category.toLowerCase())}
                        </span>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Date & Time */}
                            <div className="flex items-start gap-3">
                                <CalendarDaysIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{translate("dateAndTime")}</p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {formatDateTime(eventStart)}
                                    </p>
                                    {eventEnd && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
                                            {translate("ends")}: {formatDateTime(eventEnd)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-3">
                                <MapPinIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{translate("location")}</p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {event.location || translate("notSpecified")}
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
                                    <p className="font-semibold text-gray-900 dark:text-white">{translate("capacity")}</p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {event.registeredUsers || 0} / {event.capacity || 0} {translate("registered")}
                                    </p>
                                    {event.capacity && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {event.capacity - (event.registeredUsers || 0)} {translate("spotsRemaining")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-start gap-3">
                                <ClockIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{translate("price")}</p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {typeof event.price === 'number' ? `$${event.price.toFixed(2)}` : translate(event.price.toLowerCase())}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{translate("description")}</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </p>
                            </div>
                        )}

                        {/* Organization */}
                        {event.organization && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{translate("organization")}</h3>
                                <p className="text-gray-600 dark:text-gray-300">{event.organization.toString()}</p>
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{translate("status")}:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                event.status === 'upcoming' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                event.status === 'ongoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                event.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {event.status ? translate(event.status.toLowerCase()) : translate("unknown")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateEventModal = ({ isOpen, onClose, onAddEvent, organizationId, userApproved, userRejected, categories }) => {
    const { translate } = useLanguage();
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

        // Check user approval status
        if (!userApproved) {
            if (userRejected) {
                alert('Your organizer account has been rejected. You cannot create events. Please contact support if you believe this is an error.');
            } else {
                alert('Your organizer account must be approved by an administrator before you can create events.');
            }
            return;
        }

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
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{translate("createNewEvent")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div> <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("eventTitle")}</label> <input id="title" name="title" value={newEvent.title} onChange={handleChange} placeholder="e.g., Summer Music Fest" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("category")}</label> <select id="category" name="category" value={newEvent.category} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200"> {categories.filter(c => c !== 'All' && c !== 'Featured').map(cat => <option key={cat} value={cat}>{cat}</option>)} </select> </div>
                            <div> <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("startsAt")}</label> <input id="startAt" name="startAt" type="datetime-local" value={newEvent.startAt} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="endAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("endsAt")}</label> <input id="endAt" name="endAt" type="datetime-local" value={newEvent.endAt} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("locationName")}</label> <input id="location" name="location" value={newEvent.location} onChange={handleChange} placeholder="e.g., Place des Arts" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("locationAddress")}</label> <input id="locationAddress" name="locationAddress" value={newEvent.locationAddress} onChange={handleChange} placeholder="e.g., 175 Sainte-Catherine St W, Montreal, QC" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("eventImage")}</label>
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
                                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{translate("clickToUpload")}</span> {translate("orDragAndDrop")}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PNG, JPG, GIF {translate("or")} WEBP (Max 5MB)</p>
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div> <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("price")}</label> <input id="price" name="price" type="number" value={newEvent.price} onChange={handleChange} placeholder="0 for free" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div> <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("capacity")}</label> <input id="capacity" name="capacity" type="number" value={newEvent.capacity} onChange={handleChange} placeholder="e.g., 500" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" required /> </div>
                            <div className="md:col-span-2"> <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("description")}</label> <textarea id="description" name="description" value={newEvent.description} onChange={handleChange} placeholder={translate("descriptionPlaceholder")} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200" rows="3" required></textarea> </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {translate(isSubmitting ? 'creatingEvent' : 'createEvent')}
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
    const [userApproved, setUserApproved] = useState(false);
    const [userRejected, setUserRejected] = useState(false);
    const [rejectedAt, setRejectedAt] = useState(null);
    const [organizationName, setOrganizationName] = useState(null);
    const { translate } = useLanguage();
    const { showNotification } = useNotification();
    const [isInitialMount,setIsInitialMount] = useState(true);
    const eventsListRef = useRef(null);

    // Fetch events from API
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);

                const userProfileResponse = await getUserProfile();

                // axios wraps the response in .data
                const userProfile = userProfileResponse?.data || userProfileResponse;
                const user = userProfile?.user || userProfile;

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

                // Check user approval status (for organizers)
                // User is approved if: approved is true AND not rejected (rejectedAt is null or undefined)
                const isApproved = user.approved === true && !user.rejectedAt;
                const isRejected = user.rejectedAt !== null && user.rejectedAt !== undefined;
                setUserApproved(isApproved);
                setUserRejected(isRejected);
                setRejectedAt(user.rejectedAt || null);

                // Extract organization ID and name - handle both populated object and string ObjectId
                let orgId = null;
                let orgName = null;

                if (typeof user.organization === 'string') {
                    orgId = user.organization;
                } else if (user.organization && user.organization._id) {
                    orgId = user.organization._id;
                    orgName = user.organization.name || null;
                } else if (user.organization && typeof user.organization === 'object') {
                    // Try to extract _id or convert to string
                    orgId = user.organization._id || user.organization.toString();
                    orgName = user.organization.name || null;
                }

                // Store organization ID and name (if available)
                if (orgId) {
                    setOrganizationId(orgId);
                    setOrganizationName(orgName);
                } else {
                    // No organization yet
                    setEvents([]);
                    setLoading(false);
                    return;
                }

                const response = await getEventsByOrganization(orgId);

                // axios wraps the response in .data
                const responseData = response?.data || response;

                // Handle different response formats
                const eventsArray = responseData?.events || responseData || [];

                if (!Array.isArray(eventsArray)) {
                    console.error('Events is not an array:', eventsArray);
                    setEvents([]);
                    return;
                }

                const transformedEvents = transformEventsForFrontend(eventsArray);

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

    // eslint-disable-next-line no-unused-vars
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

    const handleCreateEventClick = () => {
        if (!userApproved) {
            if (userRejected) {
                showNotification('Your organizer account has been rejected. You cannot create events. Please contact support if you believe this is an error.', 'error');
            } else {
                showNotification('Your organizer account must be approved by an administrator before you can create events.', 'error');
            }
            return;
        }
        setIsCreateModalOpen(true);
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
            <LoadingPage title="Loading events..." />
        );
    }

    return (
        <>
            {/* Approval Status Banner */}
            {userRejected ? (
                <div className="mb-6 p-4 rounded-lg border-2 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700">
                    <div className="flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-red-800 dark:text-red-300">
                                Account Rejected
                            </h3>
                            <p className="text-sm mt-1 text-red-700 dark:text-red-400">
                                Your organizer account has been rejected by an administrator.
                                {rejectedAt && (
                                    <span className="block mt-1">
                                        Rejected on: {new Date(rejectedAt).toLocaleDateString()}
                                    </span>
                                )}
                                You cannot create events or perform organizer actions. Please contact support if you believe this is an error.
                            </p>
                        </div>
                    </div>
                </div>
            ) : !userApproved ? (
                <div className="mb-6 p-4 rounded-lg border-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
                    <div className="flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                                Awaiting Account Approval
                            </h3>
                            <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-400">
                                Your organizer account is pending approval. You will be able to create events and organizations once an administrator approves your account.
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="flex justify-between items-center mb-8" ref={eventsListRef}>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">{translate("eventsDashboard")}</h1>

                    <button
                        onClick={handleCreateEventClick}
                        disabled={!userApproved}
                        className={`mt-4 flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 ${
                            userApproved
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
                        }`}
                    >
                        <PlusCircleIcon className="w-5 h-5"/>
                        <span>{translate("createAnEvent")}</span>
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
                organizationName={organizationName}
                userApproved={userApproved}
                userRejected={userRejected}
                categories={categories}
            />
        </>
    );
}

export default DashboardPage;

