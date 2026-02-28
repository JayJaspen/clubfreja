'use client';
import { useState, useEffect } from 'react';

const GENDER_MAP: Record<string, string> = { male: 'Man', female: 'Kvinna', other: 'Annat' };
const CIVIL_MAP: Record<string, string> = { single: 'Singel', taken: 'Upptagen', undisclosed: 'Vill ej ange' };

export default function AdminPage() {
  const [tab, setTab] = useState<'pending' | 'members' | 'statistics' | 'events'>('pending');

  const tabs = [
    { key: 'pending', label: 'Ansökningar' },
    { key: 'members', label: 'Medlemmar' },
    { key: 'statistics', label: 'Statistik' },
    { key: 'events', label: 'Skapa Event' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="grain" />

      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1"/><text x="20" y="26" fontFamily="Cinzel" fontSize="18" fontWeight="700" textAnchor="middle" fill="currentColor">F</text></svg>
          <h1>Club Freja <span style={{ fontSize: '.7rem', color: 'var(--gold-light)', opacity: .5, fontFamily: 'var(--font-body)' }}>Admin</span></h1>
        </div>
        <div className="user-pill">
          <div className="avatar">A</div>
          <button className="logout-btn" onClick={async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/'; }}>Logga ut</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key as any)}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        {tab === 'pending' && <PendingTab />}
        {tab === 'members' && <MembersTab />}
        {tab === 'statistics' && <StatisticsTab />}
        {tab === 'events' && <EventsTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PENDING APPLICATIONS TAB
   ═══════════════════════════════════════ */
function PendingTab() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/applications');
    const data = await res.json();
    setApps(data.applications || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (userId: number, action: 'approve' | 'reject', name: string) => {
    if (action === 'reject' && !confirm(`Neka ${name}s ansökan?`)) return;
    await fetch('/api/admin/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    load();
  };

  return (
    <>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Väntande ansökningar</h2>
          <button className="btn btn-outline btn-sm" onClick={load}>Uppdatera</button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--gold-light)', padding: '2rem', opacity: .6 }}>Laddar…</p>
      ) : apps.length === 0 ? (
        <div className="panel"><p style={{ textAlign: 'center', fontStyle: 'italic', opacity: .6 }}>Inga väntande ansökningar</p></div>
      ) : (
        apps.map(app => (
          <div className="app-card" key={app.id}>
            <div>
              <h3>{app.name}</h3>
              <p><strong>E-post:</strong> {app.email}</p>
              <p><strong>Telefon:</strong> {app.phone}</p>
              <p><strong>Födelseår:</strong> {app.birth_year}</p>
              <p><strong>Kön:</strong> {GENDER_MAP[app.gender] || app.gender}</p>
              <p><strong>Civilstatus:</strong> {CIVIL_MAP[app.civil_status] || app.civil_status}</p>
              <p><strong>Ort:</strong> {app.city || '—'}</p>
              <p><strong>Län:</strong> {app.county}</p>
              <p style={{ fontSize: '.85rem', opacity: .5, marginTop: '.5rem' }}>
                Ansökte: {new Date(app.created_at).toLocaleDateString('sv-SE')}
              </p>
            </div>
            <div className="app-actions">
              <button className="btn-approve" onClick={() => handleAction(app.id, 'approve', app.name)}>✓ Godkänn</button>
              <button className="btn-reject" onClick={() => handleAction(app.id, 'reject', app.name)}>✗ Neka</button>
            </div>
          </div>
        ))
      )}
    </>
  );
}

/* ═══════════════════════════════════════
   MEMBERS TAB
   ═══════════════════════════════════════ */
function MembersTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/members');
    const data = await res.json();
    setMembers(data.members || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Radera ${name}? Detta kan inte ångras.`)) return;
    await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' });
    load();
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="panel">
      <h2>Alla medlemmar</h2>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--gold-light)', padding: '2rem', opacity: .6 }}>Laddar…</p>
      ) : members.length === 0 ? (
        <p style={{ textAlign: 'center', fontStyle: 'italic', opacity: .6, padding: '2rem' }}>Inga medlemmar ännu</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Namn</th>
                <th>E-post</th>
                <th>Ålder</th>
                <th>Kön</th>
                <th>Län</th>
                <th>Status</th>
                <th>Registrerad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{currentYear - m.birth_year} år</td>
                  <td>{GENDER_MAP[m.gender] || m.gender}</td>
                  <td>{m.county}</td>
                  <td>
                    <span className={`badge ${m.status === 'approved' ? 'badge-ok' : m.status === 'pending' ? 'badge-pending' : 'badge-rejected'}`}>
                      {m.status === 'approved' ? 'Godkänd' : m.status === 'pending' ? 'Väntande' : 'Nekad'}
                    </span>
                  </td>
                  <td>{new Date(m.created_at).toLocaleDateString('sv-SE')}</td>
                  <td>
                    <button className="btn-reject" style={{ fontSize: '.8rem', padding: '.3rem .8rem' }}
                      onClick={() => handleDelete(m.id, m.name)}>Radera</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   STATISTICS TAB
   ═══════════════════════════════════════ */
function StatisticsTab() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/statistics').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <p style={{ textAlign: 'center', color: 'var(--gold-light)', padding: '2rem', opacity: .6 }}>Laddar…</p>;

  const genderColors: Record<string, string> = { male: '#2196F3', female: '#E91E63', other: '#9C27B0' };
  const genderIcons: Record<string, string> = { male: '👨', female: '👩', other: '⚧' };

  const sortedCounties = Object.entries(stats.countyCounts as Record<string, number>).sort((a, b) => b[1] - a[1]);
  const maxCounty = sortedCounties.length > 0 ? sortedCounties[0][1] : 1;

  return (
    <>
      <div className="panel">
        <h2>Medlemsstatistik</h2>

        {/* Overview cards */}
        <div className="stat-grid">
          <div className="stat-card" style={{ background: 'rgba(212,175,55,.08)', borderColor: 'var(--gold)' }}>
            <div className="stat-val" style={{ color: 'var(--gold)' }}>{stats.total}</div>
            <div className="stat-label">Totalt medlemmar</div>
          </div>
          <div className="stat-card" style={{ background: 'rgba(40,167,69,.08)', borderColor: '#28a745' }}>
            <div className="stat-val" style={{ color: '#5cb85c' }}>{stats.approved}</div>
            <div className="stat-label">Godkända</div>
          </div>
          <div className="stat-card" style={{ background: 'rgba(255,193,7,.08)', borderColor: '#ffc107' }}>
            <div className="stat-val" style={{ color: '#ffc107' }}>{stats.pending}</div>
            <div className="stat-label">Väntande</div>
          </div>
        </div>
      </div>

      {/* Gender stats */}
      <div className="panel">
        <h2 style={{ fontSize: '1.3rem' }}>Könsfördelning</h2>
        <div className="stat-grid">
          {Object.entries(stats.genderCounts as Record<string, number>).map(([gender, count]) => {
            const total = stats.total || 1;
            const pct = ((count / total) * 100).toFixed(1);
            const color = genderColors[gender] || 'var(--gold)';
            return (
              <div key={gender} style={{ background: `${color}12`, border: `1px solid ${color}`, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                  <span style={{ color: 'var(--gold-light)' }}>{genderIcons[gender] || '·'} {GENDER_MAP[gender] || gender}</span>
                  <span style={{ color, fontSize: '1.5rem', fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ color: 'var(--gold-dark)', fontSize: '.9rem' }}>{pct}%</div>
                <div style={{ width: '100%', height: 8, background: 'var(--black-lighter)', marginTop: '.5rem', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* County stats */}
      {sortedCounties.length > 0 && (
        <div className="panel">
          <h2 style={{ fontSize: '1.3rem' }}>Fördelning per län</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '1rem' }}>
            {sortedCounties.map(([county, count]) => {
              const pct = ((count / (stats.total || 1)) * 100).toFixed(1);
              return (
                <div key={county} style={{
                  background: 'var(--black-lighter)', border: '1px solid var(--gold-dark)',
                  padding: '.8rem 1rem', display: 'grid',
                  gridTemplateColumns: '140px 1fr 40px 55px', gap: '1rem', alignItems: 'center'
                }}>
                  <span style={{ color: 'var(--gold-light)', fontWeight: 500 }}>{county}</span>
                  <div style={{ width: '100%', height: 8, background: 'var(--black)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / maxCounty) * 100}%`, height: '100%', background: 'var(--gold)' }} />
                  </div>
                  <span style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 600, textAlign: 'right' }}>{count}</span>
                  <span style={{ color: 'var(--gold-dark)', fontSize: '.85rem', textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Age stats */}
      <div className="panel">
        <h2 style={{ fontSize: '1.3rem' }}>Ålderskategorier</h2>
        <div className="stat-grid">
          {Object.entries(stats.ageCounts as Record<string, number>).map(([range, count]) => {
            const pct = (((count as number) / (stats.total || 1)) * 100).toFixed(1);
            return (
              <div key={range} style={{ background: 'var(--black-lighter)', border: '1px solid var(--gold-dark)', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--gold)', fontSize: '2rem', fontWeight: 600, marginBottom: '.3rem' }}>{count as number}</div>
                <div style={{ color: 'var(--gold-light)', marginBottom: '.3rem' }}>{range} år</div>
                <div style={{ color: 'var(--gold-dark)', fontSize: '.85rem' }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   EVENTS TAB
   ═══════════════════════════════════════ */
function EventsTab() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState<any[]>([]);

  const loadEvents = async () => {
    const res = await fetch('/api/admin/events');
    const data = await res.json();
    setEvents(data.events || []);
  };

  useEffect(() => { loadEvents(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, event_date: date, location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('Event skapat!');
      setTitle(''); setDesc(''); setDate(''); setLocation('');
      loadEvents();
    } catch (err: any) { setMessage('Fel: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Radera eventet "${name}"?`)) return;
    await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
    loadEvents();
  };

  return (
    <>
      <div className="panel">
        <h2>Skapa nytt evenemang</h2>

        {message && (
          <div className={`alert ${message.startsWith('Fel') ? 'alert-err' : 'alert-ok'}`}>{message}</div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div className="field-group">
            <label className="field-label">Titel *</label>
            <input className="field" required value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Beskrivning</label>
            <input className="field" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="field-group">
              <label className="field-label">Datum *</label>
              <input className="field" type="date" required value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Plats</label>
              <input className="field" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-gold" type="submit" disabled={loading} style={{ marginTop: '.5rem' }}>
            {loading ? 'Skapar…' : 'Skapa Event'}
          </button>
        </form>
      </div>

      {/* Existing events */}
      {events.length > 0 && (
        <div className="panel" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Befintliga evenemang</h2>
          {events.map(ev => {
            const d = new Date(ev.event_date);
            return (
              <div key={ev.id} style={{
                background: 'var(--black-lighter)', border: '1px solid var(--gold-dark)',
                padding: '1.2rem', marginTop: '1rem',
                display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '1.5rem', alignItems: 'center'
              }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid var(--gold-dark)', paddingRight: '1rem' }}>
                  <div style={{ fontSize: '2rem', color: 'var(--gold)', fontWeight: 600, lineHeight: 1 }}>{d.getDate()}</div>
                  <div style={{ color: 'var(--gold-light)', fontSize: '.95rem', textTransform: 'capitalize' }}>
                    {d.toLocaleDateString('sv-SE', { month: 'short' })}
                  </div>
                </div>
                <div>
                  <h3 style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', marginBottom: '.3rem' }}>{ev.title}</h3>
                  {ev.description && <p style={{ color: 'var(--gold-light)', fontSize: '.92rem', marginBottom: '.3rem' }}>{ev.description}</p>}
                  {ev.location && <p style={{ color: 'var(--gold-dark)', fontSize: '.88rem' }}>📍 {ev.location}</p>}
                  <p style={{ color: 'var(--gold-dark)', fontSize: '.85rem', marginTop: '.3rem' }}>{ev.interest_count || 0} intresserade</p>
                </div>
                <button className="btn-reject" style={{ fontSize: '.8rem', padding: '.4rem .8rem' }}
                  onClick={() => handleDelete(ev.id, ev.title)}>Radera</button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
