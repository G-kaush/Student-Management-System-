export interface Course {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface Student {
  id: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  course: Course;
}

export interface CoursePayload {
  code: string;
  name: string;
  description: string;
}

export interface StudentPayload {
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courseId: number;
}