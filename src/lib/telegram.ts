export interface ParsedDress {
  name: string;
  price: number;
  variants: {
    color: string;
    colorHex: string;
    size: string;
    quantity: number;
  }[];
}

// Known color keywords to validate true colors
const KNOWN_COLORS: Record<string, string> = {
  'اسود': '#000000',
  'أسود': '#000000',
  'ابيض': '#FFFFFF',
  'أبيض': '#FFFFFF',
  'احمر': '#DC2626',
  'أحمر': '#DC2626',
  'ازرق': '#2563EB',
  'أزرق': '#2563EB',
  'كحلي': '#1E3A5F',
  'اخضر': '#16A34A',
  'أخضر': '#16A34A',
  'وردي': '#EC4899',
  'زهري': '#F472B6',
  'بيج': '#D4B896',
  'ذهبي': '#D4AF37',
  'فضي': '#C0C0C0',
  'بني': '#92400E',
  'رمادي': '#6B7280',
  'بنفسجي': '#7C3AED',
  'موف': '#A855F7',
  'برتقالي': '#EA580C',
  'عنابي': '#800020',
  'نبيتي': '#800020',
  'خمري': '#722F37',
  'تركواز': '#06B6D4',
  'زيتي': '#556B2F',
  'سماوي': '#87CEEB',
  'كريمي': '#FFFDD0',
  'نيلي': '#1D4ED8',
  'نحاسي': '#B87333',
  'عاجي': '#FFFFF0',
  'اصفر': '#EAB308',
  'أصفر': '#EAB308',
  'بيبي بلو': '#89CFF0',
};

const COLOR_EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}🔴🔵⚫⚪🟣🟢🟡🟠🤎❤️💙🖤💚💛💜🤍🧡🩷]/gu;

export function parseChannelPost(text: string): ParsedDress | null {
  try {
    if (!text || typeof text !== 'string') return null;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    let name = '';
    let price = 0;
    const variants: ParsedDress['variants'] = [];

    // 1. Extract Wholesale Cost Price and Apply Automatic Selling Price Rules (+8 / +9 JOD)
    for (const line of lines) {
      if (line.includes('السعر') || line.toLowerCase().includes('jd') || line.includes('دينار')) {
        const numMatch = line.match(/(\d+(?:\.\d+)?)/);
        if (numMatch) {
          const wholesalePrice = parseFloat(numMatch[1]);
          // Pricing Rule: cost < 26 => +9 JOD, cost >= 26 => +8 JOD
          const margin = wholesalePrice < 26 ? 9 : 8;
          price = wholesalePrice + margin;
        }
      }
    }

    // 2. Extract Dress Name (First line)
    for (const line of lines) {
      if (line.includes('السعر') || line.toLowerCase().includes('jd')) continue;
      if (/\d{2}/.test(line) && COLOR_EMOJI_REGEX.test(line)) continue;

      const cleaned = line.replace(/^[✨🔹👗🌸⭐👑🖤❤️💙\s]+/, '').trim();
      if (cleaned.length > 2) {
        name = cleaned;
        break;
      }
    }

    if (!name && lines[0]) {
      name = lines[0].replace(/^[✨🔹👗🌸⭐👑\s]+/, '').trim();
    }

    // 3. Extract STRICT Valid Colors & Sizes
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('السعر') || line.toLowerCase().includes('jd')) continue;

      const cleanedLine = line.replace(/^[✨🔹👗🌸⭐👑🖤❤️💙\s]+/, '').trim();
      if (cleanedLine === name) continue;

      // Extract text part of the line
      let colorText = line.replace(/\b(34|36|38|40|42|44|46|48|50|XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL)\b/gi, '')
                          .replace(COLOR_EMOJI_REGEX, '')
                          .replace(/[:\-•=]/g, '')
                          .trim();

      // Check if colorText contains ANY known color keyword
      let matchedColorName: string | null = null;
      let matchedColorHex = '#800020';

      for (const [key, hex] of Object.entries(KNOWN_COLORS)) {
        if (colorText.includes(key)) {
          matchedColorName = key;
          matchedColorHex = hex;
          break;
        }
      }

      // ONLY process if line contains a valid known color!
      if (matchedColorName) {
        const sizeMatches = line.match(/\b(34|36|38|40|42|44|46|48|50|XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL)\b/gi);
        const isSoldOutLine = line.includes('خالص') || line.includes('منتهي') || line.includes('خلص') || line.includes('صفر');

        if (sizeMatches && sizeMatches.length > 0 && !isSoldOutLine) {
          for (const sizeStr of sizeMatches) {
            variants.push({
              color: matchedColorName,
              colorHex: matchedColorHex,
              size: sizeStr.toUpperCase(),
              quantity: 5,
            });
          }
        } else {
          variants.push({
            color: matchedColorName,
            colorHex: matchedColorHex,
            size: 'خالص (نفذت الكمية)',
            quantity: 0,
          });
        }
      }
    }

    if (name && price > 0 && variants.length > 0) {
      return { name, price, variants };
    }

    return null;
  } catch (err) {
    console.error('Error parsing channel post:', err);
    return null;
  }
}
