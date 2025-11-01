import { PencilSquareIcon, PlusCircleIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import Modal from '../../components/modal/Modal';
import OrganizationMembersManager from '../../components/admin/OrganizationMembersManager';
import { useOrganizerNotifications } from '../../hooks/useOrganizerNotifications';
import { adminApi } from '../../api/adminApi';

// --- MOCK DATA ---
const organizationsData = [
    { id: 1, name: 'Evenko', contact: 'Alice Martin', email: 'alice.martin@evenko.ca', role: 'Organizer' },
    { id: 2, name: 'Osheaga', contact: 'Emily White', email: 'emily.white@osheaga.co', role: 'Organizer' },
    { id: 3, name: 'Startup Montreal', contact: 'David Lee', email: 'david.lee@startupfest.com', role: 'Organizer' },
    { id: 4, name: 'Concordia Continuing Education', contact: 'Admin', email: 'cce@concordia.ca', role: 'Organizer' },
    { id: 5, name: 'City of Montreal', contact: 'Sophie Chen', email: 'sophie.chen@mtl.org', role: 'Organizer' },
    { id: 6, name: 'Tech Summit Inc.', contact: 'Admin', email: 'info@techsummit.com', role: 'Organizer' },
    { id: 7, name: 'Cinéma du Parc', contact: 'Marc Dupont', email: 'marc@cinemaduparc.com', role: 'Organizer' },
    { id: 8, name: 'McGill University', contact: 'Admin', email: 'events@mcgill.ca', role: 'Organizer' },
    { id: 9, name: 'New Contributor', contact: 'Pending Admin', email: 'pending@example.com', role: 'Pending' },
    { id: 10, name: 'Quebec Hiking Association', contact: 'Info', email: 'info@hiking.ca', role: 'Organizer' },
];

const CreateOrganizationModal = ({ isOpen, onClose, onAddOrganization }) => {
    const { translate } = useLanguage();

    const [newOrg, setNewOrg] = useState({ name: '', contact: '', email: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewOrg(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddOrganization({ ...newOrg, id: Date.now(), role: 'Organizer' });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="small">
            <form onSubmit={handleSubmit} className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">{translate("addNewOrganization")}</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">{translate("organizationName")}</label>
                        <input id="name" name="name" value={newOrg.name} onChange={handleChange} placeholder="e.g., Evenko" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200 transition-colors duration-300" required />
                    </div>
                    <div>
                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("contactName")}</label>
                        <input id="contact" name="contact" value={newOrg.contact} onChange={handleChange} placeholder="e.g., Alice Martin" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200 transition-colors duration-300" required />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{translate("contactEmail")}</label>
                        <input id="email" name="email" type="email" value={newOrg.email} onChange={handleChange} placeholder="e.g., alice@evenko.ca" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-200 transition-colors duration-300" required />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                        {translate("addOrganization")}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default function Organizations() {
    const [organizations, setOrganizations] = useState(organizationsData);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { showNotification } = useNotification();
    const { translate } = useLanguage();

    const handleEditRole = (id) => {
        // Toggle organization selection
        setSelectedOrganization(prev => prev?.id === id ? null : organizations.find(org => org.id === id));
    };

    const handleDelete = async (id) => {
        try {
            await adminApi.deleteOrganization(id);
            setOrganizations(prev => prev.filter(org => org.id !== id));
            showNotification('success', translate("organizationDeletedSuccessfully"));

            if (selectedOrganization?.id === id) {
                setSelectedOrganization(null);
            }
        } catch (error) {
            console.error('Error deleting organization:', error);
            showNotification('error', translate('errorDeletingOrganization'));
        }
    };

    const { notifyOrganizer } = useOrganizerNotifications();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            setIsLoading(true);
            const data = await adminApi.getOrganizations();
            setOrganizations(data);
        } catch (error) {
            console.error('Error loading organizations:', error);
            showNotification('error', translate('errorLoadingOrganizations'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOrganization = async (newOrg) => {
        try {
            setOrganizations(prev => [{ ...newOrg, role: 'Organizer' }, ...prev]);
            showNotification('success', translate("organizationCreatedSuccessfully"));

            await notifyOrganizer({
                organizerEmail: newOrg.email,
                organizerName: newOrg.contact,
                status: 'approved',
                eventTitle: translate('organizationRegistration'),
                feedback: translate('organizationApprovalMessage')
            });

            await adminApi.sendNotification(
                newOrg.email,
                translate('organizationApprovalSubject'),
                translate('organizationApprovalMessage')
            );
        } catch (error) {
            console.error('Error creating organization:', error);
            showNotification('error', translate('errorCreatingOrganization'));
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
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 cursor-pointer">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span className="hidden sm:block">{translate("addOrganization")}</span>
                    </button>
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
                            {organizations.length > 0 ? (
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
                                            <button
                                                onClick={() => handleEditRole(org.id)}
                                                className={`text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all transition-colors duration-300 cursor-pointer ${selectedOrganization?.id === org.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}
                                            >
                                                <span className="sr-only">{translate("manageMembers")}</span>
                                                <UserGroupIcon className="w-5 h-5" />
                                            </button>

                                            <button onClick={() => handleDelete(org.id)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-all transition-colors duration-300 cursor-pointer">
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

            {selectedOrganization && (
                <div className="mt-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 transition-colors duration-300">
                    <OrganizationMembersManager
                        organizationId={selectedOrganization.id}
                        organizationName={selectedOrganization.name}
                    />
                </div>
            )}

            <CreateOrganizationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onAddOrganization={handleAddOrganization}
            />
        </>
    );
}
