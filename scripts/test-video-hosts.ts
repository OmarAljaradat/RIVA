async function testVideoHosts() {
  console.log('Testing video upload hosts with CORS...');

  // 1. Test TmpFiles
  try {
    const fd1 = new FormData();
    const blob1 = new Blob([Buffer.from('Test video content')], { type: 'video/mp4' });
    fd1.append('file', blob1, 'test_video.mp4');
    const res1 = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: fd1 });
    const data1 = await res1.json();
    console.log('TmpFiles response:', data1);
    if (data1.status === 'success' && data1.data?.url) {
      const rawUrl = data1.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      console.log('✅ TmpFiles Direct URL:', rawUrl);
    }
  } catch (e: any) {
    console.log('TmpFiles failed:', e.message);
  }

  // 2. Test ImgBB for images
  try {
    const fd2 = new FormData();
    const blob2 = new Blob([Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')], { type: 'image/gif' });
    fd2.append('image', blob2, 'test.gif');
    const res2 = await fetch('https://api.imgbb.com/1/upload?key=061a9c37568571faeb29c2d1b8004f2f', { method: 'POST', body: fd2 });
    const data2 = await res2.json();
    console.log('✅ ImgBB response:', data2.success, data2.data?.url);
  } catch (e: any) {
    console.log('ImgBB failed:', e.message);
  }
}

testVideoHosts().catch(console.error);
