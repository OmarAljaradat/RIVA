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

const COLOR_HEX_MAP: Record<string, string> = {
  'اسود': '#000000',
  'أسود': '#000000',
  'ابيض': '#FFFFFF',
  'أبيض': '#FFFFFF',
  'خمري': '#722F37',
  'احمر': '#DC2626',
  'أحمر': '#DC2626',
  'عنابي': '#800020',
  'كحلي': '#1E3A5F',
  'زيتي': '#556B2F',
  'اخضر': '#16A34A',
  'زهري': '#F472B6',
  'اصفر': '#EAB308',
  'أصفر': '#EAB308',
  'بيبي بلو': '#89CFF0',
  'سماوي': '#87CEEB',
  'بني': '#8B4513',
  'بني فاتح': '#D2B48C',
  'بني موكا': '#6F4E37',
  'سومو': '#F9A8D4',
  'سومو غامق': '#D97706',
  'اوف وايت': '#F5F5DC',
  'نهدي': '#A855F7',
  'بيج': '#D4B896',
};

export async function parseDressWithAi(rawText: string): Promise<AiParsedDress | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      // Direct REST call to Gemini 2.5 Flash API for high accuracy
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `أنت خبير تحليل بيانات متاجر الفساتين في الأردن.
قم بتحليل النص التالي المستخرج من منشور قناة تيليجرام واستخرج بيانات الفستان بدقة 100% ككائن JSON فقط بدون أي كلام إضافي:

القواعد المطلوبة:
1. "description": قماش ووصف الفستان المكتوب للنص.
2. "costPrice": السعر المكتوب بالمنشور (مثال 25 من "25 jd" أو "٢٥ دينار").
3. "sellingPrice": إذا كان costPrice أقل من 26 أضف 9، أما إذا كان 26 أو أكثر أضف 8.
4. "variants": مصفوفة تحتوي كل الألوان والمقاسات:
   - "color": اسم اللون بالعربية الفصحى النظيفة (مثل "خمري", "أسود", "أبيض", "كحلي", "زهري", "أصفر", "بيبي بلو").
   - "colorHex": كود الهاكس المناسب للون (مثل "#722F37" للخمري، "#000000" للأسود).
   - "size": رقم المقاس (مثل "36", "38", "40", "42", "44", "46", "48"). إذا كان اللون مكتوباً بالمنشور بدون أرقام مقاسات إطلاقاً، فاجعل size يساوي "خالص (نفذت الكمية)".
   - "quantity": اجعل الكمية 0 إذا كان المقاس "خالص (نفذت الكمية)"، واجعلها 5 إذا كان مقاساً متوفراً.

نص المنشور:
"""
${rawText}
"""

أرجع JSON بنسق:
{
  "name": "...",
  "description": "...",
  "costPrice": 0,
  "sellingPrice": 0,
  "variants": [
    { "color": "...", "colorHex": "...", "size": "...", "quantity": 5 }
  ]
}`
            }]
          }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return {
            name: parsed.description || parsed.name || 'فستان جديد',
            description: parsed.description || rawText,
            costPrice: parsed.costPrice || 25,
            sellingPrice: parsed.sellingPrice || (parsed.costPrice < 26 ? parsed.costPrice + 9 : parsed.costPrice + 8),
            variants: parsed.variants || []
          };
        }
      }
    }
  } catch (e) {
    console.error('Gemini API call error, falling back to smart rule parser:', e);
  }

  // Smart Deterministic Parser Fallback (Rule-Based Expert Parser)
  return fallbackSmartParse(rawText);
}

function fallbackSmartParse(text: string): AiParsedDress | null {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let costPrice = 25;
  for (const line of lines) {
    const numMatch = line.match(/(?:السعر|price|jd|دينار)?\s*:?\s*(\d+(?:\.\d+)?)/i) || line.match(/(\d{2})\s*(?:jd|دينار)/i);
    if (numMatch) {
      const p = parseFloat(numMatch[1]);
      if (p >= 10 && p <= 100) {
        costPrice = p;
        break;
      }
    }
  }

  const margin = costPrice < 26 ? 9 : 8;
  const sellingPrice = costPrice + margin;

  let description = '';
  for (const line of lines) {
    if (line.includes('الوصف') || line.includes('قماش') || line.includes('طقم') || line.includes('فستان') || line.includes('شيفون') || line.includes('كريب') || line.includes('ستان')) {
      description = line.replace(/^الوصف\s*:\s*/, '').trim();
      break;
    }
  }
  if (!description && lines[0]) description = lines[0];

  const variants: AiParsedDress['variants'] = [];

  for (const line of lines) {
    if (line.includes('السعر') || line.includes('اسم الفستان') || line.includes('اللوان') || line.includes('الالوان')) continue;

    let matchedColor = '';
    let matchedHex = '#722F37';

    for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
      if (line.includes(key)) {
        matchedColor = key;
        matchedHex = hex;
        break;
      }
    }

    if (matchedColor) {
      const sizeMatches = line.match(/\b(34|36|38|40|42|44|46|48|50)\b/g);
      if (sizeMatches && sizeMatches.length > 0) {
        for (const s of sizeMatches) {
          variants.push({
            color: matchedColor,
            colorHex: matchedHex,
            size: s,
            quantity: 5
          });
        }
      } else {
        variants.push({
          color: matchedColor,
          colorHex: matchedHex,
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
