"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Users,
  Trophy,
  Calendar,
  Play,
  Star,
  Code,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/footer";
import { useContestFullscreen } from "@/hooks/use-contest-fullscreen";
import { useContestSecurity } from "@/hooks/use-contest-security";
import { ContestExitModal } from "@/components/contest-exit-modal";
import { useTabViolations } from "@/hooks/use-tab-violations";
import { InitialContestNotice } from "@/components/initial-contest-notice";
import { TabViolationWarning } from "@/components/tab-violation-warning";
import { AutoSubmitNotification } from "@/components/auto-submit-notification";
import { useSearchParams } from "next/navigation";
import axios from "axios";

interface Contest {
  id: string;
  contest_name: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  duration?: string;
  participants?: number;
  number_of_challenges: number;
  organizer?: string;
  status?: "upcoming" | "ongoing" | "completed";
}

interface Challenge {
  id: string;
  challenge_name: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  max_score: number;
  problem_statement: string;
  constraints: string;
  input_form: string;
  output_form: string;
  sample_testcase: string;
  sample_output: string;
  input_testcase: File;
  output_testcase: File;
  isLeetCode?: boolean;
  cpp_code?: string;
  java_code?: string;
  python_code?: string;
  solved?: boolean;
}

export default function ContestWaiting() {
  const params = useSearchParams();
  const contestId = params.get("contestId") as string;
  const [problems, setProblems] = useState<Challenge[]>([]);

  const router = useRouter();
  const [isStarted, setISStarted] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 30,
  });

  const [showExitModal, setShowExitModal] = useState(false);

  const {
    violationCount,
    showWarning,
    showInitialNotice,
    isTabActive,
    dismissWarning,
    dismissInitialNotice,
    pauseViolationDetection,
    resumeViolationDetection,
  } = useTabViolations();

  const {
    isFullscreen,
    enterFullscreen,
    isSupported,
    shouldEnforceFullscreen,
  } = useContestFullscreen();
  const { enableSecurity } = useContestSecurity();

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
    status: "upcoming",
  });

  const fetchContestInfo = async () => {
    try {
      // Simulate API call
      const response = await fetch(
        `http://localhost:8000/api/get-contest-by-id?contestId=${contestId}`
      );
      const data = await response.json();

      if (data) {
        const d1: Date = new Date(`${data.start_date}T${data.start_time}`);
        const d2: Date = new Date(`${data.end_date}T${data.end_time}`);
        const today: Date = new Date();

        console.log(today, d1);

        const hour: number = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60);

        let status: "upcoming" | "ongoing" | "completed" = "upcoming";

        if (d1.getTime() < today.getTime()) {
          status = "ongoing";
          const timeDiff = d2.getTime() - today.getTime();
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor(
            (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          setTimeLeft({ hours, minutes, seconds });
        } else if (d2.getTime() < today.getTime()) {
          status = "completed";
          console.log("Contest has ended");
        } else {
          status = "upcoming";
          setISStarted(false);
          const timeDiff = d1.getTime() - today.getTime();
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor(
            (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          setTimeLeft({ hours, minutes, seconds });
          console.log(timeLeft);
        }

        setContestInfo({
          ...data,
          duration: `${hour.toFixed(2)} hours`,
          status,
        });
      }
    } catch (error) {
      console.error("Failed to fetch contest info:", error);
    }
  };

  const fetchChallenge = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/get-challenges/?contestId=" + contestId
      );
      if (response.status === 200) {
        const data = response.data;
        setProblems(data);

        console.log("Fetched challenges:", response.data);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  useEffect(() => {
    fetchContestInfo();
    fetchChallenge();
  }, [contestId]);

  const leaderboard = [
    { rank: 1, name: "AlgoMaster2024", score: 1200, solved: 5 },
    { rank: 2, name: "CodeNinja", score: 1150, solved: 5 },
    { rank: 3, name: "ByteWarrior", score: 1100, solved: 4 },
    { rank: 4, name: "DevExpert", score: 950, solved: 4 },
    { rank: 5, name: "PythonPro", score: 900, solved: 3 },
    { rank: 6, name: "DataMaster", score: 850, solved: 3 },
    { rank: 7, name: "CodeCrafter", score: 800, solved: 2 },
    { rank: 8, name: "AlgoSolver", score: 750, solved: 2 },
  ];

  // Contest duration countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          router.push("/final-leaderboard");
          return prev;
        }

        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  // Auto-enable fullscreen on page load - no modal, just do it
  useEffect(() => {
    if (!shouldEnforceFullscreen) return

    const enableFullscreenOnLoad = async () => {
      if (document.fullscreenElement === null && isSupported) {
        try {
          await document.documentElement.requestFullscreen()
          enableSecurity()
        } catch (error) {
          console.warn("Failed to enter fullscreen:", error)
          // Don't show modal, just continue
        }
      } else if (isSupported) {
        enableSecurity()
      }
    }

    // Small delay to ensure page is loaded
    const timer = setTimeout(enableFullscreenOnLoad, 100)
    return () => clearTimeout(timer)
  }, [isSupported, enableSecurity, shouldEnforceFullscreen])

  // Handle page unload/navigation away
  useEffect(() => {
    if (!shouldEnforceFullscreen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Leaving the contest will automatically submit your current progress.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldEnforceFullscreen]);

  // Auto-exit fullscreen when leaving contest page
  useEffect(() => {
    return () => {
      // Cleanup: exit fullscreen when leaving contest-waiting page
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          console.warn("Failed to exit fullscreen on page cleanup");
        });
      }
    };
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleProblemClick = (problemId: string) => {
    // Pause violation detection before navigation
    pauseViolationDetection();

    // Small delay to ensure the pause takes effect
    setTimeout(() => {
      router.push(
        `/contest-live?contestId=${contestId}&challenge=${problemId}`
      );
    }, 100);
  };

  const handleStayInContest = () => {
    setShowExitModal(false);
  };

  const handleExitContest = () => {
    router.push("/final-leaderboard");
  };

  const handleSubmitContest = async () => {
    // Exit fullscreen before navigating to final leaderboard
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn("Failed to exit fullscreen:", error);
      }
    }

    // Navigate to final leaderboard
    router.push("/final-leaderboard");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isStarted) {
                  setShowExitModal(true);
                } else {
                  router.push("/join-contest");
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {contestInfo.contest_name}
              </h1>
              <p className="text-slate-600">Contest Live - Select Challenge</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Time Remaining:</span>
              <span className="font-mono text-lg font-bold text-emerald-600">
                {timeLeft.hours.toString().padStart(2, "0")}:
                {timeLeft.minutes.toString().padStart(2, "0")}:
                {timeLeft.seconds.toString().padStart(2, "0")}
              </span>
            </div>
            <Badge variant="default" className="bg-green-600">
              Contest Live
            </Badge>
            {violationCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                Violations: {violationCount}/3
              </Badge>
            )}
            {!isTabActive && (
              <Badge variant="destructive" className="animate-pulse">
                Tab Inactive
              </Badge>
            )}
            {!isFullscreen && shouldEnforceFullscreen && (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300"
              >
                Entering Fullscreen...
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!isStarted ? (
          /* Countdown Section */
          <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-emerald-800">
                Contest Starts In
              </CardTitle>
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
                  Use this time to prepare your development environment and
                  review the contest rules.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Contest Started Section */
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-green-800 flex items-center justify-center">
                <Play className="h-8 w-8 mr-3" />
                Contest is Live!
              </CardTitle>
              <CardDescription className="text-green-700">
                Select any challenge below to start coding. You can switch
                between challenges at any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Participants</p>
                    <p className="text-sm text-green-700">
                      {contestInfo.participants} registered
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Duration</p>
                    <p className="text-sm text-green-700">
                      {contestInfo.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Problems</p>
                    <p className="text-sm text-green-700">
                      {contestInfo.number_of_challenges} challenges
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Organizer</p>
                    <p className="text-sm text-green-700">
                      {contestInfo.organizer}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2-Column Layout: Challenges List + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Challenges List (2/3 width) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-6 w-6 text-emerald-600" />
                  <span>Contest Challenges</span>
                </CardTitle>
                <CardDescription>
                  Click on any challenge to start solving
                </CardDescription>
              </CardHeader>
              <CardContent
                className={!isStarted ? "opacity-50 pointer-events-none" : ""}
              >
                <div className="space-y-4">
                  {problems.map((problem) => (
                    <div
                      key={problem.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        problem.solved
                          ? "border-green-300 bg-green-50 hover:bg-green-100"
                          : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                      }`}
                      onClick={() => handleProblemClick(problem.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">
                              {problem.difficulty_level === "Easy" && "🟢"}
                              {problem.difficulty_level === "Medium" && "🟡"}
                              {problem.difficulty_level === "Hard" && "🔴"}
                            </span>
                            <div>
                              <h4 className="font-semibold text-slate-800 flex items-center">
                                {problem.challenge_name}
                                {problem.solved && (
                                  <div className="ml-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">
                                      ✓
                                    </span>
                                  </div>
                                )}
                              </h4>
                              <div className="flex items-center space-x-3 mt-1">
                                <Badge
                                  className={getDifficultyColor(
                                    problem.difficulty_level
                                  )}
                                >
                                  {problem.difficulty_level}
                                </Badge>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-amber-500" />
                                  <span className="text-sm font-medium text-slate-600">
                                    {problem.max_score} points
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {problem.solved && (
                            <div className="flex items-center space-x-2 text-green-700 text-sm bg-green-100 px-3 py-1 rounded-full">
                              <Trophy className="h-4 w-4" />
                              <span className="font-medium">Completed</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            className={`${
                              problem.solved
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            } text-white shadow-sm`}
                          >
                            <Code className="h-4 w-4 mr-1" />
                            {problem.solved ? "Review" : "Solve"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Live Leaderboard (1/3 width) */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>Live Leaderboard</span>
                </CardTitle>
                <CardDescription>Updates every 30 seconds</CardDescription>
              </CardHeader>
              <CardContent>
                {!isStarted ? (
                  <div className="text-center text-slate-500 mb-4">
                    {" "}
                    No Submission
                  </div>
                ) : (
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
                            <p className="font-medium text-sm">
                              {participant.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {participant.solved} solved
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">
                            {participant.score}
                          </p>
                          <p className="text-xs text-slate-500">points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Contest Button */}
        {isStarted && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSubmitContest}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg px-8 py-4 text-lg font-semibold"
              size="lg"
            >
              <Send className="h-5 w-5 mr-2" />
              Submit Contest & End Participation
            </Button>
          </div>
        )}
      </div>

      {/* Initial Contest Notice */}
      <InitialContestNotice
        isOpen={showInitialNotice}
        onAccept={dismissInitialNotice}
        contestName={contestInfo.contest_name}
      />

      {/* Tab Violation Warning */}
      <TabViolationWarning
        isVisible={showWarning}
        violationCount={violationCount}
        onDismiss={dismissWarning}
      />

      {/* Auto-Submit Notification */}
      <AutoSubmitNotification
        isVisible={violationCount >= 3}
        onComplete={() => router.push("/final-leaderboard")}
      />

      {/* Contest Exit Modal */}

      <ContestExitModal
        isOpen={showExitModal}
        onStay={handleStayInContest}
        onExit={handleExitContest}
        contestName={contestInfo.contest_name}
      />

      <Footer />
    </div>
  );
}
