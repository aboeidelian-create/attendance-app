function showToast(message, type) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3000);
}

function calcAge(birthDateStr) {
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDateAr(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

// حوار تأكيد بسيط بدل confirm() الافتراضي
function confirmDialog(message) {
  return new Promise((resolve) => {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal">
        <p>${message}</p>
        <div class="actions">
          <button class="btn secondary" id="cd-cancel">إلغاء</button>
          <button class="btn danger" id="cd-ok">تأكيد</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.querySelector('#cd-cancel').onclick = () => { bg.remove(); resolve(false); };
    bg.querySelector('#cd-ok').onclick = () => { bg.remove(); resolve(true); };
  });
}

const CLASS_NAMES = { 1: 'السابع', 2: 'الثامن', 3: 'التاسع' };

function renderSidebar(activePage, role) {
  const links = [
    { page: 'dashboard', label: 'الرئيسية', href: role === 'manager' ? 'dashboard-manager.html' : 'dashboard-staff.html' },
    { page: 'students', label: 'الطلاب', href: 'students.html' },
    { page: 'attendance', label: 'الحضور', href: 'attendance.html' },
  ];
  if (role === 'manager') {
    links.push({ page: 'staff', label: 'الخدام', href: 'staff.html' });
  }
  const linksHtml = links.map(l =>
    `<a href="${l.href}" class="${activePage === l.page ? 'active' : ''}">${l.label}</a>`
  ).join('');

  const sidebarEl = document.getElementById('sidebar');
  sidebarEl.innerHTML = `
    <h2>نظام إدارة المرحلة</h2>
    <nav>${linksHtml}</nav>
    <div class="logout" id="logoutBtn">تسجيل الخروج</div>
  `;
  document.getElementById('logoutBtn').onclick = async () => {
    await db.auth.signOut();
    location.href = 'login.html';
  };

  const ham = document.getElementById('hamburger');
  if (ham) {
    ham.onclick = () => sidebarEl.classList.toggle('open');
  }
}
