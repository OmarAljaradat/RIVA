const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const variants = await prisma.dressVariant.findMany({
    select: {
      size: true,
      color: true,
      quantity: true,
      dress: { select: { name: true, nickname: true } }
    },
    orderBy: { size: 'asc' }
  });

  const sizes = [...new Set(variants.map(v => v.size))].sort();
  
  console.log('\n=== السايزات الموجودة بقاعدة البيانات ===');
  sizes.forEach(s => console.log(' •', s));
  
  console.log('\n=== تفاصيل كل variant ===');
  variants.forEach(v => {
    const name = v.dress.nickname || v.dress.name;
    console.log(`${name} | ${v.color} | سايز: ${v.size} | كمية: ${v.quantity}`);
  });

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });
