(function () {
  /* ---------- Auth guard: students only ---------- */
  const session = Session.get();
  if (!session) { window.location.replace('login.html'); return; }
  if (session.role !== 'student' || !session.studentId) {
    window.location.replace('dashboard.html');
    return;
  }

  const $ = function (id) { return document.getElementById(id); };
  const threshold = CONFIG.LOW_ATTENDANCE_THRESHOLD;

  /* ---------- Header / user info ---------- */
  const name = session.name || 'Student';
  const initials = name.split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();

  $('userName').textContent   = name;
  $('userAvatar').textContent = initials || 'S';
  $('sideUser').textContent   = name;
  $('todayDate').textContent  = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  $('statOverallHint').textContent = 'Minimum required: ' + threshold + '%';

  $('menuBtn').addEventListener('click', function () { $('sidebar').classList.toggle('open'); });
  document.querySelector('.content').addEventListener('click', function () { $('sidebar').classList.remove('open'); });
  $('logoutBtn').addEventListener('click', function () {
    Session.clear();
    window.location.href = 'login.html';
  });

  /* ---------- Small helpers ---------- */
  function isPresent(record) { return String(record.status).toLowerCase() === 'present'; }
  function percent(present, total) { return total ? present * 100 / total : 0; }
  function fmt(p) { return String(Math.round(p * 10) / 10); }
  function tone(p) { return p >= threshold ? 'good' : (p >= threshold - 10 ? 'warn' : 'bad'); }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 'es'); }

  /* How many classes can still be missed, or how many must be attended in a row. */
  function guidanceText(present, total) {
    const p = threshold / 100;
    if (total === 0 || p >= 1) return '';

    if (present / total >= p) {
      const canMiss = Math.floor(present / p - total + 1e-9);
      return canMiss > 0
        ? 'You can miss up to ' + plural(canMiss, 'class') + ' and still stay at or above ' + threshold + '%.'
        : 'You are right at ' + threshold + '%. Missing the next class will take you below it.';
    }

    const need = Math.ceil((p * total - present) / (1 - p) - 1e-9);
    return 'Attend the next ' + plural(need, 'class') + ' in a row to get back to ' + threshold + '%.';
  }

  function cell(text, className) {
    const td = document.createElement('td');
    td.textContent = text;
    if (className) td.className = className;
    return td;
  }

  function pill(text, kind) {
    const span = document.createElement('span');
    span.className = 'pill ' + kind;
    span.textContent = text;
    return span;
  }

  function messageRow(body, columns, text) {
    body.replaceChildren();
    const tr = document.createElement('tr');
    const td = cell(text, 'empty');
    td.colSpan = columns;
    tr.appendChild(td);
    body.appendChild(tr);
  }

  /* ---------- Rendering ---------- */
  function render(subjects, records) {
    const subjectNames = {};
    subjects.forEach(function (s) { subjectNames[s.subjectId] = s.subjectName; });

    const bySubject = {};
    let present = 0;
    records.forEach(function (r) {
      const t = bySubject[r.subjectId] || (bySubject[r.subjectId] = { present: 0, total: 0 });
      t.total++;
      if (isPresent(r)) { t.present++; present++; }
    });
    const total = records.length;
    const overall = percent(present, total);

    // Summary cards
    $('statOverall').textContent  = total ? fmt(overall) + '%' : '—';
    $('statAttended').textContent = total ? present + ' of ' + total : '—';
    $('statMissed').textContent   = total ? String(total - present) : '—';
    $('overallCard').classList.toggle('warn', total > 0 && overall < threshold);

    const note = $('guidance');
    const text = guidanceText(present, total);
    note.hidden = !text;
    note.textContent = text;
    note.classList.toggle('low', total > 0 && overall < threshold);

    // Subject-wise table (every subject, even ones with no classes yet)
    const body = $('subjectBody');
    body.replaceChildren();

    if (subjects.length === 0) {
      messageRow(body, 4, 'No subjects found.');
    }

    subjects.forEach(function (s) {
      const t = bySubject[s.subjectId];
      const tr = document.createElement('tr');
      tr.appendChild(cell(s.subjectName));

      if (!t) {
        tr.appendChild(cell('—'));
        tr.appendChild(cell('0'));
        tr.appendChild(cell('No classes yet', 'muted'));
        body.appendChild(tr);
        return;
      }

      const p = percent(t.present, t.total);
      tr.appendChild(cell(String(t.present)));
      tr.appendChild(cell(String(t.total)));

      const td = document.createElement('td');
      td.className = 'bar-cell';
      const row = document.createElement('div');
      row.className = 'bar-row';
      const track = document.createElement('div');
      track.className = 'track';
      const fill = document.createElement('div');
      fill.className = 'fill ' + tone(p);
      fill.style.width = Math.min(100, p) + '%';
      track.appendChild(fill);
      const pct = document.createElement('span');
      pct.className = 'pct';
      pct.textContent = fmt(p) + '%';
      row.appendChild(track);
      row.appendChild(pct);
      td.appendChild(row);
      tr.appendChild(td);
      body.appendChild(tr);
    });

    // Recent classes: newest 8
    const recentBody = $('recentBody');
    const recent = records.slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date)) || (b.attendanceId || 0) - (a.attendanceId || 0);
    }).slice(0, 8);

    if (recent.length === 0) {
      messageRow(recentBody, 3, 'No attendance has been recorded for you yet.');
      return;
    }

    recentBody.replaceChildren();
    recent.forEach(function (r) {
      const tr = document.createElement('tr');
      const when = new Date(r.date + 'T00:00:00');
      tr.appendChild(cell(isNaN(when) ? String(r.date) : when.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      })));
      tr.appendChild(cell(subjectNames[r.subjectId] || ('Subject ' + r.subjectId)));
      const td = document.createElement('td');
      td.appendChild(isPresent(r) ? pill('Present', 'good') : pill('Absent', 'bad'));
      tr.appendChild(td);
      recentBody.appendChild(tr);
    });
  }

  /* ---------- Data ---------- */
  const DEMO = {
    subjects: [
      { subjectId: 1, subjectName: 'Java' },
      { subjectId: 2, subjectName: 'DBMS' },
      { subjectId: 3, subjectName: 'Operating Systems' }
    ],
    records: [
      { attendanceId: 1, subjectId: 1, date: '2026-10-05', status: 'Present' },
      { attendanceId: 2, subjectId: 1, date: '2026-10-06', status: 'Present' },
      { attendanceId: 3, subjectId: 2, date: '2026-10-06', status: 'Absent' },
      { attendanceId: 4, subjectId: 2, date: '2026-10-07', status: 'Present' },
      { attendanceId: 5, subjectId: 3, date: '2026-10-07', status: 'Absent' }
    ]
  };

  async function load() {
    try {
      if (CONFIG.DEMO_MODE) { render(DEMO.subjects, DEMO.records); return; }

      // Endpoints a student is allowed to call (see AccessRules on the backend):
      //   GET /api/subjects
      //   GET /api/attendance/student/{ownId}
      const results = await Promise.all([
        apiFetch('/subjects'),
        apiFetch('/attendance/student/' + session.studentId)
      ]);
      render(results[0] || [], results[1] || []);
    } catch (err) {
      const n = $('notice');
      n.textContent = 'Could not load your attendance: ' + err.message;
      n.classList.add('show');
      messageRow($('subjectBody'), 4, 'Could not load this data.');
      messageRow($('recentBody'), 3, 'Could not load this data.');
    }
  }

  load();
})();
