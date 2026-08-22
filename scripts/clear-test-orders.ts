import 'dotenv/config';
import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';

const { Pool } = pg;

async function clearTestOrders() {
  console.log('🧹 جاري حذف جميع الطلبات والبيانات التجريبية بالكامل...\n');

  // 1. Clear Neon PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('⚡ تفريغ جداول الطلبات في قاعدة بيانات Neon السحابية...');
    await client.query('DELETE FROM "OrderItem"');
    await client.query('DELETE FROM "Order"');

    // Reset order IDs sequence back to 1
    await client.query(`SELECT setval(pg_get_serial_sequence('"Order"', 'id'), 1, false)`);
    await client.query(`SELECT setval(pg_get_serial_sequence('"OrderItem"', 'id'), 1, false)`);

    await client.query('COMMIT');
    console.log('✅ تم حذف جميع الطلبات التجريبية وتصفير العداد من Neon بنجاح.');

    // Count remaining dresses to ensure safety
    const dressesRes = await client.query('SELECT COUNT(*) FROM "Dress"');
    const variantsRes = await client.query('SELECT COUNT(*) FROM "DressVariant"');
    const imagesRes = await client.query('SELECT COUNT(*) FROM "DressImage"');
    const ordersRes = await client.query('SELECT COUNT(*) FROM "Order"');

    console.log(`\n📊 حالة قاعدة البيانات السحابية (Neon) بعد التنظيف:`);
    console.log(`👗 الفساتين: ${dressesRes.rows[0].count} (محفوظة بالكامل)`);
    console.log(`🎨 الخيارات والمقاسات: ${variantsRes.rows[0].count} (محفوظة بالكامل)`);
    console.log(`📸 الصور والفيديوهات: ${imagesRes.rows[0].count} (محفوظة بالكامل)`);
    console.log(`📦 الطلبات التجريبية المتبقية: ${ordersRes.rows[0].count} (فارغة ونظيفة 0)`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error cleaning Neon:', err);
  } finally {
    client.release();
    await pool.end();
  }

  // 2. Clear Local SQLite dev.db as well
  try {
    const sqlitePath = path.join(process.cwd(), 'dev.db');
    const db = new Database(sqlitePath);
    db.prepare('DELETE FROM OrderItem').run();
    db.prepare('DELETE FROM "Order"').run();
    db.close();
    console.log('\n✅ تم تنظيف الطلبات التجريبية من النسخة المحلية أيضاً.');
  } catch (e) {
    // ignore
  }

  console.log('\n🎉 اكتمل التنظيف! لوحة الإدمن والداشبورد جاهزة لاستقبال طلبات الزبائن الحقيقية بدءاً من الطلب #1');
}

clearTestOrders();
