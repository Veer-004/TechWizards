"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Leaf, ArrowLeft, Upload, Camera, MapPin, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"

export default function ReportPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const [formData, setFormData] = useState({
    description: "",
    latitude: "",
    longitude: "",
    image: null as File | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reportId, setReportId] = useState("")
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        image: e.target.files[0],
      })
    }
  }

const getCurrentLocation = () => {
  if (navigator.geolocation) {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }))
        navigator.geolocation.clearWatch(watchId) // stop watching after first fix
      },
      (error) => {
        console.error("Error getting location:", error)
        setError(
          "Unable to get your precise location. Please enter manually or allow high-accuracy access."
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  } else {
    setError("Geolocation is not supported by this browser.")
  }
}


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      setError("You must be logged in to submit a report. Please sign in first.")
      return
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      setError("Description must be at least 10 characters long.")
      return
    }

    if (!formData.latitude || !formData.longitude) {
      setError("Location is required. Please provide coordinates or use current location.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const submitFormData = new FormData()
      submitFormData.append("description", formData.description)
      submitFormData.append("latitude", formData.latitude)
      submitFormData.append("longitude", formData.longitude)

      if (formData.image) {
        submitFormData.append("image", formData.image)
      }

      const response = await apiService.createReport(submitFormData)

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setReportId(response.data.id)
        setSubmitted(true)
      }
    } catch (err) {
      setError("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="eco-glass border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="eco-button mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-eco-teal to-eco-green rounded-xl flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-lg font-poppins font-bold text-gray-900">Report Waste Issue</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Authentication Required */}
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="eco-card shadow-eco-lg w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-poppins font-bold text-gray-900">Authentication Required</CardTitle>
              <CardDescription className="font-roboto text-gray-600">
                You need to sign in to submit waste reports and help keep our city clean.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 font-roboto">
                  Reporting requires authentication to prevent spam and ensure accountability.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-3">
                <Link href="/login">
                  <Button className="w-full eco-button-primary text-lg py-3 font-roboto font-medium">
                    Sign In to Report
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="outline"
                    className="w-full eco-button border-eco-teal text-eco-teal hover:bg-eco-teal hover:text-white bg-transparent"
                  >
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="eco-glass border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-eco-teal to-eco-green rounded-xl flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-lg font-poppins font-bold text-gray-900">Report Submitted</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="eco-card shadow-eco-lg w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-eco-green to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-poppins font-bold text-eco-green">
                Report Submitted Successfully!
              </CardTitle>
              <CardDescription className="font-roboto text-gray-600">
                Thank you for helping keep our city clean. Your report has been submitted and will be reviewed by our
                team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-eco-green/10 to-green-100 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-700 font-roboto mb-2">Your Report ID</p>
                <p className="text-lg font-poppins font-bold text-eco-green">#{reportId}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600 font-roboto">
                  <div className="w-2 h-2 bg-eco-green rounded-full"></div>
                  <span>Report logged in our system</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 font-roboto">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span>Municipal team will be notified</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 font-roboto">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>You'll receive status updates</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/my-reports">
                  <Button className="w-full eco-button-primary font-roboto font-medium">View My Reports</Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="outline"
                    className="w-full eco-button border-eco-teal text-eco-teal hover:bg-eco-teal hover:text-white bg-transparent"
                  >
                    Return Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="eco-glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="eco-button mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-eco-teal to-eco-green rounded-xl flex items-center justify-center">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-poppins font-bold text-gray-900">Report Waste Issue</h1>
                <p className="text-xs text-gray-600 font-roboto">Help keep our city clean</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="eco-card shadow-eco-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-poppins font-bold text-gray-900">Submit a Waste Report</CardTitle>
              <CardDescription className="font-roboto text-gray-600">
                Help us keep the city clean by reporting waste issues in your area. Your report will be reviewed and
                addressed by our municipal team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 font-roboto">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-roboto font-medium text-gray-700">
                    Issue Description *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the waste issue in detail (e.g., garbage pile, overflowing bin, illegal dumping, broken glass, etc.)"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="rounded-xl border-gray-200 focus:border-eco-teal focus:ring-eco-teal font-roboto resize-none"
                  />
                  <p className="text-xs text-gray-500 font-roboto">
                    Minimum 10 characters. Be specific to help our team understand the issue.
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image" className="font-roboto font-medium text-gray-700">
                    Photo Evidence
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-eco-teal transition-colors">
                    <input type="file" id="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <label htmlFor="image" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        {formData.image ? (
                          <div className="text-eco-green">
                            <Camera className="h-12 w-12 mb-3" />
                            <p className="text-sm font-roboto font-medium text-gray-900">{formData.image.name}</p>
                            <p className="text-xs text-gray-500 font-roboto mt-1">Click to change photo</p>
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            <Upload className="h-12 w-12 mb-3 mx-auto" />
                            <p className="text-sm font-roboto font-medium text-gray-700">Click to upload photo</p>
                            <p className="text-xs text-gray-500 font-roboto mt-1">PNG, JPG up to 10MB</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <Label className="font-roboto font-medium text-gray-700">Location *</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      className="eco-button border-eco-teal text-eco-teal hover:bg-eco-teal hover:text-white flex-shrink-0 bg-transparent"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Current Location
                    </Button>
                    <div className="text-xs text-gray-500 font-roboto flex items-center">
                      Click to automatically detect your location
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="font-roboto font-medium text-gray-700">
                        Latitude
                      </Label>
                      <Input
                        id="latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        placeholder="12.9716"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        required
                        className="rounded-xl border-gray-200 focus:border-eco-teal focus:ring-eco-teal font-roboto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="font-roboto font-medium text-gray-700">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        placeholder="77.5946"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        required
                        className="rounded-xl border-gray-200 focus:border-eco-teal focus:ring-eco-teal font-roboto"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full eco-button-primary text-lg py-4 font-roboto font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting Report...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
