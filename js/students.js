let PROFILE = null;
let CLASSES = [];
let STUDENTS = [];
let ATTENDANCE_COUNTS = {};

(async () => {
  PROFILE = await requireAuth();
  if (!PROFILE) return;
  renderSidebar('students', PROFILE.role);

  const { data: classes } = await db.from('classes').select('id, name').order('id');
  CLASSES = classes || [];

  fillClassSelects();
  await loadStudents();

  document.getElementById('addBtn').onclick = () => openForm();
  document.getElementById('cancelBtn').onclick = () => closeForm();
  document.getElementById('studentForm').onsubmit = saveStudent;
  document.getElementById('filterClass').onchange = loadStudents;
  document.getElementById('searchBox').oninput = renderTable;

  const urlClass = new URLSearchParams(location.search).get('class');
  if (urlClass) {
    document.getElementById('filterClass').value = urlClass;
    await loadStudents();
  }
})();

function fillClassSelects() {
  const filterSel = document.getElementById('filterClass');
  const formSel = document.getElementById('classSelect');

  if (PROFILE.role === 'manager') {
    filterSel.innerHTML = '<option value="">كل الصفوف</option>' +
      CLASSES.map(c => `<option value="${c.id}">الصف ${c.name}</option>`).join('');
    formSel.innerHTML = CLASSES.map(c => `<option value="${c.id}">الصف ${c.name}</option>`).join('');
  } else {
    const myClass = CLASSES.find(c => c.id === PROFILE.class_id);
    filterSel.innerHTML = `<option value="${PROFILE.class_id}">الصف ${myClass ? myClass.name : ''}</option>`;
    filterSel.disabled = true;
    formSel.innerHTML = `<option value="${PROFILE.class_id}">الصف ${myClass ? myClass.name : ''}</option>`;
    formSel.disabled = true;
  }
}

async function loadStudents() {
  const classId = document.getElementById('filterClass').value;
  let query = db.from('students').select('*').order('first_name');
  if (PROFILE.role === 'staff') query = query.eq('class_id', PROFILE.class_id);
  else if (classId) query = query.eq('class_id', classId);

  const { data, error } = await query;
  if (error) { showToast('حدث خطأ أثناء تحميل الطلاب', 'error'); return; }
  STUDENTS = data || [];

  const ids = STUDENTS.map(s => s.id);
  ATTENDANCE_COUNTS = {};
  if (ids.length) {
    const { data: att } = await db.from('attendance').select('student_id, status').in('student_id', ids);
    (att || []).forEach(a => {
      if (!ATTENDANCE_COUNTS[a.student_id]) ATTENDANCE_COUNTS[a.student_id] = { present: 0, absent: 0 };
      ATTENDANCE_COUNTS[a.student_id][a.status]++;
    });
  }
  renderTable();
}

function renderTable() {
  const q = document.getElementById('searchBox').value.trim().toLowerCase();
  const filtered = STUDENTS.filter(s => {
    if (!q) return true;
    return [s.first_name, s.father_name, s.mother_name, s.phone || '']
      .join(' ').toLowerCase().includes(q);
  });

  const body = document.getElementById('studentsBody');
  const emptyMsg = document.getElementById('emptyMsg');
  body.innerHTML = '';

  if (!filtered.length) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  filtered.forEach(s => {
    const cls = CLASSES.find(c => c.id === s.class_id);
    const counts = ATTENDANCE_COUNTS[s.id] || { present: 0, absent: 0 };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.first_name}</td>
      <td>${s.father_name}</td>
      <td>${s.mother_name}</td>
      <td>${calcAge(s.birth_date)}</td>
      <td>${cls ? cls.name : '-'}</td>
      <td>${s.phone || '-'}</td>
      <td>${counts.present}</td>
      <td>${counts.absent}</td>
      <td>
        <a class="btn small secondary" href="student.html?id=${s.id}">عرض</a>
        <button class="btn small" data-edit="${s.id}">تعديل</button>
        ${PROFILE.role === 'manager' ? `<button class="btn small danger" data-del="${s.id}">حذف</button>` : ''}
      </td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => openForm(STUDENTS.find(s => s.id == btn.dataset.edit));
  });
  body.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => deleteStudent(btn.dataset.del);
  });
}

function openForm(student) {
  document.getElementById('formCard').style.display = 'block';
  document.getElementById('formTitle').textContent = student ? 'تعديل بيانات الطالب' : 'إضافة طالب';
  document.getElementById('formError').textContent = '';
  document.getElementById('studentId').value = student ? student.id : '';
  document.getElementById('firstName
