"use client";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

interface OutreachStats {
    totalSent: number;
    replies: number;
    meetings: number;
    clients: number;
    byChannel: {
        dms: number;
        emails: number;
        whatsapp: number;
        calls: number;
    };
}

export default function DashboardCharts({ stats }: { stats: OutreachStats }) {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#e2e8f0',
                    font: {
                        family: 'Inter',
                        size: 12
                    }
                }
            }
        }
    };

    const doughnutData = {
        labels: ['DMs', 'Emails', 'Whatsapp', 'Calls'],
        datasets: [
            {
                data: [stats.byChannel.dms, stats.byChannel.emails, stats.byChannel.whatsapp, stats.byChannel.calls],
                backgroundColor: [
                    'rgba(249, 115, 22, 0.8)',   // Neon Orange
                    'rgba(168, 85, 247, 0.8)',   // Neon Purple
                    'rgba(16, 185, 129, 0.8)',   // Emerald
                    'rgba(59, 130, 246, 0.8)'    // Blue
                ],
                borderColor: [
                    'rgba(249, 115, 22, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    const barData = {
        labels: ['DMs', 'Emails', 'Whatsapp', 'Calls'],
        datasets: [
            {
                label: 'Total Sent',
                data: [stats.byChannel.dms, stats.byChannel.emails, stats.byChannel.whatsapp, stats.byChannel.calls],
                backgroundColor: 'rgba(168, 85, 247, 0.8)', // Neon Purple
            },
            {
                label: 'Replies/Lead',
                data: [0, 0, 0, 12], // Dummy mapping according to screenshot
                backgroundColor: 'rgba(249, 115, 22, 0.8)', // Neon Orange
            }
        ],
    };

    const funnelData = {
        labels: ['Sent', 'Replies', 'Meetings', 'Clients'],
        datasets: [
            {
                label: 'Count',
                data: [stats.totalSent, stats.replies, stats.meetings, stats.clients],
                backgroundColor: 'rgba(249, 115, 22, 0.8)', // Neon Orange
                indexAxis: 'y' as const,
            }
        ]
    };

    const barOptions = {
        ...chartOptions,
        scales: {
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
    };

    const funnelOptions = {
        ...chartOptions,
        indexAxis: 'y' as const,
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', height: '350px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}>Total Sent vs. Channel</h3>
                <div style={{ height: '250px' }}>
                    <Doughnut data={doughnutData} options={chartOptions} />
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', height: '350px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}>Total Sent and Replies</h3>
                <div style={{ height: '250px' }}>
                    <Bar data={barData} options={barOptions} />
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', height: '350px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}>Funnel: Sent → Clients</h3>
                <div style={{ height: '250px' }}>
                    <Bar data={funnelData} options={funnelOptions} />
                </div>
            </div>
        </div>
    );
}
