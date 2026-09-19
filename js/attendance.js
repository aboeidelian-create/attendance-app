let PROFILE = null;
let STUDENTS = [];
let SELECTIONS = {}; // student_id -> 'present' | 'absent'

(async () => {
  PROFILE = await requireAuth();
  if (!PROFILE) return;
  renderSidebar('attendance', PROFILE.role);

  const classSelect = document.getElementById('classSelect');
  if (PROFILE.role === 'manager') {
    const { data: classes } = await db.from('classes').select('id, name').order('id');
    classSelect.innerHTML = '<option value="">اختر الصف</option>' +
      (classes || []).map(c => `<option value="${c.id}">الصف ${c.name}</option>`).join('');
  } else {
    const { data: cls } = await db.from('classes').select('name').eq('id', PROFILE.class_id).single();
    classSelect.innerHTML = `<option value="${PROFILE.class_id}">الصف ${cls ? cls.name : ''}</option>`;
  }

  document.getElementById('dateInput').value = todayISO();
  classSelect.onchange = loadStudentsForAttendance;
  document.getElementById('dateInput').onchange = loadStudentsForAttendance;
  document.getElementById('saveBtn').onclick = saveAttendance;

  if (PROFILE.role === 'staff') loadStudentsForAttendance();
})();

async function loadStudentsForAttendance() {
  const classId = document.getElementById('classSelect').value;
  const date = document.getElementById('dateInput').value;
  const listCard = document.getElementById('listCard');

  if (!classId || !date) { listCard.style.display = 'none'; return; }

  const { data: students, error } = await db.from('students').select('id, first_name, father_name').eq('class_id', classId).order('first_name');
  if (error) { showToast('حدث خطأ أثناء تحميل الطلاب', 'error'); return; }
  STUDENTS = students || [];

  SELECTIONS = {};
  if (STUDENTS.length) {
    const ids = STUDENTS.map(s => s.id);
    const { data: existing } = await db.from('attendance').select('student_id, status').eq('attendance_date', date).in('student_id', ids);
    (existing || []).forEach(a => { SELECTIONS[a.student_id] = a.status; });
  }

  listCard.style.display = 'block';
  renderList();
}

function renderList() {
  const container = document.getElementById('studentsList');
  const emptyMsg = document.getElementById('emptyMsg');
  container.innerHTML = '';

  if (!STUDENTS.length) {
    emptyMsg.style.display = 'block';
    document.getElementById('saveBtn').style.display = 'none';
    return;
  }
  emptyMsg.style.display = 'none';
  document.getElementById('saveBtn').style.display = 'inline-block';

  STUDENTS.forEach(s => {
    const sel = SELECTIONS[s.id];
    const row = document.createElement('div');
    row.className = 'attend-row';
    row.innerHTML = `
      <div class="name">${s.first_name} ${s.father_name}</div>
      <div class="attend-choices">
        <button type="button" data-id="${s.id}" data-status="present" class="${sel === 'present' ? 'sel-present' : ''}">حاضر</button>
        <button type="button" data-id="${s.id}" data-status="absent" class="${sel === 'absent' ? 'sel-absent' : ''}">غائب</button>
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll('button[data-status]').forEach(btn => {
    btn.onclick = () => {
      SELECTIONS[btn.dataset.id] = btn.dataset.status;
      renderList();
    };
  });
}

async function saveAttendance() {
  const date = document.getElementById('dateInput').value;
  const rows = Object.keys(SELECTIONS).map(studentId => ({
    student_id: Number(studentId),
    attendance_date: date,
    status: SELECTIONS[studentId],
  }));

  if (!rows.length) {
    showToast('يرجى تحديد حالة طالب واحد على الأقل', 'error');
    return;
  }

  const { error } = await db.from('attendance').upsert(rows, { onConflict: 'student_id,attendance_date' });
  if (error) { showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error'); return; }

  const present = rows.filter(r => r.status === 'present').length;
  const absent = rows.filter(r => r.status === 'absent').length;
  showToast(`تم حفظ حضور الطلاب بنجاح — الحاضرون: ${present} — الغائبون: ${absent}`, 'success');
    }
