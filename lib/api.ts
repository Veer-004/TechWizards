const API_BASE_URL = "http://localhost:8000/api"

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private getAuthHeadersMultipart(): HeadersInit {
    const token = localStorage.getItem("access_token")
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getAuthHeaders(),
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Clear invalid tokens
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          localStorage.removeItem("user_data")

          return { error: "Authentication required. Please sign in again." }
        }

        return { error: data.error || data.message || "Request failed" }
      }

      return { data }
    } catch (error) {
      return { error: "Network error. Please check your connection." }
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(name: string, email: string, password: string) {
    return this.request("/auth/register/", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  }

  // Reports
  async getReports(params?: { status?: string; user_only?: boolean; limit?: number; skip?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append("status", params.status)
    if (params?.user_only) searchParams.append("user_only", "true")
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.skip) searchParams.append("skip", params.skip.toString())

    const queryString = searchParams.toString()
    return this.request(`/reports/${queryString ? `?${queryString}` : ""}`)
  }

  async createReport(formData: FormData) {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/reports/create/`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || "Failed to create report" }
      }

      return { data }
    } catch (error) {
      return { error: "Network error. Please check your connection." }
    }
  }

  async getReportDetail(reportId: string) {
    return this.request(`/reports/${reportId}/`)
  }

  async updateReportStatus(reportId: string, status: string, adminRemarks?: string) {
    return this.request(`/reports/${reportId}/update/`, {
      method: "PUT",
      body: JSON.stringify({ status, admin_remarks: adminRemarks }),
    })
  }

  async getReportsNearLocation(lat: number, lng: number, distance = 1000) {
    return this.request(`/reports/near/?lat=${lat}&lng=${lng}&distance=${distance}`)
  }

  async searchReports(query: string, limit = 50) {
    return this.request(`/reports/search/?q=${encodeURIComponent(query)}&limit=${limit}`)
  }

  // Dashboard
  async getDashboardStats() {
    return this.request("/dashboard/stats/")
  }

  // Health check
  async healthCheck() {
    return this.request("/health/")
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await this.request("/health/")
      return !response.error
    } catch (error) {
      return false
    }
  }
}

export const apiService = new ApiService()
