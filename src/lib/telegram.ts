export interface ExtractedVariant {
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
}

export interface ExtractedDress {
  name: string;
  description: string;
  price: number;
  variants: ExtractedVariant[];
}

// 🎨 قاموس الألوان الموسع والشامل لكافة ألوان التيليجرام الدارجة
export const COLOR_DICTIONARY: { names: string[]; standard: string; hex: string }[] = [
  // أزرق وتدرجاته
  { names: ['بيبي بلو', 'سماوي', 'ازرق فاتح', 'أزرق فاتح', 'بيبي بلو فاتح'], standard: 'بيبي بلو', hex: '#7DD3FC' },
  { names: ['كحلي', 'نيفي', 'كحلي غامق', 'بترولي', 'ازرق غامق', 'أزرق غامق'], standard: 'كحلي', hex: '#1E3A8A' },
  { names: ['ازرق', 'أزرق', 'رويال بلو', 'ملكي'], standard: 'ازرق', hex: '#2563EB' },

  // أسود
  { names: ['اسود', 'أسود', 'سواد'], standard: 'اسود', hex: '#000000' },

  // أبيض وتدرجاته
  { names: ['اوف وايت', 'أوف وايت', 'اوفوايت', 'عاجي', 'سكري', 'لؤلؤي'], standard: 'اوف وايت', hex: '#FDFBF7' },
  { names: ['ابيض', 'أبيض', 'ناصع'], standard: 'ابيض', hex: '#FFFFFF' },

  // خمري وأحمر وعنابي
  { names: ['خمري', 'عنابي', 'مارون', 'نبيذي', 'بورغندي', 'دم الغزال'], standard: 'خمري', hex: '#722F37' },
  { names: ['احمر', 'أحمر', 'ناري', 'فلمنجو'], standard: 'احمر', hex: '#DC2626' },

  // زهري وسومو ووردي
  { names: ['سومو', 'سلمون', 'سالمون', 'كورال', 'مشمشي'], standard: 'سومو', hex: '#FB923C' },
  { names: ['زهري', 'وردي', 'روز', 'بينك', 'بنك', 'زهري فاتح'], standard: 'زهري', hex: '#F472B6' },
  { names: ['فوشي', 'فوشيا', 'زهري غامق'], standard: 'فوشي', hex: '#DB2777' },

  // أصفر وذهبي
  { names: ['اصفر', 'أصفر', 'خردلي', 'ليموني', 'كموني'], standard: 'اصفر', hex: '#FBBF24' },
  { names: ['ذهبي', 'شامبين', 'غولد'], standard: 'ذهبي', hex: '#D4AF37' },

  // بني ودرجاته
  { names: ['بني موكا', 'موكا', 'كافيه'], standard: 'بني موكا', hex: '#92400E' },
  { names: ['بني فاتح', 'هافان', 'كراميل', 'عسلي', 'تان'], standard: 'بني فاتح', hex: '#A16207' },
  { names: ['بني', 'شوكولا', 'بني غامق', 'كستنائي'], standard: 'بني', hex: '#78350F' },
  { names: ['بيج', 'رملي', 'نيود', 'طباشيري'], standard: 'بيج', hex: '#D2B48C' },

  // زيتي وأخضر
  { names: ['زيتي', 'زيتوني', 'كاكي', 'عسكري'], standard: 'زيتي', hex: '#4D7C0F' },
  { names: ['اخضر', 'أخضر', 'زمردي', 'عشبي', 'فستقي', 'مينت'], standard: 'اخضر', hex: '#16A34A' },

  // بنفسجي ونهدي
  { names: ['نهدي', 'بنفسجي', 'موف', 'ارجواني', 'أرجواني', 'لافندر', 'ليلكي'], standard: 'نهدي', hex: '#A855F7' },

  // فضي ورمادي
  { names: ['فضي', 'سلفر'], standard: 'فضي', hex: '#94A3B8' },
  { names: ['سكني', 'رمادي', 'رصاصي', 'جري'], standard: 'رمادي', hex: '#64748B' },
];

// أرقام المقاسات القياسية
const STANDARD_EVEN_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'];
const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];

/**
 * دالة تحليل نطاقات المقاسات مثل "38-46" إلى مصفوفة [38, 40, 42, 44, 46]
 */
function expandSizeRange(rangeStr: string): string[] {
  const match = rangeStr.match(/(\d{2})\s*[-–—إلىto]+\s*(\d{2})/i);
  if (!match) return [];
  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  if (isNaN(start) || isNaN(end) || start >= end) return [];

  const results: string[] = [];
  for (let s = start; s <= end; s += 2) {
    results.push(String(s));
  }
  return results;
}

/**
 * المحلل الذكي والشامل لمنشورات التيليجرام
 */
export function parseChannelPost(text: string): ExtractedDress | null {
  if (!text || text.trim().length === 0) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // 1. استخراج السعر النهائي (سعر التيليجرام + 8 دنانير)
  let basePrice = 25;
  const priceMatch =
    text.match(/السعر\s*[:=]?\s*(\d+)/i) ||
    text.match(/(\d+)\s*(?:jd|دينار|د\.أ)/i) ||
    text.match(/بـ?\s*(\d+)\s*(?:jd|دينار)/i);

  if (priceMatch) {
    basePrice = parseInt(priceMatch[1], 10);
  }
  const finalPrice = basePrice + 8;

  // 2. استخراج الاسم ونوع القماش من السطر الأول
  let name = lines[0]
    .replace(/[✨️💫🌷🎗💕🍂⭐🌟👑🌸👗💎🌹]/g, '')
    .replace(/[،,.\-_/\\|():]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (name.length < 4) {
    name = 'فستان سهرة راقي';
  }

  // 3. تحليل الألوان والمقاسات سطراً بسطر
  const variants: ExtractedVariant[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // استبعاد أسطر الأبعاد والتفاصيل الجانبية والأسعار
    if (
      line.includes('السعر') ||
      line.includes('طول البليزر') ||
      line.includes('طول البنطلون') ||
      line.includes('طول الفستان') ||
      line.includes('عرض الصدر') ||
      line.includes('طول الكم') ||
      line.includes('cm') ||
      line.includes('سم')
    ) {
      continue;
    }

    // البحث عن مطابقة اللون في هذا السطر
    let detectedColor: { standard: string; hex: string } | null = null;

    // فحص الأسماء المركبة أولاً (مثل بيبي بلو، بني موكا، اوف وايت) قبل الألوان البسيطة
    for (const entry of COLOR_DICTIONARY) {
      for (const alias of entry.names) {
        // فحص وجود كلمة اللون ككلمة أو مقطع مستقل
        if (line.includes(alias)) {
          detectedColor = { standard: entry.standard, hex: entry.hex };
          break;
        }
      }
      if (detectedColor) break;
    }

    if (detectedColor) {
      const colorName = detectedColor.standard;
      const colorHex = detectedColor.hex;

      // فحص إذا كان اللون محدد كـ "خالص" أو "نفذ" أو "غير متوفر"
      const isSoldOutWord = /خالص|نفذ|خلص|غير متوفر|تم البيع|sold/i.test(line);

      // استخراج المقاسات إذا وجدت
      const extractedSizes: string[] = [];

      // 1) فحص النطاقات مثل 38-46
      const rangeSizes = expandSizeRange(line);
      if (rangeSizes.length > 0) {
        extractedSizes.push(...rangeSizes);
      }

      // 2) فحص الأرقام الفردية (34 إلى 56)
      const sizeNumbers = line.match(/\b(3[4-9]|4[0-9]|5[0-9])\b/g);
      if (sizeNumbers && sizeNumbers.length > 0) {
        extractedSizes.push(...sizeNumbers);
      }

      // 3) فحص مقاسات الأحرف (S, M, L, XL...)
      const letterMatches = line.match(/\b(XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL)\b/gi);
      if (letterMatches && letterMatches.length > 0) {
        extractedSizes.push(...letterMatches.map(s => s.toUpperCase()));
      }

      // 4) فحص الفري سايز
      if (/فري\s*سايز|free\s*size|ون\s*سايز|one\s*size|مقاس\s*موحد/i.test(line)) {
        extractedSizes.push('Free Size');
      }

      const uniqueSizes = Array.from(new Set(extractedSizes));

      if (uniqueSizes.length > 0 && !isSoldOutWord) {
        for (const sz of uniqueSizes) {
          variants.push({
            color: colorName,
            colorHex,
            size: sz,
            quantity: 5 // متوفر
          });
        }
      } else {
        // اللون مذكور بدون أرقام أو مكتوب عليه خالص -> غير متاح
        variants.push({
          color: colorName,
          colorHex,
          size: 'خالص',
          quantity: 0 // غير متوفر
        });
      }
    }
  }

  // إذا لم يتم استخراج أي لون، وضع لون أساسي افتراضي
  if (variants.length === 0) {
    variants.push({
      color: 'أساسي',
      colorHex: '#722F37',
      size: '38',
      quantity: 5
    });
  }

  return {
    name,
    description: text,
    price: finalPrice,
    variants
  };
}
