(function () {
  /* ---------- Auth guard ---------- */
  const session = Session.get();
  if (!session) { window.location.replace('login.html'); return; }

  const role = session.role === 'student' ? 'student' : 'faculty';
  const $ = function (id) { return document.getElementById(id); };

  /* ---------- Show only what this role may see ---------- */
  document.querySelectorAll('[data-role]').forEach(function (el) {
    if (el.dataset.role !== role) el.style.display = 'none';
  });

  /* ---------- Header / user info ---------- */
  const name = session.name || 'User';
  const initials = name.replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '')
    .split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();

  $('userName').textContent  = name;
  $('userRole').textContent  = role;
  $('userAvatar').textContent = initials || 'U';
  $('sideUser').textContent  = name;
  $('welcomeTitle').textContent = 'Welcome, ' + name;
  $('welcomeText').textContent = role === 'faculty'
    ? 'Here is a quick look at attendance across your classes.'
    : 'Check your attendance and stay above the minimum requirement.';
  $('todayDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  $('statLowHint').textContent = 'Below ' + CONFIG.LOW_ATTENDANCE_THRESHOLD + '%';

  /* ---------- Sidebar (mobile) + logout ---------- */
  $('menuBtn').addEventListener('click', function () { $('sidebar').classList.toggle('open'); });
  document.querySelector('.content').addEventListener('click', function () { $('sidebar').classList.remove('open'); });

  $('logoutBtn').addEventListener('click', function () {
    Session.clear();
    window.location.href = 'login.html';
  });

  /* ---------- Data ---------- */
  if (role !== 'faculty') return;

  // Sample data used while DEMO_MODE is on
  const DEMO_DATA = {
    students: 120,
    subjects: 8,
    low: [
      { studentId: 'S104', studentName: 'Rahul Verma',   department: 'CSE', percentage: 58 },
      { studentId: 'S117', studentName: 'Sneha Patil',   department: 'CSE', percentage: 66 },
      { studentId: 'S121', studentName: 'Imran Shaikh',  department: 'IT',  percentage: 71 },
      { studentId: 'S133', studentName: 'Divya Nair',    department: 'ECE', percentage: 73 }
    ]
  };

  /* Endpoints used (all exist in the Spring Boot backend):
       GET /api/students    -> [ { studentId, studentName, department, year, section } ]
       GET /api/subjects    -> [ { subjectId, subjectName } ]
       GET /api/attendance  -> [ { attendanceId, studentId, subjectId, date, status } ]
     The backend has no "low attendance" endpoint, so each student's overall
     percentage is worked out here from the attendance records. */
  async function loadData() {
    if (CONFIG.DEMO_MODE) return DEMO_DATA;
    const results = await Promise.allSettled([
      apiFetch('/students'),
      apiFetch('/subjects'),
      apiFetch('/attendance')
    ]);
    const students   = results[0].status === 'fulfilled' ? results[0].value : null;
    const subjects   = results[1].status === 'fulfilled' ? results[1].value : null;
    const attendance = results[2].status === 'fulfilled' ? results[2].value : null;

    let low = null;
    if (students && attendance) {
      const tally = {};
      attendance.forEach(function (a) {
        const t = tally[a.studentId] || (tally[a.studentId] = { total: 0, present: 0 });
        t.total++;
        if (String(a.status).toLowerCase() === 'present') t.present++;
      });
      low = students
        .filter(function (s) { return tally[s.studentId]; })   // skip students with no records yet
        .map(function (s) {
          return {
            studentId: s.studentId,
            studentName: s.studentName,
            department: s.department,
            percentage: Math.round(tally[s.studentId].present / tally[s.studentId].total * 100)
          };
        })
        .filter(function (s) { return s.percentage < CONFIG.LOW_ATTENDANCE_THRESHOLD; })
        .sort(function (a, b) { return a.percentage - b.percentage; });
    }

    return {
      students: students ? students.length : null,
      subjects: subjects ? subjects.length : null,
      low:      low,
      failed:   results.some(function (r) { return r.status === 'rejected'; })
    };
  }

  function pillClass(p) { return p < 65 ? 'bad' : 'warn'; }

  function renderLow(list) {
    const body = $('lowBody');
    body.innerHTML = '';
    if (!list) {
      body.innerHTML = '<tr><td colspan="4" class="empty">Could not load this data.</td></tr>';
      return;
    }
    if (list.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="empty">No students are below the required attendance. 🎉</td></tr>';
      return;
    }
    list.forEach(function (s) {
      const tr = document.createElement('tr');
      [s.studentId, s.studentName, s.department].forEach(function (text) {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      const td = document.createElement('td');
      const pill = document.createElement('span');
      pill.className = 'pill ' + pillClass(s.percentage);
      pill.textContent = s.percentage + '%';
      td.appendChild(pill);
      tr.appendChild(td);
      body.appendChild(tr);
    });
  }

  loadData().then(function (d) {
    $('statStudents').textContent = d.students != null ? d.students : '—';
    $('statSubjects').textContent = d.subjects != null ? d.subjects : '—';
    $('statLow').textContent      = d.low ? d.low.length : '—';
    renderLow(d.low);
    if (d.failed) {
      const n = $('notice');
      n.textContent = 'Some figures could not be loaded. Check that the backend server is running.';
      n.classList.add('show');
    }
  });
})();
