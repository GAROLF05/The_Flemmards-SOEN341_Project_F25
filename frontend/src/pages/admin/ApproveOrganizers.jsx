import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../hooks/useLanguage';

// --- MOCK DATA ---
const pendingOrganizersData = [
    { id: 1, name: 'Alice Martin', email: 'alice.martin@evenko.ca', organization: 'Evenko' },
    { id: 2, name: 'David Lee', email: 'david.lee@startupfest.com', organization: 'Startup Montreal' },
    { id: 3, name: 'Sophie Chen', email: 'sophie.chen@mtl.org', organization: 'City of Montreal' },
    { id: 4, name: 'Marc Dupont', email: 'marc@cinemaduparc.com', organization: 'Cinéma du Parc' },
    { id: 5, name: 'Emily White', email: 'emily.white@osheaga.co', organization: 'Osheaga' }
];

export default function ApproveOrganizers() {
    const [pendingOrganizers, setPendingOrganizers] = useState(pendingOrganizersData);
    const { showNotification } = useNotification();
    const { translate } = useLanguage();

    const handleApprove = (id, name) => {
        showNotification(`The organizer ${name} has been approved successfully.`, 'success');
        setPendingOrganizers(prev => prev.filter(org => org.id !== id));
    };

    const handleDeny = (id, name) => {
        showNotification(`The organizer ${name} has been denied successfully.`, 'success');
        setPendingOrganizers(prev => prev.filter(org => org.id !== id));
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{translate("approveOrganizers")}</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{translate("approveNewOrganizerAccounts")}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("name")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("email")}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("organization")}</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">{translate("actions")}</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                            {pendingOrganizers.length > 0 ? (
                                pendingOrganizers.map(org => (
                                    <tr key={org.id} className="transition-colors duration-300">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">{org.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{org.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{org.organization}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => handleDeny(org.id, org.name)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer transition-colors duration-300">
                                                <span className="sr-only">{translate("deny")}</span>
                                                <XCircleIcon className="w-6 h-6" />
                                            </button>
                                            
                                            <button onClick={() => handleApprove(org.id, org.name)} className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-all cursor-pointer transition-colors duration-300">
                                                <span className="sr-only">{translate("approve")}</span>
                                                <CheckCircleIcon className="w-6 h-6" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                                ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">{translate("noPendingApplications")}</p>
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
