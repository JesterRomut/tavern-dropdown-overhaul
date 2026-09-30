export interface SwitchGroup {
  /** 唯一标识，用于持久化存储索引与状态绑定 */
  id: string;
  /** 界面显示文本或后续的节点配置 */
  label: string;
  /** 匹配条目名称（name）的正则表达式或断言函数 */
  match: RegExp | ((name: string) => boolean);
}

export interface SwitcherConfig {
  groups: SwitchGroup[];
}
