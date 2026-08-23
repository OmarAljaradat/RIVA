import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface DressVariantAI {
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
}

export interface ParsedDressAI {
  name: string;
  description: string;
  price: number;
  variants: DressVariantAI[];
}

const SYSTEM_PROMPT = `أنت نظام ذكاء اصطناعي فائق الدقة متخصص في قراءة وتحليل منشورات تيليجرام لمتاجر الفساتين النسائية في الأردن.
مهمتك: قراءة نص المنشور واستخراج بيانات الفستان بالكامل وبدون أي أخطاء كـ JSON دقيق وصالح 100%.

القواعد الصارمة للتحليل:
1. **اسم الفستان (name)**: استخرج السطر الأول أو نوع القماش وتفاصيله (مثال: "قماش ستان نخب اول مع شال طويل").
2. **الوصف (description)**: تفاصيل القماش أو القطع أو الأطوال المذكورة.
3. **السعر (price)**: استخرج السعر بالأرقام فقط (مثال: "السعر : 34 jd" -> 34). إذا لم يذكر السعر ضع 30 كافتراضي.
4. **الألوان والمقاسات (variants)**:
   - لكل لون مذكور: استخرج اسم اللون الصافي بالعربية (مثل: "اسود", "ابيض", "خمري", "زهري", "اصفر", "بيبي بلو", "بني", "كحلي", "زيتي", "سومو", "عنابي", "نهدي").
   - حدد كود الهاكس (colorHex) المناسب للون (مثل: اصفر=#EAB308, خمري=#722F37, اسود=#000000, ابيض=#FFFFFF, زهري=#F472B6, بيبي بلو=#89CFF0, بني=#78350F, كحلي=#1E3A5F, زيتي=#4D7C0F, سومو=#F87171, عنابي=#831843, نهدي=#9333EA).
   - استخرج المقاسات المتوفرة فقط لهذا اللون (36, 38, 40, 42, 44, 46).
   - إذا ذُكرت المقاسات بصيغة مجال (مثل "من 36 الى 46") وسّعها لتشمل: ["36", "38", "40", "42", "44", "46"].
   - إذا ذُكر "خالص" بدون أي مقاس، أو لم تُذكر مقاسات بجانبه، لا تضف له مقاسات بكمية موجبة أو ضع له مقاسات بكمية 0.
   - إذا ذُكر "خالص ما عدا 38" أضف فقط المقاس "38" بكمية 5.
   - الكمية (quantity): لكل مقاس متوفر ضع 5، وللمقاسات غير المتوفرة أو المنتهية ضع 0.

أرجع فقط كود JSON صالح تماماً بصيغة:
{
  "name": "اسم الفستان",
  "description": "الوصف",
  "price": 34,
  "variants": [
    {"color": "اصفر", "colorHex": "#EAB308", "size": "40", "quantity": 5},
    {"color": "اصفر", "colorHex": "#EAB308", "size": "42", "quantity": 5},
    {"color": "خمري", "colorHex": "#722F37", "size": "36", "quantity": 5},
    {"color": "خمري", "colorHex": "#722F37", "size": "38", "quantity": 5}
  ]
}`;

export async function parseDressWithGemini(postText: string): Promise<ParsedDressAI | null> {
  if (!postText || postText.trim().length < 10) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const prompt = `${SYSTEM_PROMPT}\n\nنص المنشور لتحليله:\n---\n${postText}\n---`;
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    if (!text) return null;

    const parsed: ParsedDressAI = JSON.parse(text);
    return parsed;
  } catch (error: any) {
    console.error('⚠️ خطأ في تحليل المنشور بواسطة Gemini AI:', error?.message || error);
    return null;
  }
}
