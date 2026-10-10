(function () {
  // Already signed in? Go straight to the dashboard.
  if (Session.get()) { window.location.replace('dashboard.html'); return; }

  const form      = document.getElementById('loginForm');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const errorBox  = document.getElementById('formError');
  const loginBtn  = document.getElementById('loginBtn');
  const btnText   = document.getElementById('loginBtnText');
  const label     = document.getElementById('usernameLabel');
  const roleBtns  = document.querySelectorAll('.role-switch button');
  const toggleBtn = document.getElementById('togglePw');

  let role = 'faculty';

  if (CONFIG.DEMO_MODE) document.getElementById('demoNote').hidden = false;

  /* ---- role switch ---- */
  function applyRoleLabels() {
    label.textContent = role === 'faculty' ? 'Faculty ID / Username' : 'Student ID';
    userInput.placeholder = role === 'faculty' ? 'Your faculty username' : 'Your student ID, e.g. 101';
  }
  applyRoleLabels();

  roleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      role = btn.dataset.role;
      roleBtns.forEach(function (b) {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on);
      });
      applyRoleLabels();
      clearError();
    });
  });

  /* ---- show / hide password ---- */
  toggleBtn.addEventListener('click', function () {
    const hidden = passInput.type === 'password';
    passInput.type = hidden ? 'text' : 'password';
    toggleBtn.textContent = hidden ? 'Hide' : 'Show';
  });

  function showError(msg) { errorBox.textContent = msg; errorBox.classList.add('show'); }
  function clearError() {
    errorBox.classList.remove('show');
    userInput.classList.remove('invalid');
    passInput.classList.remove('invalid');
  }
  function setLoading(on) {
    loginBtn.disabled = on;
    loginBtn.classList.toggle('loading', on);
    btnText.textContent = on ? 'Signing in…' : 'Sign in';
  }

  /* The users.role column is free text ("Student", "STUDENT", "faculty"...).
     Map it onto the two roles the pages understand. Anything unrecognised
     is refused - it is never treated as faculty. */
  function normalizeRole(value) {
    const r = String(value || '').trim().toLowerCase();
    if (r === 'student') return 'student';
    if (r === 'faculty' || r === 'teacher' || r === 'admin' || r === 'staff') return 'faculty';
    return null;
  }

  /* ---- demo login (used until the backend login endpoint exists) ---- */
  function demoLogin(username, password) {
    const users = {
      faculty: { faculty: { password: 'faculty123', name: 'Dr. Ramesh Kumar' } },
      student: { '101':   { password: 'student123', name: 'Anjali Sharma', studentId: 101 } }
    };
    const u = users[role][username];
    if (!u || u.password !== password) throw new Error('Invalid ID or password.');
    return Promise.resolve({ token: 'demo-token', name: u.name, role: role, studentId: u.studentId || null });
  }

  /* ---- submit ---- */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearError();

    const username = userInput.value.trim();
    const password = passInput.value;

    if (!username || !password) {
      if (!username) userInput.classList.add('invalid');
      if (!password) passInput.classList.add('invalid');
      showError('Please enter both your ID and password.');
      return;
    }

    setLoading(true);
    try {
      // Backend response: { token, name, role, studentId, ... }
      const data = CONFIG.DEMO_MODE
        ? await demoLogin(username, password)
        : await apiFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ username: username, password: password })
          });

      // The role comes from the account, never from the tab that was clicked.
      const actualRole = normalizeRole(data.role);
      if (!actualRole) {
        throw new Error('This account has no valid role. Contact the administrator.');
      }

      // Separate logins: a student account cannot sign in on the Faculty tab and vice versa.
      if (actualRole !== role) {
        throw new Error(actualRole === 'student'
          ? 'This is a student account. Switch to the Student tab to sign in.'
          : 'This is a faculty account. Switch to the Faculty tab to sign in.');
      }

      if (actualRole === 'student' && !data.studentId) {
        throw new Error('Your account is not linked to a student ID. Contact the administrator.');
      }

      Session.set({
        token: data.token,
        name: data.name || data.username || username,
        username: data.username || username,
        role: actualRole,
        studentId: actualRole === 'student' ? Number(data.studentId) : null
      });
      window.location.href = 'dashboard.html';
    } catch (err) {
      showError(err.message || 'Could not sign in. Please try again.');
      setLoading(false);
    }
  });

  [userInput, passInput].forEach(function (el) { el.addEventListener('input', clearError); });
})();
