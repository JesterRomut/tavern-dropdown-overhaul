export async function changeGreeting(swipe_id: number) {
  if (typeof setChatMessages === 'function') {
    await setChatMessages([{ message_id: 0, swipe_id }], { refresh: 'affected' });
  } else if (typeof triggerSlash === 'function') {
    triggerSlash('/swipe 0 0');
  } else {
    throw new Error('OZ前端：未识别到酒馆助手API，也无法使用酒馆原生切换！');
  }
}

// /**
//  * 获取可用的 CDN 列表
//  */
// export function getCdnUrls(repo: string, path: string): string[] {
//   return [
//     `https://fastly.jsdelivr.net/gh/${repo}@main/${path}`,
//     `https://gcore.jsdelivr.net/gh/${repo}@main/${path}`,
//     `https://cdn.jsdelivr.net/gh/${repo}@main/${path}`,
//     `https://testingcf.jsdelivr.net/gh/${repo}@main/${path}`,
//   ];
// }

// /**
//  * 单个 URL 可用性与响应速度测试
//  */
// function pingCdn(url: string, timeout: number): Promise<string> {
//   const controller = new AbortController();

//   return new Promise((resolve, reject) => {
//     const timer = setTimeout(() => {
//       controller.abort();
//       reject(new Error(`Timeout: ${url}`));
//     }, timeout);

//     // 拼上时间戳，防止本地缓存干扰测速
//     const testUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;

//     fetch(testUrl, {
//       method: 'HEAD', // 只获取响应头，省流量且速度最快
//       signal: controller.signal,
//       cache: 'no-store',
//     })
//       .then(res => {
//         clearTimeout(timer);
//         if (res.ok) {
//           resolve(url); // 返回原始的 url（不带时间戳）
//         } else {
//           reject(new Error(`HTTP ${res.status}: ${url}`));
//         }
//       })
//       .catch(err => {
//         clearTimeout(timer);
//         reject(err);
//       });
//   });
// }

// /**
//  * 并发测速，获取响应最快且可用的 CDN URL
//  * @param repo GitHub 仓库，例如 "owner/repo"
//  * @param path 文件路径，例如 "dist/index.js"
//  * @param timeout 单个请求超时时间（毫秒），默认 3000ms
//  * @returns 最快的 CDN 完整 URL，若全部不可用则返回 null
//  */
// export async function getFastestCDN(repo: string, path: string, timeout: number = 3000): Promise<string | null> {
//   const urls = getCdnUrls(repo, path);

//   try {
//     // Promise.any 会返回最先 resolve 的那个 Promise
//     const fastestUrl = await Promise.any(urls.map(url => pingCdn(url, timeout)));
//     return fastestUrl;
//   } catch {
//     // 当所有 CDN 请求都失败/超时（抛出 AggregateError）时返回 null
//     return null;
//   }
// }
