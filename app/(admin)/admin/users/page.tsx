"use client"

import { UserRow } from "@/components/admin/user-row"
import { fakeUsers } from "@/lib/fake-data"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users } from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"

export default function UsersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const departments = useMemo(() => {
    const depts = new Set(fakeUsers.map(u => u.department))
    return Array.from(depts).sort()
  }, [])

  const filteredUsers = useMemo(() => {
    return fakeUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.classYear.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter
      return matchesSearch && matchesStatus && matchesDepartment
    })
  }, [searchQuery, statusFilter, departmentFilter])

  return (
    <>
      <PageHeader title="Team Directory" showSidebarTrigger />

      <div className="flex flex-1 flex-col">
        {/* Filters */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {filteredUsers.length} of {fakeUsers.length} members
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or class year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Header */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide border-t">
            <div className="w-10" /> {/* Avatar space */}
            <div className="flex-1 grid grid-cols-[1fr_100px_120px_100px_80px] gap-4">
              <span>Name</span>
              <span>Class / Year</span>
              <span>Joined</span>
              <span>Attendance</span>
              <span className="text-right">Status</span>
            </div>
            <div className="w-4" /> {/* Chevron space */}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onClick={() => router.push(`/admin/users/${user.id}`)}
            />
          ))}

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No team members found matching your criteria.</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setDepartmentFilter("all")
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
