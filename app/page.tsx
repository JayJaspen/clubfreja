'use client';
import { useState } from 'react';

const COUNTIES = [
  'Blekinge','Dalarna','Gotland','Gävleborg','Halland','Jämtland','Jönköping',
  'Kalmar','Kronoberg','Norrbotten','Skåne','Stockholm','Södermanland','Uppsala',
  'Värmland','Västerbotten','Västernorrland','Västmanland','Västra Götaland','Örebro','Östergötland'
];

type Mode = 'landing' | 'login' | 'register' | 'verify' | 'admin-login';

export default function Home() {
  const [mode, setMode] = useState<Mode>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [rName, setRName] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rPw, setRPw] = useState('');
  const [rPwConfirm, setRPwConfirm] = useState('');
  const [rGender, setRGender] = useState('');
  const [rYear, setRYear] = useState('');
  const [rCivil, setRCivil] = useState('');
  const [rCity, setRCity] = useState('');
  const [rCounty, setRCounty] = useState('');

  const [smsCode, setSmsCode] = useState('');
  const [pendingData, setPendingData] = useState<any>(null);

  const reset = () => { setError(''); setSuccess(''); };
  const go = (m: Mode) => { reset(); setMode(m); };

  const yearOpts = Array.from({ length: 82 }, (_, i) => new Date().getFullYear() - 18 - i);

  /* ── LOGIN ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.redirect;
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── REGISTER ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();
    if (rPw !== rPwConfirm) { setError('Lösenorden matchar inte.'); setLoading(false); return; }
    if (new Date().getFullYear() - parseInt(rYear) < 18) { setError('Du måste vara minst 18 år.'); setLoading(false); return; }

    const userData = {
      name: rName, email: rEmail, phone: rPhone, password: rPw,
      gender: rGender, birth_year: parseInt(rYear),
      civil_status: rCivil, city: rCity, county: rCounty,
    };
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPendingData(userData);
      setMode('verify');
      setSuccess('En verifieringskod har skickats till ditt mobilnummer.');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── VERIFY ── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();
    try {
      const res = await fetch('/api/auth/verify-sms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingData.phone, code: smsCode, userData: pendingData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Tack för din ansökan! Nu väntar vi på att en administratör granskar ditt konto.');
      setTimeout(() => go('login'), 4000);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── SVG Logo ── */
  const Logo = ({ size = 120 }: { size?: number }) => (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size, color: 'var(--gold)' }}>
      <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3"/>
      <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="1"/>
      <text x="60" y="68" fontFamily="Cinzel" fontSize="28" fontWeight="700" textAnchor="middle" fill="currentColor">F</text>
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="grain" />
      <div className="ornament orn-tl" />
      <div className="ornament orn-tr" />
      <div className="ornament orn-bl" />
      <div className="ornament orn-br" />

      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

        {/* ═══ LANDING ═══ */}
        {mode === 'landing' && (
          <div className="anim-up" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '2.5rem', animation: 'float 3s ease-in-out infinite' }}>
              <div style={{ animation: 'logoGlow 4s ease-in-out infinite' }}>
                <Logo />
              </div>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,5vw,3.2rem)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', lineHeight: 1.3, marginBottom: '1.8rem' }}>
              <span className="shimmer-text" style={{ display: 'block' }}>Södra Sveriges</span>
              <span className="shimmer-text" style={{ display: 'block' }}>hemligaste sällskap</span>
            </h1>
            <div className="anim-up anim-d2" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center', color: 'var(--gold-light)', fontSize: '1rem', letterSpacing: '.3em', textTransform: 'uppercase', marginBottom: '3.5rem', flexWrap: 'wrap' }}>
              <span>Exklusivitet</span>
              <span style={{ color: 'var(--gold)', opacity: .4 }}>·</span>
              <span>Diskretion</span>
              <span style={{ color: 'var(--gold)', opacity: .4 }}>·</span>
              <span>Elegans</span>
            </div>
            <div className="anim-up anim-d3" style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <button className="btn btn-gold" onClick={() => go('register')}>Registrera</button>
              <button className="btn btn-outline" onClick={() => go('login')}>Logga in</button>
            </div>
            <div className="anim-up anim-d4">
              <button onClick={() => go('admin-login')} style={{
                background: 'none', border: 'none', color: 'var(--gold)', opacity: .3,
                fontSize: '.85rem', letterSpacing: '.12em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'none',
                borderBottom: '1px solid transparent', transition: 'all .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '.7'; e.currentTarget.style.borderBottomColor = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '.3'; e.currentTarget.style.borderBottomColor = 'transparent'; }}
              >Administratör</button>
            </div>
          </div>
        )}

        {/* ═══ LOGIN ═══ */}
        {mode === 'login' && (
          <div className="card">
            <h2 className="card-title">Logga in</h2>
            {error && <div className="alert alert-err">{error}</div>}
            {success && <div className="alert alert-ok">{success}</div>}
            <form onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label">E-postadress</label>
                <input className="field" type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Lösenord</label>
                <input className="field" type="password" required value={loginPw} onChange={e => setLoginPw(e.target.value)} />
              </div>
              <button className="btn btn-gold" type="submit" disabled={loading} style={{ width: '100%', marginTop: '.5rem' }}>
                {loading ? 'Loggar in…' : 'Logga in'}
              </button>
            </form>
            <div className="back-link"><button onClick={() => go('landing')}>← Tillbaka</button></div>
          </div>
        )}

        {/* ═══ ADMIN LOGIN ═══ */}
        {mode === 'admin-login' && (
          <div className="card">
            <h2 className="card-title">Admin-inloggning</h2>
            {error && <div className="alert alert-err">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label">E-postadress</label>
                <input className="field" type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Lösenord</label>
                <input className="field" type="password" required value={loginPw} onChange={e => setLoginPw(e.target.value)} />
              </div>
              <button className="btn btn-gold" type="submit" disabled={loading} style={{ width: '100%', marginTop: '.5rem' }}>
                {loading ? 'Loggar in…' : 'Logga in som admin'}
              </button>
            </form>
            <div className="back-link"><button onClick={() => go('landing')}>← Tillbaka</button></div>
          </div>
        )}

        {/* ═══ REGISTER ═══ */}
        {mode === 'register' && (
          <div className="card" style={{ maxWidth: 520 }}>
            <h2 className="card-title">Registrera</h2>
            {error && <div className="alert alert-err">{error}</div>}
            <form onSubmit={handleRegister}>
              <div className="field-group">
                <label className="field-label">Namn *</label>
                <input className="field" required value={rName} onChange={e => setRName(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">E-postadress *</label>
                <input className="field" type="email" required value={rEmail} onChange={e => setREmail(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Mobilnummer * (t.ex. +46701234567)</label>
                <input className="field" type="tel" required placeholder="+46…" value={rPhone} onChange={e => setRPhone(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="field-group">
                  <label className="field-label">Lösenord * (minst 8)</label>
                  <input className="field" type="password" required minLength={8} value={rPw} onChange={e => setRPw(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Bekräfta lösenord *</label>
                  <input className="field" type="password" required minLength={8} value={rPwConfirm} onChange={e => setRPwConfirm(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="field-group">
                  <label className="field-label">Födelseår *</label>
                  <select className="field field-select" required value={rYear} onChange={e => setRYear(e.target.value)}>
                    <option value="">Välj…</option>
                    {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Kön *</label>
                  <select className="field field-select" required value={rGender} onChange={e => setRGender(e.target.value)}>
                    <option value="">Välj…</option>
                    <option value="male">Man</option>
                    <option value="female">Kvinna</option>
                    <option value="other">Annat</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Civilstatus *</label>
                <select className="field field-select" required value={rCivil} onChange={e => setRCivil(e.target.value)}>
                  <option value="">Välj…</option>
                  <option value="single">Singel</option>
                  <option value="taken">Upptagen</option>
                  <option value="undisclosed">Vill inte ange</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="field-group">
                  <label className="field-label">Ort</label>
                  <input className="field" value={rCity} onChange={e => setRCity(e.target.value)} placeholder="T.ex. Malmö" />
                </div>
                <div className="field-group">
                  <label className="field-label">Län *</label>
                  <select className="field field-select" required value={rCounty} onChange={e => setRCounty(e.target.value)}>
                    <option value="">Välj…</option>
                    {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-gold" type="submit" disabled={loading} style={{ width: '100%', marginTop: '.5rem' }}>
                {loading ? 'Skickar…' : 'Skicka ansökan'}
              </button>
            </form>
            <div className="back-link"><button onClick={() => go('landing')}>← Tillbaka</button></div>
          </div>
        )}

        {/* ═══ VERIFY SMS ═══ */}
        {mode === 'verify' && (
          <div className="card">
            <h2 className="card-title">Verifiera</h2>
            {error && <div className="alert alert-err">{error}</div>}
            {success && <div className="alert alert-ok">{success}</div>}
            <p style={{ textAlign: 'center', color: 'var(--gold-light)', marginBottom: '1.5rem', fontSize: '.95rem' }}>
              Ange koden som skickades till {pendingData?.phone}
            </p>
            <form onSubmit={handleVerify}>
              <div className="field-group">
                <label className="field-label">Verifieringskod</label>
                <input className="field" required maxLength={6} placeholder="123456"
                  value={smsCode} onChange={e => setSmsCode(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '.5rem', fontWeight: 600 }} />
              </div>
              <button className="btn btn-gold" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Verifierar…' : 'Verifiera'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
