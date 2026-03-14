"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useUser } from '@/components/UserContext';

const USERS = ['Moksh', 'smit'] as const;
type User = typeof USERS[number];

export default function TeamGoalsPage() {
    const { currentUser } = useUser();
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Legacy support for older records without tasks array
    const [completingId, setCompletingId] = useState<string | null>(null);
    const [completedText, setCompletedText] = useState('');

    // Inline edit state
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [editTasks, setEditTasks] = useState<any[]>([]);

    // New form state supporting dynamic tasks
    const [form, setForm] = useState({
        user: 'Moksh' as User,
        date: new Date().toISOString().split('T')[0],
        timeJoinedOffice: '',
        tasks: [{ text: '', isCompleted: false }]
    });

    const fetchGoals = async () => {
        const res = await fetch('/api/team-goals');
        const json = await res.json();
        if (json.success) setGoals(json.data);
        setLoading(false);
    };

    useEffect(() => { fetchGoals(); }, []);

    // Add, update, remove tasks in form
    const addTask = () => setForm({ ...form, tasks: [...form.tasks, { text: '', isCompleted: false }] });
    const updateTask = (index: number, text: string) => {
        const newTasks = [...form.tasks];
        newTasks[index].text = text;
        setForm({ ...form, tasks: newTasks });
    };
    const removeTask = (index: number) => {
        if (form.tasks.length <= 1) return;
        setForm({ ...form, tasks: form.tasks.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // filter out completely empty tasks
        const payload = {
            ...form,
            tasks: form.tasks.filter(t => t.text.trim() !== '')
        };

        await fetch('/api/team-goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        setShowModal(false);
        setForm({ user: 'Moksh', date: new Date().toISOString().split('T')[0], timeJoinedOffice: '', tasks: [{ text: '', isCompleted: false }] });
        fetchGoals();
    };

    // Inline edit operations
    const startEditingTasks = (goal: any) => {
        setEditingGoalId(goal._id);
        setEditTasks(goal.tasks && goal.tasks.length > 0 ? JSON.parse(JSON.stringify(goal.tasks)) : [{ text: '', isCompleted: false }]);
    };

    const saveEditedTasks = async (goalId: string) => {
        const validTasks = editTasks.filter(t => t.text.trim() !== '');

        // Optimistic
        setGoals(goals.map(g => g._id === goalId ? { ...g, tasks: validTasks } : g));
        setEditingGoalId(null);

        await fetch('/api/team-goals', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-user': currentUser },
            body: JSON.stringify({ id: goalId, tasks: validTasks })
        });
    };

    // Toggle individual task completion directly
    const toggleTaskComplete = async (goalId: string, taskId: string, isCompleted: boolean) => {
        // Optimistic update
        const goalIndex = goals.findIndex(g => g._id === goalId);
        if (goalIndex === -1) return;

        const updatedGoals = [...goals];
        const goal = updatedGoals[goalIndex];
        const updatedTasks = goal.tasks.map((t: any) =>
            t._id === taskId ? { ...t, isCompleted } : t
        );

        updatedGoals[goalIndex] = { ...goal, tasks: updatedTasks };
        setGoals(updatedGoals);

        // API call
        await fetch('/api/team-goals', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-user': currentUser },
            body: JSON.stringify({ id: goalId, tasks: updatedTasks })
        });
    };

    // Legacy manual complete
    const markCompleteLegacy = async (id: string) => {
        await fetch('/api/team-goals', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, completedGoals: completedText })
        });
        setCompletingId(null);
        setCompletedText('');
        fetchGoals();
    };

    const todayStr = new Date().toDateString();
    const todayGoals = goals.filter(g => new Date(g.date).toDateString() === todayStr);
    const history = goals.filter(g => new Date(g.date).toDateString() !== todayStr);

    // Calculate completion 
    const calculateTaskProgress = (entry: any) => {
        if (!entry.tasks || entry.tasks.length === 0) {
            // fallback to legacy
            return entry.completedGoals ? 100 : 0;
        }
        const completed = entry.tasks.filter((t: any) => t.isCompleted).length;
        return Math.round((completed / entry.tasks.length) * 100);
    };

    const totalTasksAcrossAll = goals.reduce((acc, g) => acc + (g.tasks?.length || (g.completedGoals ? 1 : 1)), 0);
    const totalCompletedAcrossAll = goals.reduce((acc, g) => acc + (g.tasks?.filter((t: any) => t.isCompleted).length || (g.completedGoals ? 1 : 0)), 0);
    const overallCompletionRate = totalTasksAcrossAll > 0 ? Math.round((totalCompletedAcrossAll / totalTasksAcrossAll) * 100) : 0;
    const totalDays = new Set(goals.map(g => new Date(g.date).toDateString())).size;

    return (
        <div className="animate-in">
            {/* Dark glassmorphic hero */}
            <div className="card" style={{ padding: '32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.5rem', padding: '6px', background: 'rgba(168,85,247,0.1)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>🏆</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '3px 12px', borderRadius: 99, color: '#d8b4fe' }}>
                            {overallCompletionRate}% Overall Completion
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px 0', background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Team Goals</h1>
                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px 0' }}>Daily office tracking for Moksh & Smit</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn" style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none', boxShadow: '0 4px 16px rgba(168,85,247,0.35)', fontWeight: 700 }} onClick={() => setShowModal(true)}>+ Log Today</button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {[
                    { label: 'Total Days', value: totalDays, icon: '📅', color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Completion Rate', value: `${overallCompletionRate}%`, icon: '✅', color: overallCompletionRate >= 70 ? '#16a34a' : '#d97706', bg: overallCompletionRate >= 70 ? '#f0fdf4' : '#fffbeb' },
                    { label: 'Moksh Logs', value: goals.filter(g => g.user === 'Moksh').length, icon: '👤', color: '#7c3aed', bg: '#faf5ff' },
                    { label: 'Smit Logs', value: goals.filter(g => g.user === 'smit').length, icon: '👤', color: '#0284c7', bg: '#f0f9ff' },
                ].map(s => (
                    <div key={s.label} className="stat-card card-hover" style={{ borderRadius: 'var(--radius-xl)' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1.5px solid ${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{s.icon}</div>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ fontSize: '1.75rem', color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Today's Cards */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Today — {format(new Date(), 'EEEE, MMMM d')}</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                    {USERS.map(user => {
                        const entry = todayGoals.find(g => g.user === user);
                        const gradClass = user === 'Moksh' ? 'avatar-gradient-1' : 'avatar-gradient-2';

                        let progress = 0;
                        let allDone = false;
                        if (entry) {
                            progress = calculateTaskProgress(entry);
                            allDone = progress === 100;
                        }

                        return (
                            <div key={user} className="card card-p card-hover" style={{ border: entry ? '1.5px solid rgba(0,113,227,0.15)' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div className={`avatar avatar-md ${gradClass}`}>{user[0]}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user}</div>
                                        {entry && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>🕐 Joined at {entry.timeJoinedOffice}</div>}
                                    </div>
                                    {entry && (
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`badge ${allDone ? 'badge-success' : 'badge-warning'}`}>
                                                {allDone ? '✓ All Done' : `${progress}% Done`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {!entry ? (
                                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
                                        <div style={{ fontSize: 28, marginBottom: 8 }}>☀️</div>
                                        <div style={{ fontSize: '0.875rem', marginBottom: 12 }}>No log for today yet</div>
                                        <button className="btn btn-primary btn-sm" onClick={() => { setForm(f => ({ ...f, user })); setShowModal(true); }}>Log Check-In</button>
                                    </div>
                                ) : (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 10 }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily Tasks</div>
                                            {(entry.tasks && entry.tasks.length > 0 && editingGoalId !== entry._id) && (
                                                <button onClick={() => startEditingTasks(entry)} style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>✏️ Edit</button>
                                            )}
                                        </div>

                                        {editingGoalId === entry._id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-hover)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                                {editTasks.map((task, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: 6 }}>
                                                        <input
                                                            className="form-input"
                                                            style={{ padding: '6px 10px', fontSize: '0.875rem' }}
                                                            placeholder="Task description..."
                                                            value={task.text}
                                                            onChange={e => {
                                                                const newTasks = [...editTasks];
                                                                newTasks[idx].text = e.target.value;
                                                                setEditTasks(newTasks);
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditTasks(editTasks.filter((_, i) => i !== idx))}
                                                            style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--danger)', fontSize: '1.2rem', paddingBottom: 2 }}
                                                        >×</button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => setEditTasks([...editTasks, { text: '', isCompleted: false }])} style={{ margin: '4px 0', padding: '6px', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>+ Add task</button>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => saveEditedTasks(entry._id)}>Save Changes</button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingGoalId(null)}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : entry.tasks && entry.tasks.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {entry.tasks.map((task: any) => (
                                                    <label
                                                        key={task._id}
                                                        style={{
                                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                                            padding: '10px 12px', borderRadius: 8,
                                                            background: task.isCompleted ? 'var(--success-light)' : 'var(--surface-hover)',
                                                            border: task.isCompleted ? '1px solid rgba(48,209,88,0.2)' : '1px solid transparent',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={task.isCompleted}
                                                            onChange={(e) => toggleTaskComplete(entry._id, task._id, e.target.checked)}
                                                            style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--success)' }}
                                                        />
                                                        <span style={{
                                                            fontSize: '0.9rem',
                                                            color: task.isCompleted ? '#1a8240' : 'var(--text-primary)',
                                                            textDecoration: task.isCompleted ? 'line-through' : 'none',
                                                            opacity: task.isCompleted ? 0.8 : 1
                                                        }}>
                                                            {task.text}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Legacy purely text-based support */
                                            <>
                                                <p style={{ fontSize: '0.9375rem', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: 16 }}>{entry.dailyGoals}</p>
                                                {entry.completedGoals ? (
                                                    <div style={{ padding: '12px 14px', background: 'var(--success-light)', borderRadius: 10, border: '1px solid rgba(48,209,88,0.2)' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a8240', marginBottom: 6 }}>✓ COMPLETED</div>
                                                        <p style={{ fontSize: '0.875rem', color: '#1a8240', whiteSpace: 'pre-wrap' }}>{entry.completedGoals}</p>
                                                    </div>
                                                ) : completingId === entry._id ? (
                                                    <div style={{ marginTop: 'auto' }}>
                                                        <textarea className="form-input" rows={3} placeholder="What goals did you complete today?" value={completedText} onChange={e => setCompletedText(e.target.value)} style={{ marginBottom: 10 }} />
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button className="btn btn-success btn-sm" onClick={() => markCompleteLegacy(entry._id)}>Save Complete</button>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => setCompletingId(null)}>Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem', marginTop: 'auto' }} onClick={() => setCompletingId(entry._id)}>✅ Mark Complete</button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* History Table */}
            {history.length > 0 && (
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>History</h2>
                    <div className="card table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Team Member</th>
                                    <th>Date</th>
                                    <th>Joined At</th>
                                    <th>Tasks</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(g => {
                                    const progress = calculateTaskProgress(g);
                                    let taskPreview = g.dailyGoals;
                                    if (g.tasks && g.tasks.length > 0) {
                                        taskPreview = g.tasks.map((t: any) => t.text).join(' • ');
                                    }

                                    return (
                                        <tr key={g._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div className={`avatar avatar-sm ${g.user === 'Moksh' ? 'avatar-gradient-1' : 'avatar-gradient-2'}`}>{g.user[0]}</div>
                                                    <span style={{ fontWeight: 700 }}>{g.user}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{format(new Date(g.date), 'MMM dd, yyyy')}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{g.timeJoinedOffice}</td>
                                            <td style={{ maxWidth: 300 }}>
                                                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                    {taskPreview || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 60, height: 6, background: 'var(--surface-hover)', borderRadius: 99, overflow: 'hidden' }}>
                                                        <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? 'var(--success)' : 'var(--accent)', borderRadius: 99 }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: progress === 100 ? 'var(--success)' : 'var(--text-secondary)' }}>{progress}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Log Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div><div className="modal-title">Log Daily Goals</div><div className="modal-subtitle">Track your work day tasks</div></div>
                            <button type="button" className="modal-close" onClick={() => setShowModal(false)}>
                                <span style={{ fontSize: 24, lineHeight: 1 }}>×</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' }}>
                            <div className="modal-body">
                                <div className="form-row cols-2 mb-4">
                                    <div className="form-group">
                                        <label className="form-label-premium">Team Member *</label>
                                        <select className="form-input" value={form.user} onChange={e => setForm({ ...form, user: e.target.value as User })}>
                                            {USERS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label-premium">Date</label>
                                        <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group mb-5">
                                    <label className="form-label-premium">Time Joined Office *</label>
                                    <input type="time" className="form-input" required value={form.timeJoinedOffice} onChange={e => setForm({ ...form, timeJoinedOffice: e.target.value })} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label-premium" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'baseline' }}>
                                        <span>daily tasks *</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Break down your day</span>
                                    </label>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                                        {form.tasks.map((task, idx) => (
                                            <div key={`task-input-${idx}`} style={{ display: 'flex', gap: 8 }}>
                                                <input
                                                    className="form-input"
                                                    placeholder={idx === 0 ? "e.g. Call 100 prospects" : idx === 1 ? "e.g. Send 50 emails" : "Add task..."}
                                                    value={task.text}
                                                    onChange={e => updateTask(idx, e.target.value)}
                                                    autoFocus={idx !== 0 && idx === form.tasks.length - 1} // Auto-focus new task
                                                    required={idx === 0} // Only first task is strictly required
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() => removeTask(idx)}
                                                    style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', opacity: form.tasks.length <= 1 ? 0.5 : 1 }}
                                                    disabled={form.tasks.length <= 1}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addTask}
                                        style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-tertiary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    >
                                        + Add another task
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-premium">Save Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
