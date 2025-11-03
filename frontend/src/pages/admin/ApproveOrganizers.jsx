import { ShieldCheckIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import { adminApi } from '../../api/adminApi';
import { getOrganizationById } from '../../api/organizationApi';
import ButtonGroup from '../../components/button/ButtonGroup';
import Modal from '../../components/modal/Modal';

export default function ApproveOrganizers() {
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingOrganizers, setPendingOrganizers] = useState([]);
    const [rejectedOrganizers, setRejectedOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [moderationModalOpen, setModerationModalOpen] = useState(false);
    const [selectedOrganizer, setSelectedOrganizer] = useState(null);
    const [organizationDetails, setOrganizationDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { showNotification } = useNotification();
    const { translate } = useLanguage();

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPendingOrganizers();
        } else {
            fetchRejectedOrganizers();
        }
    }, [activeTab]);

    const fetchPendingOrganizers = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getPendingOrganizers();
            console.log('Pending organizers response:', response);
            
            // axiosClient interceptor returns response.data directly
            if (response && response.organizers) {
                console.log('Setting pending organizers:', response.organizers);
                setPendingOrganizers(Array.isArray(response.organizers) ? response.organizers : []);
            } else if (Array.isArray(response)) {
                // Fallback if response is directly an array
                setPendingOrganizers(response);
            } else {
                console.warn('Unexpected response structure:', response);
                setPendingOrganizers([]);
            }
        } catch (error) {
            console.error('Error fetching pending organizers:', error);
            console.error('Error response:', error.response);
            showNotification(
                error.response?.data?.error || error.response?.data?.details || 'Failed to fetch pending organizers', 
                'error'
            );
            setPendingOrganizers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRejectedOrganizers = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getRejectedOrganizers();
            console.log('Rejected organizers response:', response);
            
            // axiosClient interceptor returns response.data directly
            if (response && response.organizers) {
                console.log('Setting rejected organizers:', response.organizers);
                setRejectedOrganizers(Array.isArray(response.organizers) ? response.organizers : []);
            } else if (Array.isArray(response)) {
                // Fallback if response is directly an array
                setRejectedOrganizers(response);
            } else {
                console.warn('Unexpected response structure:', response);
                setRejectedOrganizers([]);
            }
        } catch (error) {
            console.error('Error fetching rejected organizers:', error);
            console.error('Error response:', error.response);
            showNotification(
                error.response?.data?.error || error.response?.data?.details || 'Failed to fetch rejected organizers', 
                'error'
            );
            setRejectedOrganizers([]);
        } finally {
            setLoading(false);
        }
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (moderationModalOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [moderationModalOpen]);

    const handleModerate = async (organizer) => {
        setSelectedOrganizer(organizer);
        setModerationModalOpen(true);
        setLoadingDetails(true);
        setOrganizationDetails(null);
        setRejectionReason('');
        
        try {
            // Get organization ID from organizer
            const orgId = organizer.organization;
            
            if (orgId) {
                // Fetch organization details
                const detailsResponse = await getOrganizationById(orgId);
                const organization = detailsResponse?.organization || detailsResponse;
                setOrganizationDetails(organization);
            } else {
                // No organization found
                setOrganizationDetails(null);
            }
        } catch (error) {
            console.error('Error fetching organization details:', error);
            setOrganizationDetails(null);
            // Don't show error if organization doesn't exist - organizer might not have created one yet
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedOrganizer) return;
        
        setIsProcessing(true);
        try {
            await adminApi.approveOrganizer(selectedOrganizer._id);
            showNotification(`Organizer "${selectedOrganizer.name || selectedOrganizer.email}" has been approved successfully.`, 'success');
            
            // Remove from current list and refresh
            if (activeTab === 'pending') {
                setPendingOrganizers(prev => prev.filter(org => org._id !== selectedOrganizer._id));
            } else {
                setRejectedOrganizers(prev => prev.filter(org => org._id !== selectedOrganizer._id));
                fetchPendingOrganizers();
            }
            
            setModerationModalOpen(false);
            setSelectedOrganizer(null);
            setOrganizationDetails(null);
        } catch (error) {
            console.error('Error approving organizer:', error);
            showNotification(error.response?.data?.error || 'Failed to approve organizer', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOrganizer) return;
        
        if (!rejectionReason.trim()) {
            showNotification('Please provide a rejection reason', 'error');
            return;
        }
        
        setIsProcessing(true);
        try {
            await adminApi.rejectOrganizer(selectedOrganizer._id, rejectionReason);
            showNotification(`Organizer "${selectedOrganizer.name || selectedOrganizer.email}" has been rejected.`, 'success');
            
            // Remove from current list and refresh
            if (activeTab === 'pending') {
                setPendingOrganizers(prev => prev.filter(org => org._id !== selectedOrganizer._id));
                fetchRejectedOrganizers();
            } else {
                setRejectedOrganizers(prev => prev.filter(org => org._id !== selectedOrganizer._id));
            }
            
            setModerationModalOpen(false);
            setSelectedOrganizer(null);
            setOrganizationDetails(null);
            setRejectionReason('');
        } catch (error) {
            console.error('Error rejecting organizer:', error);
            showNotification(error.response?.data?.error || 'Failed to reject organizer', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (approved, rejectedAt) => {
        if (approved) {
            return (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Approved
                </span>
            );
        } else if (rejectedAt) {
            return (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Rejected
                </span>
            );
        } else {
            return (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                </span>
            );
        }
    };

    const tabs = [
        { value: 'pending', label: translate('Pending') || 'Pending' },
        { value: 'rejected', label: translate('Rejected') || 'Rejected' }
    ];

    const currentOrganizers = activeTab === 'pending' ? pendingOrganizers : rejectedOrganizers;

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{translate("approveOrganizers")}</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{translate("approveNewOrganizerAccounts")}</p>
            </div>

            <div className="mb-6">
                <ButtonGroup
                    options={tabs}
                    value={activeTab}
                    onChange={setActiveTab}
                    className="mb-6"
                />
            </div>

            {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        {activeTab === 'pending' ? 'Loading pending organizers...' : 'Loading rejected organizers...'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("name")}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("email")}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("username")}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("status")}</th>
                                    {activeTab === 'pending' && (
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">Registered Date</th>
                                    )}
                                    {activeTab === 'rejected' && (
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">Rejected Date</th>
                                    )}
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("actions")}</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                                {currentOrganizers.length > 0 ? (
                                    currentOrganizers.map(organizer => (
                                        <tr key={organizer._id} className="transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                                                    {organizer.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                                                    {organizer.email || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {organizer.username || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(organizer.approved, organizer.rejectedAt)}
                                            </td>
                                            {activeTab === 'pending' && (
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {organizer.createdAt ? new Date(organizer.createdAt).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </td>
                                            )}
                                            {activeTab === 'rejected' && (
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {organizer.rejectedAt ? new Date(organizer.rejectedAt).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => handleModerate(organizer)} 
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all cursor-pointer transition-colors duration-300"
                                                    title="Moderate Organizer"
                                                >
                                                    <span className="sr-only">Moderate</span>
                                                    <ShieldCheckIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={activeTab === 'pending' ? 6 : 6} className="px-6 py-12 text-center">
                                            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                                {activeTab === 'pending' 
                                                    ? (translate("No Pending Applications") || "No pending organizers") 
                                                    : (translate("No Rejected Applications") || "No rejected organizers")}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Moderation Modal */}
            <Modal isOpen={moderationModalOpen} onClose={() => setModerationModalOpen(false)} width="large">
                <div 
                    className="flex flex-col max-h-[90vh]"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    {/* Fixed Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {translate("Moderate Organizer") || "Moderate Organizer"}
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
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
                        {loadingDetails ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">Loading organizer details...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Organizer Details */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <InformationCircleIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {translate("Organizer Details") || "Organizer Details"}
                                        </h3>
                                    </div>
                                    
                                    {selectedOrganizer && (
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Name:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{selectedOrganizer.name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{selectedOrganizer.email || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Username:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{selectedOrganizer.username || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Registered:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">
                                                    {selectedOrganizer.createdAt ? new Date(selectedOrganizer.createdAt).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Status:</span>
                                                {getStatusBadge(selectedOrganizer.approved, selectedOrganizer.rejectedAt)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Organization Details */}
                                {organizationDetails ? (
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <InformationCircleIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {translate("Organization Details") || "Organization Details"}
                                            </h3>
                                        </div>
                                        
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Name:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{organizationDetails.name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Description:</span>
                                                <p className="mt-1 text-gray-900 dark:text-white">{organizationDetails.description || 'No description'}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Website:</span>
                                                <a href={organizationDetails.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    {organizationDetails.website || 'N/A'}
                                                </a>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Contact Email:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{organizationDetails.contact?.email || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Contact Phone:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{organizationDetails.contact?.phone || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Status:</span>
                                                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                                                    organizationDetails.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                    organizationDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                                }`}>
                                                    {(organizationDetails.status || 'Unknown').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {translate("NoOrganization") || "This organizer has not created an organization yet."}
                                        </p>
                                    </div>
                                )}

                                {/* Approval Actions */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        {translate("Actions") || "Actions"}
                                    </h3>
                                    
                                    {/* Check if organizer is already rejected */}
                                    {selectedOrganizer && selectedOrganizer.rejectedAt ? (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <p className="text-sm text-red-700 dark:text-red-300">
                                                This organizer account has already been rejected. You can re-approve it, but cannot reject it again.
                                            </p>
                                        </div>
                                    ) : null}
                                    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={handleApprove}
                                            disabled={isProcessing}
                                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? 'Processing...' : (selectedOrganizer?.rejectedAt ? (translate("Re-approve Organizer") || 'Re-approve Organizer') : (translate("Approve Organizer") || 'Approve Organizer'))}
                                        </button>
                                        
                                        {/* Only show reject button if organizer is not already rejected */}
                                        {selectedOrganizer && !selectedOrganizer.rejectedAt ? (
                                            <button
                                                onClick={handleReject}
                                                disabled={isProcessing}
                                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isProcessing ? 'Processing...' : (translate("Reject Organizer") || 'Reject Organizer')}
                                            </button>
                                        ) : (
                                            <button
                                                disabled={true}
                                                className="flex-1 px-4 py-2 bg-gray-400 text-gray-200 rounded-lg font-medium cursor-not-allowed opacity-50"
                                                title="Cannot reject an already rejected account"
                                            >
                                                {translate("Reject Organizer") || 'Reject Organizer'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Rejection Reason Input - Only show if organizer is not already rejected */}
                                    {selectedOrganizer && !selectedOrganizer.rejectedAt && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {translate("Rejection Reason") || "Rejection Reason"} (Required for rejection)
                                            </label>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder={translate("Enter rejection reason") || "Enter rejection reason..."}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                                                rows="3"
                                            />
                                        </div>
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
