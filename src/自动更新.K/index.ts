import { CDNManager } from '@util/cdn';
import { teleportStyle } from '@util/script';
import { compare, validate } from 'compare-versions';
import toastr from 'toastr';
import UpdateModal from './updateModal.vue';

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
const UPDATE_BUTTON_NAME = (remoteVersion?: string) => (remoteVersion ? `更新角色卡：${remoteVersion}` : '更新角色卡');

let updateContext: {
  conf: ValidConfig;
  charName: string;
  localVersion: string;
  remoteVersion: string;
  changelogText: string;
} | null = null;

let currentButtonName: string | null = null;
let currentButtonStop: (() => void) | null = null;
let isUpdating = false;

/**
 * 清除更新按钮、状态与事件监听
 */
function clearUpdateButton() {
  currentButtonStop?.();
  currentButtonStop = null;
  currentButtonName = null;
  replaceScriptButtons([]);
  updateContext = null;
}

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
 * 生成用于备份文件的时间戳后缀（格式：YYYYMMDD_HHmmss）
 */
function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * 获取当前角色绑定的主世界书名称（不包含附加世界书）
 */
async function getCharacterWorldbookName(charName: string): Promise<string | null> {
  // 1. 尝试从 getCharWorldbookNames 获取 primary（主世界书）
  try {
    const charWb = getCharWorldbookNames(charName);
    if (charWb?.primary) {
      return charWb.primary;
    }
  } catch (e) {
    console.warn('[自动更新] getCharWorldbookNames 获取角色主世界书失败:', e);
  }

  // 2. 尝试从角色卡元数据获取 worldbook
  try {
    const char = await getCharacter(charName);
    if (char?.worldbook) {
      return char.worldbook;
    }
  } catch (e) {
    console.warn('[自动更新] getCharacter 获取角色主世界书失败:', e);
  }

  // 3. 尝试从 RawCharacter 获取 embedded character_book 名称
  try {
    const rawChar = RawCharacter.find({ name: charName });
    const bookName = rawChar?.data.character_book.name;
    if (bookName) {
      return bookName;
    }
  } catch (e) {
    console.warn('[自动更新] RawCharacter 获取角色书失败:', e);
  }
  return null;
}

/**
 * 备份指定世界书为副本
 */
async function backupWorldbook(wbName: string): Promise<string | null> {
  const timestamp = formatTimestamp();
  const backupName = `${wbName}_(备份-${timestamp})`;
  try {
    const entries = await getWorldbook(wbName);
    if (entries) {
      await createOrReplaceWorldbook(backupName, entries);
      return backupName;
    }
  } catch (e) {
    console.error(`[自动更新] 备份世界书 ${wbName} 失败:`, e);
  }

  // 备选方案使用酒馆原生 loadWorldInfo / saveWorldInfo（完整保留条目、深度、扫描等所有原始设置）
  try {
    const data = await SillyTavern.loadWorldInfo(wbName);
    if (data && typeof data === 'object') {
      const backupData = JSON.parse(JSON.stringify(data));
      backupData.name = backupName;
      await SillyTavern.saveWorldInfo(backupName, backupData, true);
      if (typeof SillyTavern?.updateWorldInfoList === 'function') {
        await SillyTavern.updateWorldInfoList();
      }
      return backupName;
    }
  } catch (e) {
    console.warn(`[自动更新] loadWorldInfo 备份 ${wbName} 失败`, e);
  }

  return null;
}

/**
 * 执行角色卡更新下载与替换
 */
async function performUpdate(conf: ValidConfig, charName: string, remoteVersion: string) {
  if (isUpdating) {
    toastr.warning('角色卡更新正在进行中！');
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

    const blob = await res.blob();

    const importRes = await importRawCharacter(charName, blob);
    if (importRes && !importRes.ok) {
      throw new Error(`角色卡导入失败 (HTTP ${importRes.status})`);
    }

    await replaceCharacter(charName, { version: remoteVersion });

    toastr.success(`角色卡已成功更新至 ${remoteVersion}！`, '更新成功');
    clearUpdateButton();
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
  const app = createApp(UpdateModal, { localVersion, remoteVersion, changelogText }).use(createPinia());
  const $app = $('<div>').attr('style', `width:100%;height:100%`);
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
  const result = await SillyTavern.callGenericPopup($app, SillyTavern.POPUP_TYPE.CONFIRM, '', {
    okButton: '更新',
    cancelButton: '取消',
    wider: true,
    large: true,
    allowVerticalScrolling: true,
    leftAlign: true,
  });

  if (result === SillyTavern.POPUP_RESULT.AFFIRMATIVE || result === 1 || result === true) {
    const wbName = await getCharacterWorldbookName(charName);
    if (!wbName) {
      await performUpdate(conf, charName, remoteVersion);
      return;
    }
    const confirmResult = await SillyTavern.callGenericPopup(
      '更新角色卡会覆盖当前世界书，要备份吗？',
      SillyTavern.POPUP_TYPE.CONFIRM,
      '',
      {
        okButton: '备份&更新',
        cancelButton: '取消',
        customButtons: [
          {
            text: '直接更新',
            result: SillyTavern.POPUP_RESULT.CUSTOM1,
          },
        ],
      },
    );

    const isBackupAndUpdate =
      confirmResult === SillyTavern.POPUP_RESULT.AFFIRMATIVE || confirmResult === 1 || confirmResult === true;

    const isDirectUpdate = confirmResult === SillyTavern.POPUP_RESULT.CUSTOM1 || confirmResult === 2;

    if (isBackupAndUpdate) {
      toastr.info(`正在备份世界书：${wbName}...`, '开始备份');
      const backupName = await backupWorldbook(wbName);
      if (!backupName) {
        toastr.error('备份世界书失败，已中止更新以保护数据！', '更新中止');
        return;
      }
      toastr.success(`世界书已备份为：${backupName}`, '备份成功');

      await performUpdate(conf, charName, remoteVersion);
    } else if (isDirectUpdate) {
      await performUpdate(conf, charName, remoteVersion);
    }
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
      clearUpdateButton();
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

      const buttonName = UPDATE_BUTTON_NAME(remoteVersion);
      if (currentButtonName !== buttonName) {
        currentButtonStop?.();
        currentButtonName = buttonName;
        const { stop } = eventOn(getButtonEvent(buttonName), async () => {
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
        currentButtonStop = stop;
      }

      replaceScriptButtons([{ name: buttonName, visible: true }]);
    } else {
      console.info(`[自动更新] 角色卡已是最新版本 (v${localVersion})`);
      clearUpdateButton();
    }
  } catch (err) {
    console.error('[自动更新] 检查更新出错:', err);
  }
}

$(async () => {
  const { success, data: conf } = Config.safeParse(getVariables({ type: 'script' }));

  if (!success || !isValidConfig(conf)) {
    toastr.error('无效的更新角色卡源！');
    return;
  }

  // 角色卡页面重新载入时再次检查
  eventOn(tavern_events.CHARACTER_PAGE_LOADED, () => {
    checkUpdate(conf);
  });

  await checkUpdate(conf);
});
