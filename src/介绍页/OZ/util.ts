export async function changeGreeting(swipe_id: number) {
  try {
    if (typeof setChatMessages === 'function') {
      await setChatMessages([{ message_id: 0, swipe_id }], { refresh: 'affected' });
    } else {
      throw new Error('切换开场：未识别到酒馆助手api');
    }
  } catch (e) {
    if (typeof triggerSlash === 'function') {
      triggerSlash('/swipe 0 0');
    }
  }
}
