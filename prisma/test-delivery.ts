import { calculateDeliveryEstimate, calculateExpressDeliveryEstimate } from '../src/lib/delivery.js';

function testDelivery() {
  console.log('--------------------------------------------------');
  console.log('🚚 TESTING STANDARD VS EXPRESS DELIVERY CALCULATORS');
  console.log('--------------------------------------------------');

  const cases = [
    { name: 'Sunday 1:00 PM (before 3 & 4)', date: new Date('2026-08-09T13:00:00') },
    { name: 'Sunday 3:30 PM (after 3, before 4)', date: new Date('2026-08-09T15:30:00') },
    { name: 'Sunday 5:00 PM (after 3 & 4)', date: new Date('2026-08-09T17:00:00') },
    { name: 'Wednesday 2:00 PM (before 3 & 4)', date: new Date('2026-08-12T14:00:00') },
    { name: 'Wednesday 4:30 PM (after 3 & 4)', date: new Date('2026-08-12T16:30:00') },
    { name: 'Thursday 1:00 PM (before 3)', date: new Date('2026-08-13T13:00:00') },
    { name: 'Thursday 4:00 PM (after 3)', date: new Date('2026-08-13T16:00:00') },
    { name: 'Friday 2:00 PM', date: new Date('2026-08-14T14:00:00') },
  ];

  cases.forEach(c => {
    const std = calculateDeliveryEstimate(c.date);
    const exp = calculateExpressDeliveryEstimate(c.date);
    console.log(`📌 ${c.name.padEnd(35)}`);
    console.log(`   • Standard (مععاينة): ${std.fullFormatted}`);
    console.log(`   • Express  (بدون معاينة): ${exp.fullFormatted}`);
    console.log('');
  });
}

testDelivery();
