import type {
  AuthResponse,
  Course,
  CoursePayload,
  CurrentUser,
  RegisterUserPayload,
  Student,
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
  const isLoginRequest = path === "/auth/login";

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (!isLoginRequest && typeof window !== "undefined") {
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
      !isLoginRequest &&
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

export function registerUser(
  payload: RegisterUserPayload,
): Promise<UserResponse> {
  return apiRequest<UserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

// ======================================================
// Course APIs
// ======================================================

export function getCourses(): Promise<Course[]> {
  return apiRequest<Course[]>("/courses", {
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
// Student APIs
// ======================================================

export function getStudents(): Promise<Student[]> {
  return apiRequest<Student[]>("/students", {
    method: "GET",
    cache: "no-store",
  });
}

export function getStudentById(
  id: number,
): Promise<Student> {
  return apiRequest<Student>(`/students/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

export function createStudent(
  payload: StudentPayload,
): Promise<Student> {
  return apiRequest<Student>("/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudent(
  id: number,
  payload: StudentPayload,
): Promise<Student> {
  return apiRequest<Student>(`/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteStudent(
  id: number,
): Promise<void> {
  return apiRequest<void>(`/students/${id}`, {
    method: "DELETE",
  });
}
