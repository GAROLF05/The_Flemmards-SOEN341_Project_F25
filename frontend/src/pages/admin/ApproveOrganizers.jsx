import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import { getPendingOrganizations } from '../../api/organizationApi';
import { adminApi } from '../../api/adminApi';

export default function ApproveOrganizers() {
    const [pendingOrganizations, setPendingOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const { showNotification } = useNotification();
    const { translate } = useLanguage();

    useEffect(() => {
        fetchPendingOrganizations();
    }, []);

    const fetchPendingOrganizations = async () => {
        try {
            setLoading(true);
            const response = await getPendingOrganizations();
            if (response.data && response.data.organizations) {
                setPendingOrganizations(response.data.organizations);
            }
        } catch (error) {
            console.error('Error fetching pending organizations:', error);
            showNotification('Failed to fetch pending organizations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (orgId, orgName) => {
        try {
            await adminApi.approveOrganizer(orgId);
            showNotification(`Organization "${orgName}" has been approved successfully.`, 'success');
            // Remove from list
            setPendingOrganizations(prev => prev.filter(org => org._id !== orgId));
        } catch (error) {
            console.error('Error approving organization:', error);
            showNotification(error.response?.data?.error || 'Failed to approve organization', 'error');
        }
    };

    const handleRejectClick = (orgId) => {
        setRejectingId(orgId);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectionReason.trim()) {
            showNotification('Please provide a rejection reason', 'error');
            return;
        }

        try {
            const org = pendingOrganizations.find(o => o._id === rejectingId);
            await adminApi.rejectOrganizer(rejectingId, rejectionReason);
            showNotification(`Organization "${org?.name}" has been rejected.`, 'success');
            // Remove from list
            setPendingOrganizations(prev => prev.filter(org => org._id !== rejectingId));
            setShowRejectModal(false);
            setRejectingId(null);
            setRejectionReason('');
        } catch (error) {
            console.error('Error rejecting organization:', error);
            showNotification(error.response?.data?.error || 'Failed to reject organization', 'error');
        }
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setRejectingId(null);
        setRejectionReason('');
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || statusColors.pending}`}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{translate("approveOrganizers")}</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{translate("approveNewOrganizerAccounts")}</p>
            </div>

            {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pending organizations...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("organization")}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("organizer")}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("contact")}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("status")}</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("actions")}</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                                {pendingOrganizations.length > 0 ? (
                                    pendingOrganizations.map(org => (
                                        <tr key={org._id} className="transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">{org.name}</div>
                                                {org.description && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{org.description}</div>
                                                )}
                                                {org.website && (
                                                    <a 
                                                        href={org.website} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                                                    >
                                                        {org.website}
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {org.organizer ? (
                                                    <>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                                                            {org.organizer.name || org.organizer.username || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {org.organizer.email || ''}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">No organizer assigned</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    <div>{org.contact?.email || 'N/A'}</div>
                                                    {org.contact?.phone && (
                                                        <div className="mt-1">{org.contact.phone}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(org.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button 
                                                    onClick={() => handleRejectClick(org._id)} 
                                                    className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer transition-colors duration-300"
                                                    title="Reject"
                                                >
                                                    <span className="sr-only">{translate("deny")}</span>
                                                    <XCircleIcon className="w-6 h-6" />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleApprove(org._id, org.name)} 
                                                    className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-all cursor-pointer transition-colors duration-300"
                                                    title="Approve"
                                                >
                                                    <span className="sr-only">{translate("approve")}</span>
                                                    <CheckCircleIcon className="w-6 h-6" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">{translate("noPendingApplications")}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {translate("rejectOrganization") || "Reject Organization"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {translate("provideRejectionReason") || "Please provide a reason for rejecting this organization:"}
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={translate("rejectionReasonPlaceholder") || "Enter rejection reason..."}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            rows="4"
                        />
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={handleRejectCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {translate("cancel") || "Cancel"}
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                            >
                                {translate("confirmReject") || "Confirm Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
