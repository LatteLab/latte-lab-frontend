"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import type { User } from "@/lib/fake-data"

interface UserRowProps {
  user: User
  onClick: () => void
  isSelected?: boolean
}

export function UserRow({ user, onClick, isSelected }: UserRowProps) {
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
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors border-b border-border hover:bg-muted/50 ${
        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
      }`}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="text-sm">{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_100px_120px_100px_80px] gap-2 sm:gap-4 items-center">
        <div className="min-w-0">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>

        <div className="hidden sm:block">
          <p className="text-sm text-muted-foreground truncate">{user.classYear}</p>
        </div>

        <div className="hidden sm:block">
          <p className="text-sm text-muted-foreground truncate">{user.joinDate}</p>
        </div>

        <div className="hidden sm:block">
          <p className="text-sm text-muted-foreground">{attendancePercent}%</p>
        </div>

        <div className="hidden sm:flex justify-end">
          <Badge variant="outline" className={`text-xs ${getStatusColor(user.status)}`}>
            {user.status}
          </Badge>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  )
}
