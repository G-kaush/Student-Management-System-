export interface Course {
  id: number;
  code: string;
  name: string;
  description: string | null;
  instructor: UserResponse;
}

export interface CoursePayload {
  code: string;
  name: string;
  description: string;
  instructorId: number;
}

export type UserRole =
  | "ADMIN"
  | "INSTRUCTOR"
  | "STUDENT";

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

export interface AccountRegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface StudentPayload {
  username: string;
  email: string;
  password?: string | null;
}

export interface ProfileUpdatePayload {
  username: string;
  email: string;
  currentPassword: string;
  newPassword?: string | null;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  approved: boolean;
}

export interface EnrollmentResponse {
  id: number;
  student: UserResponse;
  course: Course;
  enrolledAt: string;
}
