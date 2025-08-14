import { apiRequest } from "@/lib/queryClient";
import type { 
  Horse, InsertHorse, 
  Client, InsertClient,
  Instructor, InsertInstructor,
  Certificate, InsertCertificate,
  Lesson, InsertLesson,
  User
} from "@shared/schema";

// Horses API
export const horsesApi = {
  getAll: () => fetch("/api/horses").then(res => res.json()) as Promise<Horse[]>,
  getById: (id: string) => fetch(`/api/horses/${id}`).then(res => res.json()) as Promise<Horse>,
  create: (data: InsertHorse) => apiRequest("POST", "/api/horses", data),
  update: (id: string, data: Partial<InsertHorse>) => apiRequest("PUT", `/api/horses/${id}`, data),
  delete: (id: string) => apiRequest("DELETE", `/api/horses/${id}`),
};

// Clients API
export const clientsApi = {
  getAll: () => fetch("/api/clients").then(res => res.json()) as Promise<Client[]>,
  search: (query: string) => fetch(`/api/clients?search=${encodeURIComponent(query)}`).then(res => res.json()) as Promise<Client[]>,
  getById: (id: string) => fetch(`/api/clients/${id}`).then(res => res.json()) as Promise<Client>,
  create: (data: InsertClient) => apiRequest("POST", "/api/clients", data),
  update: (id: string, data: Partial<InsertClient>) => apiRequest("PUT", `/api/clients/${id}`, data),
  delete: (id: string) => apiRequest("DELETE", `/api/clients/${id}`),
};

// Instructors API
export const instructorsApi = {
  getAll: () => fetch("/api/instructors").then(res => res.json()) as Promise<Instructor[]>,
  getActive: () => fetch("/api/instructors?active=true").then(res => res.json()) as Promise<Instructor[]>,
  getById: (id: string) => fetch(`/api/instructors/${id}`).then(res => res.json()) as Promise<Instructor>,
  create: (data: InsertInstructor) => apiRequest("POST", "/api/instructors", data),
  update: (id: string, data: Partial<InsertInstructor>) => apiRequest("PUT", `/api/instructors/${id}`, data),
  delete: (id: string) => apiRequest("DELETE", `/api/instructors/${id}`),
};

// Certificates API
export const certificatesApi = {
  getAll: () => fetch("/api/certificates").then(res => res.json()) as Promise<Certificate[]>,
  getById: (id: string) => fetch(`/api/certificates/${id}`).then(res => res.json()) as Promise<Certificate>,
  create: (data: InsertCertificate) => apiRequest("POST", "/api/certificates", data),
  update: (id: string, data: Partial<InsertCertificate>) => apiRequest("PUT", `/api/certificates/${id}`, data),
  delete: (id: string) => apiRequest("DELETE", `/api/certificates/${id}`),
};

// Lessons API
export const lessonsApi = {
  getAll: () => fetch("/api/lessons").then(res => res.json()) as Promise<Lesson[]>,
  getInDateRange: (startDate: string, endDate: string) => 
    fetch(`/api/lessons?startDate=${startDate}&endDate=${endDate}`).then(res => res.json()) as Promise<Lesson[]>,
  getById: (id: string) => fetch(`/api/lessons/${id}`).then(res => res.json()) as Promise<Lesson>,
  create: (data: InsertLesson) => apiRequest("POST", "/api/lessons", data),
  update: (id: string, data: Partial<InsertLesson>) => apiRequest("PUT", `/api/lessons/${id}`, data),
  delete: (id: string) => apiRequest("DELETE", `/api/lessons/${id}`),
};

// Statistics API
export const statisticsApi = {
  getHorseStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return fetch(`/api/statistics/horses?${params}`).then(res => res.json());
  },
  getInstructorStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return fetch(`/api/statistics/instructors?${params}`).then(res => res.json());
  },
  getRevenue: (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());
    if (month) params.append("month", month.toString());
    return fetch(`/api/statistics/revenue?${params}`).then(res => res.json());
  },
};

// Users API
export const usersApi = {
  getAll: () => fetch("/api/users").then(res => res.json()) as Promise<User[]>,
  updateRole: (id: string, role: "observer" | "instructor" | "administrator") => 
    apiRequest("PUT", `/api/users/${id}/role`, { role }),
};
