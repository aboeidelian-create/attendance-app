let CLASSES = [];

(async () => {
  const profile = await requireAuth('manager');
  if (!profile) return;
  renderSidebar('staff', 'manager');

  const { data: classes } = await db.from('classes').select('id, name').order('id');
  CLASSES = classes || [];
  document.getElementById('classSelect').innerHTML = CLASSES.map(c => `<option value="${c.id}">الصف ${c.name}</option>`).join('');

  document.getElementById('addBtn').onclick = () => {
    document.getElementById('formCard').style.display = 'block';
    document.getElementById('staffForm').reset();
    document.getElementById('formError').textContent = '';
  };
  document.getElementById('cancelBtn').onclick = () => {
    document.getElementById('formCard').style.display = 'none';
  };
  document.getElementById('staffForm').onsubmit = saveStaff;

  await loadStaff();
})();

async function loadStaff() {
  const { data, error } = await db.from('profiles').select('*').eq('role', 'staff').order('created_at');
  const body = document.getElementById('staffBody');
  const emptyMsg = document.getElementById('emptyMsg');
  body.innerHTML = '';

  if (error || !data || !data.length) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  data.forEach(s => {
    const cls = CLASSES.find(c => c.id === s.class_id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.full_name}<br><span style="color:var(--muted);font-size:12px">${s.email || ''}</span></td>
      <td>
        <select data-class="${s.id}" style="min-width:110px">
          ${CLASSES.map(c => `<option value="${c.id}" ${c.id === s.class_id ? 'selected' : ''}>الصف ${c.name}</option>`).join('')}
        </select>
      </td>
      <td><span class="badge ${s.is_active ? 'active' : 'inactive'}">${s.is_active ? 'مفعّل' : 'متوقف'}</span></td>
      <td>
        <button class="btn small ${s.is_active ? 'danger' : 'success'}" data-toggle="${s.id}" data-active="${s.is_active}">
          ${s.is_active ? 'إيقاف' : 'تفعيل'}
        </button>
      </td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('[data-class]').forEach(sel => {
    sel.onchange = () => updateStaffClass(sel.dataset.class, sel.value);
  });
  body.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.onclick = () => toggleStaff(btn.dataset.toggle, btn.dataset.active === 'true');
  });
}

async function saveStaff(e) {
  e.preventDefault();
  const errorEl = document.getElementById('formError');
  errorEl.textContent = '';

  const payload = {
    id: document.getElementById('userId').value.trim(),
    full_name: document.getElementById('fullName').value.trim(),
    email: document.getElementById('emailDisplay').value.trim(),
    role: 'staff',
    class_id: Number(document.getElementById('classSelect').value),
    is_active: true,
  };

  if (!payload.id || !payload.full_name || !payload.email) {
    errorEl.textContent = 'يرجى تعبئة جميع الحقول';
    return;
  }

  const { error } = await db.from('profiles').insert(payload);
  if (error) {
    errorEl.textContent = error.message.includes('الحد الأقصى') ? error.message : 'حدث خطأ، تأكد من صحة الـ UID أو أن الحساب غير مضاف مسبقًا';
    return;
  }

  showToast('تمت إضافة الخادم بنجاح', 'success');
  document.getElementById('formCard').style.display = 'none';
  await loadStaff();
}

async function updateStaffClass(id, classId) {
  const { error } = await db.from('profiles').update({ class_id: Number(classId) }).eq('id', id);
  if (error) { showToast(error.message.includes('الحد الأقصى') ? error.message : 'حدث خطأ، يرجى المحاولة مرة أخرى', 'error'); await loadStaff(); return; }
  showToast('تم تعديل الصف', 'success');
}

async function toggleStaff(id, currentlyActive) {
  const { error } = await db.from('profiles').update({ is_active: !currentlyActive }).eq('id', id);
  if (error) { showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error'); return; }
  showToast(currentlyActive ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب', 'success');
  await loadStaff();
}
