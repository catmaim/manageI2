export type Officer = {
  id: string;
  name: string;
  nickName: string;
  rank: string;
  specialty: string;
  unit: string;
};

export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';
export type CrimeCategory = 'Gambling' | 'Scam' | 'Porn' | 'Gun' | 'Admin' | 'Field Ops' | 'Other';

export type Task = {
  id: string;
  title: string;
  description: string;
  difficultyScore: number;
  assignedToId: string;
  status: TaskStatus;
  category: CrimeCategory;
  dueDate: string;
  completedAt?: string; // เพิ่มช่องบันทึกวันที่งานเสร็จ
};

export const officers: Officer[] = [
  { id: '1', name: 'กอล์ฟ (ใหญ่)', nickName: 'กอล์ฟใหญ่', rank: 'พ.ต.ท.', specialty: 'Field Lead / Mentor', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '2', name: 'เอ็ม', nickName: 'เอ็ม', rank: 'ร.ต.อ.', specialty: 'Generalist / Coordination', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '3', name: 'อั๋น', nickName: 'อั๋น', rank: 'ร.ต.ท.', specialty: 'Investigation / Documentation', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '4', name: 'อาร์ม (ใหญ่)', nickName: 'อาร์มใหญ่', rank: 'พ.ต.ต.', specialty: 'Tech Lead / Cyber Specialist', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '5', name: 'อาร์ม (เล็ก)', nickName: 'อาร์มเล็ก', rank: 'จ.ส.ต.', specialty: 'Technical Support', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '6', name: 'กอล์ฟ (เล็ก)', nickName: 'กอล์ฟเล็ก', rank: 'ส.ต.อ.', specialty: 'Technical Support / Scraper', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '7', name: 'ยีนต์', nickName: 'ยีนต์', rank: 'ร.ต.ท.', specialty: 'Investigation / Bank Liaison', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '8', name: 'บิว', nickName: 'บิว', rank: 'ร.ต.อ.', specialty: 'Admin / Reporting', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '9', name: 'กฤต', nickName: 'กฤต', rank: 'ส.ต.ท.', specialty: 'Field Ops / Surveillance', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '10', name: 'ตั้ม (เล็ก)', nickName: 'ตั้มเล็ก', rank: 'ส.ต.ต.', specialty: 'Technical Assistant', unit: 'กก.สส.2 บก.สส.ภ.8' },
  { id: '11', name: 'โจ้', nickName: 'โจ้', rank: 'จ.ส.ต.', specialty: 'Field Ops / Evidence Collection', unit: 'กก.สส.2 บก.สส.ภ.8' },
];

export const tasks: Task[] = [
  { id: 'T001', title: 'วิเคราะห์เครือข่ายเว็บพนัน 500 URLs', description: 'ดึงข้อมูลเทคนิคและจัดกลุ่มเป้าหมาย', difficultyScore: 5, assignedToId: '4', status: 'In Progress', category: 'Gambling', dueDate: '2024-04-20' },
  { id: 'T002', title: 'สรุปรายงานการสืบสวนคดีบัญชีม้า', description: 'จัดทำบันทึกข้อความสรุปพฤติการณ์', difficultyScore: 3, assignedToId: '3', status: 'Completed', category: 'Scam', dueDate: '2024-04-15' },
  { id: 'T003', title: 'ตรวจสอบ IP Address เป้าหมาย 10 รายการ', description: 'ระบุพิกัดและผู้ให้บริการรายย่อย', difficultyScore: 2, assignedToId: '6', status: 'Completed', category: 'Gambling', dueDate: '2024-04-16' },
  { id: 'T004', title: 'ประสานงานขอข้อมูลธนาคารเคสหลอกลงทุน', description: 'ติดตามข้อมูลเส้นทางการเงิน', difficultyScore: 3, assignedToId: '7', status: 'In Progress', category: 'Scam', dueDate: '2024-04-22' },
  { id: 'T005', title: 'ร่างบันทึกข้อความรายงาน ผบช.ภ.8', description: 'ผลการกวาดล้างประจำสัปดาห์', difficultyScore: 2, assignedToId: '8', status: 'Review', category: 'Admin', dueDate: '2024-04-18' },
  { id: 'T006', title: 'ลงพื้นที่ตรวจสอบพิกัดเป้าหมาย (นครศรีฯ)', description: 'สืบสวนหาข่าวเชิงลึกในพื้นที่', difficultyScore: 4, assignedToId: '1', status: 'In Progress', category: 'Field Ops', dueDate: '2024-04-19' },
  { id: 'T007', title: 'ดึงข้อมูล Scraper เว็บข่าวปลอม 100 เว็บ', description: 'ใช้เครื่องมือดึงข้อมูลเพื่อปิดกั้น', difficultyScore: 3, assignedToId: '10', status: 'To Do', category: 'Porn', dueDate: '2024-04-25' },
];
