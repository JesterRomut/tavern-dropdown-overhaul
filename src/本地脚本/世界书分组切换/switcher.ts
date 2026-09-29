import { teleportStyle } from '@util/script';
import comp from './comp.vue';
import { type SwitchGroup } from './type';

type Config = object;

function injectUI(groups: SwitchGroup[]) {
  const app = createApp(comp, { groups }).use(createPinia());
  const $app = $('<div>').attr('class', 'world_entry');

  $app.prependTo('#world_popup_entries_list');
  // $app.insertBefore('#WIEntryHeaderTitlesPC');
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
}

export async function init(conf: Config) {
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
  const worldbook = await getWorldbook(worldbookName);
  // for (const entry of worldbook) {
  //   console.log(entry);
  // }
  injectUI([{ label: '测试', match: /数码世界 -/gm }]);
}
