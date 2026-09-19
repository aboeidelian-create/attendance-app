// ينشئ اتصال Supabase عام باسم "db" تستخدمه كل صفحات المشروع
// يعتمد على مكتبة supabase-js المحمّلة عبر CDN + ملف config.js
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
