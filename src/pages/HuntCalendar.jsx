import React, { useState, useMemo } from 'react';
import {
  Calendar, Plus, Trash2, Bell, Clock, ChevronLeft, ChevronRight,
  Repeat, Mail, CheckCircle, AlertCircle, Sparkles, Edit2, X,
} from 'lucide-react';
import { useApp, ACTIONS } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { HUNT_CATEGORIES } from '../data/huntTemplates';
import './HuntCalendar.css';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQUENCIES   = [
  { value: 'weekly',    label: 'Weekly' },
  { value: 'biweekly',  label: 'Every 2 weeks' },
  { value: 'monthly',   label: 'Monthly' },
];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function HuntCalendar() {
  const { state, syncDispatch, addToast } = useApp();
  const { user } = useAuth();
  const [showForm, setShowForm]   = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const schedules = state.huntSchedules || [];

  // ── Calendar grid ──────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const days  = [];

    // Pad start
    for (let i = 0; i < first.getDay(); i++) days.push(null);

    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      // Find scheduled hunts for this day
      const daySchedules = schedules.filter(s => {
        if (!s.active) return false;
        const startDate = new Date(s.startDate);
        if (date < startDate) return false;
        if (s.frequency === 'weekly') return s.dayOfWeek === dayOfWeek;
        if (s.frequency === 'biweekly') {
          const diffMs   = date - startDate;
          const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
          return s.dayOfWeek === dayOfWeek && diffWeeks % 2 === 0;
        }
        if (s.frequency === 'monthly') {
          return date.getDate() === startDate.getDate();
        }
        return false;
      });
      days.push({ date, daySchedules });
    }
    return days;
  }, [currentMonth, schedules]);

  function handleDelete(scheduleId) {
    syncDispatch({ type: ACTIONS.DELETE_SCHEDULE, scheduleId });
    addToast('Schedule removed', 'info');
  }

  function handleToggle(schedule) {
    syncDispatch({
      type: ACTIONS.UPDATE_SCHEDULE,
      schedule: { ...schedule, active: !schedule.active },
    });
    addToast(schedule.active ? 'Schedule paused' : 'Schedule activated', 'success');
  }

  const today = new Date();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title"><Calendar size={22} /> Hunt Calendar</h1>
          <p className="page-subtitle">Schedule recurring hunts and get email reminders on your chosen days</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditSchedule(null); setShowForm(true); }}>
          <Plus size={15} /> New Schedule
        </button>
      </div>

      <div className="hunt-calendar-layout">
        {/* ── Left: Calendar ── */}
        <div className="hunt-calendar-main">
          {/* Month nav */}
          <div className="hunt-calendar-month-nav">
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>
              <ChevronLeft size={16} />
            </button>
            <h2 className="hunt-calendar-month-title">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="hunt-calendar-grid">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="hunt-calendar-day-header">{d.slice(0,3)}</div>
            ))}

            {/* Calendar cells */}
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="hunt-calendar-cell empty" />;
              const isToday = day.date.toDateString() === today.toDateString();
              return (
                <div key={i} className={`hunt-calendar-cell ${isToday ? 'today' : ''}`}>
                  <span className="hunt-calendar-date">{day.date.getDate()}</span>
                  {day.daySchedules.map(s => (
                    <div key={s.id} className="hunt-calendar-event" title={s.huntName}>
                      <span className="hunt-calendar-event-dot" style={{ background: HUNT_CATEGORIES.find(c => c.id === s.category)?.color || 'var(--accent-primary)' }} />
                      <span className="hunt-calendar-event-label">{s.huntName}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Schedules list ── */}
        <div className="hunt-calendar-sidebar">
          <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
            <Repeat size={15} style={{ display:'inline', marginRight: 6 }} />
            Active Schedules
          </h3>

          {schedules.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)', minHeight: 'unset' }}>
              <div className="empty-state-icon"><Calendar size={22} /></div>
              <div className="empty-state-title" style={{ fontSize: 'var(--text-sm)' }}>No schedules yet</div>
              <div className="empty-state-description">Create a schedule to get recurring reminders.</div>
            </div>
          ) : (
            <div className="hunt-schedule-list">
              {schedules.map(s => (
                <ScheduleCard
                  key={s.id}
                  schedule={s}
                  onDelete={() => handleDelete(s.id)}
                  onToggle={() => handleToggle(s)}
                  onEdit={() => { setEditSchedule(s); setShowForm(true); }}
                />
              ))}
            </div>
          )}

          {/* Email note */}
          <div className="hunt-calendar-email-note">
            <Mail size={13} />
            <span>Reminders are sent to <strong>{user?.email || 'your account email'}</strong></span>
          </div>
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <ScheduleFormModal
          initial={editSchedule}
          userEmail={user?.email}
          onClose={() => { setShowForm(false); setEditSchedule(null); }}
          onSave={(schedule) => {
            if (editSchedule) {
              syncDispatch({ type: ACTIONS.UPDATE_SCHEDULE, schedule: { ...editSchedule, ...schedule } });
              addToast('Schedule updated', 'success');
            } else {
              const newSchedule = {
                ...schedule,
                id: `sch-${Date.now()}`,
                createdAt: new Date().toISOString(),
                active: true,
                userEmail: user?.email || '',
              };
              syncDispatch({ type: ACTIONS.ADD_SCHEDULE, schedule: newSchedule });
              addToast('Schedule created — reminders will be sent on schedule', 'success');
            }
            setShowForm(false);
            setEditSchedule(null);
          }}
        />
      )}
    </div>
  );
}

// ── Schedule Card ─────────────────────────────────────────────────────────────
function ScheduleCard({ schedule, onDelete, onToggle, onEdit }) {
  const category = HUNT_CATEGORIES.find(c => c.id === schedule.category);
  const freq = FREQUENCIES.find(f => f.value === schedule.frequency);

  return (
    <div className={`hunt-schedule-card ${!schedule.active ? 'paused' : ''}`}>
      <div className="hunt-schedule-card-accent" style={{ background: category?.color || 'var(--accent-primary)' }} />
      <div className="hunt-schedule-card-body">
        <div className="hunt-schedule-card-header">
          <div className="hunt-schedule-card-name">{schedule.huntName}</div>
          <div className="hunt-schedule-card-actions">
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title="Edit"><Edit2 size={12} /></button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title="Delete" style={{ color: 'var(--severity-critical)' }}><Trash2 size={12} /></button>
          </div>
        </div>
        <div className="hunt-schedule-card-meta">
          <span><Clock size={11} /> {freq?.label} on {DAYS_OF_WEEK[schedule.dayOfWeek]}</span>
          {schedule.emailReminder && <span><Mail size={11} /> Email reminder</span>}
        </div>
        {schedule.notes && (
          <p className="hunt-schedule-card-notes">{schedule.notes}</p>
        )}
        <div className="hunt-schedule-card-footer">
          <span className={`hunt-schedule-status ${schedule.active ? 'active' : 'paused'}`}>
            {schedule.active ? <><CheckCircle size={10} /> Active</> : <><AlertCircle size={10} /> Paused</>}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ fontSize: '10px' }}>
            {schedule.active ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Form Modal ───────────────────────────────────────────────────────
function ScheduleFormModal({ initial, userEmail, onClose, onSave }) {
  const [huntName,      setHuntName]      = useState(initial?.huntName      || '');
  const [category,      setCategory]      = useState(initial?.category      || 'endpoint');
  const [frequency,     setFrequency]     = useState(initial?.frequency     || 'weekly');
  const [dayOfWeek,     setDayOfWeek]     = useState(initial?.dayOfWeek     ?? 4); // Thursday
  const [startDate,     setStartDate]     = useState(initial?.startDate     || new Date().toISOString().split('T')[0]);
  const [emailReminder, setEmailReminder] = useState(initial?.emailReminder ?? true);
  const [notes,         setNotes]         = useState(initial?.notes         || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!huntName.trim()) return;
    onSave({ huntName, category, frequency, dayOfWeek: Number(dayOfWeek), startDate, emailReminder, notes });
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hunt-calendar-form-modal">
        <div className="hunt-calendar-form-header">
          <h2 className="hunt-calendar-form-title">
            <Sparkles size={16} /> {initial ? 'Edit Schedule' : 'New Hunt Schedule'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form className="hunt-calendar-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Hunt Name <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Lateral Movement Weekly Hunt"
              value={huntName}
              onChange={e => setHuntName(e.target.value)}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {HUNT_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select className="form-select" value={frequency} onChange={e => setFrequency(e.target.value)}>
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Day of Week</label>
              <select className="form-select" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
                {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="What to focus on during this hunt..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="hunt-calendar-form-email-toggle">
            <label className="hunt-calendar-email-label">
              <input
                type="checkbox"
                checked={emailReminder}
                onChange={e => setEmailReminder(e.target.checked)}
              />
              <Mail size={14} />
              <span>Send email reminder to <strong>{userEmail || 'your email'}</strong></span>
            </label>
            <p className="form-hint">You'll receive a reminder email on the scheduled day with hunt details and a direct link.</p>
          </div>

          <div className="hunt-calendar-form-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle size={14} /> {initial ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
