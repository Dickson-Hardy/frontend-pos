const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  // Products endpoints
  async getProducts(outletId?: string) {
    const query = outletId ? `?outletId=${outletId}` : ""
    return this.request(`/products${query}`)
  }

  async createProduct(productData: any) {
    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    })
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    })
  }

  // Sales endpoints
  async createSale(saleData: any) {
    return this.request("/sales", {
      method: "POST",
      body: JSON.stringify(saleData),
    })
  }

  async getSales(outletId?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (outletId) params.append("outletId", outletId)
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)

    return this.request(`/sales?${params.toString()}`)
  }

  // Inventory endpoints
  async getInventory(outletId?: string) {
    const query = outletId ? `?outletId=${outletId}` : ""
    return this.request(`/inventory${query}`)
  }

  async updateInventory(productId: string, quantity: number, reason: string) {
    return this.request("/inventory/adjust", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, reason }),
    })
  }

  // Reports endpoints
  async getSalesReport(outletId?: string, period?: string) {
    const params = new URLSearchParams()
    if (outletId) params.append("outletId", outletId)
    if (period) params.append("period", period)

    return this.request(`/reports/sales?${params.toString()}`)
  }

  async getInventoryReport(outletId?: string) {
    const query = outletId ? `?outletId=${outletId}` : ""
    return this.request(`/reports/inventory${query}`)
  }

  // Outlets endpoints
  async getOutlets() {
    return this.request("/outlets")
  }

  async createOutlet(outletData: any) {
    return this.request("/outlets", {
      method: "POST",
      body: JSON.stringify(outletData),
    })
  }

  // Users endpoints
  async getUsers(outletId?: string) {
    const query = outletId ? `?outletId=${outletId}` : ""
    return this.request(`/users${query}`)
  }

  async createUser(userData: any) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  // File upload
  async uploadFile(file: File, type: "image" | "document" = "image") {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    const headers: any = {}
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseURL}/uploads`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload Error: ${response.status}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
