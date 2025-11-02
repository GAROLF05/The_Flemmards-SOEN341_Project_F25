import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import { adminApi } from '../../api/adminApi';
import ButtonGroup from '../../components/button/ButtonGroup';

export default function ApproveOrganizers() {
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingOrganizers, setPendingOrganizers] = useState([]);
    const [rejectedOrganizers, setRejectedOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
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
            if (response.data && response.data.organizers) {
                setPendingOrganizers(response.data.organizers);
            }
        } catch (error) {
            console.error('Error fetching pending organizers:', error);
            showNotification('Failed to fetch pending organizers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRejectedOrganizers = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getRejectedOrganizers();
            if (response.data && response.data.organizers) {
                setRejectedOrganizers(response.data.organizers);
            }
        } catch (error) {
            console.error('Error fetching rejected organizers:', error);
            showNotification('Failed to fetch rejected organizers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId, userName) => {
        try {
            await adminApi.approveOrganizer(userId);
            showNotification(`Organizer "${userName}" has been approved successfully.`, 'success');
            // Remove from current list and refresh
            if (activeTab === 'pending') {
                setPendingOrganizers(prev => prev.filter(org => org._id !== userId));
            } else {
                // If approving from rejected tab, remove from rejected and refresh pending
                setRejectedOrganizers(prev => prev.filter(org => org._id !== userId));
                fetchPendingOrganizers();
            }
        } catch (error) {
            console.error('Error approving organizer:', error);
            showNotification(error.response?.data?.error || 'Failed to approve organizer', 'error');
        }
    };

    const handleRejectClick = (userId) => {
        setRejectingId(userId);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectionReason.trim()) {
            showNotification('Please provide a rejection reason', 'error');
            return;
        }

        try {
            const currentList = activeTab === 'pending' ? pendingOrganizers : rejectedOrganizers;
            const organizer = currentList.find(o => o._id === rejectingId);
            await adminApi.rejectOrganizer(rejectingId, rejectionReason);
            showNotification(`Organizer "${organizer?.name || organizer?.email}" has been rejected.`, 'success');
            // Remove from current list and refresh rejected list
            if (activeTab === 'pending') {
                setPendingOrganizers(prev => prev.filter(org => org._id !== rejectingId));
                fetchRejectedOrganizers();
            } else {
                setRejectedOrganizers(prev => prev.filter(org => org._id !== rejectingId));
            }
            setShowRejectModal(false);
            setRejectingId(null);
            setRejectionReason('');
        } catch (error) {
            console.error('Error rejecting organizer:', error);
            showNotification(error.response?.data?.error || 'Failed to reject organizer', 'error');
        }
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setRejectingId(null);
        setRejectionReason('');
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
        { value: 'pending', label: translate('pending') || 'Pending' },
        { value: 'rejected', label: translate('rejected') || 'Rejected' }
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
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleRejectClick(organizer._id)} 
                                                            className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer transition-colors duration-300"
                                                            title="Reject"
                                                        >
                                                            <span className="sr-only">{translate("deny")}</span>
                                                            <XCircleIcon className="w-6 h-6" />
                                                        </button>
                                                        
                                                        <button 
                                                            onClick={() => handleApprove(organizer._id, organizer.name || organizer.email)} 
                                                            className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-all cursor-pointer transition-colors duration-300"
                                                            title="Approve"
                                                        >
                                                            <span className="sr-only">{translate("approve")}</span>
                                                            <CheckCircleIcon className="w-6 h-6" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleApprove(organizer._id, organizer.name || organizer.email)} 
                                                        className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-all cursor-pointer transition-colors duration-300"
                                                        title="Approve"
                                                    >
                                                        <span className="sr-only">{translate("approve")}</span>
                                                        <CheckCircleIcon className="w-6 h-6" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={activeTab === 'pending' ? 6 : 6} className="px-6 py-12 text-center">
                                            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                                {activeTab === 'pending' 
                                                    ? (translate("noPendingApplications") || "No pending organizers") 
                                                    : (translate("noRejectedApplications") || "No rejected organizers")}
                                            </p>
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
                            {translate("rejectOrganizer") || "Reject Organizer"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {translate("provideRejectionReason") || "Please provide a reason for rejecting this organizer:"}
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
