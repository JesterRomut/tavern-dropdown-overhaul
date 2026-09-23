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
 * 此外，本模块会自动动态扫描并克隆宿主父窗口中的 `@font-face` 与字体 `@import` 规则到本页面 `<head>`，
 * 并将 `document.body.style.fontFamily` 同步设为 `--theme-font-family`。
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
              fontFaces.add(resolveCssUrls(block, baseUrl));
            }
          }
        }
      }
    });

    // 5. 尝试同步 FontFaceSet (针对由 JS new FontFace() 动态注册且未连入 CSSOM 的字体)

    if (pw.document.fonts && document.fonts) {
      pw.document.fonts.forEach(font => {
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

/**
 * 执行一次全量父窗口主题与排版样式同步
 */
export function syncParentTheme(): void {
  try {
    const pw = getParentWindow();
    if (!pw) return;

    const pDoc = pw.document;
    const pRoot = pDoc.documentElement;
    const pBody = pDoc.body;
    // 优先取消息气泡元素作为基准，回退到 #chat 或 body
    const target = pDoc.querySelector('.mes_text') || pDoc.querySelector('#chat') || pBody;

    let rootStyle: CSSStyleDeclaration | null = null;
    let targetStyle: CSSStyleDeclaration | null = null;
    let bodyStyle: CSSStyleDeclaration | null = null;

    rootStyle = pw.getComputedStyle(pRoot);
    targetStyle = target ? pw.getComputedStyle(target) : null;
    bodyStyle = pBody ? pw.getComputedStyle(pBody) : null;

    const getProp = (name: string): string => {
      const inline = pRoot.style.getPropertyValue(name);
      if (inline) return inline.trim();
      if (rootStyle) {
        const val = rootStyle.getPropertyValue(name);
        if (val) return val.trim();
      }
      return '';
    };

    const root = document.documentElement;

    // --- 1. 排版与字体属性 ---
    const fontFamily = targetStyle?.fontFamily || bodyStyle?.fontFamily || '';
    if (fontFamily) {
      root.style.setProperty('--theme-font-family', fontFamily);
      if (document.body) {
        document.body.style.fontFamily = fontFamily;
      }
    }

    const codeTarget = pDoc.querySelector('.mes_text code, .mes_text pre') || pDoc.querySelector('code, pre');
    let codeFontFamily = codeTarget ? pw.getComputedStyle(codeTarget).fontFamily : '';
    if (!codeFontFamily && (target || pBody)) {
      const temp = pDoc.createElement('code');
      (target || pBody).appendChild(temp);
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

    const colorMappings: Array<{ cssVar: string; themeKey: string }> = [
      { cssVar: '--SmartThemeBodyColor', themeKey: '--theme-body-color' },
      { cssVar: '--SmartThemeQuoteColor', themeKey: '--theme-quote-color' },
      { cssVar: '--SmartThemeBlurTintColor', themeKey: '--theme-blur-tint-color' },
      { cssVar: '--SmartThemeEmColor', themeKey: '--theme-em-color' },
      { cssVar: '--SmartThemeChatTintColor', themeKey: '--theme-chat-tint-color' },
    ];

    for (const { cssVar, themeKey } of colorMappings) {
      const val = getProp(cssVar);
      if (val) {
        root.style.setProperty(themeKey, val);
        root.style.setProperty(cssVar, val); // 保持向后兼容
      }
    }

    // --- 3. 自定义字体样式表同步 ---
    syncParentFontStyles(pw);
  } catch (err) {
    console.warn('[theme] 主题注入失败:', err);
  }
}

/**
 * 监听父窗口的主题与排版样式变更，返回注销监听的清理函数
 */
export function watchParentTheme(options?: { debounceMs?: number }): () => void {
  const pw = getParentWindow();
  if (!pw) {
    syncParentTheme();
    return () => {};
  }

  const debounceMs = options?.debounceMs ?? 120;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debouncedSync = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      syncParentTheme();
    }, debounceMs);
  };

  // 初始立即同步一次
  syncParentTheme();

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
 * 注入并同步宿主酒馆主题与排版（向后兼容接口）
 *
 * 会在当前文档 `:root` 注入以下 CSS 变量：
 * - 排版：`--theme-font-family`, `--theme-code-font-family`, `--theme-font-size`, `--theme-font-weight`, `--theme-line-height`, `--theme-letter-spacing`
 * - 颜色：`--theme-text-color`, `--theme-text-dim`, `--theme-text-muted`, `--theme-border-color`
 * - 外观：`--theme-body-color`, `--theme-quote-color`, `--theme-blur-tint-color`, `--theme-em-color`, `--theme-chat-tint-color`
 * - 兼容变量：`--SmartThemeBodyColor`, `--SmartThemeQuoteColor`, `--SmartThemeBlurTintColor`, `--SmartThemeEmColor`, `--monoFontFamily`
 */
export function useParentTheme(options?: { debounceMs?: number }): void {
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    cleanup = watchParentTheme(options);
  });

  onUnmounted(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });
}
