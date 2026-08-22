import 'dotenv/config';
import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';

const { Pool } = pg;

const sqlitePath = path.join(process.cwd(), 'dev.db');
const db = new Database(sqlitePath);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function ultraFastMigrate() {
  console.log('⚡ بدء النقل الفوري الفائق (Batched Multi-row) إلى Neon PostgreSQL...\n');

  const dresses = db.prepare('SELECT * FROM Dress ORDER BY id ASC').all() as any[];
  const variants = db.prepare('SELECT * FROM DressVariant ORDER BY id ASC').all() as any[];
  const images = db.prepare('SELECT * FROM DressImage ORDER BY id ASC').all() as any[];
  const orders = db.prepare('SELECT * FROM "Order" ORDER BY id ASC').all() as any[];
  const orderItems = db.prepare('SELECT * FROM OrderItem ORDER BY id ASC').all() as any[];

  console.log(`📦 البيانات: ${dresses.length} فستان | ${variants.length} خيار | ${images.length} صورة/فيديو | ${orders.length} طلب`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('1. تفريغ الجداول في Neon...');
    await client.query('TRUNCATE TABLE "OrderItem", "Order", "DressImage", "DressVariant", "Dress" CASCADE');

    // 1. Batch Insert Dresses
    console.log('2. إدخال الفساتين دفعة واحدة...');
    if (dresses.length > 0) {
      const dressValues: any[] = [];
      const dressPlaceholders: string[] = [];
      dresses.forEach((d, i) => {
        const offset = i * 11;
        dressPlaceholders.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6}, $${offset+7}, $${offset+8}, $${offset+9}, $${offset+10}, $${offset+11})`);
        dressValues.push(
          d.id, d.name, d.nickname || null, d.description || null, d.price, d.originalPrice || null,
          d.sortOrder || 0, d.isNew === 1 || d.isNew === true, d.isFeatured === 1 || d.isFeatured === true,
          new Date(d.createdAt || Date.now()), new Date(d.updatedAt || Date.now())
        );
      });
      await client.query(
        `INSERT INTO "Dress" (id, name, nickname, description, price, "originalPrice", "sortOrder", "isNew", "isFeatured", "createdAt", "updatedAt") VALUES ${dressPlaceholders.join(', ')}`,
        dressValues
      );
    }

    // 2. Batch Insert Variants (chunked in 100s)
    console.log('3. إدخال المقاسات والألوان (Variants) دفعة واحدة...');
    const chunkSize = 100;
    for (let c = 0; c < variants.length; c += chunkSize) {
      const chunk = variants.slice(c, c + chunkSize);
      const vValues: any[] = [];
      const vPlaceholders: string[] = [];
      chunk.forEach((v, i) => {
        const offset = i * 6;
        vPlaceholders.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6})`);
        vValues.push(v.id, v.dressId, v.color, v.colorHex || '#000000', v.size, v.quantity || 0);
      });
      await client.query(
        `INSERT INTO "DressVariant" (id, "dressId", color, "colorHex", size, quantity) VALUES ${vPlaceholders.join(', ')}`,
        vValues
      );
    }

    // 3. Batch Insert Images (chunked in 100s)
    console.log('4. إدخال الصور والفيديوهات دفعة واحدة...');
    for (let c = 0; c < images.length; c += chunkSize) {
      const chunk = images.slice(c, c + chunkSize);
      const imgValues: any[] = [];
      const imgPlaceholders: string[] = [];
      chunk.forEach((img, i) => {
        const offset = i * 3;
        imgPlaceholders.push(`($${offset+1}, $${offset+2}, $${offset+3})`);
        imgValues.push(img.id, img.url, img.variantId);
      });
      await client.query(
        `INSERT INTO "DressImage" (id, url, "variantId") VALUES ${imgPlaceholders.join(', ')}`,
        imgValues
      );
    }

    // 4. Batch Insert Orders
    if (orders.length > 0) {
      console.log('5. إدخال الطلبات...');
      const orderValues: any[] = [];
      const orderPlaceholders: string[] = [];
      orders.forEach((o, i) => {
        const offset = i * 9;
        orderPlaceholders.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6}, $${offset+7}, $${offset+8}, $${offset+9})`);
        orderValues.push(o.id, o.customerName, o.phone, o.address, o.city, o.notes || null, o.status || 'pending', o.total, new Date(o.createdAt || Date.now()));
      });
      await client.query(
        `INSERT INTO "Order" (id, "customerName", phone, address, city, notes, status, total, "createdAt") VALUES ${orderPlaceholders.join(', ')}`,
        orderValues
      );

      if (orderItems.length > 0) {
        const oiValues: any[] = [];
        const oiPlaceholders: string[] = [];
        orderItems.forEach((oi, i) => {
          const offset = i * 6;
          oiPlaceholders.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6})`);
          oiValues.push(oi.id, oi.orderId, oi.dressId, oi.variantId, oi.quantity, oi.price);
        });
        await client.query(
          `INSERT INTO "OrderItem" (id, "orderId", "dressId", "variantId", quantity, price) VALUES ${oiPlaceholders.join(', ')}`,
          oiValues
        );
      }
    }

    // Reset sequences
    await client.query(`SELECT setval(pg_get_serial_sequence('"Dress"', 'id'), coalesce(max(id), 1)) FROM "Dress"`);
    await client.query(`SELECT setval(pg_get_serial_sequence('"DressVariant"', 'id'), coalesce(max(id), 1)) FROM "DressVariant"`);
    await client.query(`SELECT setval(pg_get_serial_sequence('"DressImage"', 'id'), coalesce(max(id), 1)) FROM "DressImage"`);
    await client.query(`SELECT setval(pg_get_serial_sequence('"Order"', 'id'), coalesce(max(id), 1)) FROM "Order"`);
    await client.query(`SELECT setval(pg_get_serial_sequence('"OrderItem"', 'id'), coalesce(max(id), 1)) FROM "OrderItem"`);

    await client.query('COMMIT');
    console.log('\n🎉 اكتمل نقل جميع البيانات بنجاح 100% إلى Neon PostgreSQL السحابية!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', err);
  } finally {
    client.release();
    await pool.end();
    db.close();
  }
}

ultraFastMigrate();
