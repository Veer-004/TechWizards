"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MapPin, Filter, Edit, FileText, CheckCircle } from "lucide-react";

interface User {
  id: string;
  name: string;
  is_banned: boolean;
}

interface Report {
  id: string;
  user_id: string;
  user_name: string; // 👈 Add this if your backend returns it
  user_banned: boolean;
  description: string;
  status: "Pending" | "In Progress" | "Resolved";
  location: {
    coordinates: [number, number];
  };
  created_at: string;
  updated_at: string;
  image_url?: string;
  admin_remarks?: string;
}

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/reports");
        const result = await res.json();

        const data: Report[] = result.reports || []; // ✅ Extract correct array

        setReports(data);
        setFilteredReports(data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    let filtered = reports;

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.id.includes(searchTerm)
      );
    }

    setFilteredReports(filtered);
  }, [reports, statusFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "destructive";
      case "In Progress":
        return "default";
      case "Resolved":
        return "secondary";
      default:
        return "default";
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/users/${userId}/ban/`,
        {
          method: "DELETE", // or "POST"/"PUT" based on your backend setup
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to ban user: ${res.status} - ${errText}`);
      }

      // Optional: Remove reports by banned user from UI
      setReports((prev) => prev.filter((r) => r.user_id !== userId));
      setFilteredReports((prev) => prev.filter((r) => r.user_id !== userId));

      alert("User has been banned and removed from the system.");
    } catch (err: any) {
      console.error("Ban user error:", err.message);
      alert("Error banning user: " + err.message);
    }
  };

  const handleStatusUpdate = async (reportId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/reports/${reportId}/update/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            admin_remarks: adminRemarks,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status in backend");
      }

      const updatedReport: Report = await res.json();

      // Update local state with new data
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? updatedReport : r))
      );

      setFilteredReports((prev) =>
        prev.map((r) => (r.id === reportId ? updatedReport : r))
      );
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update report status");
    } finally {
      setSelectedReport(null);
      setNewStatus("");
      setAdminRemarks("");
    }
  };

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "Pending").length,
    inProgress: reports.filter((r) => r.status === "In Progress").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <span className="text-sm text-gray-500">No authentication</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reports
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
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
              <div className="text-2xl font-bold text-red-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <div className="h-3 w-3 bg-yellow-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.inProgress}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.resolved}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by description or ID..."
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Report #{report.id}
                    </CardTitle>
                    <CardDescription>
                      Submitted on{" "}
                      {new Date(report.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(report.status) as any}>
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.image_url && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={report.image_url}
                      alt="Waste report"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-700">{report.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {report.location.coordinates[1].toFixed(4)},{" "}
                  {report.location.coordinates[0].toFixed(4)}
                </div>
                {report.admin_remarks && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Admin Remarks:
                    </p>
                    <p className="text-sm text-blue-800">
                      {report.admin_remarks}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Dialog>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBanUser(report.user_id)}
                      disabled={report.user_banned} // 🔒 Prevents repeat bans
                    >
                      {report.user_banned ? "User Banned" : "Ban User"}
                    </Button>

                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setNewStatus(report.status);
                          setAdminRemarks(report.admin_remarks || "");
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Report Status</DialogTitle>
                        <DialogDescription>
                          Update the status and add remarks for report #
                          {selectedReport?.id}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={newStatus}
                            onValueChange={setNewStatus}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Admin Remarks</Label>
                          <Textarea
                            placeholder="Add remarks about the status update..."
                            value={adminRemarks}
                            onChange={(e) => setAdminRemarks(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={() =>
                            selectedReport &&
                            handleStatusUpdate(selectedReport.id)
                          }
                          className="w-full"
                        >
                          Update Report
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                No reports found matching your criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
