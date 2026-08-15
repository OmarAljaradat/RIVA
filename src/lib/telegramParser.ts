// Strict Arabic Color Dictionary with Official Hex Codes
export const ARABIC_COLOR_MAP: { [key: string]: string } = {
  'خمري': '#722F37',
  'عنابي': '#800020',
  'كحلي': '#1E3A5F',
  'أسود': '#000000',
  'اسود': '#000000',
  'بني': '#6B4226',
  'زيتي': '#556B2F',
  'بيج': '#F5F5DC',
  'أبيض': '#FFFFFF',
  'ابيض': '#FFFFFF',
  'وردي': '#FFC0CB',
  'زهري': '#FF69B4',
  'نيلي': '#000080',
  'ذهبي': '#D4AF37',
  'فضة': '#C0C0C0',
  'فضي': '#C0C0C0',
  'خردلي': '#E1AD01',
  'خردل': '#E1AD01',
  'بنفسجي': '#800080',
  'موف': '#9932CC',
  'رمادي': '#808080',
  'رصاصي': '#708090',
  'سماوي': '#87CEEB',
  'أحمر': '#DC2626',
  'احمر': '#DC2626',
  'أخضر': '#16A34A',
  'اخضر': '#16A34A',
  'أزرق': '#2563EB',
  'ازرق': '#2563EB'
};

export interface ParsedTelegramProduct {
  rawCaption: string;
  cleanName: string;
  costPrice: number; // سعر الشراء/الجملة من التليجرام
  sellingPrice: number; // سعر البيع التلقائي للزبائن
  estimatedNetProfit: number; // صافي الربح التقديري (يشمل ربح التوصيل +1)
  colors: Array<{ name: string; hex: string }>;
  sizes: string[];
  cleanDescription: string;
  imageUrls: string[];
  confidenceScore: number;
  warnings: string[];
}

/**
 * Calculates Automatic Selling Price & Net Profit according to strict store rules:
 * - If costPrice < 26 JOD => margin = +9 JOD
 * - If costPrice >= 26 JOD => margin = +8 JOD
 * - Net Profit = Margin + 1 JOD (since delivery charged is 3 JOD and actual delivery cost is 2 JOD)
 */
export function calculatePricingRules(costPrice: number) {
  const margin = costPrice < 26 ? 9 : 8;
  const sellingPrice = costPrice + margin;
  const netProfitPerItem = margin + 1; // +1 JOD net profit from 3 JOD delivery - 2 JOD delivery cost
  return { sellingPrice, margin, netProfitPerItem };
}

export function parseTelegramPost(caption: string, imageUrls: string[] = []): ParsedTelegramProduct {
  const warnings: string[] = [];

  // 1. Clean Caption Lines
  const lines = caption.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 2. Extract Wholesale Cost Price from Telegram
  let extractedCostPrice = 25; // Default fallback
  const priceRegex = /(?:السعر|سعر|بـ|ب|فقط)?\s*(\d{2,3})\s*(?:د\.أ|دينار|دنانير|JOD|JD)/i;
  const priceMatch = caption.match(priceRegex);

  if (priceMatch && priceMatch[1]) {
    extractedCostPrice = parseInt(priceMatch[1], 10);
  } else {
    const simpleNumMatch = caption.match(/\b(1[5-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])\b/);
    if (simpleNumMatch && simpleNumMatch[1]) {
      extractedCostPrice = parseInt(simpleNumMatch[1], 10);
    } else {
      warnings.push('لم يتم العثور على سعر الجملة تلقائياً، تم وضع السعر الافتراضي (25 د.أ)');
    }
  }

  // Calculate Selling Price & Profit based on User Directives
  const { sellingPrice, netProfitPerItem } = calculatePricingRules(extractedCostPrice);

  // 3. Extract Clean Colors using strict dictionary
  const foundColors: Array<{ name: string; hex: string }> = [];
  const captionLower = caption.toLowerCase();

  Object.keys(ARABIC_COLOR_MAP).forEach(colorKey => {
    if (captionLower.includes(colorKey)) {
      const canonicalName = (colorKey === 'اسود' ? 'أسود' : colorKey === 'ابيض' ? 'أبيض' : colorKey === 'احمر' ? 'أحمر' : colorKey === 'اخضر' ? 'أخضر' : colorKey === 'ازرق' ? 'أزرق' : colorKey);
      if (!foundColors.some(c => c.name === canonicalName)) {
        foundColors.push({
          name: canonicalName,
          hex: ARABIC_COLOR_MAP[colorKey]
        });
      }
    }
  });

  if (foundColors.length === 0) {
    foundColors.push(
      { name: 'خمري', hex: '#722F37' },
      { name: 'كحلي', hex: '#1E3A5F' },
      { name: 'أسود', hex: '#000000' }
    );
    warnings.push('لم تُحدد ألوان صريحة بالمنشور، تم تعيين التشكيلة الافتراضية');
  }

  // 4. Extract Sizes
  const standardSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
  const foundSizes: string[] = [];

  standardSizes.forEach(sz => {
    if (caption.includes(sz)) {
      foundSizes.push(sz);
    }
  });

  if (caption.includes('فري سايز') || caption.includes('فري') || caption.includes('Free Size')) {
    foundSizes.push('فري سايز');
  }

  const finalSizes = foundSizes.length > 0 ? foundSizes : ['38', '40', '42', '44', '46'];

  // 5. Extract Clean Dress Name
  let firstLine = lines[0] || 'فستان سهرة فاخر';
  let cleanName = firstLine
    .replace(/[^\u0600-\u06FF\sA-Za-z0-9]/g, ' ')
    .replace(/(السعر|دينار|د أ|فقط|توصيل|مجانا|\d+)/g, '')
    .trim();

  const nameWords = cleanName.split(/\s+/).filter(w => w.length > 1);
  if (nameWords.length > 0) {
    cleanName = nameWords.slice(0, 5).join(' ');
  } else {
    cleanName = 'فستان سهرة فاخر';
  }

  if (!cleanName.startsWith('فستان') && !cleanName.startsWith('طقم') && !cleanName.startsWith('عباية')) {
    cleanName = 'فستان ' + cleanName;
  }

  // 6. Clean Description
  const cleanDescription = caption
    .replace(/(السعر|سعر|بـ)\s*\d+\s*(د\.أ|دينار|JOD)?/gi, '')
    .replace(/(المقاسات|الألوان|الوان|مقاسات):?/gi, '')
    .trim();

  let confidenceScore = 100;
  if (warnings.length > 0) confidenceScore -= warnings.length * 20;

  return {
    rawCaption: caption,
    cleanName,
    costPrice: extractedCostPrice,
    sellingPrice,
    estimatedNetProfit: netProfitPerItem,
    colors: foundColors,
    sizes: finalSizes,
    cleanDescription,
    imageUrls: imageUrls.length > 0 ? imageUrls : ['/uploads/dress1.jpg'],
    confidenceScore,
    warnings
  };
}
