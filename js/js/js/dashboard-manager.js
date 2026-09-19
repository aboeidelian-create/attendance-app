(async () => {
  const profile = await requireAuth('manager');
  if (!profile) return;
  renderSidebar('dashboard', 'manager');

  const { data: classes } = await db.from('classes').select('id, name').order('id');
  const { data: students } = await db.from('students').select('id, class_id');
  const today = todayISO();
  const { data: todayAttendance } = await db
    .from('attendance').select('status').eq('attendance_date', today);

  const total = students ? students.length : 0;
  const presentToday = todayAttendance ? todayAttendance.filter(a => a.status === 'present').length : 0;
  const absentToday = todayAttendance ? todayAttendance.filter(a => a.status === 'absent').length : 0;

  const statsGrid = document.getElementById('statsGrid');
  statsGrid.innerHTML = `
    <div class="stat-card"><div class="num">${total}</div><div class="label">إجمالي الطلاب</div></div>
    <div class="stat-card"><div class="num">${presentToday}</div><div class="label">حضور اليوم</div></div>
    <div class="stat-card"><div class="num">${absentToday}</div><div class="label">غياب اليوم</div></div>
  `;

  const classesGrid = document.getElementById('classesGrid');
  classesGrid.innerHTML = '';
  (classes || []).forEach(c => {
    const count = students ? students.filter(s => s.class_id === c.id).length : 0;
    const div = document.createElement('div');
    div.className = 'card class-card';
    div.innerHTML = `
      <div>الصف ${c.name}</div>
      <div class="count">${count} طالب</div>
      <a class="btn small" href="students.html?class=${c.id}">عرض الطلاب</a>
    `;
    classesGrid.appendChild(div);
  });
})();
