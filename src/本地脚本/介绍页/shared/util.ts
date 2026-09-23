export async function changeGreeting(swipe_id: number) {
  try {
    await setChatMessages([{ message_id: 0, swipe_id }], { refresh: 'affected' });
  } catch {
    triggerSlash(`/swipe 0 ${swipe_id}`);
    console.error('OZ前端：跳转开场失败，尝试回退STScript实现');
  }
}
export function format(template: string, params: { [x: string]: any }) {
  return template.replace(/\{(\w+)\}/g, (m: any, key: string) => (key in params ? params[key] : m));
}

/**
 * 按 <pagebreak> 标识符切分多页 HTML
 */
export function splitPages(content: string): string[] {
  return content
    .split(/(?:<p>)?\s*{@pagebreak}\s*(?:<\/p>)?/gi)
    .map(page => page.trim())
    .filter(Boolean);
}
