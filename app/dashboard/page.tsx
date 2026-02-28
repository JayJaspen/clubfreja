'use client';
import { useState, useEffect, useRef } from 'react';

const COUNTIES = [
  'Blekinge','Dalarna','Gotland','Gävleborg','Halland','Jämtland','Jönköping',
  'Kalmar','Kronoberg','Norrbotten','Skåne','Stockholm','Södermanland','Uppsala',
  'Värmland','Västerbotten','Västernorrland','Västmanland','Västra Götaland','Örebro','Östergötland'
];
const GM: Record<string,string> = { male:'Man', female:'Kvinna', other:'Annat' };
const CM: Record<string,string> = { single:'Singel', taken:'Upptagen', undisclosed:'Vill ej ange' };

export default function DashboardPage() {
  const [tab, setTab] = useState<string>('overview');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string|null>(null);
  const [viewMember, setViewMember] = useState<any>(null);

  const loadProfile = () => {
    fetch('/api/user/profile').then(r=>r.json()).then(d=>{
      if(d.user) setUserName(d.user.name);
    });
    fetch('/api/user/images').then(r=>r.json()).then(d=>{
      const av = d.images?.find((i:any)=>i.is_avatar);
      if(av) setUserAvatar(av.blob_url);
    });
  };

  useEffect(()=>{ loadProfile(); },[]);

  const tabs = [
    { key:'overview', label:'Översikt' },
    { key:'members', label:'Medlemmar' },
    { key:'chat', label:'Chat' },
    { key:'communities', label:'Communities' },
    { key:'events', label:'Evenemang' },
    { key:'profile', label:'Min Profil' },
  ];

  return (
    <div style={{ minHeight:'100vh' }}>
      <div className="grain" />
      <header className="dash-header">
        <div className="dash-logo">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1"/><text x="20" y="26" fontFamily="Cinzel" fontSize="18" fontWeight="700" textAnchor="middle" fill="currentColor">F</text></svg>
          <h1>Club Freja</h1>
        </div>
        <div className="user-pill">
          {userAvatar ? (
            <img src={userAvatar} style={{ width:38,height:38,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--gold)' }} alt="" />
          ) : (
            <div className="avatar">{userName?.charAt(0)?.toUpperCase()||'M'}</div>
          )}
          <span style={{ color:'var(--gold-light)',fontSize:'.92rem' }}>{userName}</span>
          <button className="logout-btn" onClick={async()=>{await fetch('/api/logout',{method:'POST'});window.location.href='/';}}>Logga ut</button>
        </div>
      </header>

      <div className="tab-bar">
        {tabs.map(t=>(
          <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`}
            onClick={()=>{setTab(t.key);setViewMember(null);}}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth:1000,margin:'0 auto',padding:'0 1.5rem 3rem' }}>
        {viewMember ? (
          <MemberProfileView member={viewMember} onBack={()=>setViewMember(null)} />
        ) : (
          <>
            {tab==='overview' && <OverviewTab onViewMember={setViewMember} />}
            {tab==='members' && <MembersTab onViewMember={setViewMember} />}
            {tab==='chat' && <ChatTab />}
            {tab==='communities' && <CommunitiesTab />}
            {tab==='events' && <EventsTab />}
            {tab==='profile' && <ProfileTab onAvatarChange={loadProfile} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══ MEMBER PROFILE VIEW ═══ */
function MemberProfileView({ member, onBack }: { member: any; onBack: () => void }) {
  const [images, setImages] = useState<any[]>([]);
  const [avatar, setAvatar] = useState<string|null>(null);
  const yr = new Date().getFullYear();

  useEffect(() => {
    fetch(`/api/user/images?userId=${member.id}`).then(r=>r.json()).then(d=>{
      setImages(d.images||[]);
      setAvatar(d.avatar||null);
    });
  }, [member.id]);

  return (
    <>
      <button className="btn btn-outline btn-sm" onClick={onBack} style={{ marginBottom:'1.5rem' }}>← Tillbaka</button>
      <div className="panel" style={{ textAlign:'center' }}>
        {avatar ? (
          <img src={avatar} style={{ width:120,height:120,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--gold)',margin:'0 auto 1rem' }} alt="" />
        ) : (
          <div className="avatar" style={{ width:120,height:120,fontSize:'3rem',margin:'0 auto 1rem' }}>{member.name.charAt(0).toUpperCase()}</div>
        )}
        <h2 style={{ fontSize:'1.5rem' }}>{member.name}</h2>
        <p style={{ color:'var(--gold-dark)',marginTop:'.5rem' }}>
          {member.city||member.county} · {yr-member.birth_year} år · {CM[member.civil_status]||member.civil_status}
        </p>
      </div>

      {images.length > 0 && (
        <div className="panel" style={{ marginTop:'1.5rem' }}>
          <h2 style={{ fontSize:'1.2rem' }}>Bildgalleri</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'1rem',marginTop:'1rem' }}>
            {images.map(img=>(
              <div key={img.id} style={{ aspectRatio:'1',overflow:'hidden',border:'1px solid var(--gold-dark)',background:'var(--black-lighter)' }}>
                <img src={img.blob_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt=""
                  onContextMenu={e=>e.preventDefault()} draggable={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══ OVERVIEW ═══ */
function OverviewTab({ onViewMember }:{ onViewMember:(m:any)=>void }) {
  const [members, setMembers] = useState<any[]>([]);
  useEffect(()=>{
    fetch('/api/user/members').then(r=>r.json()).then(d=>setMembers(d.members||[]));
  },[]);

  return (
    <>
      <div className="panel">
        <h2>Välkommen till Club Freja</h2>
        <p>Du är nu medlem i Södra Sveriges mest exklusiva sällskap.</p>
      </div>
      <div className="panel">
        <h2 style={{ fontSize:'1.3rem' }}>Medlemmar online</h2>
        {members.length===0 ? (
          <p style={{ fontStyle:'italic',opacity:.5,marginTop:'1rem' }}>Inga andra medlemmar ännu</p>
        ) : (
          members.slice(0,8).map(m=>(
            <div key={m.id} onClick={()=>onViewMember(m)} style={{ padding:'.8rem 0',borderBottom:'1px solid var(--gold-dark)',display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(212,175,55,.05)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div className="avatar">{m.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ color:'var(--gold-light)',fontWeight:500 }}>{m.name}</div>
                <div style={{ color:'var(--gold-dark)',fontSize:'.85rem' }}>
                  <span style={{ display:'inline-block',width:8,height:8,background:'#28a745',borderRadius:'50%',marginRight:'.4rem' }}/>Online
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ═══ MEMBERS ═══ */
function MembersTab({ onViewMember }:{ onViewMember:(m:any)=>void }) {
  const [members, setMembers] = useState<any[]>([]);
  useEffect(()=>{
    fetch('/api/user/members').then(r=>r.json()).then(d=>setMembers(d.members||[]));
  },[]);
  const yr = new Date().getFullYear();

  return (
    <div className="panel">
      <h2>Medlemskort</h2>
      <p>Bläddra bland våra exklusiva medlemmar</p>
      {members.length===0 ? (
        <p style={{ fontStyle:'italic',opacity:.5,marginTop:'1.5rem',textAlign:'center' }}>Inga andra medlemmar ännu</p>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1.5rem',marginTop:'1.5rem' }}>
          {members.map(m=>(
            <div key={m.id} onClick={()=>onViewMember(m)} style={{
              background:'var(--black-lighter)',border:'1px solid var(--gold-dark)',
              padding:'1.5rem',textAlign:'center',transition:'all .3s',cursor:'pointer',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.transform='translateY(-4px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--gold-dark)';e.currentTarget.style.transform='none';}}>
              <div className="avatar" style={{ width:80,height:80,fontSize:'2rem',margin:'0 auto 1rem' }}>{m.name.charAt(0).toUpperCase()}</div>
              <div style={{ color:'var(--gold-light)',fontSize:'1.1rem',marginBottom:'.3rem' }}>{m.name}</div>
              <div style={{ color:'var(--gold-dark)',fontSize:'.85rem' }}>{m.city||m.county} · {yr-m.birth_year} år</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ CHAT ═══ */
function ChatTab() {
  const [convos, setConvos] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<number|null>(null);
  const [activeName, setActiveName] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const loadConvos=()=>fetch('/api/user/chat').then(r=>r.json()).then(d=>setConvos(d.conversations||[]));
  const loadMembers=()=>fetch('/api/user/members').then(r=>r.json()).then(d=>setMembers(d.members||[]));
  useEffect(()=>{loadConvos();loadMembers();},[]);

  const openChat=async(pid:number,name:string)=>{
    setActiveChat(pid);setActiveName(name);
    const res=await fetch(`/api/user/chat?with=${pid}`);
    const data=await res.json();
    setMessages(data.messages||[]);
    setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:'smooth'}),100);
  };

  const sendMsg=async()=>{
    if(!input.trim()||!activeChat) return;
    setSending(true);
    await fetch('/api/user/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({receiverId:activeChat,message:input.trim()})});
    setInput('');
    const res=await fetch(`/api/user/chat?with=${activeChat}`);
    const data=await res.json();
    setMessages(data.messages||[]);
    setSending(false);
    setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:'smooth'}),100);
  };

  useEffect(()=>{
    if(!activeChat) return;
    const iv=setInterval(async()=>{
      const res=await fetch(`/api/user/chat?with=${activeChat}`);
      const data=await res.json();
      setMessages(data.messages||[]);
    },5000);
    return ()=>clearInterval(iv);
  },[activeChat]);

  return (
    <div className="panel">
      <h2>Chattar</h2>
      <div style={{ display:'grid',gridTemplateColumns:'260px 1fr',gap:'1rem',marginTop:'1rem',height:500 }}>
        <div style={{ border:'1px solid var(--gold-dark)',background:'var(--black-lighter)',overflowY:'auto' }}>
          <h3 style={{ padding:'1rem',color:'var(--gold)',fontSize:'1rem',borderBottom:'1px solid var(--gold-dark)' }}>Kontakter</h3>
          {members.map(m=>{
            const c=convos.find(c=>c.partner_id===m.id);
            const unread=c?.unread_count||0;
            return (
              <div key={m.id} onClick={()=>openChat(m.id,m.name)} style={{
                padding:'.8rem 1rem',cursor:'pointer',borderBottom:'1px solid rgba(184,148,31,.15)',
                background:activeChat===m.id?'rgba(212,175,55,.1)':'transparent',
                display:'flex',alignItems:'center',gap:'.7rem',transition:'background .2s',
              }}>
                <div className="avatar" style={{ width:32,height:32,fontSize:'.8rem',flexShrink:0 }}>{m.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex:1,minWidth:0 }}><div style={{ color:'var(--gold-light)',fontSize:'.9rem',fontWeight:500 }}>{m.name}</div></div>
                {unread>0&&<span style={{ background:'var(--gold)',color:'var(--black)',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:700 }}>{unread}</span>}
              </div>
            );
          })}
          {members.length===0&&<p style={{ padding:'1rem',fontStyle:'italic',opacity:.5,fontSize:'.9rem' }}>Inga medlemmar</p>}
        </div>
        <div style={{ border:'1px solid var(--gold-dark)',display:'flex',flexDirection:'column',background:'var(--black-lighter)' }}>
          <div style={{ padding:'.8rem 1rem',borderBottom:'1px solid var(--gold-dark)',background:'var(--black)',color:'var(--gold)' }}>{activeName||'Välj en kontakt'}</div>
          <div style={{ flex:1,padding:'1rem',overflowY:'auto' }}>
            {messages.map(msg=>{
              const isMine=msg.sender_name!==activeName;
              return (
                <div key={msg.id} style={{ marginBottom:'.8rem',display:'flex',justifyContent:isMine?'flex-end':'flex-start' }}>
                  <div style={{ maxWidth:'70%',padding:'.6rem 1rem',borderRadius:4,background:isMine?'rgba(212,175,55,.15)':'var(--black)',border:`1px solid ${isMine?'var(--gold-dark)':'rgba(184,148,31,.2)'}` }}>
                    <div style={{ color:'var(--gold-light)',fontSize:'.92rem' }}>{msg.message}</div>
                    <div style={{ color:'var(--gold-dark)',fontSize:'.7rem',marginTop:'.3rem',textAlign:'right' }}>
                      {new Date(msg.created_at).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={msgEndRef} />
          </div>
          {activeChat&&(
            <div style={{ padding:'.8rem',borderTop:'1px solid var(--gold-dark)',display:'flex',gap:'.5rem' }}>
              <input className="field" value={input} onChange={e=>setInput(e.target.value)}
                placeholder="Skriv ett meddelande…" onKeyDown={e=>{if(e.key==='Enter')sendMsg();}} style={{ flex:1 }} />
              <button className="btn btn-gold btn-sm" onClick={sendMsg} disabled={sending}>Skicka</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ COMMUNITIES ═══ */
function CommunitiesTab() {
  const [comms, setComms] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priv, setPriv] = useState(false);

  const load=()=>fetch('/api/user/communities').then(r=>r.json()).then(d=>setComms(d.communities||[]));
  useEffect(()=>{load();},[]);

  const handleCreate=async()=>{
    if(!title.trim()) return;
    await fetch('/api/user/communities',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'create',title,description:desc,isPrivate:priv})});
    setTitle('');setDesc('');setPriv(false);setShowCreate(false);load();
  };

  const toggleJoin=async(id:number,isMember:boolean)=>{
    await fetch('/api/user/communities',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:isMember?'leave':'join',communityId:id})});
    load();
  };

  return (
    <div className="panel">
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem' }}>
        <h2 style={{ margin:0 }}>Communities</h2>
        <button className="btn btn-gold btn-sm" onClick={()=>setShowCreate(!showCreate)}>{showCreate?'Avbryt':'Skapa Community'}</button>
      </div>
      {showCreate&&(
        <div style={{ background:'var(--black-lighter)',border:'1px solid var(--gold-dark)',padding:'1.5rem',marginBottom:'1.5rem' }}>
          <div className="field-group"><label className="field-label">Titel *</label><input className="field" value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div className="field-group"><label className="field-label">Beskrivning</label><input className="field" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
          <label style={{ display:'flex',alignItems:'center',gap:'.5rem',color:'var(--gold-light)',cursor:'pointer',marginBottom:'1rem' }}>
            <input type="checkbox" checked={priv} onChange={e=>setPriv(e.target.checked)} style={{ accentColor:'var(--gold)' }} /> Stängt community
          </label>
          <button className="btn btn-gold btn-sm" onClick={handleCreate}>Skapa</button>
        </div>
      )}
      {comms.length===0?(
        <p style={{ fontStyle:'italic',opacity:.5,textAlign:'center' }}>Inga communities ännu</p>
      ):(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1.5rem' }}>
          {comms.map(c=>(
            <div key={c.id} style={{ background:'var(--black-lighter)',border:'1px solid var(--gold-dark)',padding:'1.5rem',transition:'all .3s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--gold-dark)'}>
              <h3 style={{ color:'var(--gold)',fontFamily:'var(--font-display)',marginBottom:'.4rem',fontSize:'1.1rem' }}>{c.title}</h3>
              {c.description&&<p style={{ color:'var(--gold-light)',fontSize:'.9rem',marginBottom:'.8rem' }}>{c.description}</p>}
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ color:'var(--gold-dark)',fontSize:'.85rem' }}>{c.member_count} medlemmar</span>
                <span style={{ color:c.is_private?'#ff6b6b':'var(--gold)',fontSize:'.85rem' }}>{c.is_private?'🔒 Stängt':'🌍 Öppet'}</span>
              </div>
              <button className={c.is_member?'btn-reject':'btn-approve'} style={{ width:'100%',marginTop:'1rem',padding:'.5rem' }}
                onClick={()=>toggleJoin(c.id,c.is_member)}>{c.is_member?'Lämna':'Gå med'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ EVENTS ═══ */
function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const load=()=>fetch('/api/user/events').then(r=>r.json()).then(d=>setEvents(d.events||[]));
  useEffect(()=>{load();},[]);

  const toggleInterest=async(eventId:number)=>{
    await fetch('/api/user/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId})});
    load();
  };

  return (
    <div className="panel">
      <h2>Evenemang</h2>
      <p>Kommande events och tillställningar</p>
      {events.length===0?(
        <p style={{ fontStyle:'italic',opacity:.5,marginTop:'1.5rem',textAlign:'center' }}>Inga evenemang planerade ännu</p>
      ):(
        <div style={{ marginTop:'1.5rem' }}>
          {events.map(ev=>{
            const d=new Date(ev.event_date);
            return (
              <div key={ev.id} style={{ background:'var(--black-lighter)',border:'1px solid var(--gold-dark)',padding:'1.5rem',marginBottom:'1rem',display:'grid',gridTemplateColumns:'80px 1fr auto',gap:'1.5rem',alignItems:'center' }}>
                <div style={{ textAlign:'center',borderRight:'1px solid var(--gold-dark)',paddingRight:'1rem' }}>
                  <div style={{ fontSize:'2.5rem',color:'var(--gold)',fontWeight:600,lineHeight:1 }}>{d.getDate()}</div>
                  <div style={{ color:'var(--gold-light)',fontSize:'1rem',textTransform:'capitalize' }}>{d.toLocaleDateString('sv-SE',{month:'short'})}</div>
                </div>
                <div>
                  <h3 style={{ color:'var(--gold)',fontFamily:'var(--font-display)',marginBottom:'.3rem' }}>{ev.title}</h3>
                  {ev.description&&<p style={{ color:'var(--gold-light)',fontSize:'.92rem',marginBottom:'.3rem' }}>{ev.description}</p>}
                  {ev.location&&<p style={{ color:'var(--gold-dark)',fontSize:'.88rem' }}>📍 {ev.location}</p>}
                  <p style={{ color:'var(--gold-dark)',fontSize:'.85rem',marginTop:'.3rem' }}>{ev.interest_count} intresserade</p>
                </div>
                <button className={`btn ${ev.has_interest?'btn-outline':'btn-gold'} btn-sm`} onClick={()=>toggleInterest(ev.id)} style={{ whiteSpace:'nowrap' }}>
                  {ev.has_interest?'✓ Intresserad':'Visa intresse'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══ PROFILE ═══ */
function ProfileTab({ onAvatarChange }:{ onAvatarChange:()=>void }) {
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadVis, setUploadVis] = useState('private');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [editVis, setEditVis] = useState('private');
  const [editSelected, setEditSelected] = useState<number[]>([]);

  const loadProfile=()=>fetch('/api/user/profile').then(r=>r.json()).then(d=>{if(d.user) setUser(d.user);});
  const loadImages=()=>fetch('/api/user/images').then(r=>r.json()).then(d=>setImages(d.images||[]));
  const loadMembers=()=>fetch('/api/user/members').then(r=>r.json()).then(d=>setMembers(d.members||[]));

  useEffect(()=>{loadProfile();loadImages();loadMembers();},[]);

  const handleSave=async(e:React.FormEvent)=>{
    e.preventDefault();setSaving(true);setMsg('');
    try {
      const res=await fetch('/api/user/profile',{method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...user,password:pw||undefined})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      setMsg('Profil uppdaterad!');setPw('');
    } catch(err:any){setMsg('Fel: '+err.message);}
    finally{setSaving(false);}
  };

  const handleAvatarUpload=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    setUploading(true);
    const fd=new FormData();
    fd.append('file',file);
    fd.append('isAvatar','true');
    try {
      const res=await fetch('/api/user/upload',{method:'POST',body:fd});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      loadImages(); onAvatarChange();
    } catch(err:any){alert('Fel: '+err.message);}
    finally{setUploading(false);}
  };

  const handleGalleryUpload=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    setUploading(true);
    const fd=new FormData();
    fd.append('file',file);
    fd.append('visibility',uploadVis);
    if(uploadVis==='selected') fd.append('allowedUsers',selectedMembers.join(','));
    try {
      const res=await fetch('/api/user/upload',{method:'POST',body:fd});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      loadImages();
      setUploadVis('private');setSelectedMembers([]);
    } catch(err:any){alert('Fel: '+err.message);}
    finally{setUploading(false);}
  };

  const handleDelete=async(id:number)=>{
    if(!confirm('Radera denna bild?')) return;
    await fetch(`/api/user/images?id=${id}`,{method:'DELETE'});
    loadImages(); onAvatarChange();
  };

  const openEditVis=(img:any)=>{
    setEditingImage(img);
    setEditVis(img.visibility);
    setEditSelected(img.allowed_users||[]);
  };

  const saveVisibility=async()=>{
    if(!editingImage) return;
    await fetch('/api/user/images',{method:'PATCH',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({imageId:editingImage.id,visibility:editVis,allowedUsers:editVis==='selected'?editSelected:[]})});
    setEditingImage(null);loadImages();
  };

  const toggleMember=(id:number,list:number[],setList:(v:number[])=>void)=>{
    setList(list.includes(id)?list.filter(x=>x!==id):[...list,id]);
  };

  if(!user) return <p style={{ textAlign:'center',color:'var(--gold-light)',padding:'2rem',opacity:.6 }}>Laddar…</p>;

  const avatar=images.find(i=>i.is_avatar);
  const gallery=images.filter(i=>!i.is_avatar);
  const yearOpts=Array.from({length:82},(_,i)=>new Date().getFullYear()-18-i);

  const visLabel=(v:string)=>v==='public'?'🌍 Publik':v==='selected'?'👥 Utvalda':'🔒 Privat';

  return (
    <>
      {/* Profile info */}
      <div className="panel">
        <h2>Min Profil</h2>
        <div style={{ textAlign:'center',margin:'2rem 0' }}>
          <div style={{ position:'relative',display:'inline-block' }}>
            {avatar ? (
              <img src={avatar.blob_url} style={{ width:120,height:120,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--gold)' }} alt="" />
            ) : (
              <div className="avatar" style={{ width:120,height:120,fontSize:'3.5rem' }}>{user.name.charAt(0).toUpperCase()}</div>
            )}
            <label style={{ position:'absolute',bottom:0,right:0,width:36,height:36,borderRadius:'50%',
              background:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',
              cursor:'pointer',color:'var(--black)',fontSize:'1.2rem',border:'2px solid var(--black)' }}>
              📷
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:'none' }} />
            </label>
          </div>
          <h3 style={{ color:'var(--gold)',fontFamily:'var(--font-display)',marginTop:'1rem' }}>{user.name}</h3>
          <p style={{ color:'var(--gold-light)',fontSize:'.92rem' }}>{user.email}</p>
          {uploading&&<p style={{ color:'var(--gold-dark)',fontSize:'.85rem',marginTop:'.5rem' }}>Laddar upp…</p>}
        </div>

        {msg&&<div className={`alert ${msg.startsWith('Fel')?'alert-err':'alert-ok'}`}>{msg}</div>}

        <form onSubmit={handleSave}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem' }}>
            <div className="field-group"><label className="field-label">Namn</label><input className="field" value={user.name} onChange={e=>setUser({...user,name:e.target.value})} /></div>
            <div className="field-group"><label className="field-label">E-post</label><input className="field" type="email" value={user.email} onChange={e=>setUser({...user,email:e.target.value})} /></div>
            <div className="field-group"><label className="field-label">Telefon</label><input className="field" value={user.phone} onChange={e=>setUser({...user,phone:e.target.value})} /></div>
            <div className="field-group"><label className="field-label">Födelseår</label><select className="field field-select" value={user.birth_year} onChange={e=>setUser({...user,birth_year:parseInt(e.target.value)})}>{yearOpts.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div className="field-group"><label className="field-label">Kön</label><select className="field field-select" value={user.gender} onChange={e=>setUser({...user,gender:e.target.value})}><option value="male">Man</option><option value="female">Kvinna</option><option value="other">Annat</option></select></div>
            <div className="field-group"><label className="field-label">Civilstatus</label><select className="field field-select" value={user.civil_status} onChange={e=>setUser({...user,civil_status:e.target.value})}><option value="single">Singel</option><option value="taken">Upptagen</option><option value="undisclosed">Vill ej ange</option></select></div>
            <div className="field-group"><label className="field-label">Ort</label><input className="field" value={user.city||''} onChange={e=>setUser({...user,city:e.target.value})} /></div>
            <div className="field-group"><label className="field-label">Län</label><select className="field field-select" value={user.county} onChange={e=>setUser({...user,county:e.target.value})}>{COUNTIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="field-group" style={{ marginTop:'1rem' }}>
            <label className="field-label">Nytt lösenord (lämna tomt för att behålla)</label>
            <input className="field" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Minst 8 tecken" minLength={8} />
          </div>
          <button className="btn btn-gold" type="submit" disabled={saving} style={{ marginTop:'1rem' }}>{saving?'Sparar…':'Spara ändringar'}</button>
        </form>
      </div>

      {/* Image Gallery */}
      <div className="panel" style={{ marginTop:'1.5rem' }}>
        <h2 style={{ fontSize:'1.3rem' }}>Mitt bildgalleri</h2>

        {/* Upload section */}
        <div style={{ background:'var(--black-lighter)',border:'1px solid var(--gold-dark)',padding:'1.5rem',marginTop:'1rem' }}>
          <div style={{ display:'flex',gap:'1rem',alignItems:'flex-end',flexWrap:'wrap' }}>
            <div className="field-group" style={{ marginBottom:0 }}>
              <label className="field-label">Synlighet</label>
              <select className="field field-select" value={uploadVis} onChange={e=>{setUploadVis(e.target.value);setSelectedMembers([]);}}>
                <option value="private">🔒 Privat (bara jag)</option>
                <option value="public">🌍 Publik (alla medlemmar)</option>
                <option value="selected">👥 Utvalda medlemmar</option>
              </select>
            </div>
            <label style={{ cursor:'pointer' }}>
              <span className="btn btn-gold btn-sm" style={{ display:'inline-flex' }}>{uploading?'Laddar upp…':'📸 Ladda upp bild'}</span>
              <input type="file" accept="image/*" onChange={handleGalleryUpload} style={{ display:'none' }} disabled={uploading} />
            </label>
          </div>

          {uploadVis==='selected'&&(
            <div style={{ marginTop:'1rem' }}>
              <label className="field-label">Välj vilka som får se bilden:</label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:'.5rem',marginTop:'.5rem' }}>
                {members.map(m=>(
                  <button key={m.id} type="button" onClick={()=>toggleMember(m.id,selectedMembers,setSelectedMembers)}
                    style={{ padding:'.4rem .8rem',border:'1px solid',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'.85rem',transition:'all .2s',
                      background:selectedMembers.includes(m.id)?'rgba(212,175,55,.2)':'transparent',
                      borderColor:selectedMembers.includes(m.id)?'var(--gold)':'var(--gold-dark)',
                      color:selectedMembers.includes(m.id)?'var(--gold)':'var(--gold-light)' }}>
                    {selectedMembers.includes(m.id)?'✓ ':''}{m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gallery grid */}
        {gallery.length===0?(
          <p style={{ fontStyle:'italic',opacity:.5,marginTop:'1.5rem',textAlign:'center' }}>Inga bilder uppladdade ännu</p>
        ):(
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'1rem',marginTop:'1.5rem' }}>
            {gallery.map(img=>(
              <div key={img.id} style={{ position:'relative',aspectRatio:'1',overflow:'hidden',border:'1px solid var(--gold-dark)',background:'var(--black-lighter)' }}>
                <img src={img.blob_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt=""
                  onContextMenu={e=>e.preventDefault()} draggable={false} />
                <div style={{ position:'absolute',bottom:0,left:0,right:0,background:'rgba(10,10,10,.85)',padding:'.4rem .6rem',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <button onClick={()=>openEditVis(img)} style={{ background:'none',border:'none',color:'var(--gold-light)',cursor:'pointer',fontSize:'.75rem',fontFamily:'var(--font-body)' }}>
                    {visLabel(img.visibility)}
                  </button>
                  <button onClick={()=>handleDelete(img.id)} style={{ background:'none',border:'none',color:'#ff6b6b',cursor:'pointer',fontSize:'.85rem' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit visibility modal */}
      {editingImage&&(
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'1rem' }}
          onClick={()=>setEditingImage(null)}>
          <div className="card" style={{ maxWidth:450 }} onClick={e=>e.stopPropagation()}>
            <h2 className="card-title" style={{ fontSize:'1.3rem' }}>Ändra synlighet</h2>
            <div style={{ textAlign:'center',marginBottom:'1.5rem' }}>
              <img src={editingImage.blob_url} style={{ maxWidth:200,maxHeight:200,objectFit:'cover',border:'1px solid var(--gold-dark)' }} alt="" />
            </div>
            <div className="field-group">
              <label className="field-label">Synlighet</label>
              <select className="field field-select" value={editVis} onChange={e=>{setEditVis(e.target.value);if(e.target.value!=='selected')setEditSelected([]);}}>
                <option value="private">🔒 Privat (bara jag)</option>
                <option value="public">🌍 Publik (alla medlemmar)</option>
                <option value="selected">👥 Utvalda medlemmar</option>
              </select>
            </div>
            {editVis==='selected'&&(
              <div style={{ marginTop:'.5rem' }}>
                <label className="field-label">Välj medlemmar:</label>
                <div style={{ display:'flex',flexWrap:'wrap',gap:'.5rem',marginTop:'.5rem',maxHeight:200,overflowY:'auto' }}>
                  {members.map(m=>(
                    <button key={m.id} type="button" onClick={()=>toggleMember(m.id,editSelected,setEditSelected)}
                      style={{ padding:'.4rem .8rem',border:'1px solid',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'.85rem',transition:'all .2s',
                        background:editSelected.includes(m.id)?'rgba(212,175,55,.2)':'transparent',
                        borderColor:editSelected.includes(m.id)?'var(--gold)':'var(--gold-dark)',
                        color:editSelected.includes(m.id)?'var(--gold)':'var(--gold-light)' }}>
                      {editSelected.includes(m.id)?'✓ ':''}{m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex',gap:'1rem',marginTop:'1.5rem' }}>
              <button className="btn btn-gold btn-sm" onClick={saveVisibility} style={{ flex:1 }}>Spara</button>
              <button className="btn btn-outline btn-sm" onClick={()=>setEditingImage(null)} style={{ flex:1 }}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
