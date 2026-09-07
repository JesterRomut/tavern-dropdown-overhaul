import { CDNManager } from '@util/cdn';
import { compare, validate } from 'compare-versions';
import _ from 'lodash';
import toastr from 'toastr';

type Config = z.infer<typeof Config>;
const Config = z
  .object({
    repo: z.optional(z.string()),
    pathChr: z.optional(z.string()),
    pathChangelog: z.optional(z.string()),
  })
  .prefault({});

interface ValidConfig {
  repo: string;
  pathChr: string;
  pathChangelog: string;
}

function isValidConfig(conf: Config): conf is ValidConfig {
  return Boolean(conf.repo && conf.pathChr && conf.pathChangelog);
}

const cdn = new CDNManager();
const UPDATE_BUTTON_NAME = '更新角色卡';

let updateContext: {
  conf: ValidConfig;
  charName: string;
  localVersion: string;
  remoteVersion: string;
  changelogText: string;
} | null = null;

let isUpdating = false;

/**
 * 提取并清理版本号字符串（移除开头的 v/V 前缀）
 */
function cleanVersion(v: string): string {
  return v.trim().replace(/^[vV]/, '');
}

/**
 * 判断远程版本号是否大于本地版本号
 */
function hasNewVersion(local: string, remote: string): boolean {
  const cLocal = cleanVersion(local);
  const cRemote = cleanVersion(remote);

  try {
    if (validate(cLocal) && validate(cRemote)) {
      return compare(cLocal, cRemote, '<');
    }
  } catch (err) {
    console.warn('[自动更新] compare-versions 对比失败:', err);
  }

  // // 备用简易版本比较（按点分数值依次对比）
  // const parseParts = (s: string) => s.split('.').map(p => parseInt(p, 10) || 0);
  // const pLocal = parseParts(cLocal);
  // const pRemote = parseParts(cRemote);
  // for (let i = 0; i < Math.max(pLocal.length, pRemote.length); i++) {
  //   const n1 = pLocal[i] ?? 0;
  //   const n2 = pRemote[i] ?? 0;
  //   if (n1 < n2) return true;
  //   if (n1 > n2) return false;
  // }
  return false;
}

/**
 * 从更新日志 Markdown 中提取最上方的最新版本号
 * 支持格式如：## 0.0.2, ## v1.0.0, ## [0.0.2], ### 0.0.1 等
 */
function extractLatestVersion(markdown: string): string | null {
  const match = markdown.match(/^#{1,4}\s*\[?v?([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?)/m);
  return match?.[1]?.trim() ?? null;
}

/**
 * 将 Markdown 格式文本转为 HTML，优先使用酒馆自带的 showdown
//  */
// function renderMarkdown(content: string): string {
//   try {
//       const converter = new globalShowdown.Converter({
//         simplifiedAutoLink: true,
//         tables: true,
//         strikethrough: true,
//         tasklists: true,
//         ghCodeBlocks: true,
//         simpleLineBreaks: true,
//       });
//       return converter.makeHtml(content);

//   } catch (err) {
//     console.warn('[自动更新] Markdown 解析失败:', err);
//   }

//   // 降级使用基础转义
//   return `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${_.escape(content)}</pre>`;
// }

/**
 * 执行角色卡更新下载与替换
 */
async function performUpdate(conf: ValidConfig, charName: string, remoteVersion: string) {
  if (isUpdating) {
    toastr.warning('角色卡更新正在进行中，请稍候...');
    return;
  }

  isUpdating = true;
  toastr.info('正在下载新版本角色卡数据...', '开始更新', { timeOut: 5000 });

  try {
    const res = await cdn.fetchGitHub(conf.repo, conf.pathChr.replace(/^\/+/, ''));
    if (!res.ok) {
      toastr.error(`下载角色卡文件失败 (HTTP ${res.status})`, '更新失败');
      return;
    }

    const contentType = res.headers.get('content-type') || '';
    const isPng = conf.pathChr.toLowerCase().endsWith('.png') || contentType.includes('image/png');

    if (isPng) {
      const blob = await res.blob();
      // 酒馆助手对于角色卡原生文件（PNG）的导入/更新接口为 importRawCharacter
      if (typeof importRawCharacter === 'function') {
        const importRes = await importRawCharacter(charName, blob);
        if (importRes && !importRes.ok) {
          throw new Error(`角色卡导入失败 (HTTP ${importRes.status})`);
        }
      }
    } else {
      const cardData = await res.json();
      await replaceCharacter(charName, cardData);
    }

    toastr.success(`角色卡已成功更新至 ${remoteVersion}！`, '更新成功');
    replaceScriptButtons([]);
    updateContext = null;

    // 尝试通知酒馆刷新角色列表
    try {
      if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getCharacters === 'function') {
        await SillyTavern.getCharacters();
      }
    } catch (e) {
      console.warn('[自动更新] 刷新角色列表失败:', e);
    }
  } catch (err) {
    console.error('[自动更新] 更新角色卡出错:', err);
    toastr.error(`更新角色卡失败: ${err instanceof Error ? err.message : String(err)}`, '更新失败');
  } finally {
    isUpdating = false;
  }
}

/**
 * 弹出显示更新日志的 Modal，提供更新与取消按钮
 */
async function showUpdateModal(
  conf: ValidConfig,
  charName: string,
  localVersion: string,
  remoteVersion: string,
  changelogText: string,
) {
  const renderedHtml = builtin.renderMarkdown(changelogText);
  const modalContent = `
    <div class="update-modal" style="font-family: inherit; line-height: 1.6; max-height: 60vh; overflow-y: auto; text-align: left; padding: 6px 10px;">
      <div style="font-size: 1.15em; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
        <span>角色卡更新提示</span>
      </div>
      <div style="background: rgba(255, 255, 255, 0.06); padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>当前版本：<code style="padding: 2px 6px; border-radius: 4px; background: rgba(0, 0, 0, 0.25);">v${_.escape(localVersion)}</code></div>
        <div style="color: #4ade80; font-weight: bold;">➔ 最新版本：<code style="padding: 2px 6px; border-radius: 4px; background: rgba(74, 222, 128, 0.15); color: #4ade80;">v${_.escape(remoteVersion)}</code></div>
      </div>
      <div style="font-weight: bold; margin-bottom: 8px;">更新日志：</div>
      <div style="background: rgba(0, 0, 0, 0.15); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px; font-size: 0.95em;">
        ${renderedHtml}
      </div>
    </div>
  `;

  const result = await SillyTavern.callGenericPopup(modalContent, SillyTavern.POPUP_TYPE.CONFIRM, '', {
    okButton: '更新',
    cancelButton: '取消',
    wider: true,
    large: true,
    allowVerticalScrolling: true,
    leftAlign: true,
  });

  if (result === SillyTavern.POPUP_RESULT.AFFIRMATIVE || result === 1 || result === true) {
    await performUpdate(conf, charName, remoteVersion);
  }
}

/**
 * 检查角色卡更新
 */
async function checkUpdate(conf: ValidConfig) {
  try {
    const changelogRes = await cdn.fetchGitHub(conf.repo, conf.pathChangelog.replace(/^\/+/, ''));
    if (!changelogRes.ok) {
      console.warn(`[自动更新] 获取更新日志失败: HTTP ${changelogRes.status}`);
      return;
    }

    const changelogText = await changelogRes.text();
    const remoteVersion = extractLatestVersion(changelogText);
    if (!remoteVersion) {
      console.warn('[自动更新] 未能从更新日志中解析出版本号');
      return;
    }

    const charName = getCurrentCharacterName();
    if (!charName) {
      console.warn('[自动更新] 当前未选择角色卡，跳过更新检查');
      return;
    }

    const character = await getCharacter(charName);
    const localVersion = character.version || (character as any).character_version || '0.0.0';

    if (hasNewVersion(localVersion, remoteVersion)) {
      console.info(`[自动更新] 发现新版本: v${remoteVersion} (当前: v${localVersion})`);
      updateContext = {
        conf,
        charName,
        localVersion,
        remoteVersion,
        changelogText,
      };

      replaceScriptButtons([{ name: UPDATE_BUTTON_NAME, visible: true }]);
      toastr.info(
        `检测到角色卡新版本 v${remoteVersion} (当前: v${localVersion})，可在脚本设置中点击【${UPDATE_BUTTON_NAME}】查看`,
        '发现新版本',
        { timeOut: 6000 },
      );
    } else {
      console.info(`[自动更新] 角色卡已是最新版本 (v${localVersion})`);
      replaceScriptButtons([]);
      updateContext = null;
    }
  } catch (err) {
    console.error('[自动更新] 检查更新出错:', err);
  }
}

$(async () => {
  const { success, data: conf } = Config.safeParse(getVariables({ type: 'script' }));

  if (!success || !isValidConfig(conf)) {
    toastr.error('无效的更新角色卡！');
    return;
  }

  // 注册更新按钮点击事件
  eventOn(getButtonEvent(UPDATE_BUTTON_NAME), async () => {
    if (!updateContext) {
      await checkUpdate(conf);
    }
    if (updateContext) {
      await showUpdateModal(
        updateContext.conf,
        updateContext.charName,
        updateContext.localVersion,
        updateContext.remoteVersion,
        updateContext.changelogText,
      );
    }
  });

  // 角色卡页面重新载入时再次检查
  eventOn(tavern_events.CHARACTER_PAGE_LOADED, () => {
    checkUpdate(conf);
  });

  await checkUpdate(conf);
});
