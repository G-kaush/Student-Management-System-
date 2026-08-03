import type {
  Course,
  CoursePayload,
  Student,
  StudentPayload,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080/api";

interface ErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as ErrorResponse;

      message =
        errorBody.message ??
        errorBody.detail ??
        errorBody.error ??
        message;
    } catch {
      // The response did not contain JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Course APIs

export function getCourses(): Promise<Course[]> {
  return apiRequest<Course[]>("/courses", {
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

export function deleteCourse(id: number): Promise<void> {
  return apiRequest<void>(`/courses/${id}`, {
    method: "DELETE",
  });
}

// Student APIs

export function getStudents(): Promise<Student[]> {
  return apiRequest<Student[]>("/students", {
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

export function deleteStudent(id: number): Promise<void> {
  return apiRequest<void>(`/students/${id}`, {
    method: "DELETE",
  });
}