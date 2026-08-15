import prisma from '../src/lib/prisma.js';

interface RawDressInput {
  idNum: number;
  description: string;
  colorsWithSizes: { color: string; colorHex: string; sizes: string[] }[];
  costPrice: number;
}

const COLOR_MAP: Record<string, string> = {
  'اصفر': '#EAB308',
  'أصفر': '#EAB308',
  'خمري': '#722F37',
  'بيبي بلو': '#89CFF0',
  'سماوي': '#87CEEB',
  'كحلي': '#1E3A5F',
  'زيتي': '#556B2F',
  'ابيض': '#FFFFFF',
  'أبيض': '#FFFFFF',
  'عنابي': '#800020',
  'اسود': '#000000',
  'أسود': '#000000',
  'زهري': '#F472B6',
  'سومو غامق': '#D97706',
  'سومو': '#F9A8D4',
  'بني': '#8B4513',
  'بني فاتح': '#D2B48C',
  'بني موكا': '#6F4E37',
  'احمر': '#DC2626',
  'أحمر': '#DC2626',
  'اوف وايت': '#F5F5DC',
  'نهدي': '#A855F7',
  'بيج': '#D4B896',
};

const rawDresses: RawDressInput[] = [
  {
    idNum: 1,
    description: "قماش شيفون ببل نخب اول مبطن",
    colorsWithSizes: [
      { color: "اصفر", colorHex: "#EAB308", sizes: [] },
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "بيبي بلو", colorHex: "#89CFF0", sizes: ["42"] },
    ],
    costPrice: 12,
  },
  {
    idNum: 2,
    description: "قماش دانتيل مبطن نخب اول ✨️",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["46"] },
      { color: "زيتي", colorHex: "#556B2F", sizes: ["46"] },
    ],
    costPrice: 24,
  },
  {
    idNum: 3,
    description: "قماش باربي مع دانتيل لامع",
    colorsWithSizes: [
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["44", "46"] },
      { color: "عنابي", colorHex: "#800020", sizes: [] },
      { color: "اسود", colorHex: "#000000", sizes: ["44", "46"] },
    ],
    costPrice: 28,
  },
  {
    idNum: 4,
    description: "قماش اورجنزا مع باربي",
    colorsWithSizes: [
      { color: "زهري", colorHex: "#F472B6", sizes: ["44"] },
      { color: "سومو غامق", colorHex: "#D97706", sizes: [] },
      { color: "اسود", colorHex: "#000000", sizes: [] },
    ],
    costPrice: 26,
  },
  {
    idNum: 5,
    description: "قماش كريب مع شيفون وستراس فاخر على الخصر والاكمام",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: ["46"] },
      { color: "بيبي بلو", colorHex: "#89CFF0", sizes: ["38", "40", "42", "44", "48"] },
      { color: "اسود", colorHex: "#000000", sizes: ["40", "44"] },
    ],
    costPrice: 35,
  },
  {
    idNum: 6,
    description: "قماش كريب دوبل نخب اول وتنوره شيفون مع حجر ستراس فاخر",
    colorsWithSizes: [
      { color: "زهري", colorHex: "#F472B6", sizes: ["46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "46"] },
      { color: "بني", colorHex: "#8B4513", sizes: [] },
      { color: "اسود", colorHex: "#000000", sizes: ["36", "46"] },
    ],
    costPrice: 35,
  },
  {
    idNum: 7,
    description: "قماش كريب نخب اول والتنوره شيفون مع ستراس الماس فاخر",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "بني", colorHex: "#8B4513", sizes: ["46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["40", "42", "44"] },
    ],
    costPrice: 35,
  },
  {
    idNum: 8,
    description: "قماش كريب مع تفاصيل دانتيل ناعمه",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "40", "42", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["44", "46"] },
      { color: "بني", colorHex: "#8B4513", sizes: ["42"] },
    ],
    costPrice: 18,
  },
  {
    idNum: 9,
    description: "قماش كريب نخب اول مع دانتيل ابيض",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["40", "44", "46"] },
      { color: "ابيض", colorHex: "#FFFFFF", sizes: [] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["40", "44"] },
    ],
    costPrice: 25,
  },
  {
    idNum: 10,
    description: "قطعه بيسك شيفون مبطنه وقطعه خارجيه شيفون",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: ["40", "46", "48"] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["42", "44", "46", "48"] },
      { color: "اسود", colorHex: "#000000", sizes: ["40", "42", "44", "46", "48"] },
    ],
    costPrice: 19,
  },
  {
    idNum: 11,
    description: "قماش ستان ناعم مبطن مع لولو طبقتين",
    colorsWithSizes: [
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["44", "46"] },
      { color: "بني", colorHex: "#8B4513", sizes: [] },
    ],
    costPrice: 26,
  },
  {
    idNum: 12,
    description: "قماش شيفون نخب اول مع قماش كريب على الخصر والاكمام",
    colorsWithSizes: [
      { color: "اسود", colorHex: "#000000", sizes: ["36", "38", "44"] },
      { color: "احمر", colorHex: "#DC2626", sizes: ["36", "38", "40", "42", "46"] },
      { color: "بني فاتح", colorHex: "#D2B48C", sizes: [] },
    ],
    costPrice: 19,
  },
  {
    idNum: 13,
    description: "قماش كريب مبطن مع لمسات دانتيل ناعمه",
    colorsWithSizes: [
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["40", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: [] },
    ],
    costPrice: 25,
  },
  {
    idNum: 14,
    description: "قماش ستان نخب اول 🌷",
    colorsWithSizes: [
      { color: "زيتي", colorHex: "#556B2F", sizes: ["44", "46"] },
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["40", "42", "44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["40", "42", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["42", "46"] },
      { color: "بني", colorHex: "#8B4513", sizes: ["44", "46"] },
    ],
    costPrice: 22,
  },
  {
    idNum: 15,
    description: "قماش شيفون نخب اول مبطن كامل ✨️",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["44"] },
      { color: "بني", colorHex: "#8B4513", sizes: [] },
      { color: "اسود", colorHex: "#000000", sizes: ["40", "42"] },
    ],
    costPrice: 23,
  },
  {
    idNum: 16,
    description: "طقم قطعتين قماش كريب نخب اول مبطن الظهر ،، طول البليزر 80سم طول البنطلون 100سم ✨️",
    colorsWithSizes: [
      { color: "اسود", colorHex: "#000000", sizes: ["44"] },
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["38", "40", "44"] },
      { color: "بني", colorHex: "#8B4513", sizes: [] },
      { color: "خمري", colorHex: "#722F37", sizes: ["44"] },
    ],
    costPrice: 15,
  },
  {
    idNum: 17,
    description: "قماش كريب نخب اول مع لمسات دانتيل ابيض على الوشاح والاكمام ✨️",
    colorsWithSizes: [
      { color: "سماوي", colorHex: "#87CEEB", sizes: ["42", "44", "46"] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["36", "40", "42", "44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["38", "40", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["36", "38", "40", "42", "44", "46"] },
    ],
    costPrice: 17,
  },
  {
    idNum: 18,
    description: "قماش كريب جي ار فاخر مبطن بالكامل مع كتافيات وازرار ذهبيات ✨️ (طول البليزر: 76cm | طول البنطلون: 104cm)",
    colorsWithSizes: [
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["36", "38", "42", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["38", "40", "42", "44", "46"] },
      { color: "بني موكا", colorHex: "#6F4E37", sizes: ["36", "40", "42", "44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "42", "44", "46"] },
    ],
    costPrice: 20,
  },
  {
    idNum: 19,
    description: "فستان بليسيه شيفون مبطن مع ستراس فاخر على الخصر ✨️",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: ["38"] },
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["44", "48"] },
      { color: "بيبي بلو", colorHex: "#89CFF0", sizes: ["44"] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["38", "44"] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["46"] },
    ],
    costPrice: 34,
  },
  {
    idNum: 20,
    description: "قماش اورجنزا من فوق وكريب من تحت وخطوط ستراس بالوسط",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: ["42", "44"] },
      { color: "زهري", colorHex: "#F472B6", sizes: [] },
      { color: "ابيض", colorHex: "#FFFFFF", sizes: [] },
      { color: "اسود", colorHex: "#000000", sizes: [] },
      { color: "بيبي بلو", colorHex: "#89CFF0", sizes: ["44"] },
    ],
    costPrice: 33,
  },
  {
    idNum: 21,
    description: "قماش كريب جي ار فاخر مبطن بالكامل مع كتافيات وازرار ذهبيات ✨️ (طول البليزر: 80cm | طول البنطلون: 104cm)",
    colorsWithSizes: [
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["38", "40", "42", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["38", "40", "44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "40", "42", "46"] },
    ],
    costPrice: 20,
  },
  {
    idNum: 22,
    description: "قماش كريب نخب اول مبطن بالكامل مع كتافيات وزر ذهبي 💫 (طول البليزر: 80cm | طول البنطلون: 104cm)",
    colorsWithSizes: [
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["46"] },
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["36", "38", "40", "42", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["36", "40", "46"] },
    ],
    costPrice: 20,
  },
  {
    idNum: 23,
    description: "قماش دانتيل فرنسي نخب اول مع رباط من الخلف 💫",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: [] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["36", "38", "40", "42", "44"] },
    ],
    costPrice: 26,
  },
  {
    idNum: 24,
    description: "قماش دانتيل نخب اول 🎗",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: [] },
    ],
    costPrice: 27,
  },
  {
    idNum: 25,
    description: "جيمبسوت مميز من الكريب والدانتيل مع شريط ستان ✨️",
    colorsWithSizes: [
      { color: "اسود", colorHex: "#000000", sizes: ["36", "38", "40", "42"] },
      { color: "بني", colorHex: "#8B4513", sizes: ["36", "38", "40", "44"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "40"] },
    ],
    costPrice: 26,
  },
  {
    idNum: 26,
    description: "قماش شيفون نخب اول ✨️",
    colorsWithSizes: [
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["36", "42", "44", "46"] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: [] },
      { color: "بني", colorHex: "#8B4513", sizes: [] },
    ],
    costPrice: 27,
  },
  {
    idNum: 27,
    description: "شيفون نخب اول مبطن مع شال طويل شيفون 💫",
    colorsWithSizes: [
      { color: "بيبي بلو", colorHex: "#89CFF0", sizes: [] },
      { color: "زهري", colorHex: "#F472B6", sizes: [] },
      { color: "خمري", colorHex: "#722F37", sizes: [] },
    ],
    costPrice: 30,
  },
  {
    idNum: 28,
    description: "قماش ستان جازارا لامع نخب اول ✨️",
    colorsWithSizes: [
      { color: "سومو", colorHex: "#F9A8D4", sizes: ["42", "44", "46"] },
      { color: "اوف وايت", colorHex: "#F5F5DC", sizes: ["36", "38", "40", "42", "44", "46"] },
      { color: "بيبي بلو", colorHex: "#89CFF0", sizes: ["36", "38", "40", "42", "44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "40", "42", "44", "46"] },
    ],
    costPrice: 33,
  },
  {
    idNum: 29,
    description: "مكس ساحر بين الاورجنزا والستان الناعم",
    colorsWithSizes: [
      { color: "زهري", colorHex: "#F472B6", sizes: ["42", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["36", "38", "40", "42", "44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "42", "44", "46"] },
    ],
    costPrice: 30,
  },
  {
    idNum: 30,
    description: "قماش كريب باربي نخب اول ✨️",
    colorsWithSizes: [
      { color: "اصفر", colorHex: "#EAB308", sizes: ["36", "38", "40", "42", "44"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "40", "42", "44"] },
      { color: "بيبي بلو", colorHex: "#89CFF0", sizes: ["36", "38", "40", "42", "44"] },
      { color: "سومو", colorHex: "#F9A8D4", sizes: ["36", "38", "40", "42", "44"] },
    ],
    costPrice: 24,
  },
  {
    idNum: 31,
    description: "فستان شيفون مبطن نخب اول ✨️",
    colorsWithSizes: [
      { color: "اصفر", colorHex: "#EAB308", sizes: [] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["42", "44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["46"] },
    ],
    costPrice: 25,
  },
  {
    idNum: 32,
    description: "قماش الاورجنزا نخب اول مع ستراس فاخر على الخصر",
    colorsWithSizes: [
      { color: "زهري", colorHex: "#F472B6", sizes: ["44"] },
      { color: "بني", colorHex: "#8B4513", sizes: [] },
      { color: "بيج", colorHex: "#D4B896", sizes: ["44"] },
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "اسود", colorHex: "#000000", sizes: ["42", "46"] },
    ],
    costPrice: 31,
  },
  {
    idNum: 33,
    description: "قماش ستان يوريا نخب اول",
    colorsWithSizes: [
      { color: "عنابي", colorHex: "#800020", sizes: ["36", "38", "40", "42", "44"] },
      { color: "بني", colorHex: "#8B4513", sizes: ["42", "44"] },
      { color: "زيتي", colorHex: "#556B2F", sizes: ["38", "40", "42", "44"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["40", "42", "44"] },
      { color: "سومو", colorHex: "#F9A8D4", sizes: ["36", "38", "40", "42", "44"] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["42", "44"] },
    ],
    costPrice: 20,
  },
  {
    idNum: 34,
    description: "قماش ستان جازارا لامع ✨️",
    colorsWithSizes: [
      { color: "اصفر", colorHex: "#EAB308", sizes: [] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["38", "42", "44"] },
      { color: "نهدي", colorHex: "#A855F7", sizes: ["36", "38", "40"] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["36", "38", "40", "42", "44"] },
      { color: "اسود", colorHex: "#000000", sizes: ["36", "38", "40", "42", "44"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "42", "44"] },
    ],
    costPrice: 30,
  },
  {
    idNum: 35,
    description: "قماش اورجنزا نخب اول مع ستراس فاخر على الرقبه ✨️",
    colorsWithSizes: [
      { color: "زهري", colorHex: "#F472B6", sizes: ["36", "38", "40", "42", "44", "46"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "42", "44", "46"] },
      { color: "اسود", colorHex: "#000000", sizes: ["36", "38", "40", "42", "44", "46"] },
    ],
    costPrice: 32,
  },
  {
    idNum: 36,
    description: "قماش باربي مع شيفون",
    colorsWithSizes: [
      { color: "اصفر", colorHex: "#EAB308", sizes: ["42", "44"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "40", "42", "44"] },
      { color: "زهري", colorHex: "#F472B6", sizes: ["36", "40", "42", "44"] },
      { color: "بني", colorHex: "#8B4513", sizes: ["36", "38", "42", "44"] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["36"] },
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["36", "40", "42", "44"] },
      { color: "بيبي بلو", colorHex: "#89CFF0", sizes: ["44"] },
    ],
    costPrice: 24,
  },
  {
    idNum: 37,
    description: "قماش ستان نخب اول مع شال طويل ✨️",
    colorsWithSizes: [
      { color: "اصفر", colorHex: "#EAB308", sizes: ["38", "40", "42"] },
      { color: "خمري", colorHex: "#722F37", sizes: [] },
      { color: "اسود", colorHex: "#000000", sizes: ["36", "38", "40", "42", "44"] },
    ],
    costPrice: 26,
  },
  {
    idNum: 38,
    description: "قماش كريب نخب اول مع شاحط طويل ✨️",
    colorsWithSizes: [
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "40", "42", "44"] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["36", "38", "40", "42", "44"] },
      { color: "اسود", colorHex: "#000000", sizes: ["36", "38", "40", "42", "44"] },
    ],
    costPrice: 25,
  },
  {
    idNum: 39,
    description: "قماش ستان جازارا فاخر بلمعة ناعمه ✨️",
    colorsWithSizes: [
      { color: "سومو", colorHex: "#F9A8D4", sizes: ["36", "38", "40", "42", "44"] },
      { color: "ابيض", colorHex: "#FFFFFF", sizes: ["36", "38", "40", "42", "44"] },
      { color: "احمر", colorHex: "#DC2626", sizes: ["36", "38", "40", "42", "44"] },
      { color: "كحلي", colorHex: "#1E3A5F", sizes: ["36", "38", "40", "42", "44"] },
      { color: "خمري", colorHex: "#722F37", sizes: ["36", "38", "40", "42", "44"] },
    ],
    costPrice: 30,
  },
];

async function seedUserDresses() {
  console.log("🧹 Clearing old database records...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dressImage.deleteMany();
  await prisma.dressVariant.deleteMany();
  await prisma.dress.deleteMany();

  console.log("👗 Creating 39 verified dresses according to pricing formula (+8 / +9 JOD)...");

  for (const raw of rawDresses) {
    // Pricing formula: cost < 26 JOD => +9 JOD margin, cost >= 26 JOD => +8 JOD margin
    const margin = raw.costPrice < 26 ? 9 : 8;
    const sellingPrice = raw.costPrice + margin;
    const originalPrice = null;

    const dressTitle = raw.description;

    // sortOrder: Dress 39 (newest) = 1, Dress 1 (oldest) = 39 so Dress 39 appears first on store
    const sortOrder = 40 - raw.idNum;

    const variantsData: { color: string; colorHex: string; size: string; quantity: number }[] = [];

    for (const group of raw.colorsWithSizes) {
      if (group.sizes.length === 0) {
        variantsData.push({
          color: group.color,
          colorHex: group.colorHex,
          size: 'خالص (نفذت الكمية)',
          quantity: 0,
        });
      } else {
        for (const size of group.sizes) {
          variantsData.push({
            color: group.color,
            colorHex: group.colorHex,
            size: size,
            quantity: 5,
          });
        }
      }
    }

    const createdDress = await prisma.dress.create({
      data: {
        name: dressTitle,
        description: raw.description,
        price: sellingPrice,
        originalPrice: originalPrice,
        sortOrder: sortOrder,
        isNew: raw.idNum >= 30, // Mark latest 10 as new arrivals
        isFeatured: raw.idNum % 2 === 0, // Mark featured
        variants: {
          create: variantsData,
        },
      },
      include: {
        variants: true,
      },
    });

    // Create placeholder image link for each variant so UI gallery works immediately until user uploads custom images
    for (const variant of createdDress.variants) {
      await prisma.dressImage.create({
        data: {
          url: '/uploads/dress1.jpg',
          variantId: variant.id,
        },
      });
    }

    console.log(`✅ [${raw.idNum}/39] ${dressTitle} | Cost: ${raw.costPrice} JD -> Selling: ${sellingPrice} JD | Variants: ${variantsData.length}`);
  }

  console.log("\n🎉 All 39 dresses imported successfully into Riva store!");
}

seedUserDresses()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
