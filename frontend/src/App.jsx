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


function cetakBuktiSimpanan(transaksi, anggota, petugas) {
  if (!transaksi || !anggota) throw new Error('Data bukti transaksi tidak lengkap.');
  const pdf = new jsPDF({unit:'mm',format:'a5'});
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(19,55,104);pdf.rect(0,0,pageWidth,29,'F');
  pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(15);
  pdf.text('KOPERASI LPP KEDUNGNENG',pageWidth/2,13,{align:'center'});
  pdf.setFontSize(10);pdf.setFont('helvetica','normal');pdf.text('BUKTI TRANSAKSI SIMPANAN',pageWidth/2,21,{align:'center'});
  pdf.setTextColor(25,35,50);pdf.setFontSize(10);
  const jenis = {pokok:'Simpanan Pokok',wajib:'Simpanan Wajib',sukarela:'Simpanan Sukarela'}[transaksi.jenis] || transaksi.jenis;
  const tanggal = new Date(transaksi.created_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'long',timeStyle:'short'});
  const rows = [
    ['Nomor Bukti',transaksi.nomor_bukti],
    ['Tanggal / Jam',tanggal+' WIB'],
    ['Nomor Anggota',anggota.nomor_anggota],
    ['Nama Anggota',anggota.nama_lengkap],
    ['Jenis',jenis],
    ['Transaksi',transaksi.arah==='tarik'?'Penarikan':'Setoran'],
    ['Periode Wajib',transaksi.periode_wajib?transaksi.periode_wajib.slice(0,7):'-'],
    ['Petugas',petugas||'-'],
    ['Status',transaksi.status==='tercatat'?'Tercatat':'Dibatalkan']
  ];
  let y=38;
  for(const [label,value] of rows){
    pdf.setFont('helvetica','normal');pdf.text(label,12,y);
    pdf.setFont('helvetica','bold');
    const lines=pdf.splitTextToSize(String(value||'-'),pageWidth-62);
    pdf.text(lines,59,y);y+=Math.max(8,lines.length*5+3);
  }
  pdf.setDrawColor(210,220,232);pdf.line(12,y,pageWidth-12,y);y+=11;
  pdf.setFontSize(11);pdf.text('NOMINAL',12,y);
  pdf.setFontSize(16);pdf.text(rupiah(transaksi.nominal),pageWidth-12,y,{align:'right'});
  y+=12;pdf.setFontSize(8);pdf.setFont('helvetica','normal');
  pdf.text('Bukti ini dibuat dari transaksi yang tersimpan di sistem koperasi.',12,y);
  pdf.text('Verifikasi ke pengurus koperasi jika terdapat perbedaan data.',12,y+5);
  pdf.save('bukti-'+transaksi.nomor_bukti+'.pdf');
}

export default function App(){
  const [session,setSession] = useState(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [passwordSetup,setPasswordSetup] = useState(false);
  const [newPassword,setNewPassword] = useState('');
  const [confirmPassword,setConfirmPassword] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [profile,setProfile] = useState(null);
  const [members,setMembers] = useState([]);
  const [settings,setSettings] = useState(null);
  const [savings,setSavings] = useState([]);
  const [savingSummary,setSavingSummary] = useState(null);
  const [petugasMap,setPetugasMap] = useState({});
  const [savingForm,setSavingForm] = useState({anggota_id:'',jenis:'wajib',arah:'setor',nominal:'10000',periode_wajib:new Date().toISOString().slice(0,7),keterangan:''});
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
    client.auth.getSession().then(({data})=>{setSession(data.session);setAuthLoading(false);}).catch(()=>setAuthLoading(false));
    const { data:{subscription} } = client.auth.onAuthStateChange((event,s)=>{setSession(s);setProfile(null);if(event==='PASSWORD_RECOVERY' || (event==='SIGNED_IN' && (window.location.hash.includes('type=invite') || window.location.hash.includes('type=recovery'))))setPasswordSetup(true);});
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
      const {data:sv,error:se}=await client.from('transaksi_simpanan').select('id,nomor_bukti,anggota_id,petugas_id,jenis,arah,nominal,periode_wajib,created_at,status').order('created_at',{ascending:false}).limit(1000);
      if(se)throw se;
      setSavings(sv||[]);
      const {data:summary,error:summaryError}=await client.rpc('ringkasan_simpanan');
      if(summaryError)throw summaryError;
      setSavingSummary(Object.fromEntries((summary||[]).map(x=>[x.jenis,Number(x.saldo)])));
      const {data:staff,error:staffError}=await client.from('petugas').select('id,nama');
      if(staffError)throw staffError;
      setPetugasMap(Object.fromEntries((staff||[]).map(p=>[p.id,p.nama])));
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
  async function requestReset(){
    if(!email.trim()){setError('Masukkan email terlebih dahulu.');return;}
    setBusy(true);setError('');setMessage('');
    const {error:e}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin});
    if(e)setError(e.message);else setMessage('Jika email terdaftar, tautan pengaturan password akan dikirim. Periksa inbox dan spam.');
    setBusy(false);
  }
  async function updatePassword(e){
    e.preventDefault();setError('');setMessage('');
    if(newPassword.length<8){setError('Password minimal 8 karakter.');return;}
    if(newPassword!==confirmPassword){setError('Konfirmasi password tidak sama.');return;}
    setBusy(true);
    const {error:e2}=await client.auth.updateUser({password:newPassword});
    if(e2)setError(e2.message);else{setPasswordSetup(false);setNewPassword('');setConfirmPassword('');setMessage('Password berhasil disimpan. Anda sudah masuk.');window.history.replaceState(null,'',window.location.pathname);}
    setBusy(false);
  }
  async function saveSaving(e){
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const amount=Number(savingForm.nominal);
      if(!Number.isFinite(amount)||amount<=0)throw new Error('Nominal harus lebih dari nol.');
      const {error:e2}=await client.rpc('catat_simpanan',{
        p_anggota_id:savingForm.anggota_id,p_jenis:savingForm.jenis,p_arah:savingForm.arah,p_nominal:amount,
        p_periode_wajib:savingForm.jenis==='wajib'?savingForm.periode_wajib+'-01':null,
        p_keterangan:savingForm.keterangan||null,p_referensi:crypto.randomUUID()
      });
      if(e2)throw e2;
      setMessage('Transaksi simpanan berhasil dicatat beserta kas dan jurnal.');
      await loadData();
    }catch(e){setError(e.message||String(e));}finally{setBusy(false);}
  }
  async function saveMember(e){
    e.preventDefault();setBusy(true);setError('');setMessage('');
    const normalized={...form,nomor_anggota:form.nomor_anggota.trim(),nama_lengkap:form.nama_lengkap.trim(),nomor_whatsapp:form.nomor_whatsapp.trim()||null};
    const query=editing && editing!=='new' ? client.from('anggota').update(normalized).eq('id',editing) : client.from('anggota').insert(normalized);
    const {error:e2}=await query;
    if(e2)setError(e2.message);else{setEditing(null);setForm(initial);setMessage('Data anggota berhasil disimpan.');await loadData();}
    setBusy(false);
  }
  function openEdit(m){setForm({nomor_anggota:m.nomor_anggota,nama_lengkap:m.nama_lengkap,nomor_whatsapp:m.nomor_whatsapp||'',tanggal_bergabung:m.tanggal_bergabung,status:m.status});setEditing(m.id);setTab('anggota');}
  const filtered=members.filter(m=>(m.nama_lengkap+' '+m.nomor_anggota).toLowerCase().includes(search.toLowerCase()));
  if(!client)return <main className="center"><section className="login-card"><h1>Koperasi LPP Kedungneng</h1><p>Konfigurasi Supabase belum tersedia. Tambahkan <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> pada Cloudflare Pages atau file <code>.env</code>.</p></section></main>;
  if(authLoading)return <main className="center">Memuat sesi...</main>;
  if(passwordSetup && session)return <main className="center"><form className="login-card" onSubmit={updatePassword}><div className="mark">K</div><h1>Atur Password Administrator</h1><p>Buat password baru untuk akun Anda.</p><label>Password baru<input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label><label>Ulangi password<input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label>{error&&<div className="alert">{error}</div>}<button className="primary" disabled={busy}>{busy?'Menyimpan...':'Simpan Password'}</button></form></main>;
  if(!session)return <main className="center"><form className="login-card" onSubmit={signIn}><div className="mark">K</div><h1>Koperasi LPP Kedungneng</h1><p>Masuk sebagai pengurus koperasi</p><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></label><label>Kata sandi<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>{error&&<div className="alert">{error}</div>}{message&&<div className="notice">{message}</div>}<button disabled={busy} className="primary">{busy?'Memproses...':'Masuk ke Dashboard'}</button><button type="button" className="secondary" disabled={busy} onClick={requestReset}>Lupa password / Aktivasi akun</button><small>Akun harus didaftarkan sebagai admin di database koperasi.</small></form></main>;
  if(profile===null)return <main className="center">Memeriksa hak akses...</main>;
  if(!profile || profile.peran!=='admin')return <main className="center"><section className="login-card"><ShieldCheck size={40}/><h2>Akses belum tersedia</h2><p>Akun ini belum terdaftar sebagai administrator aktif. Hubungi pemilik proyek Supabase untuk penetapan peran.</p><button className="primary" onClick={()=>client.auth.signOut()}>Keluar</button></section></main>;

  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div className="mark small">K</div><div><strong>KSP Digital</strong><span>LPP Kedungneng</span></div></div>
      <nav><button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}><LayoutDashboard size={19}/> Dashboard</button><button className={tab==='anggota'?'active':''} onClick={()=>setTab('anggota')}><Users size={19}/> Data Anggota</button><button className={tab==='simpanan'?'active':''} onClick={()=>setTab('simpanan')}><Wallet size={19}/> Simpanan</button><button className={tab==='laporan'?'active':''} onClick={()=>setTab('laporan')}><Download size={19}/> Laporan</button></nav>
      <div className="side-note">Modul pinjaman, angsuran, dan WhatsApp akan diaktifkan setelah pengujian transaksi keuangan.</div>
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
      {tab==='simpanan'&&<><div className="heading"><div><h1>Simpanan Anggota</h1><p>Catat setoran dan penarikan melalui kas kantor</p></div></div>
      <section className="panel"><h2>Transaksi Baru</h2><form className="member-form" onSubmit={saveSaving}>
        <label>Anggota<select required value={savingForm.anggota_id} onChange={e=>setSavingForm({...savingForm,anggota_id:e.target.value})}><option value="">Pilih anggota</option>{members.filter(m=>m.status==='aktif').map(m=><option key={m.id} value={m.id}>{m.nomor_anggota} — {m.nama_lengkap}</option>)}</select></label>
        <label>Jenis Simpanan<select value={savingForm.jenis} onChange={e=>{const jenis=e.target.value;setSavingForm({...savingForm,jenis,arah:'setor',nominal:jenis==='pokok'?'100000':jenis==='wajib'?'10000':''});}}><option value="pokok">Pokok</option><option value="wajib">Wajib</option><option value="sukarela">Sukarela</option></select></label>
        <label>Transaksi<select value={savingForm.arah} onChange={e=>setSavingForm({...savingForm,arah:e.target.value})}><option value="setor">Setoran</option>{savingForm.jenis==='sukarela'&&<option value="tarik">Penarikan</option>}</select></label>
        <label>Nominal (Rp)<input type="number" min="1" step="0.01" required value={savingForm.nominal} onChange={e=>setSavingForm({...savingForm,nominal:e.target.value})}/></label>
        {savingForm.jenis==='wajib'&&<label>Periode Wajib<input type="month" required value={savingForm.periode_wajib} onChange={e=>setSavingForm({...savingForm,periode_wajib:e.target.value})}/></label>}
        <label>Keterangan<input value={savingForm.keterangan} onChange={e=>setSavingForm({...savingForm,keterangan:e.target.value})}/></label>
        <div className="form-actions"><button className="primary" disabled={busy||!savingForm.anggota_id}>{busy?'Memproses...':'Catat Transaksi'}</button></div>
      </form></section>
      <section className="panel"><h2>Ringkasan Simpanan</h2><div className="config-grid"><div><span>Saldo Pokok</span><strong>{savingSummary?rupiah(savingSummary.pokok||0):'Memuat...'}</strong></div><div><span>Saldo Wajib</span><strong>{savingSummary?rupiah(savingSummary.wajib||0):'Memuat...'}</strong></div><div><span>Saldo Sukarela</span><strong>{savingSummary?rupiah(savingSummary.sukarela||0):'Memuat...'}</strong></div></div><small>Saldo dihitung dari seluruh transaksi tercatat di database, bukan hanya riwayat yang ditampilkan.</small></section>
      <section className="panel"><h2>Riwayat Transaksi</h2><div className="table-wrap"><table><thead><tr><th>Bukti</th><th>Tanggal</th><th>Anggota</th><th>Jenis</th><th>Arah</th><th>Nominal</th><th>Bukti PDF</th></tr></thead><tbody>{savings.map(x=><tr key={x.id}><td>{x.nomor_bukti}</td><td>{new Date(x.created_at).toLocaleDateString('id-ID')}</td><td>{members.find(m=>m.id===x.anggota_id)?.nama_lengkap||x.anggota_id}</td><td>{x.jenis}</td><td>{x.arah}</td><td>{rupiah(x.nominal)}</td><td><button className="secondary" type="button" onClick={()=>{try{cetakBuktiSimpanan(x,members.find(m=>m.id===x.anggota_id),petugasMap[x.petugas_id]);}catch(e){setError(e.message);}}}><Download size={15}/> PDF</button></td></tr>)}</tbody></table>{!savings.length&&<div className="empty">Belum ada transaksi simpanan.</div>}</div></section></>}
      {tab==='laporan'&&<><div className="heading"><div><h1>Laporan</h1><p>Ekspor daftar anggota dalam format PDF atau Excel</p></div></div><section className="panel"><h2>Laporan Data Anggota</h2><p>Data yang diekspor mencakup nomor anggota, nama, WhatsApp, tanggal bergabung dan status.</p><div className="export-buttons"><button className="primary" onClick={()=>exportPDF(members)}><Download size={17}/> Unduh PDF</button><button className="secondary" onClick={()=>exportExcel(members).catch(e=>setError(e.message))}><Download size={17}/> Unduh Excel (.xlsx)</button></div></section></>}
      <footer>© {new Date().getFullYear()} Koperasi LPP Kedungneng · Versi awal administrasi</footer>
    </main></div>
  </div>;
}
