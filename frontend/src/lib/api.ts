import type {
  AuthResponse,
  Course,
  CoursePayload,
  CurrentUser,
  EnrollmentResponse,
  AccountRegisterPayload,
  ProfileUpdatePayload,
  StudentPayload,
  UserResponse,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080/api";

interface ErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
  fields?: Record<string, string>;
}

/**
 * Returns the JWT saved after login.
 */
function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
}

export function hasAuthSession(): boolean {
  return getAccessToken() !== null;
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem("currentUser");

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as CurrentUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

/**
 * Common function used by all API requests.
 */
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  const token = getAccessToken();
  const isPublicAuthRequest =
    path === "/auth/login" ||
    path === "/auth/register" ||
    path === "/auth/instructor/register";

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (!isPublicAuthRequest && typeof window !== "undefined") {
    clearAuthSession();
    window.location.assign("/login");
    throw new Error("Please sign in to continue.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody =
        (await response.json()) as ErrorResponse;

      if (
        errorBody.fields &&
        Object.keys(errorBody.fields).length > 0
      ) {
        message = Object.values(errorBody.fields).join(", ");
      } else {
        message =
          errorBody.error ??
          errorBody.message ??
          errorBody.detail ??
          message;
      }
    } catch {
      // The response did not contain JSON.
    }

    if (
      response.status === 401 &&
      !isPublicAuthRequest &&
      typeof window !== "undefined"
    ) {
      clearAuthSession();
      window.location.assign("/login");
      message = "Your session expired. Please sign in again.";
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ======================================================
// Authentication APIs
// ======================================================

export function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function registerStudent(
  payload: AccountRegisterPayload,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerInstructor(
  payload: AccountRegisterPayload,
): Promise<UserResponse> {
  return apiRequest<UserResponse>(
    "/auth/instructor/register",
    {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        role: "INSTRUCTOR",
      }),
    },
  );
}

/**
 * Saves authentication information after login.
 */
export function saveAuthSession(
  response: AuthResponse,
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "accessToken",
    response.token,
  );

  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      userId: response.userId,
      username: response.username,
      email: response.email,
      role: response.role,
    }),
  );
}

/**
 * Removes authentication information during logout.
 */
export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("currentUser");
}

// ======================================================
// User APIs
// ======================================================

export function getUsers(): Promise<UserResponse[]> {
  return apiRequest<UserResponse[]>("/users", {
    method: "GET",
    cache: "no-store",
  });
}

export function getRegisteredStudents(): Promise<
  UserResponse[]
> {
  return apiRequest<UserResponse[]>("/users/students", {
    method: "GET",
    cache: "no-store",
  });
}

export function createStudent(
  payload: StudentPayload,
): Promise<UserResponse> {
  return apiRequest<UserResponse>("/users/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudent(
  id: number,
  payload: StudentPayload,
): Promise<UserResponse> {
  return apiRequest<UserResponse>(
    `/users/students/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteStudent(
  id: number,
): Promise<void> {
  return apiRequest<void>(`/users/students/${id}`, {
    method: "DELETE",
  });
}

export function getApprovedInstructors(): Promise<
  UserResponse[]
> {
  return apiRequest<UserResponse[]>("/users/instructors", {
    method: "GET",
    cache: "no-store",
  });
}

export function approveUser(
  id: number,
): Promise<UserResponse> {
  return apiRequest<UserResponse>(`/users/${id}/approve`, {
    method: "PATCH",
  });
}

export function updateMyProfile(
  payload: ProfileUpdatePayload,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/users/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ======================================================
// Course APIs
// ======================================================

export function getCourses(): Promise<Course[]> {
  return apiRequest<Course[]>("/courses", {
    method: "GET",
    cache: "no-store",
  });
}

export function getAvailableCourses(): Promise<Course[]> {
  return apiRequest<Course[]>("/courses/available", {
    method: "GET",
    cache: "no-store",
  });
}

export function getCourseById(
  id: number,
): Promise<Course> {
  return apiRequest<Course>(`/courses/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

export function createCourse(
  payload: CoursePayload,
): Promise<Course> {
  return apiRequest<Course>("/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCourse(
  id: number,
  payload: CoursePayload,
): Promise<Course> {
  return apiRequest<Course>(`/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCourse(
  id: number,
): Promise<void> {
  return apiRequest<void>(`/courses/${id}`, {
    method: "DELETE",
  });
}

// ======================================================
// Enrollment APIs
// ======================================================

export function enrollInCourse(
  courseId: number,
): Promise<EnrollmentResponse> {
  return apiRequest<EnrollmentResponse>(
    `/enrollments/${courseId}`,
    {
      method: "POST",
    },
  );
}

export function getMyCourses(): Promise<Course[]> {
  return apiRequest<Course[]>("/enrollments/my-courses", {
    method: "GET",
    cache: "no-store",
  });
}

export function unenrollFromCourse(
  courseId: number,
): Promise<void> {
  return apiRequest<void>(
    `/enrollments/my-courses/${courseId}`,
    {
      method: "DELETE",
    },
  );
}

export function getEnrollments(): Promise<
  EnrollmentResponse[]
> {
  return apiRequest<EnrollmentResponse[]>("/enrollments", {
    method: "GET",
    cache: "no-store",
  });
}

export function removeEnrollment(
  enrollmentId: number,
): Promise<void> {
  return apiRequest<void>(
    `/enrollments/${enrollmentId}`,
    {
      method: "DELETE",
    },
  );
}

