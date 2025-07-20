"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Users, Clock, Calendar, Home, XCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Footer } from "@/components/footer"
import { useState, useEffect } from "react"
import axios from "axios"

interface rankCard  {
  rank: number
  name: string
  score: number
  solved: number
  totalProblems: number
  timeTaken: string
  avatar: string
}

export default function FinalLeaderboard() {
  const router = useRouter()
   const searchParams = useSearchParams()
   const contestId = searchParams.get("contestId")
   const [isLoading,setIsLoading] = useState(false)

  const [wasViolation, setWasViolation] = useState(false)
  const [violationReason, setViolationReason] = useState("")
  const [finalRankings,setFinalRankings] = useState<rankCard[]>([])


  const fetchLeaderboard = async () => {
     setIsLoading(true)
         try {

      const response = await axios.post("http://localhost:8000/api/getLeaderboard",{
        "contest": contestId
      })

     console.log("Contest leaderboard data:", response.data);
     setFinalRankings(response.data.finalRankings || [])
     
      
    } catch (error) {
      console.error("Error checking contest violations:", error)
      
    }

    setIsLoading(false)
  }


  useEffect(() => {
    // Check if user was redirected due to violations
    const violation = sessionStorage.getItem("contestViolation")
    const reason = sessionStorage.getItem("violationReason")

    if (violation === "true") {
      setWasViolation(true)
      setViolationReason(reason || "Contest rule violations")
    }

    fetchLeaderboard()

    // Clear ALL contest-related session storage when reaching final leaderboard
    sessionStorage.removeItem("contestViolation")
    sessionStorage.removeItem("violationReason")
    sessionStorage.removeItem("violationCount")
    sessionStorage.removeItem("contestViolationCount")
    sessionStorage.removeItem("contestInitialNoticeShown")
  }, [])

  const contestInfo = {
    name: "Advanced Algorithms Championship",
    totalParticipants: 342,
    duration: "3 hours",
    completedAt: "2024-01-25T17:00:00",
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {rank}
          </div>
        )
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
    if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
    if (rank <= 10) return "bg-emerald-100 text-emerald-800"
    return "bg-slate-100 text-slate-600"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

    if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">🏆 Contest Complete!</h1>
              <p className="text-slate-600">{contestInfo.name}</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Violation Notice (if applicable) */}
      {wasViolation && (
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-800 flex items-center justify-center">
              <XCircle className="h-8 w-8 mr-3" />
              Contest Auto-Submitted Due to Violations
            </CardTitle>
            <CardDescription className="text-red-700">
              Your contest was automatically submitted due to: {violationReason}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-red-100 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">
                ⛔ Your contest participation was ended early due to multiple rule violations. Your progress up to that
                point has been saved and submitted.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Contest Summary */}
        <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-800">Final Results</CardTitle>
            <CardDescription className="text-emerald-700">
              Contest completed on {formatDate(contestInfo.completedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex items-center justify-center space-x-3">
                <Users className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-bold text-2xl text-emerald-800">{contestInfo.totalParticipants}</p>
                  <p className="text-sm text-emerald-700">Total Participants</p>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Clock className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-bold text-2xl text-emerald-800">{contestInfo.duration}</p>
                  <p className="text-sm text-emerald-700">Contest Duration</p>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Trophy className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-bold text-2xl text-emerald-800">6</p>
                  <p className="text-sm text-emerald-700">Total Problems</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {finalRankings.slice(0, 3).map((participant, index) => (
            <Card
              key={participant?.rank}
              className={`text-center ${
                index === 0
                  ? "order-2 md:order-2 transform md:scale-110"
                  : index === 1
                    ? "order-1 md:order-1"
                    : "order-3 md:order-3"
              } ${
                participant?.rank === 1
                  ? "border-yellow-300 bg-gradient-to-b from-yellow-50 to-yellow-100"
                  : participant?.rank === 2
                    ? "border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100"
                    : "border-orange-300 bg-gradient-to-b from-orange-50 to-orange-100"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-center mb-4">{getRankIcon(participant.rank)}</div>
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center text-xl font-bold text-slate-700">
                   <img src={participant.avatar} className="rounded-full"></img>
                </div>
                <CardTitle className="text-lg">{participant.name}</CardTitle>
                <Badge className={`${getRankBadge(participant.rank)} text-sm px-3 py-1`}>
                  Rank #{participant.rank}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-slate-800">{participant.score}</div>
                  <div className="text-sm text-slate-600">
                    {participant.solved}/{participant.totalProblems} solved
                  </div>
                  <div className="text-xs text-slate-500">Time: {participant.timeTaken}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              <span>Final Leaderboard</span>
            </CardTitle>
            <CardDescription>Complete rankings for all participants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {finalRankings.map((participant) => (
                <div
                  key={participant.rank}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    participant.rank <= 3
                      ? "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10">{getRankIcon(participant.rank)}</div>
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700">
                      <img src={participant.avatar} className="rounded-full"></img>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{participant.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>
                          {participant.solved}/{participant.totalProblems} problems solved
                        </span>
                        <span>Time: {participant.timeTaken}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-800">{participant.score}</div>
                    <div className="text-sm text-slate-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button onClick={() => router.push("/dashboard")} className="bg-emerald-600 hover:bg-emerald-700">
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={() => router.push("/progress")}>
            <Calendar className="h-4 w-4 mr-2" />
            View Progress
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
