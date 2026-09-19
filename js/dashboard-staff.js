(async () => {
  const profile = await requireAuth('staff');
  if (!profile) return;
  renderSidebar('dashboard', 'staff');

  const { data: cls } = await db.from('classes').select('name').eq('id', profile.class_id).single();
  document.getElementById('pageTitle').textContent = 'الصف ' + (cls ? cls.name : '');

  const { data: students } = await db.from('students').select('id').eq('class_id', profile.class_id);
  const today = todayISO();
  const ids = (students || []).map(s => s.id);
  let presentToday = 0, absentToday = 0;
  if (ids.length) {
    const { data: att } = await db.from('attendance').select('status').eq('attendance_date', today).in('student_id', ids);
    presentToday = (att || []).filter(a => a.status === 'present').length;
    absentToday = (att || []).filter(a => a.status === 'absent').length;
  }

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="num">${students ? students.length : 0}</div><div class="label">عدد الطلاب</div></div>
    <div class="stat-card"><div class="num">${presentToday}</div><div class="label">حضور اليوم</div></div>
    <div class="stat-card"><div class="num">${absentToday}</div><div class="label">غياب اليوم</div></div>
  `;
})();
