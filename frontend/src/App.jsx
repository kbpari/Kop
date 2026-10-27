import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { Users, Wallet, Landmark, CalendarClock, LayoutDashboard, LogOut, Plus, Download, RefreshCw, ShieldCheck, Search, X, Pencil } from 'lucide-react';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const client = url && key ? createClient(url, key) : null;
const rupiah = value => new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(Number(value) || 0);
const initial = { nomor_anggota:'', nama_lengkap:'', nomor_whatsapp:'', tanggal_bergabung: new Date().toISOString().slice(0,10), status:'aktif' };

function downloadBlob(blob, name) {
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

async function exportExcel(members) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data Anggota');
  sheet.columns = [
    { header:'No. Anggota', key:'nomor_anggota', width:22 },
    { header:'Nama Anggota', key:'nama_lengkap', width:32 },
    { header:'WhatsApp', key:'nomor_whatsapp', width:24 },
    { header:'Bergabung', key:'tanggal_bergabung', width:20 },
    { header:'Status', key:'status', width:16 }
  ];
  sheet.getRow(1).font = { bold:true, color:{argb:'FFFFFFFF'} };
  sheet.getRow(1).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF133768'} };
  members.forEach(m => sheet.addRow(m));
  sheet.autoFilter = 'A1:E1';
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'anggota-koperasi-lpp-kedungneng.xlsx');
}

function exportPDF(members) {
  const pdf = new jsPDF();
  const today = new Date().toLocaleDateString('id-ID');
  pdf.setFontSize(15); pdf.text('KOPERASI LPP KEDUNGNENG',14,20);
  pdf.setFontSize(11); pdf.text('Laporan Data Anggota',14,28);
  pdf.setFontSize(9); pdf.text('Dicetak: '+today,14,35);
  pdf.line(14,39,196,39);
  let y=47;
  pdf.setFont('helvetica','bold');
  pdf.text('No.',14,y);pdf.text('Nomor Anggota',26,y);pdf.text('Nama',69,y);pdf.text('Status',170,y);
  pdf.setFont('helvetica','normal');
  members.forEach((m,i)=>{
    if(y>270){pdf.addPage();y=20;}
    y+=8;
    pdf.text(String(i+1),14,y);
    pdf.text(String(m.nomor_anggota).slice(0,18),26,y);
    pdf.text(String(m.nama_lengkap).slice(0,38),69,y);
    pdf.text(String(m.status),170,y);
  });
  pdf.save('anggota-koperasi-lpp-kedungneng.pdf');
}

export default function App(){
  const [session,setSession] = useState(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [profile,setProfile] = useState(null);
  const [members,setMembers] = useState([]);
  const [settings,setSettings] = useState(null);
  const [counts,setCounts] = useState({ pinjaman:0, angsuran:0, simpanan:0 });
  const [tab,setTab] = useState('dashboard');
  const [search,setSearch] = useState('');
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(initial);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);

  useEffect(()=>{
    if(!client){setAuthLoading(false);return;}
    client.auth.getSession().then(({data})=>{setSession(data.session);setAuthLoading(false);});
    const { data:{subscription} } = client.auth.onAuthStateChange((_event,s)=>{setSession(s);setProfile(null);});
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session || !client) return;
    let alive=true;
    (async()=>{
      setError('');
      const {data,error:e}=await client.from('petugas').select('nama,peran,aktif').eq('auth_user_id',session.user.id).maybeSingle();
      if(!alive)return;
      if(e)setError(e.message);
      setProfile(data?.aktif ? data : false);
    })();
    return ()=>{alive=false;};
  },[session]);

  async function loadData(){
    if(!client || profile?.peran!=='admin')return;
    setBusy(true);setError('');
    try {
      const [a,s,p,j,t]=await Promise.all([
        client.from('anggota').select('*').order('created_at',{ascending:false}).limit(1000),
        client.from('pengaturan_koperasi').select('*').eq('id',1).single(),
        client.from('pinjaman').select('*',{count:'exact',head:true}).eq('status','berjalan'),
        client.from('jadwal_angsuran').select('*',{count:'exact',head:true}),
        client.from('transaksi_simpanan').select('*',{count:'exact',head:true}).eq('status','tercatat')
      ]);
      if(a.error)throw a.error;
      if(s.error)throw s.error;
      setMembers(a.data||[]);setSettings(s.data);
      setCounts({pinjaman:p.count||0,angsuran:j.count||0,simpanan:t.count||0});
    }catch(e){setError(e.message||String(e));}
    finally{setBusy(false);}
  }
  useEffect(()=>{if(profile?.peran==='admin')loadData();},[profile]);

  async function signIn(e){
    e.preventDefault();setBusy(true);setError('');
    const {error:e2}=await client.auth.signInWithPassword({email,password});
    if(e2)setError(e2.message);
    setBusy(false);
  }
  async function saveMember(e){
    e.preventDefault();setBusy(true);setError('');setMessage('');
    const normalized={...form,nomor_anggota:form.nomor_anggota.trim(),nama_lengkap:form.nama_lengkap.trim(),nomor_whatsapp:form.nomor_whatsapp.trim()||null};
    const query=editing ? client.from('anggota').update(normalized).eq('id',editing) : client.from('anggota').insert(normalized);
    const {error:e2}=await query;
    if(e2)setError(e2.message);else{setEditing(null);setForm(initial);setMessage('Data anggota berhasil disimpan.');await loadData();}
    setBusy(false);
  }
  function openEdit(m){setForm({nomor_anggota:m.nomor_anggota,nama_lengkap:m.nama_lengkap,nomor_whatsapp:m.nomor_whatsapp||'',tanggal_bergabung:m.tanggal_bergabung,status:m.status});setEditing(m.id);setTab('anggota');}
  const filtered=members.filter(m=>(m.nama_lengkap+' '+m.nomor_anggota).toLowerCase().includes(search.toLowerCase()));
  if(!client)return <main className="center"><section className="login-card"><h1>Koperasi LPP Kedungneng</h1><p>Konfigurasi Supabase belum tersedia. Tambahkan <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> pada Cloudflare Pages atau file <code>.env</code>.</p></section></main>;
  if(authLoading)return <main className="center">Memuat sesi...</main>;
  if(!session)return <main className="center"><form className="login-card" onSubmit={signIn}><div className="mark">K</div><h1>Koperasi LPP Kedungneng</h1><p>Masuk sebagai pengurus koperasi</p><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></label><label>Kata sandi<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>{error&&<div className="alert">{error}</div>}<button disabled={busy} className="primary">{busy?'Memproses...':'Masuk ke Dashboard'}</button><small>Akun harus didaftarkan sebagai admin di database koperasi.</small></form></main>;
  if(profile===null)return <main className="center">Memeriksa hak akses...</main>;
  if(!profile || profile.peran!=='admin')return <main className="center"><section className="login-card"><ShieldCheck size={40}/><h2>Akses belum tersedia</h2><p>Akun ini belum terdaftar sebagai administrator aktif. Hubungi pemilik proyek Supabase untuk penetapan peran.</p><button className="primary" onClick={()=>client.auth.signOut()}>Keluar</button></section></main>;

  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div className="mark small">K</div><div><strong>KSP Digital</strong><span>LPP Kedungneng</span></div></div>
      <nav><button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}><LayoutDashboard size={19}/> Dashboard</button><button className={tab==='anggota'?'active':''} onClick={()=>setTab('anggota')}><Users size={19}/> Data Anggota</button><button className={tab==='laporan'?'active':''} onClick={()=>setTab('laporan')}><Download size={19}/> Laporan</button></nav>
      <div className="side-note">Modul simpanan, pinjaman, angsuran, dan WhatsApp akan diaktifkan setelah transaksi keuangan teruji.</div>
    </aside>
    <div className="workspace"><header className="topbar"><div><div className="eyebrow">Sistem Informasi Koperasi</div><strong>Koperasi LPP Kedungneng</strong></div><div className="user"><span>{profile.nama} · Admin</span><button title="Keluar" onClick={()=>client.auth.signOut()}><LogOut size={18}/></button></div></header>
    <main className="content">{error&&<div className="alert">{error}</div>}{message&&<div className="notice">{message}</div>}
      {tab==='dashboard'&&<><div className="heading"><div><h1>Dashboard</h1><p>Ringkasan administrasi koperasi</p></div><button className="secondary" onClick={loadData} disabled={busy}><RefreshCw size={17}/> Segarkan</button></div><div className="stats">
        <div className="stat"><div className="stat-icon blue"><Users/></div><span>Total Anggota</span><strong>{members.length.toLocaleString('id-ID')}</strong><small>Anggota terdaftar (maks. 1.000 ditampilkan)</small></div>
        <div className="stat"><div className="stat-icon green"><Wallet/></div><span>Transaksi Simpanan</span><strong>{counts.simpanan}</strong><small>Transaksi tercatat</small></div>
        <div className="stat"><div className="stat-icon orange"><Landmark/></div><span>Pinjaman Aktif</span><strong>{counts.pinjaman}</strong><small>Jumlah pinjaman berjalan</small></div>
        <div className="stat"><div className="stat-icon purple"><CalendarClock/></div><span>Jadwal Angsuran</span><strong>{counts.angsuran}</strong><small>Jumlah jadwal terdaftar</small></div>
      </div><section className="panel"><h2>Pengaturan Koperasi</h2><div className="config-grid"><div><span>Simpanan Pokok</span><strong>{rupiah(settings?.simpanan_pokok_default)}</strong></div><div><span>Simpanan Wajib / Bulan</span><strong>{rupiah(settings?.simpanan_wajib_bulanan)}</strong></div><div><span>Bunga Flat / Bulan</span><strong>{Number(settings?.bunga_flat_bulanan||0)*100}%</strong></div></div></section></>}
      {tab==='anggota'&&<><div className="heading"><div><h1>Data Anggota</h1><p>Tambah dan kelola anggota koperasi</p></div><button className="primary" onClick={()=>{setEditing('new');setForm(initial);setError('');}}><Plus size={18}/> Tambah Anggota</button></div>
        {editing&&<section className="panel"><div className="heading compact"><h2>{editing==='new'?'Tambah Anggota':'Ubah Data Anggota'}</h2><button className="icon-button" onClick={()=>{setEditing(null);setForm(initial);}}><X size={20}/></button></div><form onSubmit={saveMember} className="member-form"><label>Nomor Anggota<input required value={form.nomor_anggota} onChange={e=>setForm({...form,nomor_anggota:e.target.value})}/></label><label>Nama Lengkap<input required value={form.nama_lengkap} onChange={e=>setForm({...form,nama_lengkap:e.target.value})}/></label><label>Nomor WhatsApp<input placeholder="628xxxxxxxxxx" value={form.nomor_whatsapp} onChange={e=>setForm({...form,nomor_whatsapp:e.target.value})}/></label><label>Tanggal Bergabung<input type="date" required value={form.tanggal_bergabung} onChange={e=>setForm({...form,tanggal_bergabung:e.target.value})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></label><div className="form-actions"><button className="primary" disabled={busy}>{busy?'Menyimpan...':'Simpan Anggota'}</button></div></form></section>}
        <section className="panel"><div className="table-tools"><div className="search"><Search size={18}/><input placeholder="Cari nama atau nomor anggota..." value={search} onChange={e=>setSearch(e.target.value)}/></div><span>{filtered.length} anggota ditampilkan</span></div><div className="table-wrap"><table><thead><tr><th>Nomor Anggota</th><th>Nama Lengkap</th><th>WhatsApp</th><th>Bergabung</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(m=><tr key={m.id}><td>{m.nomor_anggota}</td><td><strong>{m.nama_lengkap}</strong></td><td>{m.nomor_whatsapp||'—'}</td><td>{m.tanggal_bergabung}</td><td><span className={'pill '+m.status}>{m.status}</span></td><td><button className="icon-button" title="Ubah" onClick={()=>openEdit(m)}><Pencil size={16}/></button></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty">Belum ada data anggota.</div>}</div></section></>}
      {tab==='laporan'&&<><div className="heading"><div><h1>Laporan</h1><p>Ekspor daftar anggota dalam format PDF atau Excel</p></div></div><section className="panel"><h2>Laporan Data Anggota</h2><p>Data yang diekspor mencakup nomor anggota, nama, WhatsApp, tanggal bergabung dan status.</p><div className="export-buttons"><button className="primary" onClick={()=>exportPDF(members)}><Download size={17}/> Unduh PDF</button><button className="secondary" onClick={()=>exportExcel(members).catch(e=>setError(e.message))}><Download size={17}/> Unduh Excel (.xlsx)</button></div></section></>}
      <footer>© {new Date().getFullYear()} Koperasi LPP Kedungneng · Versi awal administrasi</footer>
    </main></div>
  </div>;
}
