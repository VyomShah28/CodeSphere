"use client"

import { use, useContext, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trophy, Users, TrendingUp, Code2, Settings, LogOut, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/footer"
import { useSearchParams } from "next/navigation"
import { useUser } from "../../context/userContext";
import axios from "axios"

export default function Dashboard() {
 const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useUser();

  const fetchUserDetails = async (id: string, name: string, avatar: string) => {
    try {
      const response = await axios.get(
        `https://codesphere-d69g.onrender.com/api/user-details/?user_id=${id}`
      );

      const completeUser = {
        id,
        name,
        avatar,
        contestsCreated: response.data.contest_created,
        contestsJoined: response.data.contest_participated,
        currentRank: 0,
      };

      setUser(completeUser); 
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    const nameFromUrl = searchParams.get("full_name");
    const avatarFromUrl = searchParams.get("url");

    const storedId = sessionStorage.getItem("userId");
    const storedName = sessionStorage.getItem("userName");
    const storedAvatar = sessionStorage.getItem("userAvatar");

    if (idFromUrl && nameFromUrl && avatarFromUrl) {

      sessionStorage.setItem("userId", idFromUrl);
      sessionStorage.setItem("userName", nameFromUrl);
      sessionStorage.setItem("userAvatar", avatarFromUrl);
      fetchUserDetails(idFromUrl, nameFromUrl, avatarFromUrl);
    } else if (storedId && storedName && storedAvatar) {
   
      fetchUserDetails(storedId, storedName, storedAvatar);
    } else {
      router.push("/login");
    }
  }, []); 

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Code2 className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold text-slate-800">Code Sphere</span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Dashboard
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <img
                src={sessionStorage.getItem("userAvatar") || user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-slate-200"
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome back, {sessionStorage.getItem('userName')}! 👋</h1>
          <p className="text-slate-600">Ready to create amazing contests or join exciting challenges?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contests Created</CardTitle>
              <Trophy className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.contestsCreated}</div>
              <p className="text-xs text-slate-500">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contests Joined</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.contestsJoined}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Rank</CardTitle>
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{user.currentRank}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card
            className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group"
            onClick={() => router.push("/create-contest")}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <Plus className="h-6 w-6 text-orange-400 transition-colors" />
                </div>
                <div>
                  <CardTitle className="transition-colors">Create Contest</CardTitle>
                  <CardDescription>Design and organize your own coding challenges</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-white text-slate-700 border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300"
              >
                Start Creating
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group"
            onClick={() => router.push("/contests")}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <Trophy className="h-6 w-6 text-yellow-400 transition-colors" />
                </div>
                <div>
                  <CardTitle className="transition-colors">View Your Contests</CardTitle>
                  <CardDescription>Manage and monitor your created contests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-white text-slate-700 border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300"
              >
                View Contests ({user.contestsCreated})
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group"
            onClick={() => router.push("/join-contest")}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-400 transition-colors" />
                </div>
                <div>
                  <CardTitle className="transition-colors">Join Contest</CardTitle>
                  <CardDescription>Enter a contest link and start competing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-white text-slate-700 border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300"
              >
                Join Now
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group"
            onClick={() => router.push("/progress")}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <TrendingUp className="h-6 w-6 text-purple-400 transition-colors" />
                </div>
                <div>
                  <CardTitle className="transition-colors">Track Progress</CardTitle>
                  <CardDescription>View your performance analytics and history</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-white text-slate-700 border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300"
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
