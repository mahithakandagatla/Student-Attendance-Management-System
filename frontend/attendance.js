(function () {
  /* ---------- Auth guard (same as Dashboard.js) ---------- */
  const session = Session.get();
  if (!session) { window.location.replace('Login.html'); return; }

  const role = session.role === 'student' ? 'student' : 'faculty';
  if (role !== 'faculty') { window.location.replace('Dashboard.html'); return; }

  const $ = function (id) { return document.getElementById(id); };

  /* ---------- Shell: user info, sidebar, logout ---------- */
  document.querySelectorAll('[data-role]').forEach(function (el) {
    if (el.dataset.role !== role) el.style.display = 'none';
  });

  const name = session.name || 'User';
  const initials = name.replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '')
    .split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
  $('userName').textContent = name;
  $('userRole').textContent = role;
  $('userAvatar').textContent = initials || 'U';
  $('sideUser').textContent = name;
  $('todayDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  $('menuBtn').addEventListener('click', function () { $('sidebar').classList.toggle('open'); });
  document.querySelector('.content').addEventListener('click', function () { $('sidebar').classList.remove('open'); });
  $('logoutBtn').addEventListener('click', function () {
    Session.clear();
    window.location.href = 'Login.html';
  });

  function showNotice(text) {
    const n = $('notice');
    n.textContent = text;
    n.classList.add('show');
  }
  function hideNotice() { $('notice').classList.remove('show'); }

  /* ---------- Data ---------- */
  // Backend: GET /api/students -> [ { studentId, studentName, department, year, section } ]
  //          GET /api/subjects -> [ { subjectId, subjectName } ]
  //          POST /api/attendance -> one record: { studentId, subjectId, date, status }
  let students = [];
  let subjects = [];
  const marks = {};            // studentId -> 'Present' | 'Absent'

  function makeDemoStudents() {
    const first = ['Ravi', 'Sita', 'Kiran', 'Anil', 'Priya', 'Meena', 'Suresh', 'Lakshmi',
                   'Rahul', 'Divya', 'Imran', 'Sneha', 'Arjun', 'Kavya', 'Vikram', 'Anjali'];
    const last = ['Kumar', 'Reddy', 'Sharma', 'Patil', 'Nair', 'Rao', 'Verma', 'Shaikh'];
    const depts = ['CSE', 'IT', 'ECE'];
    const list = [];
    for (let i = 0; i < 74; i++) {
      list.push({
        studentId: 101 + i,
        studentName: first[i % first.length] + ' ' + last[(i * 3) % last.length],
        department: depts[i % 3],
        year: (i % 4) + 1,
        section: i % 2 ? 'B' : 'A'
      });
    }
    return list;
  }

  async function loadData() {
    if (CONFIG.DEMO_MODE) {
      students = makeDemoStudents();
      subjects = [
        { subjectId: 1, subjectName: 'Java' },
        { subjectId: 2, subjectName: 'DBMS' },
        { subjectId: 3, subjectName: 'Web Technologies' },
        { subjectId: 4, subjectName: 'Computer Organization' }
      ];
      return;
    }
    const results = await Promise.allSettled([apiFetch('/students'), apiFetch('/subjects')]);
    students = results[0].status === 'fulfilled' ? results[0].value : [];
    subjects = results[1].status === 'fulfilled' ? results[1].value : [];
    if (results.some(function (r) { return r.status === 'rejected'; })) {
      showNotice('Could not load students or subjects. Check that the backend server is running.');
    }
  }

  /* ---------- Filters ---------- */
  function fillSelect(id, values, allLabel) {
    const sel = $(id);
    sel.innerHTML = '';
    if (allLabel) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = allLabel;
      sel.appendChild(o);
    }
    values.forEach(function (v) {
      const o = document.createElement('option');
      o.value = v.value;
      o.textContent = v.label;
      sel.appendChild(o);
    });
  }

  function uniqueSorted(field) {
    const set = {};
    students.forEach(function (s) { if (s[field] != null && s[field] !== '') set[s[field]] = true; });
    return Object.keys(set).sort().map(function (v) { return { value: v, label: v }; });
  }

  function buildFilters() {
    fillSelect('subject', subjects.map(function (s) {
      return { value: s.subjectId, label: s.subjectName };
    }));
    fillSelect('dept', uniqueSorted('department'), 'All departments');
    fillSelect('year', uniqueSorted('year'), 'All years');
    fillSelect('section', uniqueSorted('section'), 'All sections');
    $('date').valueAsDate = new Date();
  }

  function visibleStudents() {
    const d = $('dept').value, y = $('year').value, sec = $('section').value;
    return students.filter(function (s) {
      return (!d || String(s.department) === d) &&
             (!y || String(s.year) === y) &&
             (!sec || String(s.section) === sec);
    });
  }

  /* ---------- Render ---------- */
  function updateSummary(list) {
    let present = 0;
    list.forEach(function (s) { if (marks[s.studentId] === 'Present') present++; });
    $('summary').textContent = list.length + ' students · ' + present + ' present · ' + (list.length - present) + ' absent';
  }

  function render() {
    const list = visibleStudents();
    const body = $('attBody');
    body.innerHTML = '';

    if (list.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="empty">No students match these filters.</td></tr>';
      updateSummary(list);
      return;
    }

    list.forEach(function (s, i) {
      if (!marks[s.studentId]) marks[s.studentId] = 'Present';   // default

      const tr = document.createElement('tr');
      const tdId = document.createElement('td'); tdId.textContent = s.studentId;
      const tdName = document.createElement('td'); tdName.textContent = s.studentName;
      tr.appendChild(tdId);
      tr.appendChild(tdName);

      ['Present', 'Absent'].forEach(function (status) {
        const td = document.createElement('td');
        td.className = 'mark ' + (status === 'Present' ? 'p' : 'a');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'att_' + i;
        input.value = status;
        input.checked = marks[s.studentId] === status;
        input.setAttribute('aria-label', s.studentName + ' ' + status);
        input.addEventListener('change', function () {
          marks[s.studentId] = status;
          updateSummary(visibleStudents());
        });
        td.appendChild(input);
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    updateSummary(list);
  }

  function markAll(status) {
    visibleStudents().forEach(function (s) { marks[s.studentId] = status; });
    render();
  }

  /* ---------- Submit ---------- */
  // One request per student (backend POST /api/attendance takes a single record).
  async function saveRecords(records) {
    const results = await Promise.allSettled(records.map(function (r) {
      return apiFetch('/attendance', { method: 'POST', body: JSON.stringify(r) });
    }));
    const failed = results.filter(function (x) { return x.status === 'rejected'; }).length;
    if (failed > 0) throw new Error(failed + ' of ' + records.length + ' records failed to save');
  }

  async function submit() {
    hideNotice();
    const date = $('date').value;
    const subjectId = $('subject').value;
    const list = visibleStudents();

    if (!subjectId) { showNotice('Please select a subject.'); return; }
    if (!date) { showNotice('Please select a date.'); return; }
    if (list.length === 0) { showNotice('There are no students to mark.'); return; }

    const records = list.map(function (s) {
      return {
        studentId: s.studentId,
        subjectId: Number(subjectId),
        date: date,
        status: marks[s.studentId] || 'Present'
      };
    });

    const btn = $('submitBtn');
    btn.disabled = true;
    btn.classList.add('loading');
    try {
      if (CONFIG.DEMO_MODE) {
        console.log('DEMO MODE – not saved. Records:', records);
        showNotice('Demo mode: ' + records.length + ' records prepared (see browser Console). Not saved to the server.');
      } else {
        await saveRecords(records);
        showNotice('Attendance saved for ' + records.length + ' students.');
      }
    } catch (e) {
      showNotice('Could not save attendance: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }

  $('dept').addEventListener('change', render);
  $('year').addEventListener('change', render);
  $('section').addEventListener('change', render);
  $('allPresentBtn').addEventListener('click', function () { markAll('Present'); });
  $('allAbsentBtn').addEventListener('click', function () { markAll('Absent'); });
  $('submitBtn').addEventListener('click', submit);

  loadData().then(function () {
    buildFilters();
    render();
  });
})();
