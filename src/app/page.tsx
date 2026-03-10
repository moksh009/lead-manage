"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Title, Filler,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler);

const chartDefaults = {
  plugins: {
    legend: { labels: { color: '#6b7280', font: { family: 'inherit', size: 12 }, usePointStyle: true, pointStyleWidth: 8 } },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)',
      titleColor: '#111110', bodyColor: '#6b7280',
      borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1,
      padding: 12, cornerRadius: 10,
    }
  },
  responsive: true, maintainAspectRatio: false,
};

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0; const end = value;
    if (start === end) return;
    const step = (ts: number, startTime: number) => {
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame((t) => step(t, startTime));
    };
    requestAnimationFrame((t) => step(t, t));
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// Color palettes per status type
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Hot lead': { bg: '#fef2f2', text: '#dc2626', border: 'rgba(220,38,38,0.2)' },
  'Qualified': { bg: '#f0fdf4', text: '#16a34a', border: 'rgba(22,163,74,0.2)' },
  'Soft lead': { bg: '#eff6ff', text: '#2563eb', border: 'rgba(37,99,235,0.2)' },
  'Unqualified Lead': { bg: '#fafafa', text: '#6b7280', border: 'rgba(107,114,128,0.2)' },
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [outreachStats, setOutreachStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/outreach').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/team-goals').then(r => r.json()),
    ]).then(([outreach, leadsData, clientsData, goalsData]) => {
      setOutreachStats(outreach.aggregate || null);
      setLeads(leadsData.data || []);
      setClients(clientsData.data || []);
      setGoals(goalsData.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Lead-derived KPIs (real data from pipeline stages) ──────────────────
  function getStage(lead: any) {
    if (lead.pipelineStage) return lead.pipelineStage.toLowerCase();
    if (lead.leadType === 'Unqualified Lead') return 'not interested';
    if (lead.leadType === 'Soft lead') return 'follow-up scheduled';
    if (lead.leadType === 'Qualified') return 'upcoming call';
    if (lead.leadType === 'Hot lead') return 'interested';
    return 'contacted';
  }

  // Meetings = leads with meeting booked / meeting booked not convert stages
  const MEETING_STAGES = ['meeting booked', 'meeting booked not convert', 'meeting'];
  const CLOSED_STAGES = ['closed won', 'closed', 'client'];

  const totalLeads = leads.length;
  const meetingLeads = leads.filter(l => MEETING_STAGES.some(s => getStage(l).includes(s)));
  const closedLeads = leads.filter(l => CLOSED_STAGES.some(s => getStage(l).includes(s)));
  const ghostedLeads = leads.filter(l => getStage(l) === 'ghosted');
  const notConvertedMeetingLeads = leads.filter(l => getStage(l) === 'meeting booked not convert');
  const hotQualified = leads.filter(l => l.leadType === 'Hot lead' || l.leadType === 'Qualified');
  const activeClients = clients.filter(c => c.isActive);

  // Channel breakdown from leads
  const byChannel = {
    dms: leads.filter(l => l.channel === 'instagram_dm' || l.channel === 'instagram' || l.channel === 'dm').length,
    emails: leads.filter(l => l.channel === 'email').length,
    whatsapp: leads.filter(l => l.channel === 'whatsapp').length,
    calls: leads.filter(l => l.channel === 'cold_call' || l.channel === 'call').length,
  };

  // Rates derived from leads
  const meetingRate = totalLeads > 0 ? (meetingLeads.length / totalLeads * 100).toFixed(1) : '0';
  const closeRate = totalLeads > 0 ? (closedLeads.length / totalLeads * 100).toFixed(1) : '0';
  const ghostRate = totalLeads > 0 ? ((ghostedLeads.length + leads.filter(l => getStage(l) === 'no show up').length) / totalLeads * 100).toFixed(1) : '0';

  // Also keep totalSent from outreach logs for outreach-sent KPI only
  const totalSent = outreachStats?.totalSent || 0;
  const sentByChannel = outreachStats?.byChannel || { dms: 0, emails: 0, whatsapp: 0, calls: 0 };

  const todayGoals = goals.filter(g => {
    const d = new Date(g.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const doughnutData = {
    labels: ['Total Leads', 'Meetings', 'Closed Won', 'Ghosted', 'No Show Up', 'Meeting Details (Not Converted)'],
    datasets: [{
      data: [totalLeads, meetingLeads.length, closedLeads.length, ghostedLeads.length, leads.filter(l => getStage(l) === 'no show up').length, notConvertedMeetingLeads.length],
      backgroundColor: ['#2563eb', '#10b981', '#16a34a', '#6b7280', '#ff3b30', '#f97316'],
      borderColor: '#ffffff', borderWidth: 3, hoverOffset: 8,
    }],
  };

  const funnelData = {
    labels: ['All Leads', 'Meetings Booked', 'Closed Won', 'Ghosted', 'No Show Up', 'Not Converted'],
    datasets: [{
      label: 'Leads',
      data: [totalLeads, meetingLeads.length, closedLeads.length, ghostedLeads.length, leads.filter(l => getStage(l) === 'no show up').length, notConvertedMeetingLeads.length],
      backgroundColor: ['rgba(37,99,235,0.18)', 'rgba(16,185,129,0.45)', 'rgba(22,163,74,0.85)', 'rgba(107,114,128,0.5)', 'rgba(255,59,48,0.5)', 'rgba(249,115,22,0.4)'],
      borderRadius: 7, indexAxis: 'y' as const,
    }],
  };

  const statCards = [
    { label: 'Outreach Sent', value: totalSent, icon: '📤', color: '#8b5cf6', bg: '#f3e8ff', change: 'All channels combined', dir: 'neutral' },
    { label: 'Total Leads', value: totalLeads, icon: '🎯', color: '#2563eb', bg: '#eff6ff', change: 'Total leads captured', dir: 'neutral' },
    { label: 'Meetings Booked', value: meetingLeads.length, icon: '📅', color: '#10b981', bg: '#f0fdf9', change: `${meetingRate}% of leads`, dir: 'neutral' },
    { label: 'Closed Won', value: closedLeads.length, icon: '🤝', color: '#16a34a', bg: '#f0fdf4', change: `${closeRate}% close rate`, dir: 'neutral' },
    { label: 'Hot + Qualified', value: hotQualified.length, icon: '🔥', color: '#d97706', bg: '#fffbeb', change: `${leads.filter(l => l.leadType === 'Hot lead').length} hot leads`, dir: 'neutral' },
    { label: 'Ghosted', value: ghostedLeads.length, icon: '👻', color: '#6b7280', bg: '#f9fafb', change: `${ghostRate}% ghost rate`, dir: 'neutral' },
    { label: 'Active Clients', value: activeClients.length, icon: '💼', color: '#7c3aed', bg: '#faf5ff', change: `${clients.length} total onboarded`, dir: 'up' },
  ];

  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);
  const upcomingFollowUps = leads
    .filter(l => l.followUpDate && new Date(l.followUpDate) >= new Date())
    .sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 140, borderRadius: 16, marginBottom: 4 }} />
        <div className="stats-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card" style={{ height: 120 }}>
              <div className="skeleton" style={{ height: 40, width: 40, borderRadius: 12, marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 30, width: 60 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* HERO BANNER */}
      <div className="page-hero" style={{ marginBottom: 28 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🚀</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: 99, backdropFilter: 'blur(8px)' }}>
              Live Dashboard
            </span>
          </div>
          <h1 className="page-hero-title">Dashboard</h1>
          <p className="page-hero-sub">Here's your outreach overview — MOKSH & Smit</p>
          <div className="page-hero-actions">
            <Link href="/outreach">
              <button className="btn-hero">📋 Add Daily Log</button>
            </Link>
            <Link href="/leads">
              <button className="btn-hero btn-hero-primary">+ New Lead</button>
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Team Check-In */}
      {todayGoals.length > 0 && (
        <div className="card card-accent card-p animate-in" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>👥 Today's Team Check-In</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>Monday, March 9</p>
            </div>
            <span className="badge badge-success" style={{ fontWeight: 600 }}>✓ Active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {todayGoals.map(g => (
              <div key={g._id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', transition: 'transform var(--t-fast)' }} className="card-hover">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className={`avatar avatar-sm ${g.user === 'MOKSH' ? 'avatar-gradient-1' : 'avatar-gradient-2'}`}>{g.user[0]}</div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{g.user}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 99 }}>🕐 {g.timeJoinedOffice}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{g.dailyGoals}</p>
                {g.completedGoals && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--success-light)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                    ✓ {g.completedGoals}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid stagger-children" style={{ marginBottom: 28 }}>
        {statCards.map((card) => (
          <div key={card.label} className="stat-card card-hover" style={{ cursor: 'default' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: card.bg, border: `1.5px solid ${card.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, marginBottom: 14
            }}>{card.icon}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.color }}>
              <AnimatedNumber value={card.value} />
            </div>
            <div className="stat-change neutral" style={{ marginTop: 5 }}>
              {card.dir === 'up' ? '↑ ' : '· '}{card.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Channel Donut */}
        <div className="card card-p animate-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Channel Breakdown</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{totalSent.toLocaleString()} total messages sent</p>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <Doughnut data={doughnutData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend, position: 'bottom' as const } } }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
            {[
              { label: 'Instagram DMs', sent: sentByChannel?.dms || 0, replies: byChannel?.dms || 0, color: '#e1306c' },
              { label: 'Emails', sent: sentByChannel?.emails || 0, replies: byChannel?.emails || 0, color: '#2563eb' },
              { label: 'WhatsApp', sent: sentByChannel?.whatsapp || 0, replies: byChannel?.whatsapp || 0, color: '#25D366' },
              { label: 'Cold Calls', sent: sentByChannel?.calls || 0, replies: byChannel?.calls || 0, color: '#7c3aed' },
            ].map(ch => {
              const replyRate = ch.sent > 0 ? ((ch.replies / ch.sent) * 100).toFixed(1) : '0.0';
              return (
                <div key={ch.label} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', transition: 'background var(--t-fast)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: ch.color }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{ch.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, textAlign: 'center' }}>
                    <div>
                      <div className="form-label-premium" style={{ marginBottom: 0 }}>sent</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{ch.sent.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="form-label-premium" style={{ marginBottom: 0 }}>replies</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--success)' }}>{ch.replies.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="form-label-premium" style={{ marginBottom: 0 }}>rate</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: replyRate !== '0.0' ? 'var(--accent)' : 'var(--text-tertiary)' }}>{replyRate}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Funnel */}
        <div className="card card-p animate-in" style={{ animationDelay: '0.15s' }}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Sales Funnel</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Outreach → Conversion breakdown</p>
          </div>
          <div style={{ height: 200 }}>
            <Bar data={funnelData} options={{
              ...chartDefaults, indexAxis: 'y',
              scales: {
                x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(0,0,0,0.04)' } },
                y: { ticks: { color: '#9ca3af' }, grid: { display: false } }
              },
              plugins: { ...chartDefaults.plugins, legend: { display: false } }
            } as any} />
          </div>
          <hr className="divider" style={{ margin: '14px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Meeting Rate', val: `${meetingRate}%`, color: meetingRate === '0' ? 'var(--text-tertiary)' : 'var(--success)' },
              { label: 'Close Rate', val: `${closeRate}%`, color: closeRate === '0' ? 'var(--text-tertiary)' : 'var(--accent)' },
              { label: 'Ghost Rate', val: `${ghostRate}%`, color: ghostRate === '0' ? 'var(--text-tertiary)' : '#6b7280' },
            ].map(r => (
              <div key={r.label} style={{ textAlign: 'center', padding: '12px 4px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: r.color }}>{r.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads + Follow-Ups */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Recent Leads */}
        <div className="card animate-in" style={{ animationDelay: '0.2s' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>🎯 Lead Pipeline</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{leads.length} total leads</p>
            </div>
            <Link href="/leads"><span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>View all →</span></Link>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Lead type summary bars */}
            {[
              { label: 'Hot lead 🔥', count: leads.filter(l => l.leadType === 'Hot lead').length, color: '#dc2626' },
              { label: 'Qualified ✅', count: leads.filter(l => l.leadType === 'Qualified').length, color: '#16a34a' },
              { label: 'Soft lead', count: leads.filter(l => l.leadType === 'Soft lead').length, color: '#2563eb' },
              { label: 'Unqualified', count: leads.filter(l => l.leadType === 'Unqualified Lead').length, color: '#9ca3af' },
            ].map(lt => (
              <div key={lt.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', minWidth: 100 }}>{lt.label}</span>
                <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: leads.length > 0 ? `${(lt.count / leads.length * 100)}%` : '0%', background: lt.color, transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, minWidth: 24, textAlign: 'right', color: lt.color }}>{lt.count}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentLeads.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-icon">🎯</div>
                <div className="empty-title">No leads yet</div>
                <Link href="/leads"><button className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>Add First Lead</button></Link>
              </div>
            ) : recentLeads.map(lead => {
              const sc = STATUS_COLORS[lead.leadType] || { bg: '#f9fafb', text: '#6b7280', border: 'rgba(0,0,0,0.1)' };
              return (
                <div key={lead._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', transition: 'transform var(--t-fast)', cursor: 'pointer' }} className="card-hover">
                  <div className="avatar avatar-sm avatar-gradient-1" style={{ flexShrink: 0 }}>{(lead.companyName || '?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.companyName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lead.prospectName}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap' }}>{lead.leadType}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card animate-in" style={{ animationDelay: '0.25s' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>📅 Upcoming Follow-ups</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{upcomingFollowUps.length} scheduled</p>
            </div>
            <Link href="/leads"><span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>View all →</span></Link>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingFollowUps.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-icon">📅</div>
                <div className="empty-title">No follow-ups scheduled</div>
                <div className="empty-desc">Add follow-up dates to your leads</div>
              </div>
            ) : upcomingFollowUps.map(lead => {
              const daysUntil = Math.ceil((new Date(lead.followUpDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntil <= 1;
              const isNear = daysUntil <= 3;
              return (
                <div key={lead._id} style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-xl)', border: '1px solid',
                  background: isUrgent ? '#fffbeb' : 'var(--bg-secondary)',
                  borderColor: isUrgent ? 'rgba(217,119,6,0.25)' : 'var(--border)',
                  transition: 'transform var(--t-fast)', cursor: 'pointer'
                }} className="card-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{lead.companyName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{lead.prospectName}</div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                      background: isUrgent ? '#fffbeb' : isNear ? '#fef2f2' : 'var(--bg-tertiary)',
                      color: isUrgent ? 'var(--warning)' : isNear ? 'var(--danger)' : 'var(--text-secondary)',
                      border: `1px solid ${isUrgent ? 'rgba(217,119,6,0.3)' : isNear ? 'rgba(220,38,38,0.2)' : 'var(--border)'}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {daysUntil === 0 ? '🔥 Today!' : daysUntil === 1 ? '⚡ Tomorrow' : `📆 in ${daysUntil}d`}
                    </span>
                  </div>
                  {lead.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>{lead.notes.slice(0, 80)}{lead.notes.length > 80 ? '…' : ''}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
