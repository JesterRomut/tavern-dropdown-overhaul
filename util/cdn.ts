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
  private versionPromises: Map<string, Promise<string | null>> = new Map();

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

  /**
   * 获取远程仓库最新版本/Tag（兼具实时探测、多源回退、防抖缓存及并发去重）
   * 优先探测 GitHub 实时接口（API 与 Atom 订阅流）穿透缓存，最后降级由 jsDelivr 保底
   */
  public async fetchLatestVersion(repo: string, options: RequestOptions | number = {}): Promise<string | null> {
    if (this.versionCache.has(repo)) {
      return this.versionCache.get(repo)!;
    }
    if (this.versionPromises.has(repo)) {
      return await this.versionPromises.get(repo)!;
    }

    const opts = typeof options === 'number' ? { timeout: options } : options;
    const { timeout = 4000, ...fetchOptions } = opts;

    const apis: {
      url: string;
      isXml?: boolean;
      parser: (data: any) => string | null | undefined;
    }[] = [
      {
        url: `https://api.github.com/repos/${repo}/tags?per_page=1`,
        parser: (json: any) => json[0]?.name,
      },
      {
        url: `https://github.com/${repo}/tags.atom`,
        isXml: true,
        parser: (text: string) => {
          const match = text.match(/<entry>[\s\S]*?<title>\s*([^<\s]+)\s*<\/title>/i);
          return match?.[1]?.trim() ?? null;
        },
      },
      {
        url: `https://data.jsdelivr.com/v1/packages/gh/${repo}`,
        parser: (json: any) => json.tags?.latest || json.versions?.[0]?.version,
      },
    ];

    const fetchPromise = (async () => {
      for (const { url, isXml, parser } of apis) {
        let timer: ReturnType<typeof setTimeout> | null = null;
        try {
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), timeout);

          if (fetchOptions.signal) {
            fetchOptions.signal.addEventListener('abort', () => controller.abort());
          }

          const bustUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
          const res = await fetch(bustUrl, {
            cache: 'no-store',
            ...fetchOptions,
            signal: controller.signal,
            headers: {
              ...(isXml
                ? { Accept: 'application/atom+xml, application/xml, text/xml, */*' }
                : { Accept: 'application/vnd.github+json, application/json, */*' }),
              ...(fetchOptions.headers as Record<string, string>),
            },
          });

          if (res.ok) {
            const data = isXml ? await res.text() : await res.json();
            const tag = parser(data);
            if (tag) {
              const trimmedTag = tag.trim();
              console.info(`[OZ-CDNManager] 成功从 ${url} 探测到最新 Tag: ${trimmedTag}`);
              this.versionCache.set(repo, trimmedTag);
              return trimmedTag;
            }
          }
        } catch (e) {
          console.warn(`[OZ-CDNManager] 从 ${url} 探测最新版本失败:`, e);
          continue;
        } finally {
          if (timer) clearTimeout(timer);
        }
      }
      return null;
    })();

    this.versionPromises.set(repo, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.versionPromises.delete(repo);
    }
  }

  /**
   * 兼容旧命名的别名方法，直接代理到 fetchLatestVersion
   */
  public async fetchRemoteLatestRepoTag(repo: string, options: RequestOptions | number = {}): Promise<string | null> {
    return this.fetchLatestVersion(repo, options);
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
    this.versionPromises.clear();
  }
}

// export const cdnManager = new CDNManager();
