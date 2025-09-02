"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Brain, Heart, Pill, Stethoscope, User, LogOut, BarChart3, RotateCcw, ArrowLeft } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function HomePage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const modules = [
    {
      name: "Cardiology",
      slug: "cardiology",
      icon: Heart,
      progress: 75,
      questions: 120,
      color: "bg-red-100 text-red-700",
      lessons: [
        { name: "Arrhythmias", progress: 85, questions: 25 },
        { name: "Heart Failure", progress: 70, questions: 30 },
        { name: "Coronary Artery Disease", progress: 60, questions: 35 },
        { name: "Valvular Disease", progress: 80, questions: 30 },
      ],
      analytics: {
        accuracy: 78,
        studyTime: 45,
        streak: 7,
        weakAreas: ["ECG Interpretation", "Drug Interactions"],
      },
    },
    {
      name: "Neurology",
      slug: "neurology",
      icon: Brain,
      progress: 45,
      questions: 95,
      color: "bg-purple-100 text-purple-700",
      lessons: [
        { name: "Stroke", progress: 60, questions: 20 },
        { name: "Epilepsy", progress: 40, questions: 25 },
        { name: "Movement Disorders", progress: 30, questions: 25 },
        { name: "Dementia", progress: 50, questions: 25 },
      ],
      analytics: {
        accuracy: 65,
        studyTime: 32,
        streak: 3,
        weakAreas: ["Neuroanatomy", "Pharmacology"],
      },
    },
    {
      name: "Pharmacology",
      slug: "pharmacology",
      icon: Pill,
      progress: 60,
      questions: 150,
      color: "bg-blue-100 text-blue-700",
      lessons: [
        { name: "Cardiovascular Drugs", progress: 75, questions: 40 },
        { name: "Antibiotics", progress: 55, questions: 35 },
        { name: "CNS Drugs", progress: 50, questions: 40 },
        { name: "Endocrine Drugs", progress: 60, questions: 35 },
      ],
      analytics: {
        accuracy: 72,
        studyTime: 38,
        streak: 5,
        weakAreas: ["Drug Interactions", "Side Effects"],
      },
    },
    {
      name: "Internal Medicine",
      slug: "internal-medicine",
      icon: Stethoscope,
      progress: 30,
      questions: 200,
      color: "bg-green-100 text-green-700",
      lessons: [
        { name: "Diabetes", progress: 40, questions: 50 },
        { name: "Hypertension", progress: 35, questions: 45 },
        { name: "Respiratory Diseases", progress: 25, questions: 55 },
        { name: "GI Disorders", progress: 20, questions: 50 },
      ],
      analytics: {
        accuracy: 58,
        studyTime: 28,
        streak: 2,
        weakAreas: ["Differential Diagnosis", "Treatment Guidelines"],
      },
    },
  ]

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const selectedModuleData = modules.find((m) => m.slug === selectedModule)

  if (selectedModule && selectedModuleData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 pt-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Modules
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:bg-muted">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl ${selectedModuleData.color} flex items-center justify-center`}>
                <selectedModuleData.icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedModuleData.name}</h1>
                <p className="text-muted-foreground">{selectedModuleData.questions} total questions</p>
              </div>
            </div>

            {/* Module Analytics */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{selectedModuleData.analytics.accuracy}%</p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">{selectedModuleData.analytics.studyTime}h</p>
                    <p className="text-sm text-muted-foreground">Study Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{selectedModuleData.analytics.streak}</p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Areas to Focus:</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedModuleData.analytics.weakAreas.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lessons */}
            <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold">Lessons</h3>
              {selectedModuleData.lessons.map((lesson, index) => (
                <Link
                  key={index}
                  href={`/practice/${selectedModuleData.slug}/${lesson.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Card className="hover:shadow-md transition-all duration-200 active:scale-95">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{lesson.name}</h4>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          Practice
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{lesson.questions} questions</span>
                          <span>{lesson.progress}% complete</span>
                        </div>
                        <Progress value={lesson.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Final Test */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-primary">Final Module Test</h4>
                    <p className="text-sm text-muted-foreground">Test yourself on all lessons</p>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Start Test</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <p className="font-semibold text-lg text-foreground">{user.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:bg-muted">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="px-4">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Study Modules</h3>
          <div className="grid grid-cols-2 gap-3">
            {modules.map((module) => {
              const IconComponent = module.icon
              return (
                <button key={module.name} onClick={() => setSelectedModule(module.slug)} className="w-full">
                  <Card className="hover:shadow-md transition-all duration-200 active:scale-95">
                    <CardContent className="p-4">
                      <div className="text-center space-y-3">
                        <div
                          className={`w-12 h-12 rounded-2xl ${module.color} flex items-center justify-center mx-auto`}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{module.name}</h4>
                          <p className="text-xs text-muted-foreground">{module.questions} questions</p>
                        </div>
                        <div className="space-y-2">
                          <Progress value={module.progress} className="h-1.5" />
                          <Badge variant="secondary" className="text-xs">
                            {module.progress}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/review">
              <Card className="hover:shadow-md transition-all duration-200 active:scale-95">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                      <RotateCcw className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Review Mistakes</h4>
                      <p className="text-sm text-muted-foreground">Learn from incorrect answers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/analytics">
              <Card className="hover:shadow-md transition-all duration-200 active:scale-95">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Performance Analytics</h4>
                      <p className="text-sm text-muted-foreground">Track your study progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
