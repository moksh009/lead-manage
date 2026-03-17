"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useUser } from '@/components/UserContext';

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
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
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
        <div ref={dropdownRef} style={{ ...style, position: 'relative', zIndex: isOpen ? 1000 : 1, borderRadius: 8 }} onClick={e => e.stopPropagation()}>

            <div
                className="notion-select"
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%', height: '100%', paddingRight: 6 }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {getLabel(value)}
                </span>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ marginLeft: 6, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M4 5L0 1L1 0L4 3L7 0L8 1L4 5Z" fill="currentColor" opacity="0.6" />
                </svg>
            </div>

            {isOpen && (
                <div 
                    onWheel={e => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        minWidth: '220px',
                        background: '#1a1b26',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 10,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                        zIndex: 10001,
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: 300,
                        overflowY: 'auto'
                    }}
                >


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
                                                justifyContent: 'space-between', flexWrap: 'wrap',
                                                background: value === subOpt.value ? 'var(--surface-hover)' : 'transparent',
                                                color: value === subOpt.value ? 'var(--text-primary)' : 'var(--text-secondary)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.background = value === subOpt.value ? 'rgba(255,255,255,0.08)' : 'transparent'}

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
                                    justifyContent: 'space-between', flexWrap: 'wrap',
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
    const { currentUser } = useUser();
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Selected Leads State
    const [selectedLeadsList, setSelectedLeadsList] = useState<any[]>([]);
    const [leadSearchStr, setLeadSearchStr] = useState('');

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
        pipelineStage: 'contacted',
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
        pipelineStage: 'contacted',
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
                headers: { 'Content-Type': 'application/json', 'x-user': currentUser },
                body: JSON.stringify({
                    ...form,
                    leadDate: form.leadDate ? new Date(form.leadDate) : new Date(),
                    followUpDate: form.followUpDate ? new Date(form.followUpDate) : undefined
                })
            });
            setShowModal(false);
            setForm({ companyName: '', prospectName: '', phoneNumber: '', link: '', leadType: 'Soft lead', channel: 'call', leadDate: new Date().toISOString().split('T')[0], followUpDate: '', notes: '', pipelineStage: 'contacted' });
            fetchLeads();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkFollowUpDone = async (e: any, leadId: string) => {
        e.stopPropagation();
        try {
            await fetch(`/api/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followUpDate: null })
            });
            setLeads(leads.map(l => l._id === leadId ? { ...l, followUpDate: null } : l));
        } catch (err) {
            console.error(err);
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
                headers: { 'Content-Type': 'application/json', 'x-user': currentUser },
                body: JSON.stringify({
                    ...inlineForm,
                    leadDate: inlineForm.leadDate ? new Date(inlineForm.leadDate) : new Date(),
                    followUpDate: inlineForm.followUpDate ? new Date(inlineForm.followUpDate) : undefined
                })
            });
            setIsInlineAdding(false);
            setInlineForm({ companyName: '', prospectName: '', phoneNumber: '', link: '', leadType: 'Soft lead', channel: 'dm', leadDate: new Date().toISOString().split('T')[0], followUpDate: '', notes: '', pipelineStage: 'contacted' });
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
            setSelectedLeadsList(prev => prev.filter(sl => sl._id !== id));
            if (selectedLead?._id === id) setShowModal(false);
        } catch (err) {
            console.error('Failed to delete lead', err);
        }
    };

    const handleDownloadCSV = () => {
        if (selectedLeadsList.length === 0) return;

        const headers = ['Company Name', 'Prospect Name', 'Phone Number', 'Link', 'Lead Type', 'Channel', 'Pipeline Stage', 'Follow-up Date', 'Notes', 'Added On'];
        const csvContent = [
            headers.join(','),
            ...selectedLeadsList.map(lead => {
                return [
                    `"${(lead.companyName || '').replace(/"/g, '""')}"`,
                    `"${(lead.prospectName || '').replace(/"/g, '""')}"`,
                    `"${String(lead.phoneNumber || '').replace(/"/g, '""')}"`,
                    `"${(lead.link || '').replace(/"/g, '""')}"`,
                    `"${(lead.leadType || '').replace(/"/g, '""')}"`,
                    `"${(lead.channel || '').replace(/"/g, '""')}"`,
                    `"${(lead.pipelineStage || '').replace(/"/g, '""')}"`,
                    `"${lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-IN') : ''}"`,
                    `"${(lead.notes || '').replace(/"/g, '""')}"`,
                    `"${new Date(lead.createdAt).toLocaleDateString('en-IN')}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `selected_leads_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const counts = {
        All: leads.length,
        'Qualified': leads.filter(l => l.leadType === 'Qualified').length,
        'Soft lead': leads.filter(l => l.leadType === 'Soft lead' || l.leadType === 'Soft Lead' || l.leadType === 'Pending').length,
        'Unqualified Lead': leads.filter(l => l.leadType === 'Unqualified Lead' || l.leadType === 'UN-QUALIFIED').length,
        'Hot lead': leads.filter(l => l.leadType === 'Hot lead').length,
    };

    return (
        <>
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

            {/* Premium hero - dark glassmorphism */}
            <div className="card" style={{ padding: '32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                {/* Decorative glow */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.5rem', padding: '6px', background: 'rgba(168,85,247,0.1)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>🎯</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '3px 12px', borderRadius: 99, color: '#d8b4fe' }}>
                            {leads.length} Leads · {counts.Qualified} Qualified
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px 0', background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Leads</h1>
                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px 0' }}>{leads.length} leads · {counts.Qualified} qualified · {followUps.length} with follow-ups</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button className="btn" style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none', boxShadow: '0 4px 16px rgba(168,85,247,0.35)', fontWeight: 700 }} onClick={() => setShowModal(true)}>+ New Lead</button>
                    </div>
                </div>
            </div>

            {/* Selected Leads Section */}
            <div style={{
                background: 'var(--surface)',
                padding: '20px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                marginBottom: 24,
                boxShadow: 'var(--shadow-sm)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Selected Leads Export</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{selectedLeadsList.length} leads selected</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {selectedLeadsList.length > 0 && (
                            <>
                                <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => setSelectedLeadsList([])}>
                                    Clear All
                                </button>
                                <button className="btn btn-premium btn-sm" onClick={handleDownloadCSV}>
                                    ⬇️ Download CSV
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Dropdown / Search to add leads manually */}
                <div style={{ position: 'relative', marginBottom: selectedLeadsList.length > 0 ? 16 : 0, maxWidth: 400 }}>
                    <input
                        type="search"
                        className="form-input"
                        placeholder="Search leads to add to selection..."
                        value={leadSearchStr}
                        onChange={e => setLeadSearchStr(e.target.value)}
                        style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', border: '1px solid var(--border-medium)' }}
                    />
                    {leadSearchStr.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: '#1a1b26', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 12, marginTop: 8, maxHeight: 300, overflowY: 'auto',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 1000,
                            backdropFilter: 'blur(10px)'
                        }}>
                            {leads.filter(l =>
                                !selectedLeadsList.find(sl => sl._id === l._id) &&
                                (l.companyName?.toLowerCase().includes(leadSearchStr.toLowerCase()) ||
                                    l.prospectName?.toLowerCase().includes(leadSearchStr.toLowerCase()))
                            ).slice(0, 50).map(l => (
                                <div
                                    key={l._id}
                                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}
                                    onClick={() => {
                                        setSelectedLeadsList([...selectedLeadsList, l]);
                                        setLeadSearchStr('');
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{l.companyName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{l.prospectName || 'No prospect name'}</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 300 }}>+</span>
                                </div>
                            ))}
                            {leads.filter(l =>
                                !selectedLeadsList.find(sl => sl._id === l._id) &&
                                (l.companyName?.toLowerCase().includes(leadSearchStr.toLowerCase()) ||
                                    l.prospectName?.toLowerCase().includes(leadSearchStr.toLowerCase()))
                            ).length === 0 && (
                                    <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        No unfound leads matching "{leadSearchStr}"
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {/* Selected Leads List */}
                {selectedLeadsList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 4, marginTop: 12 }}>
                        {selectedLeadsList.map(l => (
                            <div key={l._id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div className="avatar avatar-sm avatar-gradient-1">{l.companyName?.[0] || '?'}</div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{l.companyName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                            {l.phoneNumber && <span style={{ marginRight: 12 }}>📞 {l.phoneNumber}</span>}
                                            {l.leadType && <span>🏷️ {l.leadType}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn-icon-sm"
                                    style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}
                                    onClick={() => setSelectedLeadsList(selectedLeadsList.filter(sl => sl._id !== l._id))}
                                    title="Remove from selection"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Toolbar Area */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 24,
                boxShadow: '0 4px 24px -8px rgba(168, 85, 247, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
            }}>
                {/* Status filter pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['All', ...LEAD_TYPES] as string[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            style={{ padding: '8px 16px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)', background: filterType === t ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)', color: filterType === t ? 'white' : 'var(--text-secondary)', borderColor: filterType === t ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)', boxShadow: filterType === t ? '0 4px 14px rgba(168,85,247,0.3)' : 'none' }}
                        >
                            {t} <span style={{ opacity: filterType === t ? 0.8 : 0.6, marginLeft: 4 }}>({counts[t as keyof typeof counts]})</span>
                        </button>
                    ))}
                </div>

                {/* Channel filter pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Channel:</span>
                    <button
                        onClick={() => setFilterChannel('all')}
                        style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', background: filterChannel === 'all' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)', color: filterChannel === 'all' ? 'white' : 'var(--text-secondary)', borderColor: filterChannel === 'all' ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)' }}
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
                                style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: active ? ch.color : `${ch.color}18`, color: active ? 'white' : ch.color, boxShadow: active ? `0 4px 12px ${ch.color}40` : 'none' }}
                            >
                                {ch.icon} {ch.label} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* View Tabs */}
            <div className="tab-bar" style={{ borderRadius: 99, padding: 6 }}>
                <div className={`tab ${activeTab === 'table' ? 'active' : ''}`} style={{ borderRadius: 99 }} onClick={() => setActiveTab('table')}>📋 All Leads</div>
                <div className={`tab ${activeTab === 'followups' ? 'active' : ''}`} style={{ borderRadius: 99 }} onClick={() => setActiveTab('followups')}>📅 Follow-ups</div>
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
                                                    style={{ background: sc.bg, color: sc.color, border: 'none', boxShadow: 'none' }}

                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ width: 140 }}>
                                                <CustomBadgeSelect
                                                    value={lead.pipelineStage || 'new'}
                                                    options={PIPELINE_STAGE_OPTIONS}
                                                    onChange={(val: any) => handleUpdatePipelineStage(lead._id, val)}
                                                    style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)', border: 'none' }}

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
                                                    onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
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
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ padding: '0 8px', color: 'var(--text-primary)', background: selectedLeadsList.find(sl => sl._id === lead._id) ? 'var(--success-light, #dcfce7)' : 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        if (!selectedLeadsList.find(sl => sl._id === lead._id)) {
                                                            setSelectedLeadsList([...selectedLeadsList, lead]);
                                                        } else {
                                                            setSelectedLeadsList(selectedLeadsList.filter(sl => sl._id !== lead._id));
                                                        }
                                                    }}
                                                    title={selectedLeadsList.find(sl => sl._id === lead._id) ? "Remove from Export List" : "Add to Export List"}
                                                >
                                                    {selectedLeadsList.find(sl => sl._id === lead._id) ? '✓ Added' : '+ Add'}
                                                </button>
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
                                        <select
                                            className="filter-select"
                                            value={inlineForm.pipelineStage}
                                            onChange={e => setInlineForm({ ...inlineForm, pipelineStage: e.target.value })}
                                            style={{ padding: '6px 8px', fontSize: '0.875rem', width: '100%' }}
                                        >
                                            {PIPELINE_STAGE_OPTIONS.map((group, i) => (
                                                <optgroup key={i} label={group.label}>
                                                    {group.options.map((opt: any) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: 20 }}>
                    {followUps.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1' }} className="card card-p"><div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">No follow-ups scheduled</div><div className="empty-desc">Add follow-up dates when creating leads</div></div></div>
                    ) : followUps.map(lead => {
                        const days = Math.ceil((new Date(lead.followUpDate).getTime() - Date.now()) / 86400000);
                        const isOverdue = days < 0;
                        const isUrgent = days >= 0 && days <= 1;
                        const cardBg = isOverdue ? 'rgba(239, 68, 68, 0.05)' : isUrgent ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)';
                        const cardBorder = isOverdue ? 'rgba(239, 68, 68, 0.25)' : isUrgent ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)';
                        const accentColor = isOverdue ? '#ef4444' : isUrgent ? '#f59e0b' : '#10b981';

                        return (
                            <div key={lead._id} className="premium-card premium-card-hover" style={{
                                display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer',
                                padding: '24px',
                                border: isOverdue ? '2.5px solid rgba(239, 68, 68, 0.4)' : isUrgent ? '2.5px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                boxShadow: isOverdue ? '0 0 30px rgba(239, 68, 68, 0.2)' : isUrgent ? '0 0 30px rgba(245, 158, 11, 0.2)' : 'none',
                                position: 'relative',
                                overflow: 'hidden'
                            }} onClick={() => setSelectedLead(lead)}>

                                {/* Urgency glow at top */}
                                <div style={{
                                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                                    width: '60%', height: '40px',
                                    background: `radial-gradient(ellipse at top, ${accentColor}20 0%, transparent 70%)`,
                                    pointerEvents: 'none'
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'flex-start', position: 'relative' }}>
                                    <div style={{ display: 'flex', gap: 14 }}>
                                        <div className="avatar avatar-md avatar-gradient-1" style={{ width: 42, height: 42 }}>{lead.companyName?.[0]}</div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>{lead.companyName}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{lead.prospectName}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: 99,
                                            background: `${accentColor}15`,
                                            color: accentColor,
                                            border: `1px solid ${accentColor}30`,
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                            whiteSpace: 'nowrap', display: 'inline-block', marginBottom: 6
                                        }}>
                                            {isOverdue ? `🚨 ${Math.abs(days)}d overdue` : days === 0 ? '🔥 Today!' : days === 1 ? '⚡ Tomorrow' : `${days} days`}
                                        </span>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{format(new Date(lead.followUpDate), 'MMM dd, yyyy')}</div>
                                    </div>
                                </div>

                                {lead.notes && (
                                    <div style={{
                                        padding: '12px 14px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.03)'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                                            {lead.notes.length > 120 ? `${lead.notes.slice(0, 120)}...` : lead.notes}
                                        </div>
                                    </div>
                                )}

                                <div style={{
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    paddingTop: 16,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {lead.phoneNumber && (
                                            <a href={`tel:${lead.phoneNumber}`}
                                                style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s' }}
                                                onClick={e => e.stopPropagation()}
                                            >📞</a>
                                        )}
                                        {lead.phoneNumber && (
                                            <a href={`https://wa.me/${lead.phoneNumber.replace(/\D/g, '')}`}
                                                target="_blank" rel="noreferrer"
                                                style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', transition: 'all 0.2s' }}
                                                onClick={e => e.stopPropagation()}
                                            >💬</a>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleMarkFollowUpDone(e, lead._id)}
                                        style={{
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            color: '#10b981',
                                            border: '1px solid rgba(16, 185, 129, 0.25)',
                                            borderRadius: 12,
                                            padding: '8px 18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            cursor: 'pointer',
                                            fontSize: '0.82rem',
                                            fontWeight: 800,
                                            transition: 'all 0.2s',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.02em'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                    >
                                        ✓ Mark Done
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            </div>

            {/* ===== PREMIUM NEW LEAD MODAL ===== */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-premium" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-premium">
                            <div>
                                <h1 className="modal-title-premium">✨ New Lead</h1>
                                <p className="modal-subtitle-premium">Fill in the details to tracked the prospect</p>
                            </div>
                            <button type="button" className="modal-close-premium" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="modal-body-premium">
                            {/* Source Channel Select */}
                            <div className="form-group-premium">
                                <label className="label-premium">Source Channel</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {CHANNELS.map(ch => (
                                        <button
                                            key={ch.key}
                                            type="button"
                                            onClick={() => setForm({ ...form, channel: ch.key })}
                                            style={{
                                                padding: '8px 16px', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 700,
                                                cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
                                                background: form.channel === ch.key ? ch.color : 'rgba(255,255,255,0.03)',
                                                color: form.channel === ch.key ? 'white' : 'rgba(255,255,255,0.4)',
                                                borderColor: form.channel === ch.key ? ch.color : 'rgba(255,255,255,0.08)',
                                                boxShadow: form.channel === ch.key ? `0 8px 16px ${ch.color}30` : 'none'
                                            }}
                                        >
                                            {ch.icon} {ch.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                {/* Inputs */}
                                {[
                                    { icon: '🏢', label: 'Company Name', key: 'companyName', type: 'text', placeholder: 'e.g. Luxury Salon' },
                                    { icon: '👤', label: 'Prospect Name', key: 'prospectName', type: 'text', placeholder: 'Owner or admin' },
                                    { icon: '📞', label: 'Phone Number', key: 'phoneNumber', type: 'tel', placeholder: '+91 900 000 0000' },
                                    { icon: '🔗', label: 'Website / GBP', key: 'link', type: 'url', placeholder: 'https://...' },
                                    { icon: '🗓️', label: 'Lead Date', key: 'leadDate', type: 'date', placeholder: '' },
                                    { icon: '📅', label: 'Follow-up Date', key: 'followUpDate', type: 'date', placeholder: '' },
                                ].map((field) => (
                                    <div className="form-group-premium" key={field.key}>
                                        <label className="label-premium">{field.icon} {field.label}</label>
                                        <input
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            value={form[field.key as keyof typeof form]}
                                            onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                            className="input-premium"
                                        />
                                    </div>
                                ))}

                                {/* Pipeline Stage Selection */}
                                <div className="form-group-premium">
                                    <label className="label-premium">📍 Pipeline Stage</label>
                                    <select
                                        className="input-premium"
                                        value={form.pipelineStage}
                                        onChange={e => setForm({ ...form, pipelineStage: e.target.value })}
                                    >
                                        {PIPELINE_STAGE_OPTIONS.map((group, i) => (
                                            <optgroup key={i} label={group.label}>
                                                {group.options.map((opt: any) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Tagging */}
                                <div className="form-group-premium">
                                    <label className="label-premium">🏷️ Lead Status</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {LEAD_TYPES.map(t => {
                                            const sc = STATUS_CONFIG[t];
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, leadType: t })}
                                                    style={{
                                                        padding: '8px 14px', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 700,
                                                        cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
                                                        background: form.leadType === t ? sc.color : 'rgba(255,255,255,0.03)',
                                                        color: form.leadType === t ? 'white' : 'rgba(255,255,255,0.4)',
                                                        borderColor: form.leadType === t ? sc.color : 'rgba(255,255,255,0.08)',
                                                        boxShadow: form.leadType === t ? `0 8px 16px ${sc.color}30` : 'none'
                                                    }}
                                                >
                                                    {sc.emoji} {t}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Notes Field */}
                            <div className="form-group-premium" style={{ marginBottom: 0 }}>
                                <label className="label-premium">📝 Call Notes</label>
                                <textarea
                                    rows={4}
                                    placeholder="Key discussion points..."
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className="input-premium"
                                    style={{ resize: 'vertical', lineHeight: 1.5, minHeight: '100px' }}
                                />
                            </div>
                        </div>

                        <div className="modal-footer-premium">
                            <button
                                type="button"
                                style={{
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer'
                                }}
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                style={{
                                    background: 'var(--accent-gradient)', border: 'none',
                                    color: 'white', padding: '10px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
                                    boxShadow: '0 8px 20px -6px rgba(168, 85, 247, 0.4)',
                                    opacity: (!form.companyName.trim() || saving) ? 0.5 : 1
                                }}
                                disabled={!form.companyName.trim() || saving}
                                onClick={handleSubmit}
                            >
                                {saving ? 'Saving...' : 'Save Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PREMIUM LEAD DETAIL MODAL */}
            {selectedLead && (
                <div className="modal-overlay" onClick={() => { setSelectedLead(null); setIsEditingExisting(false); }}>
                    <div className="modal-premium" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-premium">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div className="avatar avatar-md avatar-gradient-1" style={{ fontSize: '1.2rem', width: 44, height: 44 }}>{selectedLead.companyName?.[0] || 'L'}</div>
                                {isEditingExisting ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <input className="input-premium" style={{ fontWeight: 800, fontSize: '1.1rem', padding: '4px 8px', height: 'auto' }} value={editForm.companyName} onChange={e => setEditForm({ ...editForm, companyName: e.target.value })} placeholder="Company Name" />
                                        <input className="input-premium" style={{ fontSize: '0.85rem', padding: '4px 8px', height: 'auto' }} value={editForm.prospectName} onChange={e => setEditForm({ ...editForm, prospectName: e.target.value })} placeholder="Prospect Name" />
                                    </div>
                                ) : (
                                    <div>
                                        <h1 className="modal-title-premium">{selectedLead.companyName}</h1>
                                        <p className="modal-subtitle-premium">{selectedLead.prospectName || 'No prospect name'}</p>
                                    </div>
                                )}
                            </div>
                            <button type="button" className="modal-close-premium" onClick={() => { setSelectedLead(null); setIsEditingExisting(false); }}>×</button>
                        </div>
                        <div className="modal-body-premium">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                                {isEditingExisting ? (
                                    <>
                                        <div className="form-group-premium">
                                            <label className="label-premium">📞 Phone</label>
                                            <input className="input-premium" value={editForm.phoneNumber} onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label className="label-premium">🔗 Link</label>
                                            <input className="input-premium" value={editForm.link} onChange={e => setEditForm({ ...editForm, link: e.target.value })} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label className="label-premium">📍 Stage</label>
                                            <select className="input-premium" value={editForm.pipelineStage} onChange={e => setEditForm({ ...editForm, pipelineStage: e.target.value })}>
                                                {PIPELINE_STAGE_OPTIONS.map((g, i) => (
                                                    <optgroup key={i} label={g.label}>
                                                        {g.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="label-premium" style={{ fontSize: '0.7rem', opacity: 0.5 }}>PHONE</label>
                                            <div style={{ fontWeight: 600 }}>{selectedLead.phoneNumber || '—'}</div>
                                        </div>
                                        <div>
                                            <label className="label-premium" style={{ fontSize: '0.7rem', opacity: 0.5 }}>STAGE</label>
                                            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedLead.pipelineStage || 'New'}</div>
                                        </div>
                                        <div>
                                            <label className="label-premium" style={{ fontSize: '0.7rem', opacity: 0.5 }}>STATUS</label>
                                            <div style={{ fontWeight: 600 }}>{selectedLead.leadType || '—'}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="form-group-premium" style={{ marginBottom: 0 }}>
                                <label className="label-premium">📝 Notes</label>
                                {isEditingExisting ? (
                                    <textarea className="input-premium" rows={5} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                                ) : (
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {selectedLead.notes || 'No notes available.'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer-premium">
                            {isEditingExisting ? (
                                <>
                                    <button className="btn btn-ghost" onClick={() => setIsEditingExisting(false)}>Cancel</button>
                                    <button className="btn btn-primary" style={{ background: 'var(--accent-gradient)' }} onClick={handleSaveExistingLead}>Update Details</button>
                                </>
                            ) : (
                                <>
                                    <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteLead(selectedLead._id)}>Delete Lead</button>
                                    <button className="btn btn-primary" style={{ background: 'var(--accent-gradient)' }} onClick={() => setIsEditingExisting(true)}>Edit Details</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
