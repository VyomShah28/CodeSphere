"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2, Trophy, Users, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import axios from "axios"

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async () => {
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold text-slate-800">Code Sphere</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost">About</Button>
            <Button variant="ghost">Features</Button>
          </div>
        </div>
      </header>

      {/* Centered Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Section */}
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight">
                Organize & Compete in
                <span className="text-emerald-600"> Coding Contests</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                Create challenging programming contests, join competitions worldwide, and track your coding journey with
                comprehensive analytics.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <span className="font-medium text-slate-700">Create Contests</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                  <Users className="h-6 w-6 text-emerald-500" />
                  <span className="font-medium text-slate-700">Join & Compete</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                  <TrendingUp className="h-6 w-6 text-violet-500" />
                  <span className="font-medium text-slate-700">Track Progress</span>
                </div>
              </div>
            </div>

            {/* Auth Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Get Started</CardTitle>
                  <CardDescription>Join thousands of developers in competitive programming</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => window.location.href = "http://127.0.0.1:8000/api/google-login"}
                      disabled={isLoading}
                      size="lg"
                    >
                      <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google Logo" className="h-7 w-7 mr-2 rounded-full bg-white p-1" />

                      {isLoading ? "Signing in..." : "Continue with Google"}
                    </Button>

                    <p className="text-xs text-center text-slate-500">
                      By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}