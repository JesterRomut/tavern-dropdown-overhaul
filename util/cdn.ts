export interface RequestOptions extends RequestInit {
  timeout?: number;
}

export const DEFAULT_CDN_HOSTS = [
  'https://testingcf.jsdelivr.net',
  'https://fastly.jsdelivr.net',
  'https://gcore.jsdelivr.net',
  'https://cdn.jsdelivr.net',
] as const;

export interface CDNContext {
  hosts: string[];
  currentHost: string | null;
  isInitializing: Promise<string | null> | null;
  versionCache: Map<string, string>;
  versionPromises: Map<string, Promise<string | null>>;
}

/**
 * 工厂函数：创建带默认值的 CDN 状态上下文
 */
export function createCDNContext(options?: Partial<CDNContext>): CDNContext {
  return {
    hosts: options?.hosts ? [...options.hosts] : [...DEFAULT_CDN_HOSTS],
    currentHost: options?.currentHost ?? null,
    isInitializing: null,
    versionCache: options?.versionCache ?? new Map(),
    versionPromises: options?.versionPromises ?? new Map(),
  };
}

export type BoundMethod<T> = T extends (ctx: CDNContext, ...args: infer P) => infer R ? (...args: P) => R : T;

export type CDNClient<T extends Record<string, any>> = {
  [K in keyof T]: BoundMethod<T[K]>;
} & { readonly _ctx: CDNContext };

/**
 * 工厂函数：按需组合 CDN 方法并返回绑定私有 context 的客户端对象
 */
export function createCDN<T extends Record<string, any>>(
  methods: T,
  options?: Partial<CDNContext> | CDNContext,
): CDNClient<T> {
  const ctx = options && 'hosts' in options ? options : createCDNContext(options);
  const client: any = { _ctx: ctx };
  for (const key in methods) {
    client[key] = methods[key].bind(null, ctx);
  }
  return client;
}

/**
 * 测速单个 Host (改用必定有 CORS 头的 npm 资源)
 */
export async function pingHost(host: string, timeout: number = 3000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${host}/npm/jquery@3.7.1/package.json`, {
      method: 'HEAD',
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

/**
 * 获取当前最快的 CDN 镜像节点
 */
export async function getFastestHost(ctx: CDNContext): Promise<string | null> {
  if (ctx.currentHost) return ctx.currentHost;
  if (ctx.isInitializing) return ctx.isInitializing;

  ctx.isInitializing = (async () => {
    try {
      const fastest = await Promise.any(ctx.hosts.map(host => pingHost(host)));
      ctx.currentHost = fastest;
      return fastest;
    } catch {
      ctx.currentHost = null;
      return null;
    } finally {
      ctx.isInitializing = null;
    }
  })();

  return ctx.isInitializing;
}

/**
 * 故障时切换节点
 */
export async function switchHost(ctx: CDNContext, failedHost?: string): Promise<string | null> {
  if (failedHost && ctx.currentHost === failedHost) {
    ctx.currentHost = null;
  }
  return getFastestHost(ctx);
}

/**
 * 带超时的 fetch 工具函数
 */
export async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
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
 * 独立请求：从 CDN 镜像拉取资源并自动在失败时故障转移
 */
export async function fetchFromCdn(
  ctx: CDNContext,
  pathAndRepo: string,
  options: RequestOptions = {},
): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options;
  const normalizedPath = pathAndRepo.startsWith('/') ? pathAndRepo : `/${pathAndRepo}`;

  let host = await getFastestHost(ctx);
  if (!host) {
    throw new Error('[OZ-CDNManager] 没有可用的节点，可能已离线');
  }

  try {
    return await fetchWithTimeout(`${host}${normalizedPath}`, fetchOptions, timeout);
  } catch (err) {
    console.warn(`[OZ-CDNManager] 节点 ${host} 不可用，正在启动后备隐藏节点`);

    host = await switchHost(ctx, host);
    if (!host) {
      throw new Error('[OZ-CDNManager] 所有后备隐藏节点不可用', { cause: err });
    }

    return await fetchWithTimeout(`${host}${normalizedPath}`, fetchOptions, timeout);
  }
}

/**
 * 获取远程仓库最新版本/Tag（兼具实时探测、多源回退、防抖缓存及并发去重）
 * 优先探测 GitHub 实时接口（API 与 Atom 订阅流）穿透缓存，最后降级由 jsDelivr 保底
 */
export async function fetchLatestRepoTag(
  ctx: CDNContext,
  repo: string,
  options: RequestOptions | number = {},
): Promise<string | null> {
  const cache = ctx.versionCache;
  const promises = ctx.versionPromises;

  if (cache.has(repo)) {
    return cache.get(repo)!;
  }
  if (promises.has(repo)) {
    return await promises.get(repo)!;
  }

  const opts = typeof options === 'number' ? { timeout: options } : options;
  const { timeout = 3000, ...fetchOptions } = opts;

  const sources: {
    url: string;
    parser: (res: Response) => Promise<string | null | undefined> | string | null | undefined;
  }[] = [
    {
      url: `https://gh-proxy.com/https://api.github.com/repos/${repo}/tags?per_page=1`,
      parser: async res => {
        const json = await res.json();
        return json[0]?.name;
      },
    },
    {
      url: `https://api.github.com/repos/${repo}/tags?per_page=1`,
      parser: async res => {
        const json = await res.json();
        return json[0]?.name;
      },
    },
    {
      url: `https://data.jsdelivr.com/v1/packages/gh/${repo}`,
      parser: async res => {
        const json = await res.json();
        return json.tags?.latest || json.versions?.[0]?.version;
      },
    },
  ];

  const fetchPromise = (async () => {
    for (const { url, parser } of sources) {
      let timer: ReturnType<typeof setTimeout> | null = null;
      try {
        const controller = new AbortController();
        timer = setTimeout(() => controller.abort(), timeout);

        if (fetchOptions.signal) {
          fetchOptions.signal.addEventListener('abort', () => controller.abort());
        }

        const bustUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        const res = await fetch(bustUrl, {
          method: 'GET',
          cache: 'no-store',
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            Accept: 'application/vnd.github+json, application/json, */*',
            ...(fetchOptions.headers as Record<string, string>),
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const tag = await parser(res);
        if (!tag) {
          throw new Error(`未解析到有效 Tag: ${url}`);
        }

        const trimmedTag = tag.trim();
        console.info(`[OZ-CDNManager] 成功从 ${url} 探测到最新 Tag: ${trimmedTag}`);
        cache.set(repo, trimmedTag);
        return trimmedTag;
      } catch (err) {
        console.warn(`[OZ-CDNManager] 从 ${url} 探测失败:`, err);
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    console.warn('[OZ-CDNManager] 所有探测源均未能获取到最新 Tag');
    return null;
  })();

  promises.set(repo, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    promises.delete(repo);
  }
}

/**
 * 组装 GitHub 资源的 CDN 快照完整 URL（纯同步函数）
 */
export function getGitHubCdnUrl(
  repo: string,
  path: string,
  tag?: string,
  host: string = 'https://testingcf.jsdelivr.net',
): string {
  const version = tag ? `@${tag}` : '';
  const cleanPath = encodeURI(path.replace(/^\/+/, ''));
  const cleanHost = host.replace(/\/+$/, '');
  return `${cleanHost}/gh/${repo}${version}/${cleanPath}`;
}

/**
 * 快捷拉取 GitHub 资源
 */
export async function fetchGitHub(
  ctx: CDNContext,
  repo: string,
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const version = await fetchLatestRepoTag(ctx, repo, options);
  const cleanPath = path.replace(/^\/+/, '');
  return await fetchFromCdn(ctx, `gh/${repo}@${version}/${cleanPath}`, options);
}

/**
 * 重置 CDN 状态
 */
export function resetCDNContext(ctx: CDNContext): void {
  ctx.currentHost = null;
  ctx.isInitializing = null;
  ctx.versionCache.clear();
  ctx.versionPromises.clear();
}
