"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Target,
  Clock,
  Calendar,
  Award,
  AlertTriangle,
  BookOpen,
  Brain,
  Heart,
  Pill,
  Stethoscope,
  RotateCcw,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// Sample analytics data - in a real app, this would come from an API
const performanceData = {
  overallStats: {
    totalQuestions: 565,
    completedQuestions: 342,
    correctAnswers: 248,
    accuracy: 72,
    studyStreak: 12,
    totalStudyTime: 2340, // minutes
    averageSessionTime: 28, // minutes
    weakestModule: "Neurology",
    strongestModule: "Cardiology",
  },
  progressOverTime: [
    { date: "2024-01-01", questions: 45, accuracy: 68 },
    { date: "2024-01-02", questions: 62, accuracy: 71 },
    { date: "2024-01-03", questions: 78, accuracy: 69 },
    { date: "2024-01-04", questions: 95, accuracy: 73 },
    { date: "2024-01-05", questions: 112, accuracy: 75 },
    { date: "2024-01-06", questions: 134, accuracy: 74 },
    { date: "2024-01-07", questions: 156, accuracy: 72 },
    { date: "2024-01-08", questions: 178, accuracy: 76 },
    { date: "2024-01-09", questions: 201, accuracy: 74 },
    { date: "2024-01-10", questions: 225, accuracy: 73 },
    { date: "2024-01-11", questions: 248, accuracy: 75 },
    { date: "2024-01-12", questions: 272, accuracy: 72 },
    { date: "2024-01-13", questions: 295, accuracy: 74 },
    { date: "2024-01-14", questions: 318, accuracy: 73 },
    { date: "2024-01-15", questions: 342, accuracy: 72 },
  ],
  modulePerformance: [
    { module: "Cardiology", completed: 90, total: 120, accuracy: 76, icon: Heart, color: "#ef4444" },
    { module: "Pharmacology", completed: 90, total: 150, accuracy: 72, icon: Pill, color: "#3b82f6" },
    { module: "Internal Medicine", completed: 60, total: 200, accuracy: 70, icon: Stethoscope, color: "#10b981" },
    { module: "Neurology", completed: 43, total: 95, accuracy: 65, icon: Brain, color: "#8b5cf6" },
  ],
  studyHabits: [
    { day: "Mon", minutes: 45 },
    { day: "Tue", minutes: 32 },
    { day: "Wed", minutes: 28 },
    { day: "Thu", minutes: 38 },
    { day: "Fri", minutes: 25 },
    { day: "Sat", minutes: 52 },
    { day: "Sun", minutes: 41 },
  ],
  difficultyBreakdown: [
    { difficulty: "Beginner", correct: 85, total: 95, color: "#10b981" },
    { difficulty: "Intermediate", correct: 132, total: 185, color: "#f59e0b" },
    { difficulty: "Advanced", correct: 31, total: 62, color: "#ef4444" },
  ],
  topicWeaknesses: [
    { topic: "Movement Disorders", module: "Neurology", accuracy: 58, questions: 15 },
    { topic: "Arrhythmias", module: "Cardiology", accuracy: 62, questions: 25 },
    { topic: "CNS Drugs", module: "Pharmacology", accuracy: 64, questions: 20 },
    { topic: "Nephrology", module: "Internal Medicine", accuracy: 66, questions: 12 },
  ],
}

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground font-serif">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const { overallStats } = performanceData

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-sans">Performance Analytics</h1>
            <p className="text-sm text-muted-foreground font-serif">
              Track your progress and identify areas for improvement
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-sans">Overall Accuracy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">{overallStats.accuracy}%</div>
              <p className="text-sm text-muted-foreground font-serif">
                {overallStats.correctAnswers} of {overallStats.completedQuestions} correct
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <CardTitle className="text-lg font-sans">Study Streak</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary mb-2">{overallStats.studyStreak}</div>
              <p className="text-sm text-muted-foreground font-serif">consecutive days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                <CardTitle className="text-lg font-sans">Study Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-2">{Math.round(overallStats.totalStudyTime / 60)}h</div>
              <p className="text-sm text-muted-foreground font-serif">
                {overallStats.averageSessionTime}min avg session
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-sans">Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">
                {Math.round((overallStats.completedQuestions / overallStats.totalQuestions) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground font-serif">
                {overallStats.completedQuestions} of {overallStats.totalQuestions}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="habits">Study Habits</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            {/* Progress Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Progress Over Time</CardTitle>
                <CardDescription className="font-serif">Your learning journey and accuracy trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData.progressOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        }
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value, name) => [
                          name === "questions" ? `${value} questions` : `${value}%`,
                          name === "questions" ? "Questions Completed" : "Accuracy",
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="questions" fill="#01D2AA" name="questions" />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#9C41FF"
                        strokeWidth={3}
                        name="accuracy"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            {/* Module Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Module Performance</CardTitle>
                <CardDescription className="font-serif">
                  Detailed breakdown of your performance in each module
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {performanceData.modulePerformance.map((module) => {
                    const IconComponent = module.icon
                    const progress = Math.round((module.completed / module.total) * 100)

                    return (
                      <div key={module.module} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${module.color}20` }}>
                              <IconComponent className="h-5 w-5" style={{ color: module.color }} />
                            </div>
                            <div>
                              <h3 className="font-semibold font-sans">{module.module}</h3>
                              <p className="text-sm text-muted-foreground font-serif">
                                {module.completed}/{module.total} questions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{module.accuracy}% accuracy</div>
                            <div className="text-sm text-muted-foreground">{progress}% complete</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Accuracy</span>
                              <span>{module.accuracy}%</span>
                            </div>
                            <Progress value={module.accuracy} className="h-2" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="habits" className="space-y-6">
            {/* Study Habits */}
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Weekly Study Pattern</CardTitle>
                <CardDescription className="font-serif">
                  Your study time distribution throughout the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData.studyHabits}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} minutes`, "Study Time"]} />
                      <Bar dataKey="minutes" fill="#01D2AA" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Study Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-sans flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Best Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-1">Saturday</div>
                  <p className="text-sm text-muted-foreground font-serif">52 minutes average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-sans flex items-center gap-2">
                    <Clock className="h-5 w-5 text-secondary" />
                    Peak Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary mb-1">7-9 PM</div>
                  <p className="text-sm text-muted-foreground font-serif">Most active period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-sans flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent" />
                    Consistency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent mb-1">85%</div>
                  <p className="text-sm text-muted-foreground font-serif">Study goal achievement</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="font-sans flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription className="font-serif">Topics where you could focus more attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.topicWeaknesses.map((topic, index) => (
                    <div key={topic.topic} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <h3 className="font-semibold font-sans">{topic.topic}</h3>
                        <p className="text-sm text-muted-foreground font-serif">
                          {topic.module} • {topic.questions} questions attempted
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-yellow-600">{topic.accuracy}%</div>
                        <div className="text-xs text-muted-foreground">accuracy</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Personalized Recommendations</CardTitle>
                <CardDescription className="font-serif">Based on your performance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h3 className="font-semibold font-sans text-primary mb-2">Focus on Neurology</h3>
                    <p className="text-sm font-serif">
                      Your weakest module with 65% accuracy. Consider reviewing Movement Disorders and Dementia topics.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h3 className="font-semibold font-sans text-secondary mb-2">Increase Study Consistency</h3>
                    <p className="text-sm font-serif">
                      Try to maintain your weekend study momentum throughout weekdays for better retention.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <h3 className="font-semibold font-sans text-accent mb-2">Challenge Yourself</h3>
                    <p className="text-sm font-serif">
                      You're doing well with Beginner questions (89%). Try more Advanced level questions to improve
                      further.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-serif">Home</span>
          </Link>
          <Link href="/analytics" className="flex flex-col items-center gap-1 p-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-serif">Analytics</span>
          </Link>
          <Link
            href="/review"
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="text-xs font-serif">Review</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
