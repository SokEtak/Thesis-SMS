export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  telegram_chat_id?: string | null;
  avatar?: string | null;
  phone?: string | null;
  gender?: 'male' | 'female' | null;
  dob?: string | null;
  position?: string | null;
  address?: string | null;
  class_id?: number | null;
  class_name?: string | null;
  parent_id?: number | null;
  parent_name?: string | null;
  locale?: string | null;
  role_name?: string | null;
  role_names?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TeacherOption {
  id: number;
  name: string;
  email?: string | null;
}

export interface Classroom {
  id: number;
  name: string;
  teacher_in_charge_id?: number | null;
  teacher_name?: string | null;
  level?: string;
  section?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  student_name?: string | null;
  name?: string | null;
  email?: string | null;
  telegram_chat_id?: string | null;
  avatar?: string | null;
  phone?: string | null;
  gender?: 'male' | 'female' | null;
  dob?: string | null;
  position?: string | null;
  address?: string | null;
  parent_id?: number | null;
  class_id?: number;
  class_name?: string | null;
  date: string;
  status: 'pre' | 'a' | 'per' | 'l';
  status_label?: string | null;
  recorded_by?: number | null;
  recorded_by_name?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ExamResult {
  id: number;
  student_id: number;
  student_name?: string | null;
  subject_id: number;
  subject_name?: string | null;
  exam_type: string;
  exam_date: string | null;
  score?: number | null;
  status?: string | null;
  remark?: string | null;
  recorded_by?: number | null;
  recorded_by_name?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Homework {
  id: number;
  class_id?: number | null;
  class_name?: string | null;
  subject_id?: number | null;
  subject_name?: string | null;
  teacher_id?: number | null;
  teacher_name?: string | null;
  title: string;
  description?: string | null;
  file_url?: string | null;
  deadline?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface HomeworkSubmission {
  id: number;
  homework_id: number;
  homework_title?: string | null;
  student_id: number;
  student_name?: string | null;
  file_url?: string | null;
  submitted_at?: string | null;
  score?: number | null;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface LeaveRequest {
  id: number;
  student_id: number;
  student_name?: string | null;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: string;
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Message {
  id: number;
  sender_id: number;
  sender_name?: string | null;
  receiver_id: number;
  receiver_name?: string | null;
  message_body?: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Timetable {
  id: number;
  class_id: number;
  class_name?: string | null;
  subject_id: number;
  subject_name?: string | null;
  day_of_week: string;
  start_time?: string | null;
  end_time?: string | null;
  teacher_id?: number | null;
  teacher_name?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
