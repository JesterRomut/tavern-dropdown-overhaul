import { type Directive } from 'vue';

export type GroupLabel = string | HTMLElement | JQuery | (() => string | HTMLElement | JQuery);

export const vLabel: Directive<HTMLElement, GroupLabel> = (el, binding) => {
  el.replaceChildren();
  const val = typeof binding.value === 'function' ? binding.value() : binding.value;
  if (!val) return;

  if (typeof val === 'string') {
    el.innerHTML = val;
  } else if (typeof val === 'object' && 'jquery' in val) {
    const doc = el.ownerDocument || document;
    for (const node of (val as JQuery).toArray()) {
      el.appendChild(doc.importNode(node, true));
    }
  } else if (val instanceof Node) {
    const doc = el.ownerDocument || document;
    el.appendChild(doc.importNode(val, true));
  }
};


export const ScriptVariables = z
  .object({
    previouslyDisabled: z.record(z.string(), z.array(z.string())).default({}),
  })
  .prefault({});

export type ScriptVariables = z.infer<typeof ScriptVariables>;

export interface SwitchGroup {
  /** 唯一标识，用于持久化存储索引与状态绑定 */
  id: string;
  /** 界面显示文本或后续的节点配置 */
  label: GroupLabel;
  /** 匹配条目名称（name）的正则表达式或断言函数 */
  match: RegExp | ((name: string) => boolean);

  export?: {
    name: string;
  } | null;
}

export interface SwitcherConfig {
  groups: SwitchGroup[];
}

export interface WorldbookSwitcherAPI {
  groups: SwitchGroup[];
  worldbookName: string;
  getGroup(id: string): SwitchGroup | undefined;
  isGroupEnabled(groupId: string): Promise<boolean>;
  toggleGroup(groupId: string, target?: boolean): Promise<void>;
  exportGroup(groupId: string): Promise<void>;
}
