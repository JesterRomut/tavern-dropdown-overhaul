export async function changeGreeting(swipe_id: number) {
  try {
    await setChatMessages([{ message_id: 0, swipe_id }], { refresh: 'affected' });
  } catch {
    triggerSlash(`/swipe 0 ${swipe_id}`);
    console.error('OZ前端：跳转开场失败，尝试回退STScript实现');
  }
}
