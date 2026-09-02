export async function changeGreeting(swipe_id: number) {
  if (typeof setChatMessages === 'function') {
    await setChatMessages([{ message_id: 0, swipe_id }], { refresh: 'affected' });
  } else if (typeof triggerSlash === 'function') {
    triggerSlash('/swipe 0 0');
  } else {
    throw new Error('OZ前端：未识别到酒馆助手API，也无法使用酒馆原生切换！');
  }
}
