import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import { getAllOrganizations, deleteOrganization } from '../../api/organizationApi';

export default function Organizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { translate } = useLanguage();

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

    const handleEditRole = () => {
        // console.log(`Editing role for organization ${id}`);
    };

    const handleDelete = async (id, name) => {
        try {
            await deleteOrganization(id);
            showNotification(`The organization ${name} has been deleted successfully.`, 'success');
            // Refresh the list after deleting
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
        } catch (error) {
            console.error('Error deleting organization:', error);
            showNotification(
                error.response?.data?.error || error.message || 'Failed to delete organization',
                'error'
            );
        }
    };

    return (
        <>
            <div className="mb-8">
                <div className="flex justify-between items-center mt-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{translate("manageOrganizations")}</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400 transition-colors duration-300">{translate("manageOrganizationsSubtitle") || "View and manage approved organizations"}</p>
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
                                        <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Loading organizations...</p>
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
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => handleEditRole(org.id)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all transition-colors duration-300 cursor-pointer">
                                                <span className="sr-only">{translate("editRole")}</span>
                                                <PencilSquareIcon className="w-5 h-5" />
                                            </button>

                                            <button onClick={() => handleDelete(org.id, org.name)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-all transition-colors duration-300 cursor-pointer">
                                                <span className="sr-only">{translate("delete")}</span>
                                                <TrashIcon className="w-5 h-5" />
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

        </>
    );
}
