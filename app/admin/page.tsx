'use client';

export default function AdminPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="grain" />
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
      <div style={{ maxWidth: 800, margin: '3rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <div className="panel">
          <h2>Admin-panel</h2>
          <p>🏗️ Byggs i Steg 2. Inloggningen fungerar!</p>
        </div>
      </div>
    </div>
  );
}
