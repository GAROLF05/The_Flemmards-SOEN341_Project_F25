import { CalendarDaysIcon, TicketIcon, UsersIcon, BuildingOfficeIcon, ExclamationTriangleIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { useLanguage } from '../../hooks/useLanguage';
import { adminApi } from '../../api/adminApi';

// --- MOCK DATA ---
// eslint-disable-next-line no-unused-vars
const mockEventsData = [
  { id: 1, organization: 'Evenko', price: 55, capacity: 5000, ticketsIssued: 4500, attendees: 4200 },
  { id: 2, organization: 'Osheaga', price: 75, capacity: 10000, ticketsIssued: 8500, attendees: 8000 },
  { id: 3, organization: 'Startup Montreal', price: 15, capacity: 200, ticketsIssued: 180, attendees: 175 },
  { id: 4, organization: 'Concordia Continuing Education', price: 250, capacity: 50, ticketsIssued: 45, attendees: 40 },
  { id: 5, organization: 'Run Montreal', price: 40, capacity: 2000, ticketsIssued: 1500, attendees: 1400 },
  { id: 6, organization: 'City of Montreal', price: 'Free', capacity: 1000, ticketsIssued: 0, attendees: 800 },
  { id: 7, organization: 'Tech Summit Inc.', price: 499, capacity: 1500, ticketsIssued: 1200, attendees: 1150 },
  { id: 8, organization: 'Cinéma du Parc', price: 12, capacity: 150, ticketsIssued: 140, attendees: 130 },
  { id: 9, organization: 'McGill University', price: 125, capacity: 800, ticketsIssued: 750, attendees: 700 },
  { id: 10, organization: 'MURAL Festival', price: 25, capacity: 30, ticketsIssued: 30, attendees: 28 },
  { id: 11, organization: 'Quebec Hiking Association', price: 'Free', capacity: 100, ticketsIssued: 0, attendees: 85 },
  { id: 12, organization: 'Evenko', price: 'Free', capacity: 3000, ticketsIssued: 0, attendees: 2500 },
  { id: 13, organization: 'Osheaga', price: 45, capacity: 15000, ticketsIssued: 12000, attendees: 11000 },
  { id: 14, organization: 'Concordia University', price: 'Free', capacity: 100, ticketsIssued: 90, attendees: 85 },
  { id: 15, organization: 'Orchestre symphonique de Montréal', price: 80, capacity: 2100, ticketsIssued: 1800, attendees: 1750 },
  { id: 16, organization: 'McGill University', price: 35, capacity: 40, ticketsIssued: 40, attendees: 38 },
  { id: 17, organization: 'The Comedy Nest', price: 20, capacity: 120, ticketsIssued: 110, attendees: 105 },
  { id: 18, organization: 'Allez Up', price: 30, capacity: 20, ticketsIssued: 20, attendees: 18 },
];

// Mock data for the participation trend chart
const participationTrendData = [
    { month: 'january', 'Tickets Issued': 2200, 'Attended': 1900 },
    { month: 'february', 'Tickets Issued': 2500, 'Attended': 2300 },
    { month: 'march', 'Tickets Issued': 2800, 'Attended': 2600 },
    { month: 'april', 'Tickets Issued': 2700, 'Attended': 2400 },
    { month: 'may', 'Tickets Issued': 3200, 'Attended': 2900 },
    { month: 'june', 'Tickets Issued': 4500, 'Attended': 4100 },
    { month: 'july', 'Tickets Issued': 5000, 'Attended': 4700 },
    { month: 'august', 'Tickets Issued': 4800, 'Attended': 4500 },
    { month: 'september', 'Tickets Issued': 5200, 'Attended': 4900 },
    { month: 'october', 'Tickets Issued': 6000, 'Attended': 5600 },
    { month: 'november', 'Tickets Issued': 8500, 'Attended': 8100 },
    { month: 'december', 'Tickets Issued': 9000, 'Attended': 8500 },
];

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center gap-6 transition-colors duration-300">
        <div className={`p-4 rounded-full ${color.bg} ${color.text} transition-colors duration-300`}>
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        </div>
    </div>
);

const TrendChart = ({ data }) => {
    const { translate } = useLanguage();

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{translate("participationTrends")}</h3>
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAttended" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="rgb(156 163 175 / 0.7)" />
                    <YAxis stroke="rgb(156 163 175 / 0.7)" />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(156 163 175 / 0.2)" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }}
                        labelClassName="font-bold text-gray-800"
                    />
                    <Legend />
                    <Area type="monotone" dataKey="Tickets Issued" name={translate("ticketsIssued")} stroke="#4f46e5" fillOpacity={1} fill="url(#colorTickets)" />
                    <Area type="monotone" dataKey="Attended" name={translate("attended")} stroke="#10b981" fillOpacity={1} fill="url(#colorAttended)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
};

export default function AdminDashboard() {
    const { translate } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await adminApi.getDashboardStats();
                setStats(response.stats);
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setError('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600 dark:text-red-400">{error || 'Failed to load statistics'}</div>
            </div>
        );
    }

    const chartData = participationTrendData.map(x => ({
        ...x,
        month: translate(x.month)
    }));

    return (
        <>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{translate("Dashboard")}</h1>

            {/* Pending Moderation - Priority Section */}
            {stats.moderation.totalPending > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-200">
                            {stats.moderation.totalPending} {translate("Pending Approvals") || "Pending Approvals"}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.moderation.pendingOrganizations > 0 && (
                            <div className="text-sm text-yellow-800 dark:text-yellow-300">
                                <strong>{stats.moderation.pendingOrganizations}</strong> {translate("Organizations") || "Organizations"} {translate("awaitingApproval") || "awaiting approval"}
                            </div>
                        )}
                        {stats.moderation.pendingEvents > 0 && (
                            <div className="text-sm text-yellow-800 dark:text-yellow-300">
                                <strong>{stats.moderation.pendingEvents}</strong> {translate("Events") || "Events"} {translate("Awaiting Moderation") || "Awaiting Moderation"}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title={translate("Total Events") || "Total Events"}
                    value={stats.events.total}
                    icon={<CalendarDaysIcon className="w-6 h-6"/>}
                    color={{ bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-600 dark:text-blue-400" }}
                />
                <StatCard
                    title={translate("Total Users") || "Total Users"}
                    value={stats.users.total}
                    icon={<UsersIcon className="w-6 h-6"/>}
                    color={{ bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-600 dark:text-purple-400" }}
                />
                <StatCard
                    title={translate("Total Registrations") || "Total Registrations"}
                    value={stats.registrations.total}
                    icon={<TicketIcon className="w-6 h-6"/>}
                    color={{ bg: "bg-indigo-100 dark:bg-indigo-900", text: "text-indigo-600 dark:text-indigo-400" }}
                />
                <StatCard
                    title={translate("Total Organizations") || "Total Organizations"}
                    value={stats.organizations.total}
                    icon={<BuildingOfficeIcon className="w-6 h-6"/>}
                    color={{ bg: "bg-teal-100 dark:bg-teal-900", text: "text-teal-600 dark:text-teal-400" }}
                />
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title={translate("Upcoming Events") || "Upcoming Events"}
                    value={stats.events.upcoming}
                    icon={<ClockIcon className="w-6 h-6"/>}
                    color={{ bg: "bg-green-100 dark:bg-green-900", text: "text-green-600 dark:text-green-400" }}
                />
                <StatCard
                    title={translate("Waitlisted Registrations") || "Waitlisted Registrations"}
                    value={stats.registrations.waitlisted}
                    icon={<UsersIcon className="w-6 h-6"/>}
                    color={{ bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-600 dark:text-orange-400" }}
                />
                <StatCard
                    title={translate("Capacity Utilization") || "Capacity Utilization"}
                    value={`${stats.engagement.avgCapacityUtilization} %`}
                    icon={<ChartBarIcon className="w-6 h-6"/>}
                    color={{ bg: "bg-cyan-100 dark:bg-cyan-900", text: "text-cyan-600 dark:text-cyan-400" }}
                />
                <StatCard
                    title={translate("Recent Signups (7d)") || "Recent Signups (7d)"}
                    value={stats.users.recent}
                    icon={<UsersIcon className="w-6 h-6"/>}
                    color={{ bg: "bg-pink-100 dark:bg-pink-900", text: "text-pink-600 dark:text-pink-400" }}
                />
            </div>

            {/* User Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {translate("User Breakdown") || "User Breakdown"}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">{translate("Students") || "Students"}</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.users.students}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">{translate("Organizers") || "Organizers"}</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.users.organizers}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {translate("Event Status") || "Event Status"}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">{translate("Completed") || "Completed"}</span>
                            <span className="text-xl font-bold text-green-600 dark:text-green-400">{stats.events.completed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">{translate("Cancelled") || "Cancelled"}</span>
                            <span className="text-xl font-bold text-red-600 dark:text-red-400">{stats.events.cancelled}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <TrendChart data={chartData} />
        </>
    );
}
