type Config = z.infer<typeof Config>;
const Config = z
  .object({
    repo: z.optional(z.string()),
    pathChr: z.optional(z.string()),
    pathUpd: z.optional(z.string()),
  })
  .prefault({});

async function checkUpdate() {}

$(async () => {
  const { success, data: conf } = Config.safeParse(getVariables({ type: 'script' }));

  if (!success || _.some(_.values(conf), v => !v)) {
    toastr.error('无效的更新角色卡！');
    return;
  }
});
