"use client";

import { useEffect, useState, useMemo } from 'react';
import { format, differenceInDays, addMonths } from 'date-fns';

// ── Service Catalog ──────────────────────────────────────────────────────────
const SERVICE_CATALOG = [
    // AI Caller
    { category: 'AI Caller', name: 'Core (V1)', basePrice: 149, description: 'Professional Support Agent, Ticket Creation, Dedicated Dashboard, 24/7 Availability' },
    { category: 'AI Caller', name: 'Edge (V2)', basePrice: 229, description: 'Everything in Core + Calendar Appointment Setting, CRM Updating, Custom AI Models, Human Hand-off' },
    { category: 'AI Caller', name: 'Edge (V3)', basePrice: 387, description: 'Everything in V2 + Complex Meeting Mgmt, Multi-Channel Deployment, Outbound Calling, Multi-Language' },
    // AI Chatbot
    { category: 'AI Chatbot', name: 'CX Agent (V1)', basePrice: 149, description: 'Professional Support Agent, Ticket Creation & Routing, Single Channel, 2x Custom Integrations' },
    { category: 'AI Chatbot', name: 'CX Agent (V2)', basePrice: 249, description: 'Everything in V1 + Calendar Booking, Multi-channel, Outbound Messages, Full AI Customization, Hand-off' },
];

function getNextBillingDate(joiningDate: string) {
    if (!joiningDate) return new Date();
    const joined = new Date(joiningDate);
    if (isNaN(joined.getTime())) return new Date();
    const day = joined.getDate();
    const today = new Date();
    let next = new Date(today.getFullYear(), today.getMonth(), day);
    if (next <= today) next = addMonths(next, 1);
    return next;
}

// ── Shared service editor sub-component ─────────────────────────────────────
function ServiceEditor({ services, onChange }: { services: any[]; onChange: (s: any[]) => void }) {
    const [expanded, setExpanded] = useState<string | null>(null);

    const toggle = (key: string) => setExpanded(e => e === key ? null : key);

    const isSelected = (cat: string, name: string) => services.some(s => s.category === cat && s.name === name);

    const getPrice = (cat: string, name: string) => {
        const s = services.find(s => s.category === cat && s.name === name);
        return s ? String(s.price) : '';
    };

    const handleToggle = (item: typeof SERVICE_CATALOG[0]) => {
        if (isSelected(item.category, item.name)) {
            onChange(services.filter(s => !(s.category === item.category && s.name === item.name)));
        } else {
            onChange([...services, { category: item.category, name: item.name, price: item.basePrice }]);
        }
    };

    const handlePrice = (cat: string, name: string, price: string) => {
        onChange(services.map(s => s.category === cat && s.name === name ? { ...s, price: Number(price) || 0 } : s));
    };

    const categories = ['AI Caller', 'AI Chatbot'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map(cat => {
                const items = SERVICE_CATALOG.filter(s => s.category === cat);
                const isOpen = expanded === cat;
                const selectedInCat = services.filter(s => s.category === cat).length;
                return (
                    <div key={cat} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                        <div
                            onClick={() => toggle(cat)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: isOpen ? 'var(--accent-light)' : 'var(--bg-secondary)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 16 }}>{cat === 'AI Caller' ? '📞' : '💬'}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cat}</span>
                                {selectedInCat > 0 && (
                                    <span style={{ background: 'var(--accent)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{selectedInCat} selected</span>
                                )}
                            </div>
                            <span style={{ color: 'var(--text-tertiary)', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                        </div>
                        {isOpen && (
                            <div style={{ borderTop: '1px solid var(--border)' }}>
                                {items.map((item, idx) => {
                                    const selected = isSelected(item.category, item.name);
                                    return (
                                        <div key={item.name} style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                            <div
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: selected ? 'rgba(0,113,227,0.04)' : 'transparent', transition: 'background 0.15s' }}
                                                onClick={() => handleToggle(item)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-medium)'}`, background: selected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                                        {selected && <span style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>✓</span>}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2, maxWidth: 320, lineHeight: 1.4 }}>{item.description}</div>
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)', flexShrink: 0, marginLeft: 16 }}>
                                                    ${item.basePrice}/mo
                                                </div>
                                            </div>
                                            {selected && (
                                                <div style={{ padding: '8px 16px 12px 48px', background: 'rgba(0,113,227,0.04)', borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span className="form-label-premium" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>custom price (₹):</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="form-input"
                                                            style={{ maxWidth: 140, padding: '6px 10px', fontWeight: 700, fontSize: '0.9rem' }}
                                                            placeholder={`e.g. ${item.basePrice * 83}`}
                                                            value={getPrice(item.category, item.name)}
                                                            onChange={e => handlePrice(item.category, item.name, e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>per month</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editClient, setEditClient] = useState<any>(null); // client being edited
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [billingClient, setBillingClient] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [billingForm, setBillingForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    const [billingSaving, setBillingSaving] = useState(false);

    const EMPTY_FORM = { name: '', contactName: '', email: '', phone: '', services: [] as any[], joiningDate: '', notes: '', isActive: true };
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchClients = async () => {
        const res = await fetch('/api/clients');
        const json = await res.json();
        if (json.success) setClients(json.data);
        setLoading(false);
    };

    useEffect(() => { fetchClients(); }, []);

    const filtered = useMemo(() => {
        if (!search) return clients;
        const q = search.toLowerCase();
        return clients.filter(c => c.name?.toLowerCase().includes(q) || c.contactName?.toLowerCase().includes(q));
    }, [clients, search]);

    const urgentClients = clients.filter(c => {
        if (!c.isActive || !c.joiningDate) return false;
        return differenceInDays(getNextBillingDate(c.joiningDate), new Date()) <= 5;
    });

    const totalMRR = clients.filter(c => c.isActive).reduce((sum, c) => sum + (c.monthlyFee || 0), 0);

    // Add new client
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const monthlyFee = form.services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
        await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, monthlyFee })
        });
        setShowAddModal(false);
        setForm(EMPTY_FORM);
        fetchClients();
    };

    // Save edits to existing client
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`/api/clients/${editClient._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        setEditClient(null);
        setForm(EMPTY_FORM);
        fetchClients();
    };

    const openEdit = (client: any) => {
        setForm({
            name: client.name || '',
            contactName: client.contactName || '',
            email: client.email || '',
            phone: client.phone || '',
            services: Array.isArray(client.services) ? client.services : [],
            joiningDate: client.joiningDate ? new Date(client.joiningDate).toISOString().split('T')[0] : '',
            notes: client.notes || '',
            isActive: client.isActive !== false,
        });
        setEditClient(client);
        setSelectedClient(null);
    };

    const handleDeleteClient = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;
        try {
            await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            setClients(clients.filter(c => c._id !== id));
            if (selectedClient?._id === id) setSelectedClient(null);
        } catch (err) {
            console.error('Failed to delete client', err);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setBillingSaving(true);
        try {
            const res = await fetch(`/api/clients/${billingClient._id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(billingForm.amount) || billingClient.monthlyFee,
                    date: billingForm.date,
                    note: billingForm.note,
                })
            });
            const json = await res.json();
            if (json.success) {
                // Update the client in state immediately so it reflects straight away
                setClients(prev => prev.map(c => c._id === billingClient._id ? json.data : c));
            }
            setBillingClient(null);
            setBillingForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
            fetchClients();
        } finally {
            setBillingSaving(false);
        }
    };

    // Moved outside or keeping as separate component to avoid re-renders on every keystroke

    // ── Client Form Modal (shared for Add + Edit) ──────────────────────────────
    const formMonthlyFee = form.services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

    // usage below inside main component...

    return (
        <div className="animate-in">
            {/* Premium hero */}
            <div className="page-hero" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', marginBottom: 20 }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>💼</div>
                    <h1 className="page-hero-title">Clients &amp; Billing</h1>
                    <p className="page-hero-sub">{clients.filter(c => c.isActive).length} active clients &middot; ₹{totalMRR.toLocaleString()} monthly revenue</p>
                    <div className="page-hero-actions">
                        <button className="btn-hero btn-hero-primary" onClick={() => { setForm(EMPTY_FORM); setShowAddModal(true); }}>+ Add Client</button>
                    </div>
                </div>
            </div>

            {/* Billing Alerts */}
            {urgentClients.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    {urgentClients.map(c => {
                        const next = getNextBillingDate(c.joiningDate);
                        const days = differenceInDays(next, new Date());
                        return (
                            <div key={c._id} className="alert alert-warning" style={{ padding: '16px 18px', borderRadius: 14, marginBottom: 10, alignItems: 'center' }}>
                                <div style={{ fontSize: '1.25rem' }}>💰</div>
                                <div style={{ flex: 1 }}>
                                    <div className="alert-title">{c.name} — Payment Due {days === 0 ? 'Today!' : `in ${days} day${days === 1 ? '' : 's'}`}</div>
                                    <div className="alert-body">Billing date: {format(next, 'MMMM dd, yyyy')} · ₹{c.monthlyFee?.toLocaleString()}/month</div>
                                </div>
                                <button className="btn btn-sm" style={{ background: 'var(--warning)', color: 'white', fontWeight: 700, flexShrink: 0 }}
                                    onClick={() => { setBillingClient(c); setBillingForm(f => ({ ...f, amount: String(c.monthlyFee || '') })); }}>
                                    💳 Record Payment
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Clients', value: clients.length, icon: '👥', color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Active', value: clients.filter(c => c.isActive).length, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Monthly Revenue', value: `₹${totalMRR.toLocaleString()}`, icon: '💰', color: '#7c3aed', bg: '#faf5ff', raw: true },
                    { label: 'Due This Week', value: urgentClients.length, icon: '⏰', color: urgentClients.length > 0 ? '#d97706' : '#16a34a', bg: urgentClients.length > 0 ? '#fffbeb' : '#f0fdf4' },
                ].map(s => (
                    <div key={s.label} className="stat-card card-hover">
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1.5px solid ${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{s.icon}</div>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ fontSize: '1.75rem', color: s.color }}>{s.raw ? s.value : (s.value as number).toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="search-bar">
                <div className="search-input-wrap">
                    <span className="search-icon-inside">🔍</span>
                    <input className="search-input" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Client Grid */}
            {loading ? <div className="empty-state">Loading clients...</div> : filtered.length === 0 ? (
                <div className="card card-p"><div className="empty-state"><div className="empty-icon">💼</div><div className="empty-title">No clients yet</div><button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowAddModal(true)}>Add First Client</button></div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {filtered.map(client => {
                        const next = client.joiningDate ? getNextBillingDate(client.joiningDate) : null;
                        const days = next ? differenceInDays(next, new Date()) : 30;
                        const isUrgent = days <= 3;
                        const isWarning = days <= 7 && days > 3;
                        const lastPayment = client.payments?.[client.payments.length - 1];
                        const serviceList = Array.isArray(client.services) && client.services.length > 0
                            ? client.services.map((s: any) => `${s.name}`).join(', ')
                            : (typeof client.services === 'string' ? client.services : '');

                        return (
                            <div key={client._id} className="card card-p" style={{ border: isUrgent ? '1.5px solid rgba(255,59,48,0.3)' : isWarning ? '1.5px solid rgba(255,149,0,0.3)' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }} onClick={() => setSelectedClient(client)}>
                                        <div className="avatar avatar-md avatar-gradient-1">{client.name?.[0]}</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>{client.name}</div>
                                            {client.contactName && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{client.contactName}</div>}
                                            <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: 4 }}>{client.isActive ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>₹{(client.monthlyFee || 0).toLocaleString()}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>per month</div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={e => { e.stopPropagation(); openEdit(client); }}>✏️ Edit</button>
                                            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '3px 8px', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }} onClick={e => handleDeleteClient(client._id, e)} title="Delete Client">🗑️</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Services */}
                                {serviceList && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>{serviceList}</div>}

                                {/* Last payment */}
                                {lastPayment && (
                                    <div style={{ padding: '7px 10px', background: 'var(--success-light)', borderRadius: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#1a8240' }}>✓ Last paid: ₹{lastPayment.amount?.toLocaleString()}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#1a8240' }}>{format(new Date(lastPayment.date), 'MMM dd')}</span>
                                    </div>
                                )}

                                <hr className="divider" style={{ margin: '0 0 12px 0' }} />

                                {/* Footer */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ cursor: 'pointer' }} onClick={() => setSelectedClient(client)}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Next billing</div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{next ? format(next, 'MMM dd, yyyy') : '—'}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ padding: '4px 10px', borderRadius: 99, fontWeight: 700, fontSize: '0.75rem', background: isUrgent ? 'var(--danger-light)' : isWarning ? 'var(--warning-light)' : 'var(--success-light)', color: isUrgent ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)' }}>
                                            {days === 0 ? 'Today!' : `${days}d left`}
                                        </div>
                                        <button className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                                            onClick={e => { e.stopPropagation(); setBillingClient(client); setBillingForm(f => ({ ...f, amount: String(client.monthlyFee || '') })); }}>
                                            💳 Pay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== RECORD PAYMENT MODAL ===== */}
            {billingClient && (
                <div className="modal-overlay" onClick={() => setBillingClient(null)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <div className="modal-title">💳 Record Payment</div>
                                <div className="modal-subtitle">{billingClient.name}</div>
                            </div>
                            <button type="button" className="modal-close" onClick={() => setBillingClient(null)}>
                                <span style={{ fontSize: 24, lineHeight: 1 }}>×</span>
                            </button>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                                    <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Monthly Fee</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>₹{(billingClient.monthlyFee || 0).toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Next Billing</div>
                                        <div style={{ fontWeight: 700 }}>{billingClient.joiningDate ? format(getNextBillingDate(billingClient.joiningDate), 'MMM dd, yyyy') : '—'}</div>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 14 }}>
                                    <label className="form-label-premium">amount received (₹) *</label>
                                    <input
                                        type="number" required min="1"
                                        className="form-input"
                                        style={{ fontSize: '1.25rem', fontWeight: 700 }}
                                        placeholder={String(billingClient.monthlyFee || 0)}
                                        value={billingForm.amount}
                                        onChange={e => setBillingForm({ ...billingForm, amount: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 14 }}>
                                    <label className="form-label-premium">payment date *</label>
                                    <input
                                        type="date" required
                                        className="form-input"
                                        value={billingForm.date}
                                        onChange={e => setBillingForm({ ...billingForm, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label-premium">note (optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. UPI, Bank Transfer, Cash..."
                                        value={billingForm.note}
                                        onChange={e => setBillingForm({ ...billingForm, note: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setBillingClient(null)}>Cancel</button>
                                <button type="submit" className="btn btn-premium" disabled={billingSaving} style={{ background: 'var(--success)', boxShadow: '0 2px 8px rgba(48,209,88,0.3)' }}>
                                    {billingSaving ? '⏳ Saving...' : '✓ Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== ADD CLIENT MODAL ===== */}
            {showAddModal && <ClientFormModal
                isEdit={false}
                form={form}
                setForm={setForm}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAdd}
                formMonthlyFee={formMonthlyFee}
            />}

            {/* ===== EDIT CLIENT MODAL ===== */}
            {editClient && <ClientFormModal
                isEdit={true}
                form={form}
                setForm={setForm}
                onClose={() => setEditClient(null)}
                onSubmit={handleEdit}
                editClient={editClient}
                formMonthlyFee={formMonthlyFee}
            />}

            {/* ===== CLIENT DETAIL MODAL ===== */}
            {selectedClient && (
                <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                <div className="avatar avatar-lg avatar-gradient-1">{selectedClient.name?.[0]}</div>
                                <div>
                                    <div className="modal-title">{selectedClient.name}</div>
                                    <div className="modal-subtitle">{selectedClient.contactName || 'No contact person set'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(selectedClient)}>✏️ Edit</button>
                                <button type="button" className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => handleDeleteClient(selectedClient._id)}>🗑️ Delete</button>
                                <button type="button" className="modal-close" onClick={() => setSelectedClient(null)}>
                                    <span style={{ fontSize: 24, lineHeight: 1 }}>×</span>
                                </button>
                            </div>
                        </div>
                        <div className="modal-body">
                            {/* Key info grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                {[
                                    { label: 'Monthly Fee', value: `₹${(selectedClient.monthlyFee || 0).toLocaleString()}`, icon: '💰', highlighted: true },
                                    { label: 'Status', value: selectedClient.isActive ? '✅ Active' : '❌ Inactive', icon: '📌' },
                                    { label: 'Joining Date', value: selectedClient.joiningDate ? format(new Date(selectedClient.joiningDate), 'MMM dd, yyyy') : '—', icon: '📅' },
                                    { label: 'Next Billing', value: selectedClient.joiningDate ? format(getNextBillingDate(selectedClient.joiningDate), 'MMM dd, yyyy') : '—', icon: '🔔' },
                                    ...(selectedClient.email ? [{ label: 'Email', value: selectedClient.email, icon: '📧' }] : []),
                                    ...(selectedClient.phone ? [{ label: 'Phone', value: selectedClient.phone, icon: '📞' }] : []),
                                ].map(f => (
                                    <div key={f.label} style={{ padding: '12px 14px', background: (f as any).highlighted ? 'rgba(48,209,88,0.08)' : 'var(--bg-secondary)', borderRadius: 12, border: (f as any).highlighted ? '1px solid rgba(48,209,88,0.2)' : '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{f.icon} {f.label}</div>
                                        <div style={{ fontWeight: 700, color: (f as any).highlighted ? 'var(--success)' : 'var(--text-primary)' }}>{f.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Services */}
                            {Array.isArray(selectedClient.services) && selectedClient.services.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 8 }}>🛠️ Services</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {selectedClient.services.map((s: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                                                <div>
                                                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 6 }}>· {s.category || s.tier}</span>
                                                </div>
                                                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{(s.price || 0).toLocaleString()}/mo</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedClient.notes && (
                                <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>📝 Notes</div>
                                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{selectedClient.notes}</div>
                                </div>
                            )}

                            {/* Payment History */}
                            {selectedClient.payments?.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 8 }}>💳 Payment History</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {[...selectedClient.payments].reverse().slice(0, 8).map((p: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                                                <div>
                                                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.amount?.toLocaleString()}</span>
                                                    {p.note && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>{p.note}</span>}
                                                </div>
                                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{format(new Date(p.date), 'MMM dd, yyyy')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Client Form Modal (Extracted to top-level to fix focus/render issue) ──────────────────────
function ClientFormModal({
    isEdit,
    form,
    setForm,
    onClose,
    onSubmit,
    editClient,
    formMonthlyFee
}: {
    isEdit: boolean;
    form: any;
    setForm: any;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editClient?: any;
    formMonthlyFee: number;
}) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <div className="modal-title">{isEdit ? '✏️ Edit Client' : '➕ Add New Client'}</div>
                        <div className="modal-subtitle">{isEdit ? `Editing ${editClient?.name}` : 'Set up client profile and services'}</div>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose}>
                        <span style={{ fontSize: 24, lineHeight: 1 }}>×</span>
                    </button>
                </div>
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' }}>
                    <div className="modal-body">

                        {/* Client Info */}
                        <div style={{ marginBottom: 20 }}>
                            <div className="form-label-premium">client info</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, marginBottom: 12 }}>
                                <div className="form-group">
                                    <label className="form-label-premium">business name *</label>
                                    <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Choice Salon" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label-premium">contact person</label>
                                    <input className="form-input" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} placeholder="Owner / Admin name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label-premium">email</label>
                                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label-premium">phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 900 000 0000" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label-premium">joining date</label>
                                    <input className="form-input" type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label-premium">status</label>
                                    <select className="form-input" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}>
                                        <option value="active">✅ Active</option>
                                        <option value="inactive">❌ Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Services Catalog */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div className="form-label-premium">services</div>
                                {formMonthlyFee > 0 && (
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--success)' }}>
                                        Total: ₹{formMonthlyFee.toLocaleString()}/mo
                                    </div>
                                )}
                            </div>
                            <ServiceEditor services={form.services} onChange={s => setForm({ ...form, services: s })} />
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <label className="form-label-premium">notes (optional)</label>
                            <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any special terms, agreements, or context..." />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-premium">
                            {isEdit ? '✓ Save Changes' : '✓ Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
