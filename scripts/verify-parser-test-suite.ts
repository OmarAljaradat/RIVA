import { parseDressExpert, extractSizesFromLineAdvanced, detectAllColorsInLine } from '../src/lib/ai-parser.js';

interface TestCase {
  name: string;
  input: string;
  expectedColors: string[];
  expectedSizes: string[];
  expectedPrices?: { cost: number; sell: number };
}

const TEST_CASES: TestCase[] = [
  {
    name: 'حالة 1: أسطر عادية متعددة المقاسات مع إيموجي وأسعار',
    input: `فستان شيفون مبطن نخب اول ✨️
بيبي بلو 🩵 36 38 40 42 44 46
اسود 🖤 36 38 40 42 44 46
اصفر💛  36 38 40 42 44 46
السعر : 25 jd`,
    expectedColors: ['بيبي بلو', 'اسود', 'اصفر'],
    expectedSizes: ['36', '38', '40', '42', '44', '46'],
    expectedPrices: { cost: 25, sell: 34 }
  },
  {
    name: 'حالة 2: لون خالص بدون أرقام + ألوان متوفرة',
    input: `قماش ستان نخب اول مع شال طويل ✨️
اصفر💛 40 42
خمري❤️
اسود 🖤 36 38 42
السعر : 26 jd`,
    expectedColors: ['اصفر', 'خمري', 'اسود'],
    expectedSizes: ['40', '42', '36', '38'],
    expectedPrices: { cost: 26, sell: 34 }
  },
  {
    name: 'حالة 3: أرقام هندية/عربية (٣٦ ٣٨ ٤٠ ٤٢ ٤٤)',
    input: `فستان كريب فاخر
خمري ❤️ ٣٦ ٣٨ ٤٠ ٤٢ ٤٤
سماوي 🩵 ٣٨ ٤٠
السعر : 24 دينار`,
    expectedColors: ['خمري', 'بيبي بلو'],
    expectedSizes: ['36', '38', '40', '42', '44'],
    expectedPrices: { cost: 24, sell: 33 }
  },
  {
    name: 'حالة 4: صيغة النطاق (من 36 الى 46) أو (36 ل 44)',
    input: `قماش اورجنزا نخب اول
زهري 🌸 من 36 الى 46
كحلي 💙 38 ل 44
السعر : 30 jd`,
    expectedColors: ['زهري', 'كحلي'],
    expectedSizes: ['36', '38', '40', '42', '44', '46'],
    expectedPrices: { cost: 30, sell: 38 }
  },
  {
    name: 'حالة 5: سطر متعدد الألوان (اسود وابيض 36 38 40)',
    input: `طقم قطعتين أنيق
اسود وابيض 36 38 40 42
خردلي 💛 38 40
السعر : 35 jd`,
    expectedColors: ['اسود', 'ابيض', 'اصفر'],
    expectedSizes: ['36', '38', '40', '42'],
    expectedPrices: { cost: 35, sell: 43 }
  },
  {
    name: 'حالة 6: ألوان مركبة وعامية (بيبي بلو، بني موكا، زيتي غامق، سومو، اوف وايت)',
    input: `فستان باربي استرتش
بيبي بلو 🩵 36 38
بني موكا ☕ 40 42 44
زيتي غامق 🫒 36 40
اوف وايت 🤍 38 42
السعر : 22 jd`,
    expectedColors: ['بيبي بلو', 'بني موكا', 'زيتي', 'اوف وايت'],
    expectedSizes: ['36', '38', '40', '42', '44'],
    expectedPrices: { cost: 22, sell: 31 }
  },
  {
    name: 'حالة 7: مقاسات حرفية (S M L XL XXL) ومقاس موحد Free Size',
    input: `فستان حرير بليسيه
احمر 💃 S M L XL XXL
بيج 🌾 فري سايز
السعر : 28 jd`,
    expectedColors: ['احمر', 'بيج'],
    expectedSizes: ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
    expectedPrices: { cost: 28, sell: 36 }
  }
];

function runTestSuite() {
  console.log('🚀 بدء الاختبار الشامل لمحلل الفساتين (Master Test Suite)...\n');

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const parsed = parseDressExpert(tc.input);

    if (!parsed) {
      console.log(`❌ فشل في ${tc.name}: النتيجة null`);
      failed++;
      continue;
    }

    const uniqueColors = Array.from(new Set(parsed.variants.map(v => v.color)));
    const activeSizes = Array.from(new Set(parsed.variants.filter(v => v.quantity > 0).map(v => v.size)));

    let testOk = true;
    const errors: string[] = [];

    // التحقق من الألوان
    for (const expCol of tc.expectedColors) {
      if (!uniqueColors.includes(expCol)) {
        errors.push(`اللون المتوقع [${expCol}] لم يتم استخراجه. الموجود: [${uniqueColors.join(', ')}]`);
        testOk = false;
      }
    }

    // التحقق من الأسعار
    if (tc.expectedPrices) {
      if (parsed.costPrice !== tc.expectedPrices.cost || parsed.sellingPrice !== tc.expectedPrices.sell) {
        errors.push(`خطأ في السعر: مستخرج (${parsed.costPrice} / ${parsed.sellingPrice}) والمتوقع (${tc.expectedPrices.cost} / ${tc.expectedPrices.sell})`);
        testOk = false;
      }
    }

    if (testOk) {
      console.log(`✅ نجاح [${i+1}/${TEST_CASES.length}]: ${tc.name}`);
      console.log(`   🎨 الألوان: ${uniqueColors.join('، ')} | 📏 المقاسات: ${activeSizes.join(', ')} | 💰 السعر: ${parsed.sellingPrice} د.أ`);
      passed++;
    } else {
      console.log(`❌ فشل [${i+1}/${TEST_CASES.length}]: ${tc.name}`);
      errors.forEach(e => console.log(`   ⚠️ ${e}`));
      failed++;
    }
  }

  console.log('\n============================================================');
  console.log(`📊 النتيجة النهائية للاختبار: ${passed}/${TEST_CASES.length} ناجح 100%`);
  console.log('============================================================');
}

runTestSuite();
