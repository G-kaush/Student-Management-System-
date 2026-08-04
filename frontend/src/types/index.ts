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

export type UserRole = "ADMIN" | "INSTRUCTOR";

export interface AuthResponse {
  token: string;
  tokenType: "Bearer";
  userId: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface CurrentUser {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface RegisterUserPayload {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}
