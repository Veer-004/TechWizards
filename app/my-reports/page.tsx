"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, ArrowLeft, Search, Plus, Calendar } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"

interface Report {
  id: string
  description: string
  status: "Pending" | "In Progress" | "Resolved"
  location: {
    coordinates: [number, number]
  }
  created_at: string
  updated_at: string
  image_url?: string
  admin_remarks?: string
}

export default function MyReportsPage() {
  const { isAuthenticated, user, logout } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      loadReports()
    }
  }, [isAuthenticated])

  useEffect(() => {
    let filtered = reports

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter((report) => report.description.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    setFilteredReports(filtered)
  }, [reports, statusFilter, searchTerm])

  const loadReports = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiService.getReports({ user_only: true })

      if (response.error) {
        if (response.error.includes("Authentication")) {
          logout()
          return
        }
        setError(response.error)
      } else if (response.data) {
        setReports(response.data.reports || [])
      }
    } catch (err) {
      setError("Failed to load reports. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "destructive"
      case "In Progress":
        return "default"
      case "Resolved":
        return "secondary"
      default:
        return "default"
    }
  }

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "Pending").length,
    inProgress: reports.filter((r) => r.status === "In Progress").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="eco-card shadow-eco-lg w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-poppins font-bold text-gray-900">Authentication Required</CardTitle>
            <CardDescription className="font-roboto text-gray-600">
              Please sign in to view your reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full eco-button-primary">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2 ml-4">
                <MapPin className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-900">My Reports</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
              <Link href="/report">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <Button onClick={loadReports} className="mt-2" size="sm">
              Retry
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <div className="h-3 w-3 bg-red-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <div className="h-3 w-3 bg-yellow-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <div className="h-3 w-3 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search your reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1">
                      <div className="aspect-video bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="lg:col-span-2 space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Report #{report.id}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Submitted on {new Date(report.created_at).toLocaleDateString()}
                        {report.updated_at !== report.created_at && (
                          <span className="ml-2 text-blue-600">
                            • Updated {new Date(report.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(report.status) as any}>{report.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Image */}
                    {report.image_url && (
                      <div className="lg:col-span-1">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={report.image_url || "/placeholder.svg"}
                            alt="Waste report"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className={report.image_url ? "lg:col-span-2" : "lg:col-span-3"}>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                          <p className="text-gray-700">{report.description}</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Location</h4>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            {report.location.coordinates[1].toFixed(6)}, {report.location.coordinates[0].toFixed(6)}
                          </div>
                        </div>

                        {report.admin_remarks && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Admin Update</h4>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-blue-800 text-sm">{report.admin_remarks}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredReports.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <MapPin className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "No reports match your current filters."
                  : "You haven't submitted any reports yet."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Link href="/report">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Report
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
