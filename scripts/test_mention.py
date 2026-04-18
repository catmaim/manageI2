# ทดสอบการคำนวณตำแหน่ง Tag สำหรับ LINE (ภาษาไทย)
intro = "📢 ประกาศแจ้งเวรปฏิบัติการประจำวันนี้\n🗓️ วันที่: 18/04/2569\n\n👮‍♂️ ผู้เข้าเวรวันนี้คือ: ส.ต.ต.ณัฐภัทร บุญต่อ (บิว)\n"
tagText = "@บิว"

# 1. การนับแบบปกติของ Python/JS (อาจจะเพี้ยนใน LINE)
normal_index = len(intro) + 3 # +3 คือ "👉 "

# 2. การนับแบบ Unicode UTF-16 (ที่ LINE ใช้)
def get_line_index(text):
    # LINE นับตามความยาว UTF-16
    return len(text.encode('utf-16-le')) // 2

line_intro_len = get_line_index(intro)
line_prefix_len = get_line_index("👉 ")
line_target_index = line_intro_len + line_prefix_len

print(f"--- ผลการวิเคราะห์พิกัด ---")
print(f"ข้อความเกริ่นนำ: {intro[:20]}...")
print(f"ความยาว (Normal): {len(intro)}")
print(f"ความยาว (LINE UTF-16): {line_intro_len}")
print(f"ตำแหน่งเริ่มต้นที่ต้องใช้: {line_target_index}")
print(f"ความยาว Tag (@บิว): {get_line_index(tagText)}")
