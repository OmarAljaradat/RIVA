export interface AiParsedDress {
  name: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  variants: {
    color: string;
    colorHex: string;
    size: string;
    quantity: number;
  }[];
}

// ── قاموس شامل لجميع ألوان فساتين التيليجرام والأردن ──────────────────────────────
export const COLOR_DICTIONARY: { name: string; hex: string; aliases: string[]; emoji?: string }[] = [
  { name: 'اسود', hex: '#000000', aliases: ['اسود', 'أسود', 'سواد', 'بلاك', 'black'], emoji: '🖤' },
  { name: 'ابيض', hex: '#FFFFFF', aliases: ['ابيض', 'أبيض', 'وايت', 'white', 'ناصع'], emoji: '🤍' },
  { name: 'اوف وايت', hex: '#F5F5DC', aliases: ['اوف وايت', 'أوف وايت', 'اوفوايت', 'سكري', 'كريمي', 'off white', 'offwhite'] },
  { name: 'خمري', hex: '#722F37', aliases: ['خمري', 'خمرى', 'ماروني', 'نبيذي', 'بورغندي', 'burgundy'], emoji: '❤️' },
  { name: 'احمر', hex: '#DC2626', aliases: ['احمر', 'أحمر', 'ريد', 'red'] },
  { name: 'عنابي', hex: '#800020', aliases: ['عنابي', 'دم الغزال'] },
  { name: 'كحلي', hex: '#1E3A5F', aliases: ['كحلي', 'كحلى', 'نيلي', 'كحلي غامق', 'رويال بلو', 'navy', 'كحلي ملوكي'], emoji: '💙' },
  { name: 'بيبي بلو', hex: '#89CFF0', aliases: ['بيبي بلو', 'بيبيبلو', 'بيبي بلوو', 'سماوي', 'ازرق فاتح', 'baby blue', 'babyblue'], emoji: '🩵' },
  { name: 'زهري', hex: '#F472B6', aliases: ['زهري', 'زهرى', 'وردي', 'بينك', 'pink', 'فوشيا فاتح'], emoji: '🩷' },
  { name: 'فوشي', hex: '#DB2777', aliases: ['فوشي', 'فوشيا', 'ماجنتي', 'فوشيه'] },
  { name: 'سومو', hex: '#F9A8D4', aliases: ['سومو', 'سومو غامق', 'سمكي', 'سلمون', 'salmon'] },
  { name: 'اصفر', hex: '#EAB308', aliases: ['اصفر', 'أصفر', 'اصفر كموني', 'ليموني', 'خردلي', 'كموني', 'كركمي', 'يلو', 'yellow', 'مسترد'], emoji: '💛' },
  { name: 'بني', hex: '#8B4513', aliases: ['بني', 'بنى', 'بني شوكولاته', 'شوكولاته', 'brown'], emoji: '🤎' },
  { name: 'بني فاتح', hex: '#D2B48C', aliases: ['بني فاتح', 'ترابي', 'كراميل', 'عسلي', 'هافان', 'جملي', 'camel'] },
  { name: 'بني موكا', hex: '#6F4E37', aliases: ['بني موكا', 'موكا', 'كافيه', 'نسكافيه', 'mocha'] },
  { name: 'بيج', hex: '#D4B896', aliases: ['بيج', 'بيج فاتح', 'بيج غامق', 'بيچ', 'beige'] },
  { name: 'نهدي', hex: '#A855F7', aliases: ['نهدي', 'نهدى', 'بنفسجي', 'موف', 'ليلكي', 'لافندر', 'purple', 'ارغواني'], emoji: '💜' },
  { name: 'زيتي', hex: '#556B2F', aliases: ['زيتي', 'زيتى', 'زيتوني', 'جيشي', 'كاكي', 'olive', 'زيتي غامق'], emoji: '💚' },
  { name: 'اخضر', hex: '#16A34A', aliases: ['اخضر', 'أخضر', 'زمردي', 'عشبي', 'جرين', 'green'] },
  { name: 'فستقي', hex: '#86EFAC', aliases: ['فستقي', 'مينت', 'نعناعي', 'تفاحي', 'mint'] },
  { name: 'رمادي', hex: '#9CA3AF', aliases: ['رمادي', 'رمادى', 'سكني', 'سكنى', 'رصاصي', 'سلفر', 'فضي', 'grey', 'gray'] },
  { name: 'برتقالي', hex: '#F97316', aliases: ['برتقالي', 'برتقالى', 'اورنج', 'أورنج', 'مشمشي', 'طوبي', 'orange'], emoji: '🧡' },
  { name: 'ذهبي', hex: '#D4AF37', aliases: ['ذهبي', 'ذهبى', 'شامبين', 'شامبانيا', 'gold'] },
];

// ── دالة تنظيف وتوحيد الأرقام العربية والإنجليزية ──────────────────────────────
export function normalizeArabicNumbers(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d)));
}

// ── دالة استخراج المقاسات بدقة عالية من أي نص ─────────────────────────────────
export function extractSizesFromLine(line: string): string[] {
  const normalized = normalizeArabicNumbers(line)
    .replace(/[,\-_/\\|•]/g, ' ')
    .replace(/\s+/g, ' ');

  const sizes: string[] = [];

  // 1. فحص المقاسات الموحدة
  if (/فري\s*سايز|مقاس\s*موحد|free\s*size|one\s*size/i.test(normalized)) {
    return ['Free Size'];
  }

  // 2. المقاسات الرقمية (34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54)
  const numMatches = normalized.match(/\b(34|36|38|40|42|44|46|48|50|52|54)\b/g);
  if (numMatches) {
    numMatches.forEach(m => {
      if (!sizes.includes(m)) sizes.push(m);
    });
  }

  // 3. المقاسات الحرفية (XS, S, M, L, XL, XXL, 2XL, 3XL, 4XL, 5XL)
  const letterMatches = normalized.match(/\b(XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|XXXL)\b/gi);
  if (letterMatches) {
    letterMatches.forEach(m => {
      const upper = m.toUpperCase();
      if (!sizes.includes(upper)) sizes.push(upper);
    });
  }

  return sizes;
}

// ── دالة التعرف على اللون الذكية بالكلمات والإيموجي ──────────────────────────────
export function identifyColor(line: string): { color: string; colorHex: string } | null {
  const cleanLine = line.toLowerCase();

  // 1. فحص بالأسماء والـ Aliases
  for (const entry of COLOR_DICTIONARY) {
    for (const alias of entry.aliases) {
      const regex = new RegExp(`(^|[\\s،,:;\\-_])${alias}([\\s،,:;\\-_]|$)`, 'i');
      if (regex.test(cleanLine) || cleanLine.startsWith(alias) || cleanLine.includes(alias)) {
        return { color: entry.name, colorHex: entry.hex };
      }
    }
  }

  // 2. فحص بالإيموجي إذا لم تُذكر الكلمة صراحة
  for (const entry of COLOR_DICTIONARY) {
    if (entry.emoji && cleanLine.includes(entry.emoji)) {
      return { color: entry.name, colorHex: entry.hex };
    }
  }

  return null;
}

// ── المحلل الذكي الفائق والشامل للمنشورات ─────────────────────────────────────
export function parseDressExpert(rawText: string): AiParsedDress | null {
  if (!rawText || typeof rawText !== 'string') return null;

  const normalizedText = normalizeArabicNumbers(rawText);
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // 1. استخراج السعر
  let costPrice = 25;
  for (const line of lines) {
    const priceMatch = line.match(/(?:السعر|price|jd|دينار|د\.أ)?\s*:?\s*(\d+(?:\.\d+)?)/i) || 
                       line.match(/(\d{2})\s*(?:jd|دينار)/i);
    if (priceMatch) {
      const p = parseFloat(priceMatch[1]);
      if (p >= 10 && p <= 120) {
        costPrice = p;
        break;
      }
    }
  }

  // قاعدة التسعير في الأردن: إذا أقل من 26 أضف 9، وإذا 26 فأكثر أضف 8
  const margin = costPrice < 26 ? 9 : 8;
  const sellingPrice = costPrice + margin;

  // 2. استخراج الاسم والوصف
  let description = '';
  for (const line of lines) {
    if (
      line.includes('الوصف') || line.includes('قماش') || line.includes('فستان') || 
      line.includes('طقم') || line.includes('شيفون') || line.includes('كريب') || 
      line.includes('ستان') || line.includes('اورجنزرا') || line.includes('باربي')
    ) {
      description = line.replace(/^الوصف\s*:\s*/, '').trim();
      break;
    }
  }
  if (!description && lines[0]) description = lines[0];

  // 3. استخراج الألوان والمقاسات
  const variants: AiParsedDress['variants'] = [];

  for (const line of lines) {
    // تجاهل أسطر السعر أو العناوين العامة
    if (
      line.startsWith('السعر') || line.includes('price') || 
      line.startsWith('المقاسات') || line.startsWith('الالوان') || line.startsWith('اللوان')
    ) {
      continue;
    }

    const identified = identifyColor(line);
    if (identified) {
      const sizes = extractSizesFromLine(line);
      const isExplicitlySoldOut = line.includes('خالص') || line.includes('نفذت') || line.includes('نفذ');

      if (sizes.length > 0 && !isExplicitlySoldOut) {
        for (const s of sizes) {
          variants.push({
            color: identified.color,
            colorHex: identified.colorHex,
            size: s,
            quantity: 5
          });
        }
      } else {
        // اللون نفذ أو غير متوفر
        variants.push({
          color: identified.color,
          colorHex: identified.colorHex,
          size: 'خالص (نفذت الكمية)',
          quantity: 0
        });
      }
    }
  }

  return {
    name: description,
    description: description,
    costPrice,
    sellingPrice,
    variants
  };
}

// ── المحلل الرئيسي (يستخدم خبير القواعد الفوري والمحسّن) ──────────────────────
export async function parseDressWithAi(rawText: string): Promise<AiParsedDress | null> {
  return parseDressExpert(rawText);
}
