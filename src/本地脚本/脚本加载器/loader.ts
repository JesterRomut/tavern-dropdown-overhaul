import { createCDN, fetchGitHub, fetchLatestRepoTag, getAvailableHost, getGitHubCdnUrl } from '@util/cdn';

const cdn = createCDN({ fetchGitHub, fetchLatestRepoTag, getAvailableHost });

export async function loadScript(repo: string, path: string, pathReadme: string, name = '脚本加载器') {
  try {
    const [tagRes, hostRes] = await Promise.all([cdn.fetchLatestRepoTag(repo), cdn.getAvailableHost()]);
    const tag = tagRes || 'latest';
    const host = hostRes || undefined;
    const scriptUrl = getGitHubCdnUrl(repo, path, tag, host);
    console.info(`[${name}] 正在动态加载: ${scriptUrl}`);

    await import(/* webpackIgnore: true */ scriptUrl);
  } catch (err) {
    console.error(`[${name}] 加载失败:`, err);
    return;
  }

  const readme = await cdn.fetchGitHub(repo, pathReadme);
  if (!readme.ok) {
    console.error(`[${name}] README加载失败:`, readme.status);
    return;
  }
  replaceScriptInfo(await readme.text());
}
