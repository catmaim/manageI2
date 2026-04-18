"use client";

export async function sendLineMessage(to: string, message: string) {
  try {
    const response = await fetch('/api/line-msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending LINE message:', error);
    return { success: false, message: 'Error connecting to API' };
  }
}
