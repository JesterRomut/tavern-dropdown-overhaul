export interface RequestOptions extends RequestInit {
  timeout?: number;
}

export class CDNManager {
  private hosts: string[] = [
    'https://cdn.jsdelivr.net',
    'https://fastly.jsdelivr.net',
    'https://gcore.jsdelivr.net',
    'https://testingcf.jsdelivr.net',
  ];

  private currentHost: string | null = null;
  private isInitializing: Promise<string | null> | null = null;
  private versionCache: Map<string, string> = new Map();

  /**
   * 测速单个 Host (改用必定有 CORS 头的 npm 资源)
   */
  private async pingHost(host: string, timeout: number = 3000): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      // jsdelivr 对 /npm/... 路径默认配置了 Access-Control-Allow-Origin: *
      const res = await fetch(`${host}/npm/jquery@3.7.1/package.json`, {
        method: 'HEAD', // 只拉取请求头，极省流量
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timer);
      if (res.ok) return host;
      throw new Error(`Host responded with ${res.status}`);
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  public async getFastestHost(): Promise<string | null> {
    if (this.currentHost) return this.currentHost;
    if (this.isInitializing) return this.isInitializing;

    this.isInitializing = (async () => {
      try {
        const fastest = await Promise.any(this.hosts.map(host => this.pingHost(host)));
        this.currentHost = fastest;
        return fastest;
      } catch {
        this.currentHost = null;
        return null;
      } finally {
        this.isInitializing = null;
      }
    })();

    return this.isInitializing;
  }

  public async switchHost(failedHost?: string): Promise<string | null> {
    if (failedHost && this.currentHost === failedHost) {
      this.currentHost = null;
    }
    return this.getFastestHost();
  }

  public async fetch(pathAndRepo: string, options: RequestOptions = {}): Promise<Response> {
    const { timeout = 5000, ...fetchOptions } = options;
    const normalizedPath = pathAndRepo.startsWith('/') ? pathAndRepo : `/${pathAndRepo}`;

    let host = await this.getFastestHost();
    if (!host) {
      throw new Error('[OZ-CDNManager] 没有可用的节点，可能已离线');
    }

    try {
      return await this.fetchWithTimeout(`${host}${normalizedPath}`, fetchOptions, timeout);
    } catch (err) {
      console.warn(`[OZ-CDNManager] 节点 ${host} 不可用，正在启动后备隐藏节点`);

      host = await this.switchHost(host);
      if (!host) {
        throw new Error('[OZ-CDNManager] 所有后备隐藏节点不可用');
      }

      return await this.fetchWithTimeout(`${host}${normalizedPath}`, fetchOptions, timeout);
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timer);
      throw error;
    }
  }

  public async fetchLatestVersion(repo: string, options: RequestOptions = {}): Promise<string | null> {
    if (this.versionCache.has(repo)) {
      return this.versionCache.get(repo)!;
    }

    const { timeout = 5000, ...fetchOptions } = options;
    const apis = [
      {
        url: `https://data.jsdelivr.com/v1/packages/gh/${repo}`,
        parser: (json: any) => json.tags?.latest || json.versions?.[0]?.version,
      },
      {
        url: `https://api.github.com/repos/${repo}/tags?per_page=1`, // 加上 per_page=1 减少传输体积
        parser: (json: any) => json[0]?.name,
      },
      // { // 我的项目只打tags不打releases就不要这玩意了
      //   url: `https://api.github.com/repos/${repo}/releases/latest`,
      //   parser: (json: any) => json.tag_name,
      // },
    ];

    for (const { url, parser } of apis) {
      try {
        const resp = await this.fetchWithTimeout(url, fetchOptions, timeout);
        if (resp.ok) {
          const json = await resp.json();
          const ver = parser(json);
          if (ver) {
            console.log(`[OZ-CDNManager] 获取版本 ${ver}`);
            this.versionCache.set(repo, ver);
            return ver;
          }
        }
      } catch (e) {
        console.warn(`[OZ-CDNManager] 从 ${url} 获取版本失败:`, e);
        continue;
      }
    }
    return null;
  }

  public async fetchGitHub(repo: string, path: string, options: RequestOptions = {}) {
    const version = await this.fetchLatestVersion(repo, options);
    if (!version) {
      return await this.fetch(`gh/${repo}@latest/${path}`);
    }
    return await this.fetch(`gh/${repo}@${version}/${path}`);
  }

  public reset(): void {
    this.currentHost = null;
    this.isInitializing = null;
    this.versionCache.clear();
  }
}

// export const cdnManager = new CDNManager();
