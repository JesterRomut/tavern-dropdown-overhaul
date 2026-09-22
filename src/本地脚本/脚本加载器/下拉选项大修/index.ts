// import { fetchLatestRepoTag, getGitHubCdnUrl } from '@util/cdn';
// import toastr from 'toastr';

import { loadScript } from '../loader';

// type Config = z.infer<typeof Config>;
// const Config = z.union([
//   z.object({
//     _metadata: z.object({
//       repo: z.string({ error: '未配置目标仓库 repo' }).min(1, 'repo 不能为空'),
//       path: z.string({ error: '未配置目标脚本路径 path' }).min(1, 'path 不能为空'),
//     }),
//   }),
//   z.object({
//     repo: z.string({ error: '未配置目标仓库 repo' }).min(1, 'repo 不能为空'),
//     path: z.string({ error: '未配置目标脚本路径 path' }).min(1, 'path 不能为空'),
//   }),
// ]);

$(async () => {
  await loadScript(
    'JesterRomut/tavern-dropdown-overhaul',
    'dist/下拉选项大修/index.js',
    'src/下拉选项大修/VERSION.md',
    '下拉选项大修@Kernschmelze',
  );
});
