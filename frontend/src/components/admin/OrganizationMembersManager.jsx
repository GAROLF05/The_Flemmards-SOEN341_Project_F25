import { UserGroupIcon, UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';
import Modal from '../modal/Modal';
import { adminApi } from '../../api/adminApi';

const OrganizationMembersManager = ({ organizationId, organizationName }) => {
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    // Mock data - replace with API call
    const [members] = useState([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Member' },
    ]);

    const handleAddMember = async () => {
        try {
            await adminApi.addOrganizationMember(organizationId, newMemberEmail);
            showNotification('success', translate('memberAddedSuccessfully'));
            setIsAddMemberModalOpen(false);
            setNewMemberEmail('');
            await loadMembers(); // Refresh the list
        } catch (error) {
            console.error('Error adding member:', error);
            showNotification('error', translate('errorAddingMember'));
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            await adminApi.removeOrganizationMember(organizationId, memberId);
            showNotification('success', translate('memberRemovedSuccessfully'));
            await loadMembers(); // Refresh the list
        } catch (error) {
            console.error('Error removing member:', error);
            showNotification('error', translate('errorRemovingMember'));
        }
    };

    const loadMembers = async () => {
        try {
            const response = await adminApi.getOrganizationMembers(organizationId);
            setMembers(response.data);
        } catch (error) {
            console.error('Error loading members:', error);
            showNotification('error', translate('errorLoadingMembers'));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                    <UserGroupIcon className="h-5 w-5 inline-block mr-2" />
                    {t('Organization Members')}
                </h3>
                <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    {t('Add Member')}
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {members.map((member) => (
                        <li key={member.id} className="px-4 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {member.role}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                            >
                                <UserMinusIcon className="h-5 w-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <Modal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                title={t('Add Organization Member')}
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            {t('Email Address')}
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="member@example.com"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setIsAddMemberModalOpen(false)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            onClick={handleAddMember}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            {t('Add Member')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OrganizationMembersManager;