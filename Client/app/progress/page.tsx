"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, TrendingUp, Trophy, Calendar, Target, Award, BarChart3, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Footer } from "@/components/footer"

export default function ProgressPage() {
  const router = useRouter()

  const rankData = [
    { contest: "Contest 1", rank: 45, participants: 120 },
    { contest: "Contest 2", rank: 32, participants: 150 },
    { contest: "Contest 3", rank: 28, participants: 180 },
    { contest: "Contest 4", rank: 15, participants: 200 },
    { contest: "Contest 5", rank: 12, participants: 220 },
    { contest: "Contest 6", rank: 8, participants: 250 },
  ]

  const skillData = [
    { skill: "Algorithms", score: 85 },
    { skill: "Data Structures", score: 78 },
    { skill: "Dynamic Programming", score: 72 },
    { skill: "Graph Theory", score: 68 },
    { skill: "String Processing", score: 75 },
    { skill: "Mathematics", score: 65 },
  ]

  const contestHistory = [
    {
      id: 1,
      name: "Weekly Algorithm Challenge #42",
      date: "2024-01-15",
      rank: 8,
      participants: 250,
      score: 1200,
      problems: 4,
      solved: 3,
      status: "completed",
    },
    {
      id: 2,
      name: "Data Structures Mastery",
      date: "2024-01-10",
      rank: 12,
      participants: 220,
      score: 950,
      problems: 5,
      solved: 4,
      status: "completed",
    },
    {
      id: 3,
      name: "Dynamic Programming Deep Dive",
      date: "2024-01-05",
      rank: 15,
      participants: 200,
      score: 800,
      problems: 6,
      solved: 3,
      status: "completed",
    },
    {
      id: 4,
      name: "Graph Algorithms Contest",
      date: "2024-01-01",
      rank: 28,
      participants: 180,
      score: 650,
      problems: 4,
      solved: 2,
      status: "completed",
    },
  ]

  const stats = {
    totalContests: 12,
    averageRank: 18,
    bestRank: 3,
    totalScore: 9850,
    problemsSolved: 45,
    currentStreak: 5,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Progress Analytics</h1>
            <p className="text-slate-600">Track your competitive programming journey</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contests</CardTitle>
              <Trophy className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContests}</div>
              <p className="text-xs text-slate-500">+2 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rank</CardTitle>
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{stats.averageRank}</div>
              <p className="text-xs text-slate-500">↑5 improvement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Rank</CardTitle>
              <Award className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{stats.bestRank}</div>
              <p className="text-xs text-slate-500">Personal best</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
              <Target className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.problemsSolved}</div>
              <p className="text-xs text-slate-500">{stats.currentStreak} day streak</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Rank Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                <span>Rank Progress</span>
              </CardTitle>
              <CardDescription>Your ranking improvement over recent contests</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rankData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="contest" />
                  <YAxis reversed domain={[1, "dataMax"]} />
                  <Tooltip
                    formatter={(value, name) => [`Rank ${value}`, "Your Rank"]}
                    labelFormatter={(label) => `Contest: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="rank"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skill Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Assessment</CardTitle>
              <CardDescription>Your performance across different topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillData.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{skill.skill}</span>
                      <span className="text-slate-500">{skill.score}%</span>
                    </div>
                    <Progress value={skill.score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contest History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-violet-600" />
              <span>Contest History</span>
            </CardTitle>
            <CardDescription>Your recent contest participations and results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contestHistory.map((contest) => (
                <div
                  key={contest.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg">
                      <Trophy className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{contest.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(contest.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {contest.participants} participants
                        </span>
                        <span>
                          {contest.solved}/{contest.problems} solved
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-bold text-lg">#{contest.rank}</p>
                        <p className="text-sm text-slate-500">{contest.score} pts</p>
                      </div>
                      <Badge variant={contest.rank <= 10 ? "default" : contest.rank <= 50 ? "secondary" : "outline"}>
                        {contest.rank <= 10 ? "Excellent" : contest.rank <= 50 ? "Good" : "Average"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
