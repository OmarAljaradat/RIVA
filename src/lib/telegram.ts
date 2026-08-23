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

const KNOWN_COLORS = [
  'بيبي بلو', 'سماوي', 'بني موكا', 'بني فاتح', 'اوف وايت', 'أوف وايت',
  'اسود', 'أسود', 'ابيض', 'أبيض', 'خمري', 'زهري', 'وردي',
  'اصفر', 'أصفر', 'بني', 'كحلي', 'زيتي', 'سومو', 'نهدي',
  'عنابي', 'احمر', 'أحمر', 'بيج', 'ذهبي', 'فضي'
];

const COLOR_HEX_MAP: Record<string, string> = {
  'اسود': '#000000', 'أسود': '#000000',
  'ابيض': '#FFFFFF', 'أبيض': '#FFFFFF',
  'خمري': '#722F37', 'عنابي': '#722F37',
  'زهري': '#F472B6', 'وردي': '#F472B6',
  'اصفر': '#FBBF24', 'أصفر': '#FBBF24',
  'بيبي بلو': '#7DD3FC', 'سماوي': '#7DD3FC', 'ازرق': '#3B82F6',
  'بني': '#78350F', 'بني موكا': '#92400E', 'بني فاتح': '#A16207', 'موكا': '#92400E',
  'كحلي': '#1E3A8A', 'نيفي': '#1E3A8A',
  'زيتي': '#4D7C0F', 'زيتوني': '#4D7C0F',
  'سومو': '#FB923C', 'سلمون': '#FB923C',
  'نهدي': '#A855F7', 'بنفسجي': '#A855F7', 'موف': '#A855F7',
  'اوف وايت': '#FDFBF7', 'أوف وايت': '#FDFBF7',
  'احمر': '#DC2626', 'أحمر': '#DC2626',
  'ذهبي': '#D4AF37', 'فضي': '#94A3B8', 'بيج': '#D2B48C'
};

export function parseChannelPost(text: string): ExtractedDress | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // 1. Extract Price (base + 8 JOD)
  let basePrice = 25;
  const priceMatch = text.match(/السعر\s*[:=]?\s*(\d+)/i) || text.match(/(\d+)\s*(?:jd|دينار)/i);
  if (priceMatch) {
    basePrice = parseInt(priceMatch[1], 10);
  }

  // 2. Extract Name (Line 1 without emojis)
  let name = lines[0].replace(/✨️|💫|🌷|🎗|💕|🍂|⭐|🌟/g, '').trim();
  if (name.length < 5) name = 'موديل فاخر';

  // 3. Extract Colors and exact Sizes per line
  const variants: ExtractedVariant[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('السعر') || line.includes('طول البليزر') || line.includes('طول البنطلون')) continue;

    // Match color
    let matchedColor: string | null = null;
    for (const col of KNOWN_COLORS) {
      if (line.includes(col)) {
        matchedColor = col;
        break;
      }
    }

    if (matchedColor) {
      let cleanColor = matchedColor;
      if (cleanColor === 'أسود') cleanColor = 'اسود';
      if (cleanColor === 'أبيض') cleanColor = 'ابيض';
      if (cleanColor === 'أصفر') cleanColor = 'اصفر';
      if (cleanColor === 'أوف وايت') cleanColor = 'اوف وايت';
      if (cleanColor === 'أحمر') cleanColor = 'احمر';
      if (cleanColor === 'وردي') cleanColor = 'زهري';

      const hex = COLOR_HEX_MAP[cleanColor] || '#722F37';

      // Find sizes (numbers 34-56 or S, M, L, XL, XXL)
      const sizeMatches = line.match(/\b(3[4-9]|4[0-9]|5[0-9])\b/g);

      if (sizeMatches && sizeMatches.length > 0) {
        const uniqueSizes = Array.from(new Set(sizeMatches));
        for (const sz of uniqueSizes) {
          variants.push({
            color: cleanColor,
            colorHex: hex,
            size: sz,
            quantity: 5 // Available
          });
        }
      } else {
        // Color is listed but has no sizes -> Out of stock
        variants.push({
          color: cleanColor,
          colorHex: hex,
          size: 'خالص',
          quantity: 0
        });
      }
    }
  }

  return {
    name,
    description: text,
    price: basePrice + 8,
    variants
  };
}
