# 酒馆助手前端界面或脚本编写

@.cursor/rules/项目基本概念.mdc
@.cursor/rules/酒馆变量.mdc
@.cursor/rules/酒馆助手接口.mdc
@.cursor/rules/脚本.mdc

以上酒馆相关**必看**，不看找人弄你
然后zod用v4规范，deprecated的东西不要用

@.cursor/rules/前端界面.mdc

写前端界面（如果有index.html就是前端界面，没有就不是）必看，不看找人弄你
注意.vue文件不一定是前端界面，也可能是内嵌在脚本中用的

@.cursor/rules/mcp.mdc

debug必看，里面写了如何用Chrome DevTools MCP来实操浏览器

---
其它规则:

  1. 讲中文
  2. 不准加emoji，加了我找人弄你
  3. 不需要手动用prettier或pnpm build，我通常开着dev服务器会自动build，有报错我会通知你
  4. 我们的代码都是要打包的，在能用的同时写的越小越好，不准写检测某个酒馆助手函数存不存在还要酒馆原生兜底的这种冗余玩意，我们的代码都是100%在酒馆助手环境里跑的
  5. 不要擅自写更新日志，只提示我写
