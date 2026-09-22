import { createCDNContext, fetchGitHub, fetchLatestRepoTag, getGitHubCdnUrl } from '@util/cdn';

const ctx = createCDNContext();

export async function loadScript(repo: string, path: string, pathReadme: string, name = '脚本加载器') {
  try {
    const tag = (await fetchLatestRepoTag(repo, undefined, ctx)) || 'latest';
    const scriptUrl = getGitHubCdnUrl(repo, path, tag);
    console.info(`[${name}] 正在动态加载: ${scriptUrl}`);

    await import(/* webpackIgnore: true */ scriptUrl);
  } catch (err) {
    console.error(`[${name}] 加载失败:`, err);
    return;
  }

  const readme = await fetchGitHub(repo, pathReadme, undefined, ctx);
  if (!readme.ok) {
    console.error(`[${name}] README加载失败:`, readme.status);
    return;
  }
  replaceScriptInfo(await readme.text());
}
