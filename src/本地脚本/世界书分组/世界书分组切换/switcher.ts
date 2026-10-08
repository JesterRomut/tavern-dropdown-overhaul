import { teleportStyle } from '@util/script';
import comp from './comp.vue';
import { type SwitchGroup, type SwitcherConfig, type WorldbookSwitcherAPI, ScriptVariables } from './type';

const scriptId = getScriptId();

function isMatch(name: string, matcher: SwitchGroup['match']): boolean {
  if (typeof matcher === 'function') return matcher(name);
  if (matcher.global) matcher.lastIndex = 0;
  return matcher.test(name);
}

async function isGroupEnabled(group: SwitchGroup, worldbookName: string): Promise<boolean> {
  const worldbook = await getWorldbook(worldbookName);
  const matchedEntries = worldbook.filter(entry => isMatch(entry.name, group.match));
  return matchedEntries.some(entry => entry.enabled);
}

async function toggleGroup(group: SwitchGroup, worldbookName: string, target?: boolean): Promise<void> {
  await updateWorldbookWith(
    worldbookName,
    entries => {
      const matched = entries.filter(entry => isMatch(entry.name, group.match));
      const current = matched.some(entry => entry.enabled);
      const next = target !== undefined ? target : !current;

      if (!next) {
        if (matched.some(e => e.enabled)) {
          const previouslyDisabled = matched.filter(e => !e.enabled).map(e => e.name);
          updateVariablesWith(
            rawVars => {
              const vars = ScriptVariables.parse(rawVars || {});
              vars.previouslyDisabled[group.id] = previouslyDisabled;
              return vars;
            },
            { type: 'script' },
          );
        }
      }

      const vars = !next ? null : ScriptVariables.parse(getVariables({ type: 'script' }) || {});
      const disabledSet = new Set(vars?.previouslyDisabled[group.id] || []);
      const shouldApplyFilter = next && disabledSet.size > 0;

      for (const entry of entries) {
        if (isMatch(entry.name, group.match)) {
          entry.enabled = next ? !shouldApplyFilter || !disabledSet.has(entry.name) : false;
        }
      }
      return entries;
    },
    { render: 'immediate' },
  );
}

async function exportGroup(group: SwitchGroup, worldbookName: string) {
  if (!group.export) return;

  const targetName = group.export.name;
  const message = `将导出为「${targetName}」，如有同名世界书会覆盖，是否确定导出？`;

  const result = await SillyTavern.callGenericPopup(message, SillyTavern.POPUP_TYPE.CONFIRM, '', {
    okButton: '确定',
    cancelButton: '取消',
  });

  if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE && result !== 1 && result !== true) {
    return;
  }

  const worldbook = await getWorldbook(worldbookName);
  const matchedEntries = worldbook.filter(entry => isMatch(entry.name, group.match));

  if (matchedEntries.length === 0) {
    toastr.warning(`未找到匹配的条目`);
    return;
  }

  await createOrReplaceWorldbook(targetName, klona(matchedEntries), { render: 'immediate' });
  toastr.success(`已成功导出世界书「${targetName}」`);
}

function injectUI(api: WorldbookSwitcherAPI) {
  if ($(`#${scriptId}`).length) return;

  const app = createApp(comp, { api }).use(createPinia());
  const $app = $('<div>').attr('id', scriptId).attr('class', 'wide100p');

  function mount(): boolean {
    if ($app.parent().length && document.body.contains($app[0])) return true;

    const $multiSelector = $('#WIMultiSelector');
    if ($multiSelector.length) {
      $app.appendTo($multiSelector);
      return true;
    }

    const $worldpopup = $('#world_popup');
    if ($worldpopup.length) {
      $app.prependTo($worldpopup);
      return true;
    }
    return false;
  }

  function tryMount() {
    if (mount()) return;
    setTimeout(mount, 50);
    setTimeout(mount, 200);
  }

  tryMount();
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  let observer: MutationObserver | null = null;
  const drawerIcon = $('#WIDrawerIcon')[0];
  if (drawerIcon) {
    observer = new MutationObserver(() => {
      if (drawerIcon.classList.contains('openIcon')) {
        tryMount();
      }
    });
    observer.observe(drawerIcon, { attributes: true, attributeFilter: ['class'] });
  }

  const clickHandler = () => {
    tryMount();
  };
  $(document).on('click', '#WIDrawerIcon, #world_button, .chat_lorebook_button', clickHandler);

  $(window).on('pagehide', () => {
    observer?.disconnect();
    $(document).off('click', '#WIDrawerIcon, #world_button, .chat_lorebook_button', clickHandler);
    app.unmount();
    $app.remove();
    destroy();
  });
}

export async function init(conf: SwitcherConfig) {
  let char: Character;
  try {
    const id = getCurrentCharacterId();
    if (!id) throw new Error();
    char = await getCharacter(id);
  } catch {
    const name = getCurrentCharacterName();
    if (!name) return;
    char = await getCharacter(name);
  }

  const { worldbook: worldbookName } = char;
  if (!worldbookName) return;

  const groupMap = new Map(conf.groups.map(g => [g.id, g]));

  const api: WorldbookSwitcherAPI = {
    groups: conf.groups,
    worldbookName,
    getGroup: (id: string) => groupMap.get(id),
    isGroupEnabled: async (groupId: string) => {
      const group = groupMap.get(groupId);
      if (!group) return false;
      return isGroupEnabled(group, worldbookName);
    },
    toggleGroup: async (groupId: string, target?: boolean) => {
      const group = groupMap.get(groupId);
      if (!group) return;
      return toggleGroup(group, worldbookName, target);
    },
    exportGroup: async (groupId: string) => {
      const group = groupMap.get(groupId);
      if (!group) return;
      return exportGroup(group, worldbookName);
    },
  };

  initializeGlobal('WorldbookSwitcher', api);

  injectUI(api);
}
