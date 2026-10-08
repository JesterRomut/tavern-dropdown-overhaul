/**
 * @fileoverview 酒馆宿主主题与排版同步工具 (Theme & Typography Synchronization)
 *
 * 同步逻辑会将宿主酒馆（SillyTavern）的消息气泡及 `:root` 样式提取并映射为一组语义化的 CSS 变量注入当前页面的 `:root`。
 *
 * ### 导出的 CSS 变量清单 (`--theme-*`)：
 *
 * #### 1. 排版与字体 (Typography)
 * - `--theme-font-family`      : 宿主正文渲染字体族（优先获取 `.mes_text`，回退至 `body`）
 * - `--theme-code-font-family` : 宿主代码块渲染字体族（优先获取 `.mes_text code` / `code`，回退至 `--font-mono` / `--monoFontFamily`）
 * - `--theme-font-size`        : 宿主正文字号（优先获取 `--mainFontSize`，回退至 `.mes_text` 计算值）
 * - `--theme-font-weight`      : 宿主正文字重（优先获取 `--mainFontWeight`，回退至 `.mes_text` 计算值）
 * - `--theme-line-height`      : 宿主正文行高比例（获取自 `.mes_text`）
 * - `--theme-letter-spacing`   : 宿主正文字间距（获取自 `.mes_text`）
 *
 * #### 2. 主题外观色 (SmartTheme Colors)
 * - `--theme-body-color`       : 宿主背景基色（`--SmartThemeBodyColor`）
 * - `--theme-quote-color`      : 引用块强调色（`--SmartThemeQuoteColor`）
 * - `--theme-blur-tint-color`  : 毛玻璃/遮罩着色（`--SmartThemeBlurTintColor`）
 * - `--theme-em-color`         : 斜体/高亮强调色（`--SmartThemeEmColor`）
 * - `--theme-chat-tint-color`  : 气泡底层色（`--SmartThemeChatTintColor`）
 *
 * #### 3. 向后兼容注入 (Legacy Variables)
 * - `--SmartThemeBodyColor`
 * - `--SmartThemeQuoteColor`
 * - `--SmartThemeBlurTintColor`
 * - `--SmartThemeEmColor`
 * - `--monoFontFamily`
 *
 * ### 插件化按需引入 (Tree-shaking Plugins)：
 * - `withColors()`     : 主题外观色同步（轻量，不引入字体扫描引擎）
 * - `withTypography()` : 正文排版与正文字体同步（自动联动引入字体扫描引擎）
 * - `withCodeFont()`   : 代码块字体同步（自动联动引入字体扫描引擎）
 *
 * 示例：
 * ```ts
 * // 仅使用颜色（零字体扫描开销，体积最小）
 * useParentTheme([withColors()]);
 *
 * // 使用正文与颜色
 * useParentTheme([withColors(), withTypography()]);
 *
 * // 包含代码块
 * useParentTheme([withColors(), withTypography(), withCodeFont()]);
 * ```
 *
 * 噢对了，参考了数据库通用美化（这个有不显示高亮颜色的问题）和朋友的卡的正则
 */

import { onMounted, onUnmounted } from 'vue';

const FONT_STYLE_ID = 'theme-synced-fonts';

/**
 * 安全获取父窗口对象
 */
function getParentWindow(): Window | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!window.parent || window.parent === window) return null;
    if (!window.parent.document) return null;
    return window.parent;
  } catch {
    return null;
  }
}

/**
 * 将 CSS 文本中的相对 url(...) 地址根据基准 URL 解析为绝对路径，
 * 避免在 iframe 中因相对路径改变而导致字体资源 404
 */
function resolveCssUrls(cssText: string, baseUrl: string): string {
  if (!baseUrl) return cssText;
  return cssText.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, _quote, rawUrl) => {
    const trimmed = rawUrl.trim();
    if (
      !trimmed ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('#')
    ) {
      return match;
    }
    try {
      const resolved = new URL(trimmed, baseUrl).href;
      return `url("${resolved}")`;
    } catch {
      return match;
    }
  });
}

/**
 * 判断 URL 是否可能是字体相关资源或字体样式表（如 @fontsource、Google Fonts、各大 CDN webfont 等）
 */
function isFontResourceUrl(url: string): boolean {
  if (!url) return false;
  // 排除图标库及宿主框架样式（图标库与框架应由各环境自洽提供，避免宿主残缺图标或全量 CSS 规则污染）
  if (/(?:fontawesome|font-awesome|icon|tailwind)/i.test(url)) {
    return false;
  }
  // 1. 常见字体 CDN 或托管平台
  if (/fonts\.(googleapis|gstatic|bunny)\.com|fontsapi|zeoseven|typekit/i.test(url)) {
    return true;
  }
  // 2. 字体文件类型后缀
  if (/\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(url)) {
    return true;
  }
  // 3. 常见字体包 / 字体族 / 排版关键词（匹配路径段、包名或文件名）
  const fontKeywords = [
    'font',
    'fonts',
    'fontsource',
    'webfont',
    'typeface',
    'glyph',
    'typography',
    'sans',
    'serif',
    'mono',
    'code',
    'wenkai',
    'lxgw',
    'noto',
    'harmony',
    'jetbrains',
    'pretendard',
    'misans',
    'inter',
    'roboto',
    'fira',
    'cascadia',
    'source-han',
  ];
  const keywordPattern = new RegExp(`(?:^|[/?#._@-])(?:${fontKeywords.join('|')})`, 'i');
  if (keywordPattern.test(url)) {
    return true;
  }
  // 4. 路径特征匹配 (如 /font.css, /fonts/ 等)
  if (/[/?#._@-]fonts?(\.css|[/?#._@-])/i.test(url)) {
    return true;
  }
  return false;
}

/**
 * 递归从 CSS 规则列表中提取所有 @font-face 规则及必要 @import 规则
 */
function extractFontRulesFromCssRules(
  rules: CSSRuleList,
  baseUrl: string,
  imports: Set<string>,
  fontFaces: Set<string>,
  visitedSheets: Set<CSSStyleSheet>,
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    const isFontFace = rule instanceof CSSFontFaceRule;
    // rule.constructor?.name === 'CSSFontFaceRule' ||
    // rule.cssText.trimStart().startsWith('@font-face');

    // 1. @font-face 规则
    if (isFontFace) {
      if (/font\s*awesome|fontawesome/i.test(rule.cssText)) {
        continue;
      }
      fontFaces.add(resolveCssUrls(rule.cssText, baseUrl));
      continue;
    }

    const isImport = rule instanceof CSSImportRule;
    // rule.cssText.trimStart().startsWith('@import');

    // 2. @import 规则
    if (isImport) {
      const importUrl =
        rule.href || rule.cssText.match(/@import\s+(?:url\(\s*(['"]?)([^'")]+)\1\s*\)|(['"])([^'"]+)\3)/i)?.[2] || '';

      if (importUrl && isFontResourceUrl(importUrl)) {
        // 只要是字体相关的 @import，直接保留该 @import 规则以保真引入
        imports.add(resolveCssUrls(rule.cssText, baseUrl));
      } else if (rule.styleSheet && !visitedSheets.has(rule.styleSheet)) {
        // 非明确命名字体或同源的 @import，尝试递归提取内部的 @font-face
        visitedSheets.add(rule.styleSheet);
        try {
          const nextBase = rule.styleSheet.href || importUrl || baseUrl;
          extractFontRulesFromCssRules(rule.styleSheet.cssRules, nextBase, imports, fontFaces, visitedSheets);
        } catch {
          // 跨域受限无法读取 cssRules 时，若疑似字体则保留 @import 兜底
          if (importUrl && isFontResourceUrl(importUrl)) {
            imports.add(resolveCssUrls(rule.cssText, baseUrl));
          }
        }
      }
      continue;
    }

    // 3. 嵌套分组规则 (如 @supports, @media, @layer)
    if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
      extractFontRulesFromCssRules((rule as CSSGroupingRule).cssRules, baseUrl, imports, fontFaces, visitedSheets);
    }
  }
}

/**
 * 动态同步父窗口的所有 @font-face 字体规则与字体 @import 到本页面 <head>
 *
 * 机制：
 * 1. 动态遍历宿主窗口中的全部样式表 (CSSStyleSheet 及 adoptedStyleSheets)，提取所有 @font-face 与 @import 规则；
 * 2. 自动扫描宿主 <style> 标签和 <link> 外链，捕获如 @fontsource、LobeHub webfont、Google Fonts 等字体引入；
 * 3. 自动将相对 URL 转为绝对路径，防止 iframe 路径差异导致字体文件 404；
 * 4. 尝试同步宿主 document.fonts 中的动态 FontFace 实例；
 * 5. CSS 规范保证：将所有 @import 严格置于样式表最顶端，其后追加 @font-face；
 * 6. DOM Diff 防抖无闪烁注入，仅在样式真正变更时更新 DOM。
 */
export function syncParentFontStyles(targetWindow?: Window | null): void {
  try {
    const pw = targetWindow || getParentWindow();
    if (!pw || !pw.document) return;

    const pDoc = pw.document;
    if (!pDoc.head) return;

    const imports = new Set<string>();
    const fontFaces = new Set<string>();
    const visitedSheets = new Set<CSSStyleSheet>();

    // 1. 收集宿主窗口中的所有可用样式表 (含常规样式表与 constructable stylesheets)
    const sheets: CSSStyleSheet[] = [];
    if (pDoc.styleSheets) {
      for (let i = 0; i < pDoc.styleSheets.length; i++) {
        const sheet = pDoc.styleSheets[i];
        if (sheet) sheets.push(sheet);
      }
    }
    if ((pDoc as any).adoptedStyleSheets) {
      const adopted = (pDoc as any).adoptedStyleSheets;
      for (let i = 0; i < adopted.length; i++) {
        const sheet = adopted[i];
        if (sheet) sheets.push(sheet);
      }
    }

    // 2. 动态扫描样式表中的 @font-face 与 @import
    for (const sheet of sheets) {
      if (visitedSheets.has(sheet)) continue;
      visitedSheets.add(sheet);

      const baseUrl =
        sheet.href || (sheet.ownerNode as HTMLElement | null)?.baseURI || pDoc.baseURI || pw.location.href;

      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          extractFontRulesFromCssRules(rules, baseUrl, imports, fontFaces, visitedSheets);
        }
      } catch {
        // 跨域 <link rel="stylesheet"> 访问 cssRules 会触发 SecurityError
        if (sheet.href && isFontResourceUrl(sheet.href)) {
          imports.add(`@import url("${sheet.href}");`);
        }
      }
    }

    // 3. 扫描宿主 <link rel="stylesheet"> 标签（处理跨域字体样式表，如 Google Fonts、CDN link 等）

    const linkNodes = pDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
    linkNodes.forEach(link => {
      const href = link.href;
      if (href && isFontResourceUrl(href)) {
        imports.add(`@import url("${href}");`);
      }
    });

    const styleNodes = pDoc.querySelectorAll('style');
    styleNodes.forEach(node => {
      const text = node.textContent;
      if (!text) return;

      const baseUrl = node.baseURI || pDoc.baseURI || pw.location.href;

      // 提取文本中的 @import url(...) 或 @import "..."
      if (text.includes('@import')) {
        const importRegex = /@import\s+(?:url\(\s*(['"]?)([^'")]+)\1\s*\)|(['"])([^'"]+)\3)([^;]*);/gi;
        let match: RegExpExecArray | null;
        while ((match = importRegex.exec(text)) !== null) {
          const rawUrl = (match[2] || match[4] || '').trim();
          if (rawUrl && isFontResourceUrl(rawUrl)) {
            const resolved = resolveCssUrls(`url("${rawUrl}")`, baseUrl);
            const extra = match[5] ? match[5].trim() : '';
            imports.add(`@import ${resolved}${extra ? ` ${extra}` : ''};`);
          }
        }
      }

      // 提取文本中的 @font-face（当该 style 节点尚未解析或 cssRules 不可用时的兜底）
      if (text.includes('@font-face')) {
        let hasLoadedRules: boolean;
        try {
          hasLoadedRules = Boolean(node.sheet && node.sheet.cssRules);
        } catch {
          hasLoadedRules = false;
        }

        if (!hasLoadedRules) {
          const matches = text.match(/@font-face\s*\{[\s\S]*?\}/gi);
          if (matches) {
            for (const block of matches) {
              if (/font\s*awesome|fontawesome/i.test(block)) continue;
              fontFaces.add(resolveCssUrls(block, baseUrl));
            }
          }
        }
      }
    });

    // 5. 尝试同步 FontFaceSet (针对由 JS new FontFace() 动态注册且未连入 CSSOM 的字体)

    if (pw.document.fonts && document.fonts) {
      pw.document.fonts.forEach(font => {
        if (/font\s*awesome|fontawesome/i.test(font.family)) return;
        try {
          if (!document.fonts.has(font)) {
            document.fonts.add(font);
          }
        } catch {
          // CSS-connected 字体调用 add() 会抛 InvalidModificationError，属于预期正常行为
        }
      });
    }

    // 6. 按照 CSS 规范，@import 必须严格置于所有 @font-face 之前
    const combinedCSS = [...Array.from(imports), ...Array.from(fontFaces)].join('\n\n').trim();

    let styleEl = document.getElementById(FONT_STYLE_ID) as HTMLStyleElement | null;
    if (!combinedCSS) {
      if (styleEl) styleEl.remove();
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = FONT_STYLE_ID;
      document.head.appendChild(styleEl);
    }

    // 仅在 CSS 发生变更时修改 DOM，避免重排抖动
    if (styleEl.textContent !== combinedCSS) {
      styleEl.textContent = combinedCSS;
    }
  } catch (err) {
    console.warn('[theme] 字体样式表动态同步失败:', err);
  }
}

let lastFontSyncTime = 0;
function syncParentFontStylesOnce(pw: Window): void {
  const now = Date.now();
  if (now - lastFontSyncTime < 60) return;
  lastFontSyncTime = now;
  syncParentFontStyles(pw);
}

export interface ThemeSyncContext {
  pw: Window;
  pDoc: Document;
  target: Element | null;
  pBody: HTMLElement | null;
  root: HTMLElement;
  getProp: (name: string) => string;
}

export type ThemePlugin = (ctx: ThemeSyncContext) => void;

/**
 * 主题外观色插件 (SmartTheme Colors)
 * 仅提取主题颜色变量，不引入字体扫描引擎
 */
export function withColors(): ThemePlugin {
  const colorMappings: Array<{ cssVar: string; themeKey: string }> = [
    { cssVar: '--SmartThemeBodyColor', themeKey: '--theme-body-color' },
    { cssVar: '--SmartThemeQuoteColor', themeKey: '--theme-quote-color' },
    { cssVar: '--SmartThemeBlurTintColor', themeKey: '--theme-blur-tint-color' },
    { cssVar: '--SmartThemeEmColor', themeKey: '--theme-em-color' },
    { cssVar: '--SmartThemeChatTintColor', themeKey: '--theme-chat-tint-color' },
  ];

  return ({ getProp, root }) => {
    for (const { cssVar, themeKey } of colorMappings) {
      const val = getProp(cssVar);
      if (val) {
        root.style.setProperty(themeKey, val);
        root.style.setProperty(cssVar, val);
      }
    }
  };
}

/**
 * 正文排版与字体插件 (Typography)
 * 提取正文字体族、字号、字重、行高与字距，并自动联动克隆宿主字体样式表
 */
export function withTypography(): ThemePlugin {
  return ({ pw, target, pBody, root, getProp }) => {
    const targetStyle = target ? pw.getComputedStyle(target) : null;
    const bodyStyle = pBody ? pw.getComputedStyle(pBody) : null;

    const fontFamily = targetStyle?.fontFamily || bodyStyle?.fontFamily || '';
    if (fontFamily) {
      root.style.setProperty('--theme-font-family', fontFamily);
      if (document.body) {
        document.body.style.fontFamily = fontFamily;
      }
    }

    const fontSize = getProp('--mainFontSize') || targetStyle?.fontSize || bodyStyle?.fontSize || '';
    if (fontSize) {
      root.style.setProperty('--theme-font-size', fontSize);
    }

    const fontWeight = getProp('--mainFontWeight') || targetStyle?.fontWeight || bodyStyle?.fontWeight || '';
    if (fontWeight) {
      root.style.setProperty('--theme-font-weight', fontWeight);
    }

    const lineHeight = targetStyle?.lineHeight || bodyStyle?.lineHeight || '';
    if (lineHeight && lineHeight !== 'normal') {
      root.style.setProperty('--theme-line-height', lineHeight);
    }

    const letterSpacing = targetStyle?.letterSpacing || bodyStyle?.letterSpacing || '';
    if (letterSpacing && letterSpacing !== 'normal') {
      root.style.setProperty('--theme-letter-spacing', letterSpacing);
    }

    syncParentFontStylesOnce(pw);
  };
}

/**
 * 代码块字体插件 (Code Typography)
 * 提取代码块字体族，并自动联动克隆宿主字体样式表
 */
export function withCodeFont(): ThemePlugin {
  return ({ pw, pDoc, target, pBody, root, getProp }) => {
    const codeTarget = pDoc.querySelector('.mes_text code, .mes_text pre') || pDoc.querySelector('code, pre');
    let codeFontFamily = codeTarget ? pw.getComputedStyle(codeTarget).fontFamily : '';
    if (!codeFontFamily && (target || pBody)) {
      const temp = pDoc.createElement('code');
      (target || pBody)?.appendChild(temp);
      codeFontFamily = pw.getComputedStyle(temp).fontFamily;
      temp.remove();
    }
    if (!codeFontFamily) {
      codeFontFamily = getProp('--font-mono') || getProp('--monoFontFamily');
    }
    if (codeFontFamily) {
      root.style.setProperty('--theme-code-font-family', codeFontFamily);
      root.style.setProperty('--monoFontFamily', codeFontFamily);
    }

    syncParentFontStylesOnce(pw);
  };
}

/**
 * 执行一次父窗口主题与排版同步
 */
export function syncParentTheme(plugins: ThemePlugin[], targetWindow?: Window | null): void {
  try {
    const pw = targetWindow || getParentWindow();
    if (!pw) return;

    const pDoc = pw.document;
    const pRoot = pDoc.documentElement;
    const pBody = pDoc.body;
    const target = pDoc.querySelector('.mes_text') || pDoc.querySelector('#chat') || pBody;
    const rootStyle = pw.getComputedStyle(pRoot);

    const getProp = (name: string): string => {
      const inline = pRoot.style.getPropertyValue(name);
      if (inline) return inline.trim();
      if (rootStyle) {
        const val = rootStyle.getPropertyValue(name);
        if (val) return val.trim();
      }
      return '';
    };

    const ctx: ThemeSyncContext = {
      pw,
      pDoc,
      target,
      pBody,
      root: document.documentElement,
      getProp,
    };

    for (const plugin of plugins) {
      plugin(ctx);
    }
  } catch (err) {
    console.warn('[theme] 主题注入失败:', err);
  }
}

/**
 * 监听父窗口的主题与排版样式变更，返回注销监听的清理函数
 */
export function watchParentTheme(plugins: ThemePlugin[], options?: { debounceMs?: number }): () => void {
  const pw = getParentWindow();
  if (!pw) {
    syncParentTheme(plugins);
    return () => {};
  }

  const debounceMs = options?.debounceMs ?? 120;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debouncedSync = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      syncParentTheme(plugins, pw);
    }, debounceMs);
  };

  // 初始立即同步一次
  syncParentTheme(plugins, pw);

  try {
    const observer = new MutationObserver(() => {
      debouncedSync();
    });

    const pDoc = pw.document;
    if (pDoc.documentElement) {
      observer.observe(pDoc.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    if (pDoc.body) {
      observer.observe(pDoc.body, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    if (pDoc.head) {
      observer.observe(pDoc.head, { childList: true, subtree: true });
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      observer.disconnect();
    };
  } catch (err) {
    console.warn('[theme] 无法挂载样式观察器:', err);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }
}

/**
 * 注入并同步宿主酒馆主题与排版（按需插件化）
 *
 * @param plugins 需要激活的插件列表（如 withColors(), withTypography(), withCodeFont()）
 * @param options 配置项（如防抖延时）
 */
export function useParentTheme(plugins: ThemePlugin[] = [], options?: { debounceMs?: number }): void {
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    cleanup = watchParentTheme(plugins, options);
  });

  onUnmounted(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });
}
