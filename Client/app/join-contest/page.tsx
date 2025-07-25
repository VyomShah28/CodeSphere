"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Link, Users, Calendar, Clock, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/footer"
import axios from "axios"
import { Varela_Round } from "next/font/google"

interface Contest{
  id: string
  contest_name: string
  description: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  duration?: string
  participants?: number
  number_of_challenges: number
  organizer?: string
  status?: "upcoming" | "ongoing"| "completed"
}

export default function JoinContest() {
  const router = useRouter()
  const [contestLink, setContestLink] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [showContestBox, setShowContestBox] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)
  const [contestInfo, setContestInfo] = useState<Contest>({
    id: "",
    contest_name: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    duration: "",
    participants: 0,
    number_of_challenges: 0,
    organizer: "",
    status: "upcoming",})

  const handleValidateLink = async () => {
    setIsValidating(true);
    setErrorMessage("");
  if (!contestLink.trim()) return;



  const tempStr = contestLink.split("/").pop() || "";
  const contestId = tempStr.split("=").pop();

  try {
    const response = await axios.get(`https://codesphere-d69g.onrender.com/api/valid-link?link=${contestLink}&userId=${sessionStorage.getItem("userId")}`);
    const data = response.data;
    console.log("Contest data:", data);
    

    const d1: Date = new Date(`${data.start_date}T${data.start_time}`);
    const d2: Date = new Date(`${data.end_date}T${data.end_time}`);
    const today:Date = new Date();

    const hour: number = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60);

    let status: "upcoming" | "ongoing" | "completed"= "upcoming";

    if (d1.getTime() < today.getTime() && d2.getTime() > today.getTime()) {
      status = "ongoing";
      console.log("Contest is ongoing");
      
    } else if (d2.getTime() < today.getTime()) {
      status = "completed";
      console.log("Contest has ended");
      
      setIsCompleted(true);
      setIsValidating(false);
      return
    } else {
      status = "upcoming";
      console.log("Contest is upcoming");
      
    }

    setContestInfo({
      ...data,
      duration: `${hour.toFixed(2)} hours`,
      status: status,
      id: contestId,
    });

    console.log("Duration in hours:", hour);
    setIsValidating(false);
    console.log(contestInfo);
    
    setShowContestBox(true);
    } catch (error:any) {
    console.log(error);
    console.error("Error validating link:", error);
    setErrorMessage(error.response.data.error || "Failed to validate contest link. Please check the link and try again.");
    setIsValidating(false);
  }
};


  const handleJoinContest = () => {
    router.push("/contest-waiting/?contestId=" + contestInfo.id);
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
          <div>
            {errorMessage && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                <p>{errorMessage}</p>
              </div>
            )}
          </div>
          {isCompleted && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
              <p>This contest has already ended. You cannot join it.</p>
            </div>
          )}
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
        {showContestBox && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-emerald-800">{contestInfo.contest_name}</CardTitle>
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
                      <p className="text-sm text-emerald-700">{formatDate(contestInfo.start_date)}</p>
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
                      <p className="text-sm text-emerald-700">{contestInfo.number_of_challenges} problems</p>
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
