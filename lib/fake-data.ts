export interface User {
  id: number
  name: string
  email: string
  phone: string
  location: string
  avatar: string
  classYear: string
  status: "active" | "inactive" | "unpaid"
  joinDate: string
  bio: string
  eventsAttended: number
  totalEvents: number
  lastActive: string
  department: string
}

// Generate more fake users for scalability demo
const classYears = ["2025", "2026", "2027", "2028", "NA"]
const departments = ["Engineering", "Design", "Marketing", "Data", "Operations", "Sales", "HR", "Support"]
const locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Los Angeles, CA", "Boston, MA", "Chicago, IL", "Denver, CO", "Miami, FL", "Portland, OR"]
const statuses: ("active" | "inactive" | "unpaid")[] = ["active", "active", "active", "active", "inactive", "unpaid"]

const avatars = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop",
]

const firstNames = ["Sarah", "Michael", "Emily", "David", "Jessica", "Alex", "Olivia", "James", "Emma", "Daniel", "Sophia", "William", "Isabella", "Benjamin", "Mia", "Lucas", "Charlotte", "Henry", "Amelia", "Alexander", "Harper", "Sebastian", "Evelyn", "Jack", "Luna", "Owen", "Chloe", "Liam", "Aria", "Noah", "Ella", "Ethan", "Grace", "Mason", "Lily", "Logan", "Zoe", "Aiden", "Nora", "Jacob"]
const lastNames = ["Johnson", "Chen", "Rodriguez", "Kim", "Martinez", "Thompson", "Brown", "Wilson", "Davis", "Garcia", "Miller", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Green", "Baker", "Adams"]

function generateUser(id: number): User {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const totalEvents = Math.floor(Math.random() * 20) + 5
  const eventsAttended = Math.floor(Math.random() * (totalEvents + 1))

  // Generate join date in MM/DD/YYYY format
  const joinYear = 2021 + Math.floor(Math.random() * 4)
  const joinMonth = Math.floor(Math.random() * 12) + 1
  const joinDay = Math.floor(Math.random() * 28) + 1
  const joinDate = `${String(joinMonth).padStart(2, '0')}/${String(joinDay).padStart(2, '0')}/${joinYear}`

  const lastActiveDays = Math.floor(Math.random() * 30)
  const lastActive = lastActiveDays === 0 ? "Today" : lastActiveDays === 1 ? "Yesterday" : `${lastActiveDays} days ago`

  return {
    id,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    location: locations[Math.floor(Math.random() * locations.length)],
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
    classYear: classYears[Math.floor(Math.random() * classYears.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    joinDate,
    bio: "Dedicated professional with expertise in their field, committed to delivering high-quality work and collaborating with team members.",
    eventsAttended,
    totalEvents,
    lastActive,
    department: departments[Math.floor(Math.random() * departments.length)]
  }
}

// Generate 150 users for demo
export const fakeUsers: User[] = Array.from({ length: 150 }, (_, i) => generateUser(i + 1))
