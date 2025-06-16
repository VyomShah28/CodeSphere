"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, Trophy, Calendar, Play, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/footer"

export default function ContestWaiting() {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 15,
    seconds: 30,
  })
  const [isStarted, setIsStarted] = useState(false)

  const contestInfo = {
    name: "Advanced Algorithms Championship",
    description: "Test your skills with complex algorithmic problems",
    participants: 342,
    challenges: 6,
    duration: "3 hours",
    organizer: "CodeMaster Pro",
  }

  const problems = [
    { id: 1, name: "Binary Tree Maximum Path Sum", difficulty: "Hard", points: 300 },
    { id: 2, name: "Sliding Window Maximum", difficulty: "Hard", points: 250 },
    { id: 3, name: "Longest Increasing Subsequence", difficulty: "Medium", points: 200 },
    { id: 4, name: "Graph Shortest Path", difficulty: "Medium", points: 200 },
    { id: 5, name: "Dynamic Programming Optimization", difficulty: "Hard", points: 350 },
    { id: 6, name: "String Pattern Matching", difficulty: "Medium", points: 150 },
  ]

  const leaderboard = [
    { rank: 1, name: "AlgoMaster2024", score: 1200, solved: 5 },
    { rank: 2, name: "CodeNinja", score: 1150, solved: 5 },
    { rank: 3, name: "ByteWarrior", score: 1100, solved: 4 },
    { rank: 4, name: "DevExpert", score: 950, solved: 4 },
    { rank: 5, name: "PythonPro", score: 900, solved: 3 },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          setIsStarted(true)
          return prev
        }

        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStartContest = () => {
    router.push("/contest-live")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{contestInfo.name}</h1>
              <p className="text-slate-600">Contest Waiting Room</p>
            </div>
          </div>
          <Badge variant={isStarted ? "default" : "secondary"}>
            {isStarted ? "Contest Started" : "Waiting to Start"}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!isStarted ? (
          /* Countdown Section */
          <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-emerald-800">Contest Starts In</CardTitle>
              <CardDescription className="text-emerald-700">
                Get ready for an exciting coding challenge!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-800 mb-2">
                    {timeLeft.hours.toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-emerald-600">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-800 mb-2">
                    {timeLeft.minutes.toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-emerald-600">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-800 mb-2">
                    {timeLeft.seconds.toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-emerald-600">Seconds</div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-emerald-700 mb-4">
                  Use this time to prepare your development environment and review the contest rules.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Contest Started Section */
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-green-800 flex items-center justify-center">
                <Play className="h-8 w-8 mr-3" />
                Contest Has Started!
              </CardTitle>
              <CardDescription className="text-green-700">Click below to enter the coding environment</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleStartContest}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                <Play className="h-5 w-5 mr-2" />
                Enter Contest
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contest Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contest Details */}
            <Card>
              <CardHeader>
                <CardTitle>Contest Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">Participants</p>
                      <p className="text-sm text-slate-600">{contestInfo.participants} registered</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-sm text-slate-600">{contestInfo.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">Problems</p>
                      <p className="text-sm text-slate-600">{contestInfo.challenges} challenges</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">Organizer</p>
                      <p className="text-sm text-slate-600">{contestInfo.organizer}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problems List */}
            {!isStarted ? (
              <Card>
                <CardHeader>
                  <CardTitle>Contest Problems</CardTitle>
                  <CardDescription>
                    {isStarted
                      ? "Click on any problem to start solving"
                      : "Problems will be available when the contest starts"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {problems.map((problem) => (
                      <div
                        key={problem.id}
                        className={`p-4 border rounded-lg ${isStarted ? "cursor-pointer hover:bg-slate-50" : "opacity-60"}`}
                        onClick={isStarted ? () => router.push(`/contest-live?problem=${problem.id}`) : undefined}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-slate-700">
                              {String.fromCharCode(64 + problem.id)}. {problem.name}
                            </span>
                            <Badge className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium">{problem.points} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Contest Challenges</CardTitle>
                  <CardDescription>Click on any challenge to start solving</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {problems.map((problem) => (
                      <div
                        key={problem.id}
                        className="p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => router.push(`/contest-live?problem=${problem.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {String.fromCharCode(64 + problem.id)}. {problem.name}
                          </h4>
                          <Badge className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Registered Participants Leaderboard */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>Registered Participants</span>
                </CardTitle>
                <CardDescription>
                  {isStarted ? "Live rankings (updates every 30 seconds)" : "Contest participants"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((participant) => (
                    <div
                      key={participant.rank}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            participant.rank === 1
                              ? "bg-amber-100 text-amber-800"
                              : participant.rank === 2
                                ? "bg-slate-100 text-slate-800"
                                : participant.rank === 3
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {participant.rank}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{participant.name}</p>
                          <p className="text-xs text-slate-500">
                            {isStarted ? `${participant.solved} solved` : "Ready to compete"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{isStarted ? participant.score : "0"}</p>
                        <p className="text-xs text-slate-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
                {!isStarted && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-slate-500 text-center">
                      Rankings will appear here once the contest starts
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
