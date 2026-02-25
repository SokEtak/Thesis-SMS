export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Classroom {
  id: number;
  name: string;
  level: string;
  section: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
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
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ExamResult {
  id: number;
  student_id: number;
  exam_id: number;
  score: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Homework {
  id: number;
  title: string;
  description: string;
  due_date: string;
  teacher_id?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface HomeworkSubmission {
  id: number;
  homework_id: number;
  student_id: number;
  file_path: string;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Timetable {
  id: number;
  classroom_id: number;
  subject_id: number;
  day: string;
  start_time: string;
  end_time: string;
  teacher_id?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
