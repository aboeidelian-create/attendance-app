(async () => {
  const profile = await requireAuth();
  if (!profile) return;
  renderSidebar('students', profile.role);

  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = 'students.html'; return; }

  const { data: student, error } = await db.from('students').select('*, classes(name)').eq('id', id).single();
  if (error || !student) {
    document.getElementById('infoCard').innerHTML = '<p>تعذر العثور على الطالب</p>';
    return;
  }

  document.getElementById('infoCard').innerHTML = `
    <h2>${student.first_name}</h2>
    <p><strong>اسم الأب:</strong> ${student.father_name}</p>
    <p><strong>اسم الأم:</strong> ${student.mother_name}</p>
    <p><strong>تاريخ الميلاد:</strong> ${formatDateAr(student.birth_date)}</p>
    <p><strong>العمر:</strong> ${calcAge(student.birth_date)} سنة</p>
    <p><strong>الصف الحالي:</strong> ${student.classes ? student.classes.name : '-'}</p>
    <p><strong>رقم الهاتف:</strong> ${student.phone || '-'}</p>
  `;

  const { data: attendance } = await db
    .from('attendance').select('attendance_date, status')
    .eq('student_id', id).order('attendance_date', { ascending: false });

  const present = (attendance || []).filter(a => a.status === 'present').length;
  const absent = (attendance || []).filter(a => a.status === 'absent').length;
  document.getElementById('totalPresent').textContent = present;
  document.getElementById('totalAbsent').textContent = absent;

  const body = document.getElementById('attendanceBody');
  if (!attendance || !attendance.length) {
    document.getElementById('emptyAtt').style.display = 'block';
  } else {
    body.innerHTML = attendance.map(a => `
      <tr>
        <td>${formatDateAr(a.attendance_date)}</td>
        <td><span class="badge ${a.status}">${a.status === 'present' ? 'حاضر' : 'غائب'}</span></td>
      </tr>
    `).join('');
  }
})();
