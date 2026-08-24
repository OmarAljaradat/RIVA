async function testLive() {
  const res = await fetch('https://riva-lime.vercel.app/products', { headers: { 'Cache-Control': 'no-cache' } });
  const html = await res.text();
  console.log('HTML size:', html.length);
  console.log('Includes AVAILABLE_COLORS or filter text:', html.includes('التصفية') || html.includes('الألوان'));
  
  // Find script tags
  const matches = [...html.matchAll(/src="(\/_next\/static\/[^"]+)"/g)];
  console.log('Script matches count:', matches.length);
  for (const m of matches) {
    const sUrl = 'https://riva-lime.vercel.app' + m[1];
    const sRes = await fetch(sUrl);
    const text = await sRes.text();
    if (text.includes('التصفية باللون') || text.includes('كل الألوان') || text.includes('FBBF24')) {
      console.log('SUCCESS! Found in live JS bundle:', sUrl);
      return;
    }
  }
  console.log('Not yet found in JS bundles. Vercel deployment may still be processing.');
}

testLive();
