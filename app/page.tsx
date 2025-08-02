"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, FileText, CheckCircle, Leaf, Users, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"
import { apiService } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface Report {
  id: string
  description: string
  status: "Pending" | "In Progress" | "Resolved"
  location: {
    coordinates: [number, number]
  }
  created_at: string
  image_url?: string
}

interface Stats {
  total_reports: number
  pending_reports: number
  in_progress_reports: number
  resolved_reports: number
}

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<Stats>({
    total_reports: 0,
    pending_reports: 0,
    in_progress_reports: 0,
    resolved_reports: 0,
  })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    // Only load data after auth state is determined
    if (!isLoading) {
      loadData()
    }
  }, [isLoading, user])

  const loadData = async () => {
    setDataLoading(true)
    try {
      // Load recent reports (public view - no auth required for basic stats)
      const reportsResponse = await apiService.getReports({ limit: 6 })
      if (reportsResponse.data && Array.isArray((reportsResponse.data as { reports?: Report[] }).reports)) {
        setReports((reportsResponse.data as { reports?: Report[] }).reports || [])
      }

      // Only load admin stats if user is authenticated and admin
      if (isAuthenticated && user?.is_admin) {
        const statsResponse = await apiService.getDashboardStats()
        if (statsResponse.data) {
          setStats(statsResponse.data as Stats)
        }
      } else if (isAuthenticated) {
        // Calculate basic stats from user's reports for regular users
        const userReportsResponse = await apiService.getReports({ user_only: true, limit: 100 })
        if (userReportsResponse.data) {
          const userReports = (userReportsResponse.data as { reports?: Report[] }).reports || []
          setStats({
            total_reports: userReports.length,
            pending_reports: userReports.filter((r: Report) => r.status === "Pending").length,
            in_progress_reports: userReports.filter((r: Report) => r.status === "In Progress").length,
            resolved_reports: userReports.filter((r: Report) => r.status === "Resolved").length,
          })
        }
      } else {
        // For non-authenticated users, show basic public stats
        const allReportsResponse = await apiService.getReports({ limit: 100 })
        if (allReportsResponse.data) {
          const allReports = (allReportsResponse.data as { reports?: Report[] }).reports || []
          setStats({
            total_reports: allReports.length,
            pending_reports: allReports.filter((r: Report) => r.status === "Pending").length,
            in_progress_reports: allReports.filter((r: Report) => r.status === "In Progress").length,
            resolved_reports: allReports.filter((r: Report) => r.status === "Resolved").length,
          })
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "status-pending"
      case "In Progress":
        return "status-in-progress"
      case "Resolved":
        return "status-resolved"
      default:
        return "status-pending"
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="eco-glass border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-eco-teal to-eco-green rounded-xl flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-poppins font-bold text-gray-900">EcoTracker</h1>
                <p className="text-sm text-gray-600 font-roboto">Clean City Initiative</p>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600 font-roboto">Welcome, {user?.name}</span>
                  {user?.is_admin && (
                    <Link href="/admin">
                      <Button
                        variant="outline"
                        className="eco-button border-eco-teal text-eco-teal hover:bg-eco-teal hover:text-white bg-transparent"
                      >
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Link href="/my-reports">
                    <Button
                      variant="outline"
                      className="eco-button border-eco-teal text-eco-teal hover:bg-eco-teal hover:text-white bg-transparent"
                    >
                      My Reports
                    </Button>
                  </Link>
                  <Link href="/report">
                    <Button className="eco-button-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="eco-button border-eco-teal text-eco-teal hover:bg-eco-teal hover:text-white bg-transparent"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="eco-button-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 eco-gradient opacity-5"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-5xl md:text-6xl font-poppins font-bold text-gray-900 mb-6 leading-tight">
              Keep Your City
              <span className="block bg-gradient-to-r from-eco-teal to-eco-green bg-clip-text text-transparent">
                Clean & Green
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-roboto leading-relaxed">
              Join thousands of citizens in making our city cleaner. Report waste issues, track their resolution, and be
              part of the environmental solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={isAuthenticated ? "/report" : "/login"}>
                <Button size="lg" className="eco-button-primary text-lg px-8 py-4">
                  <Plus className="h-5 w-5 mr-2" />
                  Start Reporting
                </Button>
              </Link>
              <Link href="/map">
                <Button
                  size="lg"
                  variant="outline"
                  className="eco-button border-2 border-eco-teal text-eco-teal hover:bg-eco-teal hover:text-white text-lg px-8 py-4 bg-transparent"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Explore Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-poppins font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-lg text-gray-600 font-roboto">Simple steps to make a big difference</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="eco-card p-8 text-center group hover:shadow-eco-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-eco-red to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-poppins font-semibold text-gray-900 mb-3">Report Issues</h4>
              <p className="text-gray-600 font-roboto">
                Spot a waste problem? Take a photo and report it with your location.
              </p>
            </div>
            <div className="eco-card p-8 text-center group hover:shadow-eco-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-eco-amber to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-poppins font-semibold text-gray-900 mb-3">Track Progress</h4>
              <p className="text-gray-600 font-roboto">Monitor the status of your reports and see real-time updates.</p>
            </div>
            <div className="eco-card p-8 text-center group hover:shadow-eco-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-eco-green to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-poppins font-semibold text-gray-900 mb-3">See Results</h4>
              <p className="text-gray-600 font-roboto">
                Watch as your community becomes cleaner through collective action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-eco-teal/5 to-eco-green/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-poppins font-bold text-gray-900 mb-4">Community Impact</h3>
            <p className="text-lg text-gray-600 font-roboto">Together, we're making a difference</p>
          </div>
          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="eco-card text-center p-6 animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="eco-card text-center p-6 hover:shadow-eco-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-poppins text-gray-900">{stats.total_reports}</CardTitle>
                  <CardDescription className="font-roboto">Total Reports</CardDescription>
                </CardHeader>
              </Card>
              <Card className="eco-card text-center p-6 hover:shadow-eco-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-eco-red to-red-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse-eco" />
                  </div>
                  <CardTitle className="text-2xl font-poppins text-eco-red">{stats.pending_reports}</CardTitle>
                  <CardDescription className="font-roboto">Pending</CardDescription>
                </CardHeader>
              </Card>
              <Card className="eco-card text-center p-6 hover:shadow-eco-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-eco-amber to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-poppins text-eco-amber">{stats.in_progress_reports}</CardTitle>
                  <CardDescription className="font-roboto">In Progress</CardDescription>
                </CardHeader>
              </Card>
              <Card className="eco-card text-center p-6 hover:shadow-eco-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-eco-green to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-poppins text-eco-green">{stats.resolved_reports}</CardTitle>
                  <CardDescription className="font-roboto">Resolved</CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Recent Reports */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-poppins font-bold text-gray-900 mb-4">Recent Community Reports</h3>
            <p className="text-lg text-gray-600 font-roboto">See what your neighbors are reporting</p>
          </div>
          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="eco-card overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-200"></div>
                  <CardHeader className="pb-2">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="eco-card overflow-hidden group hover:shadow-eco-lg transition-all duration-300"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <img
                      src={report.image_url || "/placeholder.svg?height=200&width=300"}
                      alt="Waste report"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={`${getStatusColor(report.status)} font-roboto font-medium px-3 py-1 rounded-full`}
                      >
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-poppins line-clamp-2 text-gray-900">
                      {report.description}
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      Reported on {new Date(report.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-500 font-roboto">
                      <MapPin className="h-4 w-4 mr-1 text-eco-teal" />
                      {report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-500 mb-4">Be the first to report a waste issue in your community.</p>
              <Link href={isAuthenticated ? "/report" : "/login"}>
                <Button className="eco-button-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Report
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-eco-teal to-eco-green relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <h3 className="text-4xl font-poppins font-bold mb-6">Ready to Make a Difference?</h3>
          <p className="text-xl mb-8 font-roboto opacity-90">
            Join our community of environmental champions and help create a cleaner, greener city for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={isAuthenticated ? "/my-reports" : "/login"}>
              <Button
                size="lg"
                className="bg-white text-eco-teal hover:bg-gray-100 eco-button text-lg px-8 py-4 font-medium"
              >
                <Users className="h-5 w-5 mr-2" />
                {isAuthenticated ? "View Dashboard" : "Join Community"}
              </Button>
            </Link>
            <Link href={isAuthenticated ? "/report" : "/login"}>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-eco-teal eco-button text-lg px-8 py-4 font-medium bg-transparent"
              >
                <Shield className="h-5 w-5 mr-2" />
                Report Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-eco-teal to-eco-green rounded-xl flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-poppins font-bold">EcoTracker</h4>
                  <p className="text-sm text-gray-400 font-roboto">Clean City Initiative</p>
                </div>
              </div>
              <p className="text-gray-300 font-roboto leading-relaxed">
                Empowering communities to create cleaner, healthier environments through collaborative waste reporting
                and tracking.
              </p>
            </div>
            <div>
              <h5 className="font-poppins font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 font-roboto">
                <li>
                  <Link href="/report" className="text-gray-300 hover:text-eco-green transition-colors">
                    Report Issue
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="text-gray-300 hover:text-eco-green transition-colors">
                    View Map
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-300 hover:text-eco-green transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-poppins font-semibold mb-4">Contact</h5>
              <ul className="space-y-2 font-roboto text-gray-300">
                <li>support@ecotracker.com</li>
                <li>+1 (555) 123-4567</li>
                <li>24/7 Community Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 font-roboto">
              &copy; 2024 EcoTracker. Making cities cleaner, one report at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
