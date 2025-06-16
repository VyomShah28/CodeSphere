"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Link, Users, Calendar, Clock, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/footer"

export default function JoinContest() {
  const router = useRouter()
  const [contestLink, setContestLink] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [contestInfo, setContestInfo] = useState<any>(null)

  const handleValidateLink = async () => {
    if (!contestLink.trim()) return

    setIsValidating(true)

    // Simulate link validation
    setTimeout(() => {
      setContestInfo({
        name: "Advanced Algorithms Championship",
        description: "Test your skills with complex algorithmic problems",
        startTime: "2024-01-25T14:00:00",
        duration: "3 hours",
        participants: 342,
        challenges: 6,
        organizer: "CodeMaster Pro",
        status: "upcoming",
      })
      setIsValidating(false)
    }, 1500)
  }

  const handleJoinContest = () => {
    router.push("/contest-waiting")
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Join Contest</h1>
            <p className="text-slate-600">Enter a contest link to participate</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Link Input Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link className="h-6 w-6 text-emerald-600" />
              <span>Contest Link</span>
            </CardTitle>
            <CardDescription>Paste the contest invitation link you received</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contest-link">Contest URL</Label>
              <Input
                id="contest-link"
                placeholder="https://codesphere.com/contest/..."
                value={contestLink}
                onChange={(e) => setContestLink(e.target.value)}
              />
            </div>
            <Button
              onClick={handleValidateLink}
              disabled={!contestLink.trim() || isValidating}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isValidating ? "Validating..." : "Validate Link"}
            </Button>
          </CardContent>
        </Card>

        {/* Contest Info Card */}
        {contestInfo && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-emerald-800">{contestInfo.name}</CardTitle>
                <Trophy className="h-6 w-6 text-emerald-600" />
              </div>
              <CardDescription className="text-emerald-700">{contestInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Start Time</p>
                      <p className="text-sm text-emerald-700">{formatDate(contestInfo.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Duration</p>
                      <p className="text-sm text-emerald-700">{contestInfo.duration}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Participants</p>
                      <p className="text-sm text-emerald-700">{contestInfo.participants} registered</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Challenges</p>
                      <p className="text-sm text-emerald-700">{contestInfo.challenges} problems</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Organized by:</strong> {contestInfo.organizer}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Status:</strong> Registration open
                </p>
              </div>

              <Button onClick={handleJoinContest} className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                Join Contest
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <strong>Where to find contest links:</strong> Contest organizers typically share links via email, social
                media, or coding community platforms.
              </p>
              <p>
                <strong>Link format:</strong> Contest links usually look like
                <code className="bg-slate-100 px-1 rounded">https://codesphere.com/contest/contest-id</code>
              </p>
              <p>
                <strong>Registration:</strong> Some contests may require registration before the start time, while
                others allow joining when the contest begins.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
