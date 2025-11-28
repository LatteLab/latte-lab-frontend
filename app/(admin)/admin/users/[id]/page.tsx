"use client"

import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Building2, Clock, BarChart3, Users, MessageSquare, GraduationCap, CreditCard, Activity } from "lucide-react"
import { fakeUsers } from "@/lib/fake-data"
import { PageHeader } from "@/components/ui/page-header"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = Number(params.id)

  const user = fakeUsers.find(u => u.id === userId)

  if (!user) {
    return (
      <>
        <PageHeader title="User Not Found" showSidebarTrigger />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">User Not Found</h1>
            <p className="text-muted-foreground mb-4">The user you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push("/admin/users")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Button>
          </div>
        </div>
      </>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      case "inactive":
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
      case "unpaid":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
    }
  }

  const attendancePercent = Math.round((user.eventsAttended / user.totalEvents) * 100)

  return (
    <>
      <PageHeader title="User Details" showSidebarTrigger />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Back Button */}
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
            <Avatar className="h-28 w-28">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-3xl">{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <Badge variant="outline" className={`text-sm ${getStatusColor(user.status)}`}>
                  {user.status}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground mb-3">{user.department}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>Class of {user.classYear}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {user.joinDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Active {user.lastActive}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline">
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contact & Work Info */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{user.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Membership Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Membership Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Class / Year</p>
                      <p className="text-sm font-medium">{user.classYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{user.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Join Date</p>
                      <p className="text-sm font-medium">{user.joinDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="outline" className={`mt-1 ${getStatusColor(user.status)}`}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle & Right Column - Statistics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{user.eventsAttended}</p>
                    <p className="text-xs text-muted-foreground">Events Attended</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{attendancePercent}%</p>
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{Math.floor(Math.random() * 50) + 10}</p>
                    <p className="text-xs text-muted-foreground">Messages Sent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">${Math.floor(Math.random() * 500) + 100}</p>
                    <p className="text-xs text-muted-foreground">Contributions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Event Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Event Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Events attended this year</span>
                      <span className="font-medium">{user.eventsAttended} / {user.totalEvents}</span>
                    </div>
                    <Progress value={attendancePercent} className="h-3" />
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xl font-semibold">{user.eventsAttended}</p>
                        <p className="text-xs text-muted-foreground">Attended</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xl font-semibold">{user.totalEvents - user.eventsAttended}</p>
                        <p className="text-xs text-muted-foreground">Missed</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xl font-semibold">{user.totalEvents}</p>
                        <p className="text-xs text-muted-foreground">Total Events</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{user.bio}</p>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="text-sm">Attended &quot;Annual Team Meeting&quot;</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      <div>
                        <p className="text-sm">Updated profile information</p>
                        <p className="text-xs text-muted-foreground">5 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                      <div>
                        <p className="text-sm">RSVPed to &quot;Networking Event&quot;</p>
                        <p className="text-xs text-muted-foreground">1 week ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                      <div>
                        <p className="text-sm">Completed membership renewal</p>
                        <p className="text-xs text-muted-foreground">2 weeks ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
