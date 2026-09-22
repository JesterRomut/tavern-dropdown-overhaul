# 酒馆助手前端界面或脚本编写

@.cursor/rules/项目基本概念.mdc
@.cursor/rules/酒馆变量.mdc
@.cursor/rules/酒馆助手接口.mdc
@.cursor/rules/脚本.mdc

以上写代码必看，不看找人弄你
然后zod用v4规范，deprecated的东西不要用

@.cursor/rules/前端界面.mdc

写前端界面（如果有index.html就是前端界面，没有就不是）必看
注意.vue文件不一定是前端界面，也可能是内嵌在脚本中用的

@.cursor/rules/mcp.mdc

debug必看，里面写了如何用Chrome DevTools MCP来实操浏览器
建议用Edge（launch.json里配置了mcp端口）

---

还有，给我讲中文

然后如果你弄好了：通常先讨论方案，不要直接写
如果不经同意直接写了我直接找人弄你

还有不准加emoji，加了我找人弄你

通常不需要手动用prettier，我的VSCode会自动格式化

最后我们的代码都是要打包的，在能用的同时写的越小越好，不准写那种检测某个酒馆助手函数是不是`=== function`还要兜底的这种冗余玩意
