import { ClipboardList, FileSpreadsheet, LayoutDashboard, LogOut, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';

const MASTER_DATA = {
  subject_data: {
    "COM (4th Sem)": ["MIC", "DCN", "JPR", "PWP", "EES", "UI/UX"],
    "IT (4th SEM)": ["IOT", "PWP", "INS", "DCN", "JPR", "EES"],
    "AIML (4th SEM)": ["EES", "JPR", "DCN", "MML", "MIC", "UI/UX"],
    "COM (6th SEM)": ["SFT", "ETI", "ML", "CSS", "MAN", "CPE", "MAD"]
  },
  initialFaculties: {
    "rahul123": { name: "Rahul Rathod", password: "123", subjects: ["PWP", "ML", "SFT", "CSS"] },
    "Omkarg123": { name: "Dr. Omkar Ghatage", password: "OMG123", subjects: ["CPE", "JPR"] },
    "HODCOM": { name: "Admin/HOD", password: "COMP1578", role: 'hod' }
  }
};

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, sans-serif', margin: 0, padding: 0 },
  loginBox: { height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a' },
  nav: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: '15px 5%', backgroundColor: '#1e293b', color: 'white', alignItems: 'center', boxSizing: 'border-box' },
  tabBar: { width: '100%', display: 'flex', gap: '15px', padding: '10px 5%', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', boxSizing: 'border-box', overflowX: 'auto' },
  main: { width: '100%', padding: '20px 5%', boxSizing: 'border-box' },
  card: { width: '100%', backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', boxSizing: 'border-box', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px', boxSizing: 'border-box' },
  btn: (bg) => ({ backgroundColor: bg, color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' })
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [faculties, setFaculties] = useState(JSON.parse(localStorage.getItem('faculties')) || MASTER_DATA.initialFaculties);
  const [subjectData, setSubjectData] = useState(JSON.parse(localStorage.getItem('subjectData')) || MASTER_DATA.subject_data);
  const [attendanceLog, setAttendanceLog] = useState(JSON.parse(localStorage.getItem('attendanceLog')) || []);

  useEffect(() => {
    localStorage.setItem('faculties', JSON.stringify(faculties));
    localStorage.setItem('subjectData', JSON.stringify(subjectData));
    localStorage.setItem('attendanceLog', JSON.stringify(attendanceLog));
  }, [faculties, subjectData, attendanceLog]);

  const handleLogin = (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); }
    else if (faculties[u] && faculties[u].password === p) { setUser({ ...faculties[u], id: u, role: 'faculty' }); setView('faculty'); }
    else { alert("Invalid Credentials!"); }
  };

  if (view === 'login') return (
    <div style={styles.loginBox}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
        <UserCheck size={50} color="#2563eb" style={{ marginBottom: '15px' }} />
        <h2>College Portal</h2>
        <input id="u" style={styles.input} placeholder="Username" />
        <input id="p" style={styles.input} type="password" placeholder="Password" />
        <button style={{ ...styles.btn('#2563eb'), width: '100%' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><LayoutDashboard size={24} /> <b>ATTEND-PRO SYSTEM</b></div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}><LogOut size={18} /></button>
      </nav>
      {view === 'faculty' ? <FacultyPanel user={user} subjectData={subjectData} logAtt={(e) => setAttendanceLog([e, ...attendanceLog])} /> : <HODPanel faculties={faculties} setFaculties={setFaculties} subjectData={subjectData} setSubjectData={setSubjectData} attendanceLog={attendanceLog} />}
    </div>
  );
}

function FacultyPanel({ user, subjectData, logAtt }) {
  const [selClass, setSelClass] = useState('');
  const [selSub, setSelSub] = useState('');
  const [roll, setRoll] = useState('');
  const [absents, setAbsents] = useState([]);
  const [students, setStudents] = useState({});

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const data = {};
      wb.SheetNames.forEach(n => {
        const sheet = XLSX.utils.sheet_to_json(wb.Sheets[n]);
        const stds = {};
        sheet.forEach(r => { 
          const rNo = String(r['ROLL NO'] || r['Roll No'] || '').trim();
          if(rNo) stds[rNo] = r['STUDENT NAME'] || r['Student Name'];
        });
        data[n] = stds;
      });
      setStudents(data);
    });
  }, []);

  const handleFinalSubmit = () => {
    if(!selSub || !selClass) return alert("Please select all fields!");
    const totalCount = Object.keys(students[selClass]).length;
    const logEntry = { date: new Date().toLocaleDateString(), faculty: user.name, subject: selSub, branch: selClass, present: totalCount - absents.length, total: totalCount };
    logAtt(logEntry);
    
    const finalData = Object.entries(students[selClass]).map(([r, n]) => ({ "ROLL NO": r, "STUDENT NAME": n, "STATUS": absents.includes(r) ? "Absent" : "Present", "SUBJECT": selSub, "DATE": logEntry.date }));
    const ws = XLSX.utils.json_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${selClass}_${selSub}.xlsx`);
    
    alert("✅ Attendance Logged & Excel Downloaded!");
    setAbsents([]);
  };

  return (
    <div style={styles.main}>
      <div style={{ ...styles.card, maxWidth: '900px', margin: '0 auto' }}>
        <h3><ClipboardList color="#2563eb" /> Mark Attendance</h3>
        <select style={styles.input} onChange={e => setSelClass(e.target.value)}>
          <option value="">-- Select Branch --</option>
          {Object.keys(students).map(c => <option key={c}>{c}</option>)}
        </select>
        <select style={styles.input} onChange={e => setSelSub(e.target.value)}>
          <option value="">-- Select Subject --</option>
          {subjectData[selClass]?.filter(s => user.subjects.includes(s)).map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input style={styles.input} placeholder="Roll No" value={roll} onChange={e => setRoll(e.target.value)} />
          <button style={styles.btn('#ef4444')} onClick={() => { if(students[selClass]?.[roll]) setAbsents([...absents, roll]); setRoll(''); }}>Absent</button>
        </div>
        <div style={{ textAlign: 'center', background: '#f8fafc', padding: '30px', borderRadius: '15px', margin: '20px 0', border: '2px dashed #cbd5e1' }}>
          <h1>{students[selClass]?.[roll] || "---"}</h1>
        </div>
        <p><b>Absentees:</b> {absents.join(', ') || 'None'}</p>
        <button style={{ ...styles.btn('#10b981'), width: '100%' }} onClick={handleFinalSubmit}><FileSpreadsheet /> Final Submit & Download</button>
      </div>
    </div>
  );
}

function HODPanel({ faculties, setFaculties, subjectData, setSubjectData, attendanceLog }) {
  const [tab, setTab] = useState('analytics');
  const [fForm, setFForm] = useState({ id: '', name: '', password: '', subjects: '' });

  return (
    <>
      <div style={styles.tabBar}>
        <button onClick={() => setTab('analytics')} style={{ ...styles.btn(tab === 'analytics' ? '#2563eb' : 'transparent'), color: tab === 'analytics' ? 'white' : '#64748b' }}>Analytics</button>
        <button onClick={() => setTab('faculties')} style={{ ...styles.btn(tab === 'faculties' ? '#2563eb' : 'transparent'), color: tab === 'faculties' ? 'white' : '#64748b' }}>Faculties</button>
        <button onClick={() => setTab('subjects')} style={{ ...styles.btn(tab === 'subjects' ? '#2563eb' : 'transparent'), color: tab === 'subjects' ? 'white' : '#64748b' }}>Subjects</button>
        <button onClick={() => setTab('logs')} style={{ ...styles.btn(tab === 'logs' ? '#2563eb' : 'transparent'), color: tab === 'logs' ? 'white' : '#64748b' }}>History</button>
      </div>
      <div style={styles.main}>
        {tab === 'analytics' && (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div style={{ ...styles.card, background: '#2563eb', color: 'white' }}><h4>Total Logs</h4><h2>{attendanceLog.length}</h2></div>
              <div style={{ ...styles.card, background: '#10b981', color: 'white' }}><h4>Avg Present</h4><h2>{attendanceLog.length > 0 ? (attendanceLog.reduce((a, b) => a + b.present, 0) / attendanceLog.length).toFixed(1) : 0}</h2></div>
            </div>
            <div style={{ ...styles.card, height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceLog.slice(0, 10).map(l => ({ name: l.subject, Present: l.present, Absent: l.total - l.present }))}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                  <Bar dataKey="Present" fill="#10b981" /><Bar dataKey="Absent" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {tab === 'faculties' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={styles.card}>
              <h4>Faculty Database</h4>
              {Object.entries(faculties).map(([id, d]) => (
                <div key={id} onClick={() => setFForm({id, name: d.name, password: d.password, subjects: d.subjects.join(',')})} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}><b>{id}</b> - {d.name}</div>
              ))}
            </div>
            <div style={styles.card}>
              <h4>Add/Edit Faculty</h4>
              <input style={styles.input} placeholder="ID" value={fForm.id} onChange={e => setFForm({...fForm, id: e.target.value})} />
              <input style={styles.input} placeholder="Name" value={fForm.name} onChange={e => setFForm({...fForm, name: e.target.value})} />
              <input style={styles.input} placeholder="Subjects (comma sep)" value={fForm.subjects} onChange={e => setFForm({...fForm, subjects: e.target.value})} />
              <button style={{ ...styles.btn('#2563eb'), width: '100%' }} onClick={() => { setFaculties({ ...faculties, [fForm.id]: { name: fForm.name, password: fForm.password, subjects: fForm.subjects.split(',').map(s => s.trim()) } }); alert("Saved!"); }}>Save</button>
            </div>
          </div>
        )}
        {tab === 'logs' && (
          <div style={styles.card}>
            <h4>History Logs</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}><th style={{ padding: '12px' }}>Date</th><th>Faculty</th><th>Subject</th><th>P/T</th></tr></thead>
                <tbody>
                  {attendanceLog.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}><td style={{ padding: '12px' }}>{l.date}</td><td>{l.faculty}</td><td>{l.subject}</td><td>{l.present}/{l.total}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}