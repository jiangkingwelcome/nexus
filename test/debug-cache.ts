import { chromium } from 'playwright';

async function debugCache() {
  console.log('🚀 启动缓存调试...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 收集控制台日志
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    // 打印所有关键日志
    if (text.includes('缓存') || text.includes('IndexedDB') || text.includes('命中') || 
        text.includes('下载') || text.includes('检查') || text.includes('写入') ||
        text.includes('路径') || text.includes('error') || text.includes('Error') ||
        text.includes('成功') || text.includes('失败')) {
      console.log(`📝 ${text}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log(`❌ 页面错误: ${err.message}`);
  });

  // 等待加载完成
  async function waitForLoad(timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const loading = await page.locator('text=加载中').count();
      if (loading === 0) return true;
      await page.waitForTimeout(500);
    }
    return false;
  }

  try {
    // 1. 打开应用
    console.log('1️⃣ 打开应用...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 2. 进入图书馆
    console.log('\n2️⃣ 进入图书馆...');
    await page.click('nav >> text=图书馆');
    await page.waitForTimeout(1500);
    await waitForLoad(30000);
    
    await page.screenshot({ path: 'test/debug-2-library.png' });
    
    // 3. 查找书籍
    console.log('\n3️⃣ 查找书籍...');
    
    const bookCards = page.locator('div[class*="bg-"][class*="rounded"]').filter({
      has: page.locator('span, div')
    }).filter({
      hasText: /《.*》|斗|签约/
    });
    
    const count = await bookCards.count();
    console.log(`   找到 ${count} 个书籍卡片`);
    
    if (count > 0) {
      const firstBook = bookCards.first();
      const bookTitle = await firstBook.textContent();
      console.log(`   书名: ${bookTitle?.substring(0, 50)}...`);
      
      // 4. 第一次加载
      console.log('\n4️⃣ 【第一次加载】点击书籍...');
      
      const startTime1 = Date.now();
      await firstBook.click();
      
      console.log('   等待下载和加载...');
      
      let loaded1 = false;
      for (let i = 0; i < 180; i++) {  // 最多等6分钟
        await page.waitForTimeout(2000);
        
        const hasArticle = await page.locator('article').count() > 0;
        if (hasArticle) {
          const loadTime1 = Date.now() - startTime1;
          console.log(`\n   ✅ 第一次加载完成! 耗时: ${(loadTime1/1000).toFixed(1)}秒`);
          loaded1 = true;
          break;
        }
        
        // 显示进度
        const bodyText = await page.locator('body').innerText();
        const match = bodyText.match(/(\d+(?:\.\d+)?)\s*[%％]/);
        if (match && i % 5 === 0) {
          console.log(`   下载进度: ${match[1]}%`);
        }
        
        if (i % 15 === 0) {
          console.log(`   ... 等待中 (${i * 2}s)`);
          await page.screenshot({ path: `test/debug-loading-${i}.png` });
        }
      }
      
      if (loaded1) {
        // 等待缓存写入完成
        console.log('\n   等待缓存写入完成 (15秒)...');
        await page.waitForTimeout(15000);
        
        await page.screenshot({ path: 'test/debug-loaded.png' });
        
        // 5. 关闭阅读器
        console.log('\n5️⃣ 关闭阅读器...');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1500);
        
        const backBtn = page.locator('button:has-text("返回")');
        if (await backBtn.count() > 0) {
          await backBtn.click();
        }
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'test/debug-closed.png' });
        
        // 6. 第二次加载 - 测试缓存
        console.log('\n6️⃣ 【第二次加载 - 测试缓存】');
        console.log('   （如果缓存生效，这次应该很快）\n');
        
        const bookCards2 = page.locator('div[class*="bg-"][class*="rounded"]').filter({
          has: page.locator('span, div')
        }).filter({
          hasText: /《.*》|斗|签约/
        });
        
        if (await bookCards2.count() > 0) {
          const startTime2 = Date.now();
          await bookCards2.first().click();
          
          let loaded2 = false;
          for (let i = 0; i < 60; i++) {
            await page.waitForTimeout(1000);
            
            const hasArticle = await page.locator('article').count() > 0;
            if (hasArticle) {
              const loadTime2 = Date.now() - startTime2;
              console.log(`\n   ✅ 第二次加载完成! 耗时: ${(loadTime2/1000).toFixed(1)}秒`);
              
              if (loadTime2 < 2000) {
                console.log('\n   🎉🎉🎉 缓存完美生效！瞬间加载！');
              } else if (loadTime2 < 5000) {
                console.log('\n   ✨ 缓存生效，加载较快');
              } else if (loadTime2 < 15000) {
                console.log('\n   ℹ️ 加载速度中等');
              } else {
                console.log('\n   ⚠️ 加载较慢，缓存可能未生效');
              }
              loaded2 = true;
              break;
            }
            
            if (i % 10 === 0 && i > 0) {
              console.log(`   ... 等待中 (${i}s)`);
            }
          }
          
          if (!loaded2) {
            console.log('   ⚠️ 第二次加载超时');
          }
        }
      } else {
        console.log('   ⚠️ 第一次加载超时，无法测试缓存');
      }
    } else {
      console.log('   ❌ 未找到书籍');
    }
    
    // 打印缓存日志
    console.log('\n\n📋 完整缓存日志:');
    console.log('='.repeat(70));
    const cacheRelatedLogs = logs.filter(l => 
      l.includes('缓存') || l.includes('IndexedDB') || l.includes('命中') || 
      l.includes('下载') || l.includes('检查') || l.includes('写入') ||
      l.includes('路径') || l.includes('成功') || l.includes('失败') ||
      l.includes('error') || l.includes('Error')
    );
    cacheRelatedLogs.forEach(l => console.log(l));
    console.log('='.repeat(70));
    
    await page.screenshot({ path: 'test/debug-final.png' });
    console.log('\n等待5秒后关闭...');
    await page.waitForTimeout(5000);
    
  } catch (err) {
    console.error('❌ 调试出错:', err);
    await page.screenshot({ path: 'test/debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugCache().catch(console.error);
