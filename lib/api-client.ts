import axios from "axios"

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("auth_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) => apiClient.post("/auth/login", credentials),
    register: (userData: { name: string; email: string; password: string; role: string }) =>
      apiClient.post("/auth/register", userData),
    logout: () => apiClient.post("/auth/logout"),
    me: () => apiClient.get("/auth/me"),
  },

  // Products endpoints
  products: {
    getAll: () => apiClient.get("/products"),
    getById: (id: string) => apiClient.get(`/products/${id}`),
    create: (product: any) => apiClient.post("/products", product),
    update: (id: string, product: any) => apiClient.put(`/products/${id}`, product),
    delete: (id: string) => apiClient.delete(`/products/${id}`),
    search: (query: string) => apiClient.get(`/products/search?q=${query}`),
  },

  // Sales endpoints
  sales: {
    getAll: () => apiClient.get("/sales"),
    getById: (id: string) => apiClient.get(`/sales/${id}`),
    create: (sale: any) => apiClient.post("/sales", sale),
    getByDateRange: (startDate: string, endDate: string) =>
      apiClient.get(`/sales?startDate=${startDate}&endDate=${endDate}`),
  },

  // Inventory endpoints
  inventory: {
    getItems: () => apiClient.get("/inventory/items"),
    getStats: () => apiClient.get("/inventory/stats"),
    adjust: (data: { itemId: string; newStock: number; reason: string }) => apiClient.post("/inventory/adjust", data),
    getBatches: () => apiClient.get("/inventory/batches"),
  },

  // Shifts endpoints
  shifts: {
    getAll: () => apiClient.get("/shifts"),
    getStats: () => apiClient.get("/shifts/stats"),
    start: (data: { cashierId: string; openingBalance: number }) => apiClient.post("/shifts/start", data),
    end: (id: string, data: { closingBalance: number }) => apiClient.post(`/shifts/${id}/end`, data),
  },

  // Reports endpoints
  reports: {
    getSales: (params: { startDate: string; endDate: string; outletId?: string }) =>
      apiClient.get("/reports/sales", { params }),
    getInventory: (outletId?: string) => apiClient.get("/reports/inventory", { params: { outletId } }),
    getStaffPerformance: (params: { startDate: string; endDate: string; outletId?: string }) =>
      apiClient.get("/reports/staff-performance", { params }),
    getWeeklySales: () => apiClient.get("/reports/sales/weekly"),
  },

  // Users endpoints
  users: {
    getAll: () => apiClient.get("/users"),
    getById: (id: string) => apiClient.get(`/users/${id}`),
    create: (user: any) => apiClient.post("/users", user),
    update: (id: string, user: any) => apiClient.put(`/users/${id}`, user),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
  },

  // Outlets endpoints
  outlets: {
    getAll: () => apiClient.get("/outlets"),
    getById: (id: string) => apiClient.get(`/outlets/${id}`),
    create: (outlet: any) => apiClient.post("/outlets", outlet),
    update: (id: string, outlet: any) => apiClient.put(`/outlets/${id}`, outlet),
    delete: (id: string) => apiClient.delete(`/outlets/${id}`),
  },

  // Upload endpoints
  uploads: {
    uploadImage: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return apiClient.post("/uploads/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    },
  },
}

export default apiClient
