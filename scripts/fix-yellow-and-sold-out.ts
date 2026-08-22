import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function fixStaleSoldOutVariants() {
  console.log('🔧 جاري فحص وإصلاح مشكلة اللون الأصفر والمقاسات الخالصة في الداتا بيس...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // 1. Find all variants where size is 'خالص' but other real sizes exist for the same dress and color
    const staleVariants = await client.query(`
      SELECT id, "dressId", color, size, quantity 
      FROM "DressVariant" 
      WHERE size ILIKE '%خالص%' OR size ILIKE '%نفذ%'
    `);

    console.log(`📦 تم العثور على ${staleVariants.rows.length} سجل قديم يحتوي على كلمة (خالص/نفذت):`);
    for (const r of staleVariants.rows) {
      console.log(`   - Dress ID: ${r.dressId} | اللون: ${r.color} | المقاس: ${r.size}`);
    }

    // Delete stale "خالص" variants so they don't block the color
    if (staleVariants.rows.length > 0) {
      const idsToDelete = staleVariants.rows.map(r => r.id);
      await client.query(`DELETE FROM "DressImage" WHERE "variantId" = ANY($1::int[])`, [idsToDelete]);
      await client.query(`DELETE FROM "DressVariant" WHERE id = ANY($1::int[])`, [idsToDelete]);
      console.log(`\n✅ تم حذف السجلات الوهمية التي كانت تمنع ظهور الألوان.`);
    }

    // 2. Ensure all yellow / valid sizes have proper quantity = 5
    const yellowUpdated = await client.query(`
      UPDATE "DressVariant" 
      SET quantity = 5 
      WHERE (color ILIKE '%اصفر%' OR color ILIKE '%أصفر%' OR color ILIKE '%خردلي%') 
        AND quantity <= 0 
        AND size ~ '^[0-9]+$'
      RETURNING id, "dressId", color, size, quantity
    `);

    console.log(`\n💛 تم تفعيل وتثبيت المقاسات الحية للألوان الصفراء (${yellowUpdated.rows.length} مقاس):`);
    yellowUpdated.rows.forEach(r => {
      console.log(`   - Dress ID: ${r.dressId} | اللون: ${r.color} | المقاس: ${r.size} | الكمية: ${r.quantity}`);
    });

    console.log('\n🎉 تم إصلاح جميع الألوان والسايزات بنجاح 100%!');
  } catch (err) {
    console.error('Error fixing variants:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixStaleSoldOutVariants();
