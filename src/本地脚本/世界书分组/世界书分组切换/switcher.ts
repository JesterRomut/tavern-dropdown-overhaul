import { teleportStyle } from '@util/script';
import comp from './comp.vue';
import { type SwitchGroup, type SwitcherConfig } from './type.js';

const scriptId = getScriptId();

function injectUI(groups: SwitchGroup[], worldbookName: string) {
  if ($(`#${scriptId}`).length) return;

  const app = createApp(comp, { groups, worldbookName }).use(createPinia());
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

  injectUI(conf.groups, worldbookName);
}
