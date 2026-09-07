import { CDNManager } from '@util/cdn';
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

const cdn = new CDNManager(); // 要fetch的时候就用这个fetchGitHub或者fetch

async function checkUpdate() {
  // 首先获取pathChangelog，格式就是像同路径里UPDATE.md那样，（大概是用正则什么的）获取最上面那个版本号
  // 然后用await getCharacter(data.name) 获取自己角色卡的版本号，用'compare-versions'这里的函数比较
  // 如果版本号比远程版本号小，用replaceScriptButtons添加一个按钮，按钮弹出一个modal（大概是用SillyTavern.callGenericPopup）里面显示changelog 然后modal里一个更新按钮一个取消按钮
  // 更新角色卡就用replaceCharacter，cdn.fetchGitHub获取pathChr那里
}

$(async () => {
  const { success, data: conf } = Config.safeParse(getVariables({ type: 'script' }));

  if (!success || _.some(_.values(conf), v => !v)) {
    toastr.error('无效的更新角色卡！');
    return;
  }
});
