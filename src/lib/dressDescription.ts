/**
 * Generates an elegant, boutique-style customer description
 * strictly stripped of any supplier prices, cost prices, raw sizes, or raw telegram lists.
 */
export function generateCleanDressDescription(name: string, rawDescription?: string | null): string {
  const cleanName = (name || '').trim();

  // If raw description has clean narrative lines (without prices or size numbers), use it as base
  if (rawDescription) {
    const lines = rawDescription
      .split('\n')
      .map(l => l.trim())
      .filter(l => {
        // Filter out any price lines
        if (/السعر|jd|دينار|JD|JOD|[0-9]{2,}\s*(jd|دينار)/i.test(l)) return false;
        // Filter out size lists (e.g. 36 38 40 42 44 46)
        if (/[0-9]{2}\s+[0-9]{2}\s+[0-9]{2}/.test(l)) return false;
        // Filter out short emoji lines
        if (l.length < 8) return false;
        return true;
      });

    const cleanNarrative = lines.find(l => 
      !l.includes('36') && 
      !l.includes('38') && 
      !l.includes('40') && 
      !l.includes('السعر') &&
      l.length > 15
    );

    if (cleanNarrative) {
      const cleaned = cleanNarrative.replace(/^[✨️🌟👗❤️🖤🩵💛🩷\s-]+/, '').trim();
      if (cleaned.length > 15) {
        return `✨ ${cleaned} — مصمم بأعلى معايير الجودة والأناقة، مبطن بالكامل ليمنحكِ إطلالة محتشمة وساحرة تليق بأجمل مناسباتكِ.`;
      }
    }
  }

  // Dynamic luxury descriptions based on dress fabric and cut
  if (cleanName.includes('شيفون')) {
    return '✨ تصميم أنيق وراقٍ من خامة الشيفون الفاخر، مبطن بالكامل بقصة انسيابية ساحرة ليمنحكِ إطلالة أنثوية مميزة تجمع بين الراحة والفخامة في أرقى المناسبات.';
  }
  if (cleanName.includes('كريب')) {
    return '✨ فستان راقٍ مصمم من قماش الكريب الملكي الفاخر والمبطن بعناية، بقصة محتشمة ومريحة تبرز جمال التصميم وتمنحكِ حضوراً استثنائياً وجذاباً.';
  }
  if (cleanName.includes('مخمل')) {
    return '✨ إطلالة ملوكية ساحرة من قماش المخمل الفاخر مع لمسات تصميم متقنة، تمنحكِ الدفء والأناقة الفائقة في سهراتكِ ومناسباتكِ الخاصة.';
  }
  if (cleanName.includes('دانتيل')) {
    return '✨ تفاصيل أنثوية رقيقة من الدانتيل الفرنسي الفاخر والمبطن بالكامل، بتصميم كلاسيكي جذاب يعكس ذوقكِ الرفيع في كل إطلالة.';
  }
  if (cleanName.includes('ستان') || cleanName.includes('جازارا')) {
    return '✨ فستان سهرة راقٍ من قماش الستان اللامع الفاخر، مصمم بقصة أنيقة ومبطنة بعناية لتتألقي ببريق لا يُنسى في سهراتكِ.';
  }
  if (cleanName.includes('جيمبسوت') || cleanName.includes('جمبسوت')) {
    return '✨ جمبسوت عصري وفاخر يجمع بين الأناقة والراحة، بخامات نخب أول متقنة وتصميم استثنائي يمنحكِ إطلالة مفعمة بالثقة والتميز.';
  }
  if (cleanName.includes('طقم')) {
    return '✨ طقم فاخر وأنيق منسق بعناية من خامات عالية الجودة، يمنحكِ تنوعاً وسهولة في التنسيق مع إطلالة ملكية متكاملة.';
  }
  if (cleanName.includes('بليسيه')) {
    return '✨ فستان بليسيه راقٍ بتكسيرات أنيقة وانسيابية ناعمة، مبطن بالكامل ليمنحكِ حركة خفيفة وإطلالة أنثوية ساحرة.';
  }

  return '✨ فستان سهرة راقٍ مصمم بعناية فائقة من خامات نخب أول مبطنة بالكامل، بقصة انسيابية أنيقة تضمن لكِ إطلالة استثنائية وفخمة في كافة مناسباتكِ.';
}
