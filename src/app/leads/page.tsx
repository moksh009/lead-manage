"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';

type LeadType = 'Unqualified Lead' | 'Soft lead' | 'Qualified' | 'Hot lead';
type Channel = 'dm' | 'email' | 'whatsapp' | 'call';

const LEAD_TYPES: LeadType[] = ['Unqualified Lead', 'Soft lead', 'Qualified', 'Hot lead'];

const LEAD_TYPE_OPTIONS = LEAD_TYPES.map(t => ({ value: t, label: t }));
const PIPELINE_STAGE_OPTIONS = [
    { label: 'To-do', options: [{ value: 'contacted', label: 'Contacted' }] },
    {
        label: 'In progress', options: [
            { value: 'waiting for resp.', label: 'Waiting for resp.' },
            { value: 'follow-up scheduled', label: 'Follow-up Scheduled' },
            { value: 'interested', label: 'Interested' },
            { value: 'meeting booked', label: 'Meeting Booked' }
        ]
    },
    {
        label: 'Complete / Dead', options: [
            { value: 'ghosted', label: 'Ghosted' },
            { value: 'meeting booked not convert', label: 'Meeting Booked Not Convert' },
            { value: 'not interested', label: 'Not Interested' },
            { value: 'no show up', label: 'No Show Up' }
        ]
    },
    {
        label: 'Legacy', options: [
            { value: 'new', label: 'New' },
            { value: 'followup', label: 'Follow-up' },
            { value: 'meeting', label: 'Meeting Set' },
            { value: 'proposal', label: 'Proposal Sent' },
            { value: 'closed', label: 'Client 🎉' }
        ]
    }
];

const CHANNELS: { key: Channel; label: string; icon: string; color: string }[] = [
    { key: 'dm', label: 'Instagram DM', icon: '📸', color: '#E1306C' },
    { key: 'email', label: 'Email', icon: '📧', color: '#0071e3' },
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366' },
    { key: 'call', label: 'Cold Call', icon: '📞', color: '#5856d6' },
];

const InlineEditableInput = ({ value, type = "text", placeholder, field, leadId, onSuccess }: any) => {
    return (
        <input
            type={type}
            defaultValue={value}
            onBlur={e => {
                const newVal = e.target.value;
                if (newVal !== value) {
                    fetch(`/api/leads/${leadId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ [field]: newVal })
                    });
                    if (onSuccess) onSuccess(newVal);
                }
            }}
            onClick={e => e.stopPropagation()}
            placeholder={placeholder}
            style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid transparent',
                fontSize: 'inherit',
                color: 'inherit',
                fontWeight: 'inherit',
                padding: '2px 4px',
                borderRadius: 4,
                outline: 'none',
                transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(0,0,0,0.08)'; e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'transparent'; }}
            onFocus={e => {
                e.currentTarget.style.border = '1px solid var(--accent)';
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-light)';
            }}
            onBlurCapture={e => {
                e.currentTarget.style.border = '1px solid transparent';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
            }}
        />
    )
};

const CustomBadgeSelect = ({ value, options, onChange, style }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getLabel = (val: string) => {
        for (const opt of options) {
            if (opt.options) {
                const found = opt.options.find((o: any) => o.value === val);
                if (found) return found.label;
            } else if (opt.value === val) {
                return opt.label;
            }
        }
        return val;
    };

    return (
        <div ref={dropdownRef} style={{ ...style, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div
                className="notion-select"
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', paddingRight: 6 }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {getLabel(value)}
                </span>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ marginLeft: 6, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M4 5L0 1L1 0L4 3L7 0L8 1L4 5Z" fill="currentColor" opacity="0.6" />
                </svg>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    minWidth: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    zIndex: 9999,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 250,
                    overflowY: 'auto'
                }}>
                    {options.map((opt: any, i: number) => {
                        const isGroup = opt.options !== undefined;
                        if (isGroup) {
                            return (
                                <div key={i}>
                                    <div style={{ padding: '6px 8px 4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                                        {opt.label}
                                    </div>
                                    {opt.options.map((subOpt: any) => (
                                        <div
                                            key={subOpt.value}
                                            onClick={() => { onChange(subOpt.value); setIsOpen(false); }}
                                            style={{
                                                padding: '6px 8px',
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer',
                                                borderRadius: 4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: value === subOpt.value ? 'var(--surface-hover)' : 'transparent',
                                                color: value === subOpt.value ? 'var(--text-primary)' : 'var(--text-secondary)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                                            onMouseLeave={e => e.currentTarget.style.background = value === subOpt.value ? 'var(--surface-hover)' : 'transparent'}
                                        >
                                            <span style={{ whiteSpace: 'nowrap' }}>{subOpt.label}</span>
                                            {value === subOpt.value && <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', marginLeft: 8 }}>✓</span>}
                                        </div>
                                    ))}
                                </div>
                            );
                        }

                        return (
                            <div
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                style={{
                                    padding: '6px 8px',
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: value === opt.value ? 'var(--surface-hover)' : 'transparent',
                                    color: value === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? 'var(--surface-hover)' : 'transparent'}
                            >
                                <span style={{ whiteSpace: 'nowrap' }}>{opt.label}</span>
                                {value === opt.value && <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', marginLeft: 8 }}>✓</span>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
    'not interested': { color: '#ff3b30', bg: 'rgba(255,59,48,0.1)', emoji: '🔴' },
    'closed won': { color: '#30d158', bg: 'rgba(48,209,88,0.1)', emoji: '🟢' },
    'closed lost': { color: '#8e8e93', bg: 'rgba(142,142,147,0.1)', emoji: '🟤' },
    'contacted': { color: '#007aff', bg: 'rgba(0,122,255,0.1)', emoji: '🔵' },
    'waiting for resp.': { color: '#a2845e', bg: 'rgba(162,132,94,0.1)', emoji: '🟤' },
    'follow-up scheduled': { color: '#af52de', bg: 'rgba(175,82,222,0.1)', emoji: '🟣' },
    'interested': { color: '#d4af37', bg: 'rgba(212,175,55,0.1)', emoji: '🟡' },
    'meeting booked': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', emoji: '📅' },
    'meeting booked not convert': { color: '#f97316', bg: 'rgba(249,115,22,0.1)', emoji: '⚠️' },
    'ghosted': { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', emoji: '👻' },

    // Legacy / Fallbacks
    'new': { color: '#8e8e93', bg: 'rgba(142,142,147,0.1)', emoji: '🆕' },
    'followup': { color: '#ff9500', bg: 'rgba(255,149,0,0.1)', emoji: '🔄' },
    'meeting': { color: '#5856d6', bg: 'rgba(88,86,214,0.1)', emoji: '📅' },
    'proposal': { color: '#ff2d55', bg: 'rgba(255,45,85,0.1)', emoji: '📋' },
    'closed': { color: '#30d158', bg: 'rgba(48,209,88,0.1)', emoji: '🤝' },
    'Qualified': { color: '#30d158', bg: 'rgba(48,209,88,0.1)', emoji: '🟢' },
    'Hot lead': { color: '#ff2d55', bg: 'rgba(255,45,85,0.1)', emoji: '🔥' },
    'Soft lead': { color: '#007aff', bg: 'rgba(0,122,255,0.1)', emoji: '🔵' },
    'Unqualified Lead': { color: '#ff3b30', bg: 'rgba(255,59,48,0.1)', emoji: '🔴' },
};


export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [filterType, setFilterType] = useState('All');
    const [filterChannel, setFilterChannel] = useState<'all' | Channel>('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [activeTab, setActiveTab] = useState<'table' | 'followups'>('table');
    const [saving, setSaving] = useState(false);

    // Edit mode state for existing leads
    const [isEditingExisting, setIsEditingExisting] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);

    // Inline Add state
    const [isInlineAdding, setIsInlineAdding] = useState(false);
    const [inlineForm, setInlineForm] = useState({
        companyName: '',
        prospectName: '',
        phoneNumber: '',
        link: '',
        leadType: 'Soft lead' as LeadType,
        channel: 'dm' as Channel,
        leadDate: new Date().toISOString().split('T')[0],
        followUpDate: '',
        notes: '',
    });

    const [form, setForm] = useState({
        companyName: '',
        prospectName: '',
        phoneNumber: '',
        link: '',
        leadType: 'Soft lead' as LeadType,
        channel: 'call' as Channel,
        leadDate: new Date().toISOString().split('T')[0],
        followUpDate: '',
        notes: '',
    });

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/leads');
            const json = await res.json();
            if (json.success) setLeads(json.data);
        } catch (e) {
            console.error("Failed to fetch leads", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeads(); }, []);

    const filtered = useMemo(() => {
        let list = [...leads];
        if (filterType !== 'All') list = list.filter(l => l.leadType === filterType);
        if (filterChannel !== 'all') list = list.filter(l => l.channel === filterChannel);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(l =>
                l.companyName?.toLowerCase().includes(q) ||
                l.prospectName?.toLowerCase().includes(q) ||
                l.phoneNumber?.includes(q) ||
                l.notes?.toLowerCase().includes(q)
            );
        }
        if (sortBy === 'company') list.sort((a, b) => a.companyName.localeCompare(b.companyName));
        else if (sortBy === 'followUp') list.sort((a, b) => {
            if (!a.followUpDate) return 1;
            if (!b.followUpDate) return -1;
            return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
        });
        else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
    }, [leads, filterType, filterChannel, search, sortBy]);

    const followUps = useMemo(() =>
        leads.filter(l => l.followUpDate).sort((a, b) =>
            new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
        ), [leads]
    );

    const handleSubmit = async () => {
        if (!form.companyName.trim()) return;
        setSaving(true);
        try {
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    leadDate: form.leadDate ? new Date(form.leadDate) : new Date(),
                    followUpDate: form.followUpDate ? new Date(form.followUpDate) : undefined
                })
            });
            setShowModal(false);
            setForm({ companyName: '', prospectName: '', phoneNumber: '', link: '', leadType: 'Soft lead', channel: 'call', leadDate: new Date().toISOString().split('T')[0], followUpDate: '', notes: '' });
            fetchLeads();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: LeadType) => {
        await fetch(`/api/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadType: status })
        });
        fetchLeads();
        if (selectedLead?._id === id) setSelectedLead({ ...selectedLead, leadType: status });
    };

    const handleSaveExistingLead = async () => {
        if (!editForm || !editForm.companyName.trim()) return;
        setSaving(true);
        try {
            await fetch(`/api/leads/${editForm._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            fetchLeads();
            setSelectedLead(editForm);
            setIsEditingExisting(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveInlineAdd = async () => {
        if (!inlineForm.companyName.trim()) return;
        setSaving(true);
        try {
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...inlineForm,
                    leadDate: inlineForm.leadDate ? new Date(inlineForm.leadDate) : new Date(),
                    followUpDate: inlineForm.followUpDate ? new Date(inlineForm.followUpDate) : undefined
                })
            });
            setIsInlineAdding(false);
            setInlineForm({ companyName: '', prospectName: '', phoneNumber: '', link: '', leadType: 'Soft lead', channel: 'dm', leadDate: new Date().toISOString().split('T')[0], followUpDate: '', notes: '' });
            fetchLeads();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePipelineStage = async (id: string, stage: string) => {
        await fetch(`/api/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pipelineStage: stage })
        });
        fetchLeads();
        if (selectedLead?._id === id) setSelectedLead({ ...selectedLead, pipelineStage: stage });
    };

    const handleDeleteLead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this lead? This cannot be undone.')) return;
        try {
            await fetch(`/api/leads/${id}`, { method: 'DELETE' });
            setLeads(leads.filter(l => l._id !== id));
            if (selectedLead?._id === id) setShowModal(false);
        } catch (err) {
            console.error('Failed to delete lead', err);
        }
    };

    const counts = {
        All: leads.length,
        'Qualified': leads.filter(l => l.leadType === 'Qualified').length,
        'Soft lead': leads.filter(l => l.leadType === 'Soft lead' || l.leadType === 'Soft Lead' || l.leadType === 'Pending').length,
        'Unqualified Lead': leads.filter(l => l.leadType === 'Unqualified Lead' || l.leadType === 'UN-QUALIFIED').length,
        'Hot lead': leads.filter(l => l.leadType === 'Hot lead').length,
    };

    return (
        <div className="animate-in relative">
            <style>{`
                .glass-overlay {
                    position: fixed;
                    inset: 0;
                    background: transparent; /* Pure transparent for un-darkened blur */
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 16px;
                }
                .glass-modal {
                    background: var(--surface, #ffffff);
                    border: 1px solid var(--border, #eaeaea);
                    border-radius: 20px;
                    width: 100%;
                    max-width: 650px;
                    max-height: calc(100vh - 40px); /* Strictly limits height to viewport */
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                }
                .glass-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border, #eaeaea);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    background: var(--surface, #ffffff);
                    flex-shrink: 0; /* Prevents header from collapsing */
                }
                .glass-modal-body {
                    padding: 24px;
                    overflow-y: auto; /* Enables internal scrolling */
                    flex: 1 1 auto;
                    min-height: 0; /* Crucial fix for flexbox scrolling */
                    max-height: 50vh; /* Better viewport constraint for smaller screens */
                }
                .glass-modal-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--border, #eaeaea);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    background: var(--bg-secondary, #fafafa);
                    flex-shrink: 0; /* Prevents footer from collapsing */
                }
                .notion-row {
                    display: grid;
                    grid-template-columns: 220px 1fr;
                    border-bottom: 1px solid var(--border, #eaeaea);
                    min-height: 52px;
                    transition: background 0.15s;
                }
                .notion-row:last-child { border-bottom: none; }
                .notion-row:hover { background: var(--bg-secondary, #f9f9f9); }
                .notion-label {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    background: var(--bg-secondary, #fafafa);
                    border-right: 1px solid var(--border, #eaeaea);
                }
                .notion-input-wrap {
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .notion-input {
                    width: 100%;
                    border: none;
                    background: transparent;
                    padding: 8px 4px;
                    font-size: 0.95rem;
                    color: var(--text-primary);
                    outline: none;
                    font-family: inherit;
                }
                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                @media (max-width: 640px) {
                    .glass-modal {
                        max-height: calc(100vh - 24px);
                    }
                    .glass-modal-body {
                        padding: 16px;
                    }
                    .notion-row {
                        grid-template-columns: 1fr;
                        border-bottom: 4px solid var(--bg-secondary, #f0f0f0);
                    }
                    .notion-label {
                        border-right: none;
                        border-bottom: 1px solid var(--border, #eaeaea);
                        padding: 12px 16px;
                        min-height: auto !important;
                    }
                    .notion-input-wrap { padding: 12px 16px; }
                    .detail-grid { grid-template-columns: 1fr; }
                }
                .horizontal-scroll-container {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    padding-bottom: 8px; /* Room for scrollbar */
                }
                .data-table {
                    min-width: 1100px; /* Force table to be wider for scrolling */
                }
            `}</style>

            {/* Premium hero */}
            <div className="page-hero" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.875rem' }}>🎯</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: 99, backdropFilter: 'blur(8px)' }}>
                            {leads.length} Leads · {counts.Qualified} Qualified
                        </span>
                    </div>
                    <h1 className="page-hero-title">Leads</h1>
                    <p className="page-hero-sub">{leads.length} leads · {counts.Qualified} qualified · {followUps.length} with follow-ups</p>
                    <div className="page-hero-actions">
                        <button className="btn-hero btn-hero-primary" onClick={() => setShowModal(true)}>+ New Lead</button>
                    </div>
                </div>
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {(['All', ...LEAD_TYPES] as string[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s ease', background: filterType === t ? 'var(--accent)' : 'var(--surface)', color: filterType === t ? 'white' : 'var(--text-secondary)', borderColor: filterType === t ? 'transparent' : 'var(--border)' }}
                    >
                        {t} <span style={{ opacity: 0.7, marginLeft: 4 }}>({counts[t as keyof typeof counts]})</span>
                    </button>
                ))}
            </div>

            {/* Channel filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Channel:</span>
                <button
                    onClick={() => setFilterChannel('all')}
                    style={{ padding: '5px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', background: filterChannel === 'all' ? 'var(--text-primary)' : 'var(--surface)', color: filterChannel === 'all' ? 'white' : 'var(--text-secondary)', borderColor: filterChannel === 'all' ? 'transparent' : 'var(--border)' }}
                >
                    All ({leads.length})
                </button>
                {CHANNELS.map(ch => {
                    const count = leads.filter(l => l.channel === ch.key).length;
                    const active = filterChannel === ch.key;
                    return (
                        <button
                            key={ch.key}
                            onClick={() => setFilterChannel(active ? 'all' : ch.key)}
                            style={{ padding: '5px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: active ? ch.color : `${ch.color}15`, color: active ? 'white' : ch.color, boxShadow: active ? `0 2px 8px ${ch.color}40` : 'none' }}
                        >
                            {ch.icon} {ch.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* View Tabs */}
            <div className="tab-bar">
                <div className={`tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>📋 All Leads</div>
                <div className={`tab ${activeTab === 'followups' ? 'active' : ''}`} onClick={() => setActiveTab('followups')}>📅 Follow-ups</div>
            </div>

            {/* Search + Sort */}
            <div className="search-bar">
                <div className="search-input-wrap">
                    <span className="search-icon-inside">🔍</span>
                    <input className="search-input" placeholder="Search company, prospect, notes..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="createdAt">Newest First</option>
                    <option value="company">Company A–Z</option>
                    <option value="followUp">Follow-up Date</option>
                </select>
            </div>

            {activeTab === 'table' && (
                <div className="card table-wrap horizontal-scroll-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Added On</th>
                                <th>Lead Date</th>
                                <th>Company</th>
                                <th>Channel</th>
                                <th>Prospect</th>
                                <th>Lead Type</th>
                                <th>Pipeline Stage</th>
                                <th>Follow-up</th>
                                <th>Phone</th>
                                <th style={{ minWidth: 200 }}>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8}><div className="empty-state">Loading leads...</div></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8}>
                                    <div className="empty-state">
                                        <div className="empty-icon">🎯</div>
                                        <div className="empty-title">No leads found</div>
                                        <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowModal(true)}>Add Lead</button>
                                    </div>
                                </td></tr>
                            ) : filtered.map(lead => {
                                const daysUntil = lead.followUpDate ? Math.ceil((new Date(lead.followUpDate).getTime() - Date.now()) / 86400000) : null;
                                const sc = STATUS_CONFIG[lead.leadType] || STATUS_CONFIG['Pending'];
                                return (
                                    <tr key={lead._id} onClick={() => setSelectedLead(lead)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {format(new Date(lead.createdAt), 'MMM dd, yyyy • h:mm a')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ width: 110 }}>
                                                <InlineEditableInput
                                                    type="date"
                                                    value={lead.leadDate ? new Date(lead.leadDate).toISOString().split('T')[0] : ''}
                                                    field="leadDate"
                                                    leadId={lead._id}
                                                    onSuccess={(val: any) => {
                                                        if (selectedLead?._id === lead._id) setSelectedLead({ ...selectedLead, leadDate: val });
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="avatar avatar-sm avatar-gradient-1">{lead.companyName?.[0] || '?'}</div>
                                                <div style={{ flex: 1, minWidth: 120 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                        <InlineEditableInput
                                                            value={lead.companyName}
                                                            placeholder="Company Name"
                                                            field="companyName"
                                                            leadId={lead._id}
                                                            onSuccess={(val: any) => { if (selectedLead?._id === lead._id) setSelectedLead({ ...selectedLead, companyName: val }) }}
                                                        />
                                                    </div>
                                                    {lead.link && <a href={lead.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.75rem', color: 'var(--accent)', paddingLeft: 6 }}>View ↗</a>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                                {CHANNELS.find(c => c.key === lead.channel)?.icon || ''} {CHANNELS.find(c => c.key === lead.channel)?.label || lead.channel || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ minWidth: 100, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                <InlineEditableInput
                                                    value={lead.prospectName || ''}
                                                    placeholder="Prospect"
                                                    field="prospectName"
                                                    leadId={lead._id}
                                                    onSuccess={(val: any) => { if (selectedLead?._id === lead._id) setSelectedLead({ ...selectedLead, prospectName: val }) }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ width: 130 }}>
                                                <CustomBadgeSelect
                                                    value={lead.leadType}
                                                    options={LEAD_TYPES.includes(lead.leadType as any) ? LEAD_TYPE_OPTIONS : [...LEAD_TYPE_OPTIONS, { value: lead.leadType, label: lead.leadType }]}
                                                    onChange={(val: any) => handleUpdateStatus(lead._id, val as LeadType)}
                                                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40`, boxShadow: 'none' }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ width: 140 }}>
                                                <CustomBadgeSelect
                                                    value={lead.pipelineStage || 'new'}
                                                    options={PIPELINE_STAGE_OPTIONS}
                                                    onChange={(val: any) => handleUpdatePipelineStage(lead._id, val)}
                                                    style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ width: 120 }}>
                                                <InlineEditableInput
                                                    type="date"
                                                    value={lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ''}
                                                    field="followUpDate"
                                                    leadId={lead._id}
                                                    placeholder="Set Add Follow-up"
                                                    onSuccess={(val: any) => { if (selectedLead?._id === lead._id) setSelectedLead({ ...selectedLead, followUpDate: val }) }}
                                                />
                                                {lead.followUpDate && daysUntil !== null && (
                                                    <span style={{ fontSize: '0.75rem', color: daysUntil <= 1 ? 'var(--danger)' : daysUntil <= 3 ? 'var(--warning)' : 'var(--text-tertiary)', fontWeight: daysUntil <= 3 ? 700 : 400, marginLeft: 6 }}>
                                                        {daysUntil === 0 ? '(Today 🔴)' : daysUntil === 1 ? '(Tmrw ⚠️)' : `(${daysUntil}d)`}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ minWidth: 110, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                <InlineEditableInput
                                                    value={lead.phoneNumber || ''}
                                                    placeholder="Phone"
                                                    field="phoneNumber"
                                                    leadId={lead._id}
                                                    onSuccess={(val: any) => { if (selectedLead?._id === lead._id) setSelectedLead({ ...selectedLead, phoneNumber: val }) }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ position: 'relative', width: '100%', minWidth: 200 }}>
                                                <textarea
                                                    defaultValue={lead.notes || ''}
                                                    onBlur={e => {
                                                        const newVal = e.target.value;
                                                        if (newVal !== lead.notes) {
                                                            fetch(`/api/leads/${lead._id}`, {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ notes: newVal })
                                                            });
                                                            if (selectedLead?._id === lead._id) setSelectedLead({ ...selectedLead, notes: newVal });
                                                        }
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                    placeholder="Add note..."
                                                    style={{
                                                        width: '100%',
                                                        background: 'transparent',
                                                        border: '1px solid transparent',
                                                        fontSize: '0.8125rem',
                                                        color: 'var(--text-secondary)',
                                                        resize: 'none',
                                                        padding: '4px 8px',
                                                        borderRadius: 6,
                                                        lineHeight: 1.4,
                                                        minHeight: 40,
                                                        outline: 'none',
                                                        transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(0,0,0,0.08)'; e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'transparent'; }}
                                                    onFocus={e => {
                                                        e.currentTarget.style.border = '1px solid var(--accent)';
                                                        e.currentTarget.style.background = 'var(--surface)';
                                                        e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-light)';
                                                    }}
                                                    onBlurCapture={e => {
                                                        e.currentTarget.style.border = '1px solid transparent';
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelectedLead(lead); setShowModal(true); }}>Details →</button>
                                                <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }} onClick={e => handleDeleteLead(lead._id, e)} title="Delete Lead">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Inline Add Row */}
                            {isInlineAdding && (
                                <tr style={{ background: 'var(--surface-hover)' }}>
                                    <td>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Auto</span>
                                    </td>
                                    <td>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={inlineForm.leadDate}
                                            onChange={e => setInlineForm({ ...inlineForm, leadDate: e.target.value })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem', width: 130 }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="form-input"
                                            autoFocus
                                            placeholder="Company Name *"
                                            value={inlineForm.companyName}
                                            onChange={e => setInlineForm({ ...inlineForm, companyName: e.target.value })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem' }}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="filter-select"
                                            value={inlineForm.channel}
                                            onChange={e => setInlineForm({ ...inlineForm, channel: e.target.value as Channel })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem', width: '100%' }}
                                        >
                                            <option value="dm">IG DM</option>
                                            <option value="email">Email</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="call">Call</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            className="form-input"
                                            placeholder="Prospect"
                                            value={inlineForm.prospectName}
                                            onChange={e => setInlineForm({ ...inlineForm, prospectName: e.target.value })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem' }}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="filter-select"
                                            value={inlineForm.leadType}
                                            onChange={e => setInlineForm({ ...inlineForm, leadType: e.target.value as LeadType })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem', width: '100%' }}
                                        >
                                            {LEAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>New</div>
                                    </td>
                                    <td>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={inlineForm.followUpDate}
                                            onChange={e => setInlineForm({ ...inlineForm, followUpDate: e.target.value })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="form-input"
                                            placeholder="Phone"
                                            value={inlineForm.phoneNumber}
                                            onChange={e => setInlineForm({ ...inlineForm, phoneNumber: e.target.value })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="form-input"
                                            placeholder="Notes..."
                                            value={inlineForm.notes}
                                            onChange={e => setInlineForm({ ...inlineForm, notes: e.target.value })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem' }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveInlineAdd();
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }} onClick={handleSaveInlineAdd} disabled={!inlineForm.companyName.trim() || saving}>✓</button>
                                            <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setIsInlineAdding(false)}>✕</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {!isInlineAdding && (
                        <button
                            onClick={() => setIsInlineAdding(true)}
                            style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            + New item
                        </button>
                    )}
                </div>
            )}

            {activeTab === 'followups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {followUps.length === 0 ? (
                        <div className="card card-p"><div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">No follow-ups scheduled</div><div className="empty-desc">Add follow-up dates when creating leads</div></div></div>
                    ) : followUps.map(lead => {
                        const days = Math.ceil((new Date(lead.followUpDate).getTime() - Date.now()) / 86400000);
                        return (
                            <div key={lead._id} className="card card-p" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: days <= 1 ? '1px solid rgba(255,59,48,0.3)' : days <= 3 ? '1px solid rgba(255,149,0,0.3)' : '1px solid var(--border)' }} onClick={() => setSelectedLead(lead)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div className="avatar avatar-md avatar-gradient-1">{lead.companyName?.[0]}</div>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{lead.companyName}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{lead.prospectName}</div>
                                        {lead.notes && <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: 4 }}>{lead.notes.slice(0, 100)}</div>}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: days <= 0 ? 'var(--danger)' : days <= 3 ? 'var(--warning)' : 'var(--text-primary)' }}>
                                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days} days`}
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{format(new Date(lead.followUpDate), 'MMM dd, yyyy')}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== RESPONSIVE NEW LEAD MODAL ===== */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h1 className="modal-title">✨ New Lead</h1>
                                <p className="modal-subtitle">Click fields to edit — Company Name required</p>
                            </div>
                            <button type="button" className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>

                                {/* Source Channel */}
                                <div className="notion-row">
                                    <div className="notion-label">
                                        <span style={{ fontSize: 18 }}>📡</span>
                                        <div>
                                            <span className="form-label-premium" style={{ marginBottom: 0 }}>source channel</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>Auto-logs a reply ✓</span>
                                        </div>
                                    </div>
                                    <div className="notion-input-wrap">
                                        {CHANNELS.map(ch => (
                                            <button
                                                key={ch.key}
                                                type="button"
                                                onClick={() => setForm({ ...form, channel: ch.key })}
                                                style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: form.channel === ch.key ? ch.color : `${ch.color}15`, color: form.channel === ch.key ? 'white' : ch.color, boxShadow: form.channel === ch.key ? `0 2px 8px ${ch.color}40` : 'none' }}
                                            >
                                                {ch.icon} {ch.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Lead Date */}
                                <div className="notion-row">
                                    <div className="notion-label">
                                        <span style={{ fontSize: 18 }}>🗓️</span>
                                        <div>
                                            <span className="form-label-premium" style={{ marginBottom: 0 }}>lead date</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>When did this happen?</span>
                                        </div>
                                    </div>
                                    <div className="notion-input-wrap">
                                        <input
                                            type="date"
                                            value={form.leadDate}
                                            onChange={e => setForm({ ...form, leadDate: e.target.value })}
                                            className="notion-input"
                                        />
                                    </div>
                                </div>

                                {/* Inputs */}
                                {[
                                    { icon: '🏢', label: 'Company Name', key: 'companyName', type: 'text', placeholder: 'e.g. Luxury Salon Pune', required: true },
                                    { icon: '👤', label: 'Prospect / Contact', key: 'prospectName', type: 'text', placeholder: 'Owner or admin name' },
                                    { icon: '📞', label: 'Phone Number', key: 'phoneNumber', type: 'tel', placeholder: '+91 900 000 0000' },
                                    { icon: '🔗', label: 'Website / GBP Link', key: 'link', type: 'url', placeholder: 'https://...' },
                                    { icon: '📅', label: 'Follow-up Date', key: 'followUpDate', type: 'date', placeholder: '' },
                                ].map((field) => (
                                    <div className="notion-row" key={field.key}>
                                        <div className="notion-label">
                                            <span style={{ fontSize: 18 }}>{field.icon}</span>
                                            <span className="form-label-premium" style={{ marginBottom: 0 }}>
                                                {field.label.toLowerCase()}
                                                {field.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
                                            </span>
                                        </div>
                                        <div className="notion-input-wrap">
                                            <input
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                value={form[field.key as keyof typeof form]}
                                                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                                className="notion-input"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Status */}
                                <div className="notion-row">
                                    <div className="notion-label">
                                        <span style={{ fontSize: 18 }}>🏷️</span>
                                        <span className="form-label-premium" style={{ marginBottom: 0 }}>lead status</span>
                                    </div>
                                    <div className="notion-input-wrap">
                                        {LEAD_TYPES.map(t => {
                                            const sc = STATUS_CONFIG[t];
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, leadType: t })}
                                                    style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: form.leadType === t ? sc.color : sc.bg, color: form.leadType === t ? 'white' : sc.color, boxShadow: form.leadType === t ? `0 2px 8px ${sc.color}40` : 'none' }}
                                                >
                                                    {sc.emoji} {t}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="notion-row" style={{ alignItems: 'flex-start' }}>
                                    <div className="notion-label" style={{ minHeight: '100px' }}>
                                        <span style={{ fontSize: 18, marginTop: 2 }}>📝</span>
                                        <span className="form-label-premium" style={{ marginBottom: 0 }}>call notes</span>
                                    </div>
                                    <div className="notion-input-wrap" style={{ alignItems: 'flex-start' }}>
                                        <textarea
                                            rows={4}
                                            placeholder="What was discussed on the call? Any promises made?"
                                            value={form.notes}
                                            onChange={e => setForm({ ...form, notes: e.target.value })}
                                            className="notion-input"
                                            style={{ resize: 'vertical', lineHeight: 1.5 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button
                                type="button"
                                className="btn btn-premium"
                                disabled={!form.companyName.trim() || saving}
                                onClick={handleSubmit}
                            >
                                {saving ? '⏳ Saving...' : '✓ Save Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESPONSIVE LEAD DETAIL MODAL */}
            {selectedLead && (
                <div className="modal-overlay" onClick={() => { setSelectedLead(null); setIsEditingExisting(false); }}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div className="avatar avatar-md avatar-gradient-1" style={{ fontSize: '1.2rem', width: 44, height: 44 }}>{selectedLead.companyName?.[0]}</div>
                                {isEditingExisting ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <input className="form-input" style={{ fontWeight: 800, fontSize: '1.1rem', padding: '4px 8px' }} value={editForm.companyName} onChange={e => setEditForm({ ...editForm, companyName: e.target.value })} placeholder="Company Name" />
                                        <input className="form-input" style={{ fontSize: '0.85rem', padding: '4px 8px' }} value={editForm.prospectName} onChange={e => setEditForm({ ...editForm, prospectName: e.target.value })} placeholder="Prospect Name" />
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedLead.companyName}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{selectedLead.prospectName}</div>
                                    </div>
                                )}
                            </div>
                            <button type="button" className="modal-close" onClick={() => { setSelectedLead(null); setIsEditingExisting(false); }}>
                                <span style={{ fontSize: 24, lineHeight: 1 }}>×</span>
                            </button>
                        </div>
                        <div className="glass-modal-body">

                            {isEditingExisting ? (
                                <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 24 }}>
                                    {/* Source Channel */}
                                    <div className="notion-row">
                                        <div className="notion-label">
                                            <span style={{ fontSize: 18 }}>📡</span>
                                            <div>
                                                <span className="form-label-premium" style={{ marginBottom: 0 }}>source channel</span>
                                            </div>
                                        </div>
                                        <div className="notion-input-wrap">
                                            {CHANNELS.map(ch => (
                                                <button
                                                    key={ch.key}
                                                    type="button"
                                                    onClick={() => setEditForm({ ...editForm, channel: ch.key })}
                                                    style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: editForm.channel === ch.key ? ch.color : `${ch.color}15`, color: editForm.channel === ch.key ? 'white' : ch.color, boxShadow: editForm.channel === ch.key ? `0 2px 8px ${ch.color}40` : 'none' }}
                                                >
                                                    {ch.icon} {ch.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Lead Date */}
                                    <div className="notion-row">
                                        <div className="notion-label">
                                            <span style={{ fontSize: 18 }}>🗓️</span>
                                            <div>
                                                <span className="form-label-premium" style={{ marginBottom: 0 }}>lead date</span>
                                            </div>
                                        </div>
                                        <div className="notion-input-wrap">
                                            <input
                                                type="date"
                                                value={editForm.leadDate ? editForm.leadDate.split('T')[0] : ''}
                                                onChange={e => setEditForm({ ...editForm, leadDate: e.target.value })}
                                                className="notion-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Inputs */}
                                    {[
                                        { icon: '📞', label: 'Phone Number', key: 'phoneNumber', type: 'tel', placeholder: '+91 900 000 0000' },
                                        { icon: '🔗', label: 'Website / GBP Link', key: 'link', type: 'url', placeholder: 'https://...' },
                                        { icon: '📅', label: 'Follow-up Date', key: 'followUpDate', type: 'date', placeholder: '' },
                                    ].map((field) => (
                                        <div className="notion-row" key={field.key}>
                                            <div className="notion-label">
                                                <span style={{ fontSize: 18 }}>{field.icon}</span>
                                                <span className="form-label-premium" style={{ marginBottom: 0 }}>
                                                    {field.label.toLowerCase()}
                                                </span>
                                            </div>
                                            <div className="notion-input-wrap">
                                                <input
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={field.key === 'followUpDate' && editForm[field.key] ? editForm[field.key].split('T')[0] : (editForm[field.key] || '')}
                                                    onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                                                    className="notion-input"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Status */}
                                    <div className="notion-row">
                                        <div className="notion-label">
                                            <span style={{ fontSize: 18 }}>🏷️</span>
                                            <span className="form-label-premium" style={{ marginBottom: 0 }}>lead status</span>
                                        </div>
                                        <div className="notion-input-wrap">
                                            {LEAD_TYPES.map(t => {
                                                const sc = STATUS_CONFIG[t];
                                                return (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setEditForm({ ...editForm, leadType: t })}
                                                        style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: editForm.leadType === t ? sc.color : sc.bg, color: editForm.leadType === t ? 'white' : sc.color, boxShadow: editForm.leadType === t ? `0 2px 8px ${sc.color}40` : 'none' }}
                                                    >
                                                        {sc.emoji} {t}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="notion-row" style={{ alignItems: 'flex-start' }}>
                                        <div className="notion-label" style={{ minHeight: '100px' }}>
                                            <span style={{ fontSize: 18, marginTop: 2 }}>📝</span>
                                            <span className="form-label-premium" style={{ marginBottom: 0 }}>call notes</span>
                                        </div>
                                        <div className="notion-input-wrap" style={{ alignItems: 'flex-start' }}>
                                            <textarea
                                                rows={4}
                                                placeholder="What was discussed on the call?"
                                                value={editForm.notes || ''}
                                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                                className="notion-input"
                                                style={{ resize: 'vertical', lineHeight: 1.5 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="detail-grid">
                                        {[
                                            { label: 'Phone', value: selectedLead.phoneNumber || '—', icon: '📞' },
                                            { label: 'Status', value: selectedLead.leadType, icon: '🏷️' },
                                            { label: 'Follow-up', value: selectedLead.followUpDate ? format(new Date(selectedLead.followUpDate), 'MMM dd, yyyy') : '—', icon: '📅' },
                                            { label: 'Added On', value: format(new Date(selectedLead.createdAt), 'MMM dd, yyyy'), icon: '📋' },
                                        ].map(f => (
                                            <div key={f.label} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>{f.icon} {f.label}</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{f.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedLead.link && (
                                        <div style={{ marginBottom: 24 }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>� Website / GBP Link</div>
                                            <a href={selectedLead.link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-all', fontSize: '0.95rem' }}>{selectedLead.link}</a>
                                        </div>
                                    )}

                                    {selectedLead.notes && (
                                        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 16, marginBottom: 24, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 700 }}>📝 Call Notes</div>
                                            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{selectedLead.notes}</p>
                                        </div>
                                    )}

                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <div className="form-label-premium">🔄 update status</div>
                                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                    {LEAD_TYPES.map(t => {
                                                        const sc = STATUS_CONFIG[t];
                                                        return (
                                                            <button
                                                                key={t}
                                                                style={{
                                                                    padding: '8px 16px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 700, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                                                                    background: selectedLead.leadType === t ? sc.color : 'var(--surface)',
                                                                    color: selectedLead.leadType === t ? 'white' : 'var(--text-secondary)',
                                                                    borderColor: selectedLead.leadType === t ? 'transparent' : 'var(--border)',
                                                                    boxShadow: selectedLead.leadType === t ? `0 4px 12px ${sc.color}50` : 'none'
                                                                }}
                                                                onClick={() => handleUpdateStatus(selectedLead._id, t)}
                                                            >
                                                                {sc.emoji} {t}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                                                <div className="form-label-premium">📍 pipeline stage</div>
                                                <select
                                                    className="filter-select"
                                                    value={selectedLead.pipelineStage || 'new'}
                                                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem', background: 'var(--surface)', color: 'var(--text-primary)', fontWeight: 600, border: '1px solid var(--border)', borderRadius: 10 }}
                                                    onChange={e => handleUpdatePipelineStage(selectedLead._id, e.target.value)}
                                                >
                                                    <option value="new">New</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="followup">Follow-up</option>
                                                    <option value="meeting">Meeting Set</option>
                                                    <option value="proposal">Proposal Sent</option>
                                                    <option value="closed">Client 🎉</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>

                        <div className="modal-footer">
                            {isEditingExisting ? (
                                <>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsEditingExisting(false)}>Cancel Edit</button>
                                    <button type="button" className="btn btn-premium" onClick={handleSaveExistingLead} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button type="button" className="btn btn-secondary" onClick={() => { setEditForm(selectedLead); setIsEditingExisting(true); }}>✏️ Edit Lead Details</button>
                                        <button type="button" className="btn" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => handleDeleteLead(selectedLead._id)}>🗑️ Delete</button>
                                    </div>
                                    {selectedLead.phoneNumber && (
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <a href={`tel:${selectedLead.phoneNumber}`} className="btn btn-secondary">📞 Call</a>
                                            <a href={`https://wa.me/${selectedLead.phoneNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ color: '#25d366', borderColor: '#25d36630', background: '#25d36610' }}>💬 WhatsApp</a>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}