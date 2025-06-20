"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Users, Clock, Edit, Trash2, Eye, ExternalLink, Plus, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/footer"
import axios from "axios"
import { useUser } from "../../context/userContext"
import { create } from "domain"
import { set } from "date-fns"

interface Contest {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  participants: number
  status: "upcoming" | "active" | "completed"
  link: string
  challenges: number
}

export default function ContestsPage() {
  const router = useRouter()
  const [delete_id,setDelete_id] = useState<string>("-1")
  const [searchTerm, setSearchTerm] = useState("")
  const [contests, setContests] = useState<Contest[]>()
  const [deletedContestId, setDeletedContestId] = useState<string[]>()
  const user = useUser()

  useEffect(() => { 
    const fetchContests = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/get-contests?userId=" + sessionStorage.getItem("userId"))
        if (response.status === 200) {
          setContests(response.data.data)
        } else {
          console.error("Failed to fetch contests:", response.statusText)
        }
        setDelete_id("-1")
        setDeletedContestId([])
      }
      catch (error) {
        console.error("Error fetching contests:", error)
      }
    }
    fetchContests()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "upcoming":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredContests = contests?.filter(
    (contest) =>
      contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contest.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    if (delete_id === "-1") return
    console.log("Deleting contest with ID:", delete_id);
    setContests(prev => prev?.filter((c) => c.id !== delete_id));
    setDeletedContestId((prev) => [...(prev || []), delete_id])
  }, [delete_id])

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (deletedContestId && deletedContestId.length > 0) {
        navigator.sendBeacon(
          "http://127.0.0.1:8000/api/delete-contests/",
          JSON.stringify({ ids: deletedContestId })
        );
      }
  };

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [deletedContestId]);
  

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => {
              handleBeforeUnload(new Event("beforeunload"));
              router.push("/dashboard")
            }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Your Contests</h1>
              <p className="text-slate-600">Manage and monitor your created contests</p>
            </div>
          </div>
          <div className="group">
            <Button
              onClick={() => router.push("/create-contest")}
              className="bg-emerald-600 hover:bg-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search contests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Contest Grid */}
        {filteredContests?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No contests found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Create your first contest to get started"}
              </p>
              <Button onClick={() => router.push("/create-contest")} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Contest
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests?.map((contest) => (
              <Card key={contest.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{contest.name}</CardTitle>
                      <CardDescription className="text-sm">{contest.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(contest.status)}>{contest.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Contest Info */}
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Start:{formatDate(contest.startDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>End: {formatDate(contest.endDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{contest.participants} participants</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{contest.challenges} challenges</span>
                      </div>
                    </div>

                    {/* Contest Link */}
                    <div className="p-2 bg-slate-50 rounded text-xs font-mono break-all">{contest.link}</div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/edit-contest/${contest.id}`)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { console.log(contest.id); setDelete_id(contest.id); console.log("Delete button clicked",delete_id) }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
