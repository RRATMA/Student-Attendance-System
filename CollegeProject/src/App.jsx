import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { CheckCircle, LayoutDashboard, LogOut, Plus, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from './firebase';

const styles = {
  container: { width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' },
  nav: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: '15px 5%', backgroundColor: '#1e293b', alignItems: 'center', borderBottom: '1px solid #334155', boxSizing: 'border-box' },
  card: { backgroundColor: '#1e293b', padding: '25px', borderRadius: '15px', width: '95%', maxWidth: '1000px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginTop: '20px' },
  input: { padding: '12px', borderRadius: '8px', backgroundColor: '#334155', color: 'white', border: '1px solid #475569', outline: 'none', width: '100%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '12px', background: '#0f172a', padding: '20px', borderRadius: '12px', marginTop: '20px' },
  rollBtn: (isActive) => ({ padding: '15px 0', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', backgroundColor: isActive ? '#22c55e' : '#334155', color: 'white', border: isActive ? '2px solid #4ade80' : '1px solid #475569' }),
  btnMain: (bg) => ({ backgroundColor: bg, color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }),
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #334155', color: '#94a3b8', backgroundColor: '#1e293b' },
  td: { padding: '12px', borderBottom: '1px solid #334155', color: '#cbd5e1' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [faculties, setFaculties] = useState({});
  const [classes, setClasses] = useState({});

  useEffect(() => {
    const unsubAtt = onSnapshot(query(collection(db, "attendance"), orderBy("timestamp", "desc")), (snap) => {
      setAttendanceLog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubFac = onSnapshot(collection(db, "faculties"), (snap) => {
      const d = {}; snap.docs.forEach(doc => d[doc.id] = doc.data()); setFaculties(d);
    });
    const unsubClass = onSnapshot(collection(db, "classes"), (snap) => {
      const d = {}; snap.docs.forEach(doc => d[doc.id] = doc.data()); setClasses(d);
    });
    return () => { unsubAtt(); unsubFac(); unsubClass(); };
  }, []);

  const handleLogin = (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "Admin/HOD", role: 'hod' }); setView('hod'); }
    else if (faculties[u] && faculties[u].password === p) { setUser({ ...faculties[u], id: u, role: 'faculty' }); setView('faculty'); }
    else alert("Invalid Login!");
  };

  if (view === 'login') return (
    <div style={{ ...styles.container, justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '350px', textAlign: 'center' }}>
        <UserCheck size={50} color="#2563eb" style={{ marginBottom: '15px' }} />
        <h2 style={{ color: '#0f172a', marginBottom: '25px' }}>College Portal</h2>
        <input id="u" style={{ ...styles.input, backgroundColor: '#f1f5f9', color: 'black', marginBottom: '10px' }} placeholder="Username" />
        <input id="p" type="password" style={{ ...styles.input, backgroundColor: '#f1f5f9', color: 'black', marginBottom: '20px' }} placeholder="Password" />
        <button style={{ ...styles.btnMain('#2563eb'), width: '100%' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><LayoutDashboard size={18} /> <b>ATTEND-PRO</b></div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}><LogOut size={16} /></button>
      </nav>
      {view === 'faculty' ? <FacultyPanel user={user} classes={classes} /> : <HODDashboard logs={attendanceLog} faculties={faculties} classes={classes} />}
    </div>
  );
}

function HODDashboard({ logs, faculties, classes }) {
  const [tab, setTab] = useState('logs');
  const [fId, setFId] = useState(''); const [fName, setFName] = useState(''); const [fPass, setFPass] = useState(''); const [fClass, setFClass] = useState(''); const [fSubs, setFSubs] = useState('');

  const saveFaculty = async () => {
    if (!fId || !fPass || !fClass) return alert("Please fill ID, Pass and Class");
    await setDoc(doc(db, "faculties", fId), { name: fName, password: fPass, assignedClass: fClass, subjects: fSubs.split(',').map(s => s.trim()) });
    alert("Faculty Saved!"); setFId(''); setFPass(''); setFSubs(''); setFName('');
  };

  const saveClass = async () => {
    const name = prompt("Enter Class Name (e.g. COM 4th Sem)");
    const subs = prompt("Enter Subjects (comma separated)");
    if (name) await setDoc(doc(db, "classes", name), { subjects: subs.split(',').map(s => s.trim()) });
  };

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #334155' }}>
        {['logs', 'manage'].map(t => <button key={t} onClick={() => setTab(t)} style={{ background: 'none', color: tab === t ? '#3b82f6' : '#94a3b8', border: 'none', padding: '10px', cursor: 'pointer', fontWeight: 'bold', borderBottom: tab === t ? '2px solid #3b82f6' : 'none' }}>{t.toUpperCase()}</button>)}
      </div>

      {tab === 'logs' ? (
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Faculty</th><th style={styles.th}>Class</th><th style={styles.th}>Subject</th><th style={styles.th}>Count</th></tr></thead>
          <tbody>{logs.map(l => <tr key={l.id}><td style={styles.td}>{l.timeStr}</td><td style={styles.td}>{l.faculty}</td><td style={styles.td}>{l.class}</td><td style={styles.td}>{l.subject}</td><td style={styles.td}>{l.present}/{l.total}</td></tr>)}</tbody>
        </table>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <input style={styles.input} placeholder="Faculty ID" value={fId} onChange={e => setFId(e.target.value)} />
            <input style={styles.input} placeholder="Faculty Name" value={fName} onChange={e => setFName(e.target.value)} />
            <input style={styles.input} placeholder="Password" value={fPass} onChange={e => setFPass(e.target.value)} />
            <select style={styles.input} value={fClass} onChange={e => setFClass(e.target.value)}>
              <option value="">-- Select Class --</option>
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={styles.input} placeholder="Subjects (Ex: PWP, JPR)" value={fSubs} onChange={e => setFSubs(e.target.value)} />
            <button style={styles.btnMain('#3b82f6')} onClick={saveFaculty}><Plus size={18} /> Add Faculty</button>
            <button style={styles.btnMain('#8b5cf6')} onClick={saveClass}><Plus size={18} /> Add New Class</button>
          </div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Faculty ID</th><th style={styles.th}>Name</th><th style={styles.th}>Class & Subjects</th><th style={styles.th}>Action</th></tr></thead>
            <tbody>{Object.entries(faculties).map(([id, f]) => (
              <tr key={id}><td style={styles.td}>{id}</td><td style={styles.td}>{f.name}</td><td style={styles.td}>{f.assignedClass} ({f.subjects?.join(', ')})</td><td style={styles.td}><Trash2 size={18} color="#ef4444" cursor="pointer" onClick={async () => await deleteDoc(doc(db, "faculties", id))} /></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FacultyPanel({ user, classes }) {
  const [selSub, setSelSub] = useState('');
  const [presentList, setPresentList] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = wb.Sheets[user.assignedClass] || wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet).map(r => ({ id: String(r['ROLL NO'] || '').trim() })).filter(s => s.id !== "");
      setStudents(data);
    });
  }, [user.assignedClass]);

  const handleSubmit = async () => {
    if (!selSub) return alert("Select Subject");
    await addDoc(collection(db, "attendance"), { faculty: user.name, class: user.assignedClass, subject: selSub, present: presentList.length, total: students.length, timestamp: serverTimestamp(), timeStr: new Date().toLocaleString() });
    const ws = XLSX.utils.json_to_sheet(students.map(s => ({ ROLL: s.id, STATUS: presentList.includes(s.id) ? "P" : "A" })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attend"); XLSX.writeFile(wb, `${user.assignedClass}_${selSub}.xlsx`);
    alert("Submitted to Cloud!");
  };

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3>{user.name} ({user.assignedClass})</h3>
        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Present: {presentList.length} / {students.length}</span>
      </div>
      <select style={styles.input} onChange={e => setSelSub(e.target.value)}>
        <option value="">-- Select Subject --</option>
        {user.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <div style={styles.grid}>{students.map(s => (
        <div key={s.id} onClick={() => setPresentList(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} style={styles.rollBtn(presentList.includes(s.id))}>{s.id}</div>
      ))}</div>
      <button style={{ ...styles.btnMain('#10b981'), width: '100%', marginTop: '20px' }} onClick={handleSubmit}><CheckCircle size={20} /> SUBMIT ATTENDANCE</button>
    </div>
  );
}