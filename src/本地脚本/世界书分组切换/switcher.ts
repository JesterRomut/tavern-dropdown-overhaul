import { teleportStyle } from '@util/script';
import comp from './comp.vue';
import { type SwitchGroup, type SwitcherConfig } from './type';

const scriptId = getScriptId();

function injectUI(groups: SwitchGroup[], worldbookName: string) {
  if ($(`#${scriptId}`).length) return;

  const app = createApp(comp, { groups, worldbookName }).use(createPinia());
  const $app = $('<div>').attr('id', scriptId).attr('class', 'world_entry');

  $app.prependTo('#world_popup_entries_list');
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
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
