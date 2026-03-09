"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler);

const chartDefaults = {
  plugins: {
    legend: {
      labels: { color: '#6e6e73', font: { family: '-apple-system, BlinkMacSystemFont, Inter', size: 12 }, usePointStyle: true, pointStyleWidth: 8 }
    },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)',
      titleColor: '#1d1d1f',
      bodyColor: '#6e6e73',
      borderColor: 'rgba(0,0,0,0.08)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 10,
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    }
  },
  responsive: true,
  maintainAspectRatio: false,
};

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 1000;
    const step = (timestamp: number, startTime: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame((ts) => step(ts, startTime));
    };
    requestAnimationFrame((ts) => step(ts, ts));
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/outreach').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/team-goals').then(r => r.json()),
    ]).then(([outreach, leadsData, clientsData, goalsData]) => {
      setStats(outreach.aggregate || { totalSent: 0, byChannel: { dms: 0, emails: 0, whatsapp: 0, calls: 0 }, replies: 0, meetings: 0, clients: 0 });
      setLeads(leadsData.data || []);
      setClients(clientsData.data || []);
      setGoals(goalsData.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalSent = stats?.totalSent || 0;
  const replyRate = totalSent > 0 ? ((stats?.replies || 0) / totalSent * 100).toFixed(1) : '0.0';
  const meetingRate = (stats?.replies || 0) > 0 ? ((stats?.meetings || 0) / (stats?.replies || 1) * 100).toFixed(1) : '0.0';
  const closeRate = (stats?.meetings || 0) > 0 ? ((stats?.clients || 0) / (stats?.meetings || 1) * 100).toFixed(1) : '0.0';
  const qualifiedLeads = leads.filter(l => l.leadType === 'Qualified').length;
  const activeClients = clients.filter(c => c.isActive).length;
  const todayGoals = goals.filter(g => {
    const d = new Date(g.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const doughnutData = {
    labels: ['DMs', 'Emails', 'WhatsApp', 'Calls'],
    datasets: [{
      data: [
        stats?.byChannel?.dms || 0,
        stats?.byChannel?.emails || 0,
        stats?.byChannel?.whatsapp || 0,
        stats?.byChannel?.calls || 0,
      ],
      backgroundColor: ['#0071e3', '#30d158', '#ff9500', '#5856d6'],
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const funnelData = {
    labels: ['Sent', 'Replies', 'Meetings', 'Clients'],
    datasets: [{
      label: 'Count',
      data: [totalSent, stats?.replies || 0, stats?.meetings || 0, stats?.clients || 0],
      backgroundColor: ['rgba(0,113,227,0.15)', 'rgba(0,113,227,0.3)', 'rgba(0,113,227,0.55)', 'rgba(0,113,227,0.9)'],
      borderColor: 'rgba(0,113,227,0.8)',
      borderWidth: 0,
      borderRadius: 6,
      indexAxis: 'y' as const,
    }],
  };

  const statCards = [
    { label: 'Total Sent', value: totalSent, icon: '📤', color: 'accent', change: '+12%', changeDir: 'up', sub: 'All channels combined' },
    { label: 'Replies', value: stats?.replies || 0, icon: '💬', color: 'success', change: `${replyRate}% reply rate`, changeDir: 'neutral', sub: 'From all outreach' },
    { label: 'Meetings Booked', value: stats?.meetings || 0, icon: '📅', color: 'warning', change: `${meetingRate}% of replies`, changeDir: 'neutral', sub: 'Calls scheduled' },
    { label: 'Clients Closed', value: stats?.clients || 0, icon: '🤝', color: 'purple', change: `${closeRate}% close rate`, changeDir: 'neutral', sub: 'Paying clients' },
    { label: 'Qualified Leads', value: qualifiedLeads, icon: '⭐', color: 'info', change: `${leads.length} total leads`, changeDir: 'neutral', sub: 'Ready for follow-up' },
    { label: 'Active Clients', value: activeClients, icon: '💼', color: 'success', change: `${clients.length} total onboarded`, changeDir: 'up', sub: 'Current retainers' },
  ];

  const recentLeads = leads.slice(0, 5);
  const upcomingFollowUps = leads
    .filter(l => l.followUpDate && new Date(l.followUpDate) >= new Date())
    .sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime())
    .slice(0, 4);

  const leadTypeSummary = [
    { label: 'Hot lead', count: leads.filter(l => l.leadType === 'Hot lead').length, color: 'danger' },
    { label: 'Qualified', count: leads.filter(l => l.leadType === 'Qualified').length, color: 'success' },
    { label: 'Soft lead', count: leads.filter(l => l.leadType === 'Soft lead' || l.leadType === 'Soft Lead' || l.leadType === 'Pending').length, color: 'info' },
    { label: 'Unqualified Lead', count: leads.filter(l => l.leadType === 'Unqualified Lead' || l.leadType === 'UN-QUALIFIED').length, color: 'neutral' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ height: 36, width: 300, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 20, width: 200 }} />
          </div>
        </div>
        <div className="stats-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card" style={{ height: 130 }}>
              <div className="skeleton" style={{ height: 40, width: 40, borderRadius: 12, marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 16, width: 80, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 32, width: 60 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Here's your outreach overview — MOKSH & Smit</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/outreach">
            <button className="btn btn-secondary">📋 Add Daily Log</button>
          </Link>
          <Link href="/leads">
            <button className="btn btn-primary">+ New Lead</button>
          </Link>
        </div>
      </div>

      {/* Today's Team Check-in */}
      {todayGoals.length > 0 && (
        <div className="card card-p mb-6 animate-in" style={{ background: 'linear-gradient(135deg, rgba(0,113,227,0.04), rgba(88,86,214,0.04))', border: '1px solid rgba(0,113,227,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Today's Team Check-In</h2>
            <span className="badge badge-success">✓ Active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {todayGoals.map(g => (
              <div key={g._id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className={`avatar avatar-sm ${g.user === 'MOKSH' ? 'avatar-gradient-1' : 'avatar-gradient-2'}`}>{g.user[0]}</div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{g.user}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🕐 {g.timeJoinedOffice}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{g.dailyGoals}</p>
                {g.completedGoals && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--success-light)', borderRadius: 8, fontSize: '0.75rem', color: '#1a8240' }}>
                    ✓ {g.completedGoals}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid stagger-children" style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <div key={card.label} className={`stat-card ${card.color}`}>
            <div className={`stat-icon ${card.color}`}>{card.icon}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">
              <AnimatedNumber value={card.value} />
            </div>
            <div className={`stat-change ${card.changeDir}`}>
              {card.changeDir === 'up' ? '↑' : card.changeDir === 'down' ? '↓' : '·'} {card.change}
            </div>
          </div>
        ))}
      </div>

      {/* Channel Performance */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card card-p animate-in" style={{ animationDelay: '0.1s' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 16 }}>Channel Breakdown</h2>
          <div style={{ height: 220 }}>
            <Doughnut data={doughnutData} options={{
              ...chartDefaults,
              plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend, position: 'bottom' as const } }
            }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            {[
              { label: 'DMs', val: stats?.byChannel?.dms || 0, color: '#0071e3' },
              { label: 'Emails', val: stats?.byChannel?.emails || 0, color: '#30d158' },
              { label: 'WhatsApp', val: stats?.byChannel?.whatsapp || 0, color: '#ff9500' },
              { label: 'Calls', val: stats?.byChannel?.calls || 0, color: '#5856d6' },
            ].map(ch => (
              <div key={ch.label} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ch.color }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{ch.label}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{ch.val.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {totalSent > 0 ? ((ch.val / totalSent) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-p animate-in" style={{ animationDelay: '0.2s' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 16 }}>Sales Funnel</h2>
          <div style={{ height: 220 }}>
            <Bar data={funnelData} options={{
              ...chartDefaults,
              indexAxis: 'y',
              scales: {
                x: { ticks: { color: '#6e6e73' }, grid: { color: 'rgba(0,0,0,0.04)' } },
                y: { ticks: { color: '#6e6e73' }, grid: { display: false } }
              },
              plugins: { ...chartDefaults.plugins, legend: { display: false } }
            } as any} />
          </div>
          <hr className="divider" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Reply Rate</div>
              <div style={{ fontWeight: 700, color: replyRate === '0.0' ? 'var(--text-tertiary)' : 'var(--success)' }}>{replyRate}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Close Rate</div>
              <div style={{ fontWeight: 700, color: closeRate === '0.0' ? 'var(--text-tertiary)' : 'var(--accent)' }}>{closeRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Summary + Follow-ups */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card card-p animate-in" style={{ animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Lead Pipeline</h2>
            <Link href="/leads"><span style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 600 }}>View all →</span></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {leadTypeSummary.map(lt => (
              <div key={lt.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', width: 100, flex: 1 }}>{lt.label}</span>
                <div style={{ flex: 2, background: 'var(--bg-secondary)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: leads.length > 0 ? `${(lt.count / leads.length * 100)}%` : '0%',
                    background: lt.color === 'success' ? 'var(--success)' : lt.color === 'info' ? 'var(--accent)' : lt.color === 'danger' ? 'var(--danger)' : 'var(--border-medium)',
                    transition: 'width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{lt.count}</span>
              </div>
            ))}
          </div>
          {recentLeads.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-icon">🎯</div>
              <div className="empty-title">No leads yet</div>
              <Link href="/leads"><button className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>Add First Lead</button></Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentLeads.map(lead => (
                <div key={lead._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                  <div className="avatar avatar-sm avatar-gradient-1">{lead.companyName[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.companyName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lead.prospectName}</div>
                  </div>
                  <span className={`badge badge-${lead.leadType === 'Qualified' ? 'success' : lead.leadType === 'Hot lead' ? 'danger' : lead.leadType === 'Soft lead' ? 'info' : 'neutral'}`}>{lead.leadType}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-p animate-in" style={{ animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Upcoming Follow-ups</h2>
            <Link href="/leads"><span style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 600 }}>View all →</span></Link>
          </div>
          {upcomingFollowUps.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-icon">📅</div>
              <div className="empty-title">No follow-ups scheduled</div>
              <div className="empty-desc">Add follow-up dates to your leads</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingFollowUps.map(lead => {
                const daysUntil = Math.ceil((new Date(lead.followUpDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={lead._id} style={{ padding: '12px 14px', background: daysUntil <= 1 ? 'var(--warning-light)' : 'var(--bg-secondary)', borderRadius: 12, border: `1px solid ${daysUntil <= 1 ? 'rgba(255,149,0,0.3)' : 'transparent'}` }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>{lead.companyName}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{lead.prospectName}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: daysUntil <= 1 ? 'var(--warning)' : daysUntil <= 3 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil}d`}
                      </span>
                    </div>
                    {lead.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>{lead.notes.slice(0, 80)}...</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
