// يستدعى في أول كل صفحة محمية: requireAuth('manager') أو requireAuth('staff') أو requireAuth()
async function requireAuth(requiredRole) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    location.href = 'login.html';
    return null;
  }

  const { data: profile, error } = await db
    .from('profiles')
    .select('id, full_name, role, class_id, is_active')
    .eq('id', session.user.id)
    .single();

  if (error || !profile || !profile.is_active) {
    await db.auth.signOut();
    location.href = 'login.html';
    return null;
  }

  if (requiredRole && profile.role !== requiredRole) {
    location.href = profile.role === 'manager' ? 'dashboard-manager.html' : 'dashboard-staff.html';
    return null;
  }

  // تحويل تلقائي عند انتهاء الجلسة
  db.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') location.href = 'login.html';
  });

  return profile;
}
