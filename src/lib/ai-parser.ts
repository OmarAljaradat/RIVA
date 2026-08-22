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

// ── قاموس الألوان العملاق والشامل لجميع متاجر الفساتين في الأردن والشرق الأوسط ────────
export interface ColorDef {
  name: string;
  hex: string;
  aliases: string[];
  emojis: string[];
}

export const MASTER_COLOR_DICTIONARY: ColorDef[] = [
  {
    name: 'اسود',
    hex: '#000000',
    aliases: ['اسود', 'أسود', 'سواد', 'بلاك', 'black', 'اسود ملكي', 'اسود فاحم'],
    emojis: ['🖤', '⬛', '🏴']
  },
  {
    name: 'ابيض',
    hex: '#FFFFFF',
    aliases: ['ابيض', 'أبيض', 'وايت', 'white', 'ناصع', 'بياض', 'ابيض ناصع'],
    emojis: ['🤍', '⬜', '🏳️']
  },
  {
    name: 'اوف وايت',
    hex: '#F5F5DC',
    aliases: ['اوف وايت', 'أوف وايت', 'اوفوايت', 'اوف-وايت', 'سكري', 'كريمي', 'off white', 'offwhite', 'عاجي'],
    emojis: ['📜', '🥛']
  },
  {
    name: 'خمري',
    hex: '#722F37',
    aliases: ['خمري', 'خمرى', 'ماروني', 'نبيذي', 'بورغندي', 'برغندي', 'burgundy', 'مارون', 'دم غزال', 'شيري'],
    emojis: ['❤️', '🍷', '🍒']
  },
  {
    name: 'احمر',
    hex: '#DC2626',
    aliases: ['احمر', 'أحمر', 'ريد', 'red', 'احمر ناري', 'فلاور'],
    emojis: ['🔴', '🌹', '💃']
  },
  {
    name: 'عنابي',
    hex: '#800020',
    aliases: ['عنابي', 'عنابى', 'دم الغزال', 'توتي', 'توتى'],
    emojis: ['🍇']
  },
  {
    name: 'كحلي',
    hex: '#1E3A5F',
    aliases: ['كحلي', 'كحلى', 'نيلي', 'نيلى', 'كحلي غامق', 'رويال بلو', 'navy', 'كحلي ملوكي', 'بلو غامق', 'ازرق داكن'],
    emojis: ['💙', '🔷', '🫐']
  },
  {
    name: 'بيبي بلو',
    hex: '#89CFF0',
    aliases: ['بيبي بلو', 'بيبيبلو', 'بيبي-بلو', 'بيبي بلوو', 'سماوي', 'سماوى', 'ازرق فاتح', 'baby blue', 'babyblue', 'سكاي'],
    emojis: ['🩵', '🧊', '🐬']
  },
  {
    name: 'زهري',
    hex: '#F472B6',
    aliases: ['زهري', 'زهرى', 'وردي', 'وردى', 'بينك', 'pink', 'روز', 'rose', 'بيبي بينك', 'زهري باربي'],
    emojis: ['🩷', '🌸', '🎀']
  },
  {
    name: 'فوشي',
    hex: '#DB2777',
    aliases: ['فوشي', 'فوشى', 'فوشيا', 'فوشيه', 'ماجنتي', 'ماجنتا', 'زهري غامق', 'فوشيا صارخ'],
    emojis: ['🌺', '💄']
  },
  {
    name: 'سومو',
    hex: '#F9A8D4',
    aliases: ['سومو', 'سومو غامق', 'سومو فاتح', 'سمكي', 'سلمون', 'salmon', 'دستي روز', 'dusty rose'],
    emojis: ['🦩', '🍑']
  },
  {
    name: 'اصفر',
    hex: '#EAB308',
    aliases: ['اصفر', 'أصفر', 'اصفر كموني', 'ليموني', 'ليمونى', 'خردلي', 'خردلى', 'كموني', 'كمونى', 'كركمي', 'كركمى', 'يلو', 'yellow', 'مسترد', 'مسترده'],
    emojis: ['💛', '🍋', '🌻', '⚡']
  },
  {
    name: 'بني',
    hex: '#8B4513',
    aliases: ['بني', 'بنى', 'بني شوكولاته', 'شوكولاته', 'شوكولاه', 'brown', 'براون', 'كاكاو'],
    emojis: ['🤎', '🍫', '🌰']
  },
  {
    name: 'بني فاتح',
    hex: '#D2B48C',
    aliases: ['بني فاتح', 'ترابي', 'ترابى', 'كراميل', 'عسلي', 'عسلى', 'هافان', 'جملي', 'جملى', 'camel', 'تان'],
    emojis: ['🍯', '🐪']
  },
  {
    name: 'بني موكا',
    hex: '#6F4E37',
    aliases: ['بني موكا', 'موكا', 'كافيه', 'نسكافيه', 'كابتشينو', 'mocha', 'لاتيه'],
    emojis: ['☕']
  },
  {
    name: 'بيج',
    hex: '#D4B896',
    aliases: ['بيج', 'بيج فاتح', 'بيج غامق', 'بيچ', 'beige', 'رملي', 'طبيعي'],
    emojis: ['🌾', '🏜️']
  },
  {
    name: 'نهدي',
    hex: '#A855F7',
    aliases: ['نهدي', 'نهدى', 'بنفسجي', 'بنفسجى', 'موف', 'ليلكي', 'ليلكى', 'لافندر', 'purple', 'ارغواني', 'ارجواني', 'باذنجاني'],
    emojis: ['💜', '🔮', '🍆']
  },
  {
    name: 'زيتي',
    hex: '#556B2F',
    aliases: ['زيتي', 'زيتى', 'زيتوني', 'زيتونى', 'جيشي', 'جيشى', 'كاكي', 'olive', 'زيتي غامق', 'اخضر زيتي'],
    emojis: ['💚', '🫒', '🍃']
  },
  {
    name: 'اخضر',
    hex: '#16A34A',
    aliases: ['اخضر', 'أخضر', 'زمردي', 'زمردى', 'عشبي', 'عشبى', 'جرين', 'green', 'اخضر ملكي'],
    emojis: ['🟢', '🌲', '🍀']
  },
  {
    name: 'فستقي',
    hex: '#86EFAC',
    aliases: ['فستقي', 'فستقى', 'مينت', 'نعناعي', 'نعناعى', 'تفاحي', 'تفاحى', 'mint', 'بيستاشيو'],
    emojis: ['🍏', '🌿']
  },
  {
    name: 'رمادي',
    hex: '#9CA3AF',
    aliases: ['رمادي', 'رمادى', 'سكني', 'سكنى', 'رصاصي', 'رصاصى', 'سلفر', 'سيلفر', 'فضي', 'فضى', 'grey', 'gray', 'تيتانيوم'],
    emojis: ['🩶', '⚙️', '🌫️']
  },
  {
    name: 'برتقالي',
    hex: '#F97316',
    aliases: ['برتقالي', 'برتقالى', 'اورنج', 'أورنج', 'مشمشي', 'مشمشى', 'طوبي', 'طوبى', 'orange', 'تانجرين'],
    emojis: ['🧡', '🍊', '🎃']
  },
  {
    name: 'ذهبي',
    hex: '#D4AF37',
    aliases: ['ذهبي', 'ذهبى', 'شامبين', 'شامبانيا', 'gold', 'جولد', 'برونزي', 'برونزى'],
    emojis: ['🥇', '✨', '👑']
  }
];

// ── تحويل الأرقام العربية إلى إنجليزية ──────────────────────────────────────────
export function normalizeDigits(str: string): string {
  if (!str) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d)));
}

// ── توليد سلسلة المقاسات من نطاق (Range Expansion) ────────────────────────────
// مثال: "من 36 ل 46" -> [36, 38, 40, 42, 44, 46]
export function expandSizeRange(start: number, end: number): string[] {
  const result: string[] = [];
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  
  // إذا كانت الأرقام زوجية (مثل 36 إلى 46)
  if (min >= 34 && max <= 54) {
    for (let s = min; s <= max; s += 2) {
      result.push(String(s));
    }
  } else if (min >= 1 && max <= 6) {
    for (let s = min; s <= max; s++) {
      result.push(String(s));
    }
  }
  return result;
}

// ── استخراج جميع المقاسات بدقة فائقة من أي سطر ──────────────────────────────────
export function extractSizesFromLineAdvanced(line: string): { sizes: string[]; isSoldOutExcept?: string[] } {
  const normalized = normalizeDigits(line)
    .replace(/[،,]/g, ' ')
    .replace(/\s+/g, ' ');

  // 1. فحص استثناءات خالص (مثال: "خالص ما عدا 38" أو "خالص الا 40")
  const exceptMatch = normalized.match(/(?:خالص|نفذت|خلص)\s*(?:ما عدا|الا|إلا|عدا|فقط)\s*(\d{2}(?:\s+\d{2})*)/i);
  if (exceptMatch) {
    const exceptSizes = exceptMatch[1].match(/\b(34|36|38|40|42|44|46|48|50|52|54)\b/g);
    if (exceptSizes && exceptSizes.length > 0) {
      return { sizes: exceptSizes, isSoldOutExcept: exceptSizes };
    }
  }

  // 2. فحص النطاقات (Range) مثل: "من 36 الى 46" أو "36 ل 46" أو "36-46"
  const rangeMatch = normalized.match(/(?:من\s*)?(\d{2})\s*(?:الى|إلى|لـ|ل|حتى|-)\s*(\d{2})/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    if (start >= 34 && end <= 54) {
      const expanded = expandSizeRange(start, end);
      if (expanded.length > 0) return { sizes: expanded };
    }
  }

  // 3. فحص المقاسات الموحدة
  if (/فري\s*سايز|مقاس\s*موحد|free\s*size|one\s*size/i.test(normalized)) {
    return { sizes: ['Free Size'] };
  }

  const sizes: string[] = [];

  // 4. استخراج الأرقام النسائية المباشرة (34 حتى 54)
  const numMatches = normalized.match(/\b(34|36|38|40|42|44|46|48|50|52|54)\b/g);
  if (numMatches) {
    numMatches.forEach(m => {
      if (!sizes.includes(m)) sizes.push(m);
    });
  }

  // 5. استخراج أرقام المقاسات الترقيمية (1, 2, 3, 4)
  if (sizes.length === 0) {
    const numberedScale = normalized.match(/\b([1-4])\s*(?:\/|-|\s+)\s*([1-4])\b/g) || 
                          normalized.match(/\b(1|2|3|4)\b/g);
    if (numberedScale && numberedScale.length >= 2) {
      const scaleMap: Record<string, string> = { '1': '38 (1)', '2': '40 (2)', '3': '42 (3)', '4': '44 (4)' };
      numberedScale.forEach(num => {
        const mapped = scaleMap[num] || num;
        if (!sizes.includes(mapped)) sizes.push(mapped);
      });
    }
  }

  // 6. استخراج المقاسات الحرفية (XS, S, M, L, XL, XXL, 2XL, 3XL, 4XL)
  const letterMatches = normalized.match(/\b(XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|XXXL)\b/gi);
  if (letterMatches) {
    letterMatches.forEach(m => {
      const upper = m.toUpperCase();
      if (!sizes.includes(upper)) sizes.push(upper);
    });
  }

  return { sizes };
}

// ── كشف جميع الألوان في السطر (يدعم الأسطر متعددة الألوان) ──────────────────────
// مثال: "اسود وابيض 36 38 40" -> يعيد [اسود, ابيض]
export function detectAllColorsInLine(line: string): { color: string; colorHex: string }[] {
  const cleanLine = line.toLowerCase();
  const found: { color: string; colorHex: string }[] = [];
  const addedNames = new Set<string>();

  // 1. فحص بالإيموجي أولاً
  for (const entry of MASTER_COLOR_DICTIONARY) {
    for (const emoji of entry.emojis) {
      if (cleanLine.includes(emoji)) {
        if (!addedNames.has(entry.name)) {
          found.push({ color: entry.name, colorHex: entry.hex });
          addedNames.add(entry.name);
        }
        break;
      }
    }
  }

  // 2. فحص بالأسماء والـ Aliases
  for (const entry of MASTER_COLOR_DICTIONARY) {
    for (const alias of entry.aliases) {
      // يدعم السوابق مثل "وخمري" أو "والابيض" أو "بالاسود"
      const regex = new RegExp(`(^|[\\s،,:;\\-_+&/|()\\d])(?:و|ال|وال|بال)?${alias}([\\s،,:;\\-_+&/|()\\d]|$)`, 'i');
      if (regex.test(cleanLine)) {
        if (!addedNames.has(entry.name)) {
          found.push({ color: entry.name, colorHex: entry.hex });
          addedNames.add(entry.name);
        }
        break;
      }
    }
  }

  return found;
}

// ── المحلل الذكي الفائق والشامل (Master NLP Parser) ───────────────────────────
export function parseDressExpert(rawText: string): AiParsedDress | null {
  if (!rawText || typeof rawText !== 'string') return null;

  const normalizedText = normalizeDigits(rawText);
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // 1. استخراج السعر بدقة (يجب أن يحتوي السطر على كلمة السعر أو jd أو دينار)
  let costPrice = 25;
  for (const line of lines) {
    if (/السعر|price|دينار|jd|د\.أ/i.test(line)) {
      const priceMatch = line.match(/(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        const p = parseFloat(priceMatch[1]);
        if (p >= 10 && p <= 150) {
          costPrice = p;
          break;
        }
      }
    }
  }

  // قاعدة التسعير الأردنية:
  const margin = costPrice < 26 ? 9 : 8;
  const sellingPrice = costPrice + margin;

  // 2. استخراج الاسم والوصف
  let description = '';
  for (const line of lines) {
    if (
      line.includes('الوصف') || line.includes('قماش') || line.includes('فستان') || 
      line.includes('طقم') || line.includes('شيفون') || line.includes('كريب') || 
      line.includes('ستان') || line.includes('اورجنزرا') || line.includes('باربي') ||
      line.includes('دانتيل') || line.includes('بليسيه') || line.includes('جيمبسوت')
    ) {
      description = line.replace(/^الوصف\s*:\s*/, '').trim();
      break;
    }
  }
  if (!description && lines[0]) description = lines[0];

  // 3. استخراج الألوان والمقاسات
  const variants: AiParsedDress['variants'] = [];

  for (const line of lines) {
    if (
      line.startsWith('السعر') || line.startsWith('price') || 
      line.startsWith('المقاسات') || line.startsWith('الالوان') || line.startsWith('اللوان')
    ) {
      continue;
    }

    const detectedColors = detectAllColorsInLine(line);
    if (detectedColors.length === 0) continue;

    const { sizes } = extractSizesFromLineAdvanced(line);
    const isLineSoldOut = (line.includes('خالص') || line.includes('نفذت') || line.includes('نفذ') || line.includes('خلص')) && sizes.length === 0;

    for (const col of detectedColors) {
      if (sizes.length > 0 && !isLineSoldOut) {
        for (const s of sizes) {
          // تجنب تكرار نفس اللون والمقاس
          const exists = variants.some(v => v.color === col.color && v.size === s);
          if (!exists) {
            variants.push({
              color: col.color,
              colorHex: col.colorHex,
              size: s,
              quantity: 5
            });
          }
        }
      } else {
        // اللون نافذ بالكامل
        const exists = variants.some(v => v.color === col.color && v.size === 'خالص (نفذت الكمية)');
        if (!exists) {
          variants.push({
            color: col.color,
            colorHex: col.colorHex,
            size: 'خالص (نفذت الكمية)',
            quantity: 0
          });
        }
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

export async function parseDressWithAi(rawText: string): Promise<AiParsedDress | null> {
  return parseDressExpert(rawText);
}
