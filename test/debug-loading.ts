/**
 * 调试脚本：测试书籍加载性能
 * 运行: npx tsx test/debug-loading.ts
 */

import { chromium } from 'playwright';

async function debugLoading() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听所有控制台输出
  page.on('console', msg => {
    const text = msg.text();
    // 显示所有日志
    console.log(`[${msg.type()}]`, text);
  });
  
  // 监听页面错误
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
  });

  console.log('🚀 打开应用...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  // 点击图书馆
  console.log('📚 进入图书馆...');
  await page.click('text=图书馆');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test/debug-1-library.png' });

  // 查找书籍
  const books = page.locator('button').filter({ has: page.locator('[class*="bg-gradient"]') });
  const bookCount = await books.count();
  console.log(`📖 找到 ${bookCount} 本书`);

  if (bookCount > 0) {
    // 点击第一本书
    console.log('📖 点击第一本书，开始计时...');
    const startTime = Date.now();
    await books.first().click();
    
    // 等待阅读界面
    try {
      await page.waitForSelector('article', { timeout: 120000 });
      const loadTime = Date.now() - startTime;
      console.log(`\n✅ 界面加载完成！前端总耗时: ${loadTime}ms\n`);
    } catch (e) {
      console.log('⚠️ 等待超时');
      await page.screenshot({ path: 'test/debug-timeout.png' });
    }
    
    await page.screenshot({ path: 'test/debug-2-reader.png' });
  } else {
    // 尝试文件管理
    console.log('📁 图书馆为空，尝试文件管理...');
    await page.click('text=文件');
    await page.waitForTimeout(2000);
    
    // 点击第一个文件夹
    const folders = page.locator('text=文件夹');
    if (await folders.count() > 0) {
      console.log('📂 点击进入文件夹...');
      await page.locator('button').filter({ hasText: '百度云解压' }).click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test/debug-3-folder.png' });
    }
  }

  console.log('\n🔧 浏览器保持打开');
  console.log('💡 请在开发者工具 Console 中查看详细性能日志');
  console.log('💡 手动点击一个 .txt 文件查看加载过程');
  console.log('按 Ctrl+C 关闭...\n');
  
  await page.waitForTimeout(600000); // 10分钟
  await browser.close();
}

debugLoading().catch(console.error);
