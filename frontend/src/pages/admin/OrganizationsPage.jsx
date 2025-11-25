import { ShieldCheckIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import { getAllOrganizations, getOrganizationById, updateOrganization } from '../../api/organizationApi';
import { getEventsByOrganization } from '../../api/eventApi';
import { adminApi } from '../../api/adminApi';
import Modal from '../../components/modal/Modal';

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [moderationModalOpen, setModerationModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [orgDetails, setOrgDetails] = useState(null);
    const [orgEvents, setOrgEvents] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isSuspending, setIsSuspending] = useState(false);
    const { showNotification } = useNotification();
    const { translate, currentLanguage } = useLanguage();

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (moderationModalOpen) {
            // Save current overflow value
            const originalOverflow = document.body.style.overflow;
            // Disable body scroll
            document.body.style.overflow = 'hidden';

            // Cleanup: restore scroll when modal closes
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [moderationModalOpen]);

    // Fetch organizations from backend
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                setLoading(true);
                const response = await getAllOrganizations();
                // Backend returns { organizations: [...], total: number, message: string }
                const orgs = response.organizations || [];

                // Map backend data to frontend format
                const mappedOrgs = orgs.map(org => ({
                    id: org._id,
                    name: org.name || 'Unnamed Organization',
                    contact: org.organizer?.name || org.contact?.name || 'N/A',
                    email: org.organizer?.email || org.contact?.email || 'N/A',
                    role: org.status || 'Pending',
                    _id: org._id,
                    raw: org // Keep raw data for other operations
                }));

                setOrganizations(mappedOrgs);
            } catch (error) {
                console.error('Error fetching organizations:', error);
                showNotification(
                    error.response?.data?.error || error.message || 'Failed to load organizations',
                    'error'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizations();
    }, [showNotification]);

    const handleModerate = async (org) => {
        setSelectedOrg(org);
        setModerationModalOpen(true);
        setLoadingDetails(true);

        try {
            // Fetch full organization details and events
            const [detailsResponse, eventsResponse] = await Promise.all([
                getOrganizationById(org._id),
                getEventsByOrganization(org._id).catch(() => ({ events: [] })) // Don't fail if events fail
            ]);

            // Backend returns { message, organization }, axiosClient returns response.data
            const organization = detailsResponse?.organization || detailsResponse || org.raw;
            setOrgDetails(organization);

            // Events response structure - backend returns { message, events }
            const events = eventsResponse?.events || (Array.isArray(eventsResponse) ? eventsResponse : []);
            setOrgEvents(Array.isArray(events) ? events : []);
        } catch (error) {
            console.error('Error fetching organization details:', error);
            console.error('Error details:', error.response?.data || error.message);
            // Fallback to raw organization data if API fails
            if (org.raw) {
                setOrgDetails(org.raw);
                setOrgEvents([]);
                showNotification('Using cached organization data', 'warning');
            } else {
                showNotification('Failed to load organization details', 'error');
            }
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSuspendToggle = async () => {
        if (!selectedOrg) return;

        setIsSuspending(true);
        try {
            const isCurrentlyApproved = selectedOrg.role === 'approved' || selectedOrg.raw?.status === 'approved';

            if (isCurrentlyApproved) {
                // Suspend the organization
                await adminApi.suspendOrganization(selectedOrg._id);
                showNotification(translate("organizationSuspendedSuccessfully"), 'success');
            } else {
                // Unsuspend by updating status back to approved
                await updateOrganization(selectedOrg._id, { status: 'approved' });
                showNotification(translate("organizationUnsuspendedSuccessfully"), 'success');
            }

            // Refresh the list
            const refreshResponse = await getAllOrganizations();
            const orgs = refreshResponse.organizations || [];
            const mappedOrgs = orgs.map(org => ({
                id: org._id,
                name: org.name || 'Unnamed Organization',
                contact: org.organizer?.name || org.contact?.name || 'N/A',
                email: org.organizer?.email || org.contact?.email || 'N/A',
                role: org.status || 'Pending',
                _id: org._id,
                raw: org
            }));
            setOrganizations(mappedOrgs);

            // Close modal and refresh details
            setModerationModalOpen(false);
        } catch (error) {
            console.error('Error suspending/unsuspending organization:', error);
            console.error('Error response:', error.response?.data);
            console.error('Selected org ID:', selectedOrg._id);
            const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to update organization status';
            showNotification(errorMessage, 'error');
        } finally {
            setIsSuspending(false);
        }
    };


    return (
        <>
            <div className="mb-8">
                <div className="flex justify-between items-center mt-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{translate("manageOrganizations")}</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400 transition-colors duration-300">{translate("manageOrganizationsSubtitle")}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                        <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("organization")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("primaryContact")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("email")}</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("actions")}</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">{translate("loadingOrganizations")}</p>
                                    </td>
                                </tr>
                            ) : organizations.length > 0 ? (
                                organizations.map((org) => (
                                    <tr key={org.id} className="transition-colors duration-300">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">{org.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{org.contact}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{org.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleModerate(org)}
                                                className={`p-1 rounded-full transition-all transition-colors duration-300 cursor-pointer ${
                                                    org.role === 'suspended' || org.raw?.status === 'suspended'
                                                        ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                                                        : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                                }`}
                                                title="Moderate Organization"
                                            >
                                                <span className="sr-only">Moderate</span>
                                                <ShieldCheckIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">{translate("noOrganizationsFound")}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Moderation Modal */}
            <Modal isOpen={moderationModalOpen} onClose={() => setModerationModalOpen(false)} width="large">
                <div
                    className="flex flex-col max-h-[90vh]"
                    onWheel={(e) => {
                        // Prevent scroll propagation to body
                        e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                        // Prevent touch scroll propagation to body
                        e.stopPropagation();
                    }}
                >
                    {/* Fixed Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {translate("moderateOrganization")}
                        </h2>
                        <button
                            onClick={() => setModerationModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div
                        className="overflow-y-auto flex-1 p-6 scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        onWheel={(e) => {
                            // Prevent scroll propagation to body
                            e.stopPropagation();
                        }}
                    >
                        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
                        {loadingDetails ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">{translate("loadingOrganizationDetails")}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                            {/* Feature 1: Suspend/Unsuspend */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {translate("suspendOrUnsuspendOrganization")}
                                    </h3>
                                    <button
                                        onClick={handleSuspendToggle}
                                        disabled={isSuspending}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            selectedOrg?.role === 'approved' || selectedOrg?.raw?.status === 'approved'
                                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {translate(isSuspending
                                            ? "processing"
                                            : (selectedOrg?.role === 'approved' || selectedOrg?.raw?.status === 'approved'
                                                ? 'suspendOrganization'
                                                : 'unsuspendOrganization')
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {translate(selectedOrg?.role === 'approved' || selectedOrg?.raw?.status === 'approved'
                                        ? "suspendOrganizationDescription"
                                        : "unsuspendOrganizationDescription"
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    {translate("currentStatus")}: <span className="font-semibold">{translate(selectedOrg?.role?.toLowerCase() || selectedOrg?.raw?.status?.toLowerCase() || "unknown").toUpperCase()}</span>
                                </p>
                            </div>

                            {/* Feature 2: View Organization Details */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <InformationCircleIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {translate("organizationDetails")}
                                    </h3>
                                </div>

                                {orgDetails ? (
                                    <div className="space-y-4 text-sm">
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{translate("name")}:</span>
                                            <span className="ml-2 text-gray-900 dark:text-white">{orgDetails.name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{translate("description")}:</span>
                                            <p className="mt-1 text-gray-900 dark:text-white">{orgDetails.description || translate("noDescription")}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{translate("website")}:</span>
                                            <a href={orgDetails.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline">
                                                {orgDetails.website || 'N/A'}
                                            </a>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{translate("contactEmail")}:</span>
                                            <span className="ml-2 text-gray-900 dark:text-white">{orgDetails.contact?.email || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{translate("contactPhone")}:</span>
                                            <span className="ml-2 text-gray-900 dark:text-white">{orgDetails.contact?.phone || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{translate("organizer")}:</span>
                                            <span className="ml-2 text-gray-900 dark:text-white">
                                                {orgDetails.organizer?.name || 'N/A'} ({orgDetails.organizer?.email || 'N/A'})
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{translate("status")}:</span>
                                            <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                                                orgDetails.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                orgDetails.status === 'suspended' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                            }`}>
                                                {translate(orgDetails.status.toLowerCase() || 'unknown').toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Events List */}
                                        <div className="mt-4">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{translate("events")} ({orgEvents.length}):</span>
                                            {orgEvents.length > 0 ? (
                                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                    {orgEvents.map(event => (
                                                        <div key={event._id || event.id} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                                            <div className="font-medium text-gray-900 dark:text-white">{event.title}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {event.start_at ? new Date(event.start_at).toLocaleDateString(currentLanguage).toLocaleUpperCase() : 'N/A'} • {translate(event.status.toLowerCase()).toUpperCase() || 'N/A'} • {event.registered_users?.length || 0} {translate("registrations")}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-gray-500 dark:text-gray-400">{translate("noEventsFound")}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">{translate("failedToLoadOrganizationDetails")}</p>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </Modal>

        </>
    );
}
