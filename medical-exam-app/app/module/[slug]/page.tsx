"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Brain,
  Heart,
  Pill,
  Stethoscope,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  BarChart3,
  FileText,
  Target,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface Topic {
  id: string
  name: string
  description: string
  totalQuestions: number
  completedQuestions: number
  correctAnswers: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  estimatedTime: number
}

interface ModuleData {
  name: string
  icon: any
  description: string
  totalQuestions: number
  completedQuestions: number
  correctAnswers: number
  topics: Topic[]
  color: string
}

const moduleData: Record<string, ModuleData> = {
  cardiology: {
    name: "Cardiology",
    icon: Heart,
    description: "Comprehensive study of cardiovascular system, heart diseases, and cardiac procedures",
    totalQuestions: 120,
    completedQuestions: 90,
    correctAnswers: 68,
    color: "bg-red-100 text-red-700",
    topics: [
      {
        id: "arrhythmias",
        name: "Arrhythmias",
        description: "Heart rhythm disorders and their management",
        totalQuestions: 25,
        completedQuestions: 20,
        correctAnswers: 16,
        difficulty: "Advanced",
        estimatedTime: 30,
      },
      {
        id: "heart-failure",
        name: "Heart Failure",
        description: "Pathophysiology and treatment of heart failure",
        totalQuestions: 30,
        completedQuestions: 25,
        correctAnswers: 19,
        difficulty: "Intermediate",
        estimatedTime: 35,
      },
      {
        id: "coronary-artery-disease",
        name: "Coronary Artery Disease",
        description: "CAD diagnosis, management, and interventions",
        totalQuestions: 35,
        completedQuestions: 30,
        correctAnswers: 22,
        difficulty: "Intermediate",
        estimatedTime: 40,
      },
      {
        id: "valvular-disease",
        name: "Valvular Disease",
        description: "Heart valve disorders and surgical interventions",
        totalQuestions: 30,
        completedQuestions: 15,
        correctAnswers: 11,
        difficulty: "Advanced",
        estimatedTime: 35,
      },
    ],
  },
  neurology: {
    name: "Neurology",
    icon: Brain,
    description: "Study of nervous system disorders, neurological conditions, and treatments",
    totalQuestions: 95,
    completedQuestions: 43,
    correctAnswers: 31,
    color: "bg-purple-100 text-purple-700",
    topics: [
      {
        id: "stroke",
        name: "Stroke",
        description: "Cerebrovascular accidents and management",
        totalQuestions: 25,
        completedQuestions: 15,
        correctAnswers: 11,
        difficulty: "Intermediate",
        estimatedTime: 30,
      },
      {
        id: "epilepsy",
        name: "Epilepsy",
        description: "Seizure disorders and anticonvulsant therapy",
        totalQuestions: 20,
        completedQuestions: 12,
        correctAnswers: 9,
        difficulty: "Intermediate",
        estimatedTime: 25,
      },
      {
        id: "movement-disorders",
        name: "Movement Disorders",
        description: "Parkinson's, dystonia, and related conditions",
        totalQuestions: 25,
        completedQuestions: 10,
        correctAnswers: 7,
        difficulty: "Advanced",
        estimatedTime: 30,
      },
      {
        id: "dementia",
        name: "Dementia",
        description: "Cognitive disorders and neurodegenerative diseases",
        totalQuestions: 25,
        completedQuestions: 6,
        correctAnswers: 4,
        difficulty: "Advanced",
        estimatedTime: 30,
      },
    ],
  },
  pharmacology: {
    name: "Pharmacology",
    icon: Pill,
    description: "Drug mechanisms, interactions, and therapeutic applications",
    totalQuestions: 150,
    completedQuestions: 90,
    correctAnswers: 65,
    color: "bg-blue-100 text-blue-700",
    topics: [
      {
        id: "cardiovascular-drugs",
        name: "Cardiovascular Drugs",
        description: "Antihypertensives, antiarrhythmics, and cardiac medications",
        totalQuestions: 40,
        completedQuestions: 30,
        correctAnswers: 22,
        difficulty: "Intermediate",
        estimatedTime: 45,
      },
      {
        id: "antibiotics",
        name: "Antibiotics",
        description: "Antimicrobial agents and resistance patterns",
        totalQuestions: 35,
        completedQuestions: 25,
        correctAnswers: 18,
        difficulty: "Intermediate",
        estimatedTime: 40,
      },
      {
        id: "cns-drugs",
        name: "CNS Drugs",
        description: "Neurological and psychiatric medications",
        totalQuestions: 40,
        completedQuestions: 20,
        correctAnswers: 14,
        difficulty: "Advanced",
        estimatedTime: 45,
      },
      {
        id: "endocrine-drugs",
        name: "Endocrine Drugs",
        description: "Hormonal therapies and metabolic medications",
        totalQuestions: 35,
        completedQuestions: 15,
        correctAnswers: 11,
        difficulty: "Intermediate",
        estimatedTime: 40,
      },
    ],
  },
  "internal-medicine": {
    name: "Internal Medicine",
    icon: Stethoscope,
    description: "General internal medicine, diagnosis, and management of adult diseases",
    totalQuestions: 200,
    completedQuestions: 60,
    correctAnswers: 42,
    color: "bg-green-100 text-green-700",
    topics: [
      {
        id: "infectious-diseases",
        name: "Infectious Diseases",
        description: "Bacterial, viral, and fungal infections",
        totalQuestions: 50,
        completedQuestions: 20,
        correctAnswers: 14,
        difficulty: "Intermediate",
        estimatedTime: 60,
      },
      {
        id: "endocrinology",
        name: "Endocrinology",
        description: "Diabetes, thyroid, and hormonal disorders",
        totalQuestions: 45,
        completedQuestions: 15,
        correctAnswers: 11,
        difficulty: "Intermediate",
        estimatedTime: 50,
      },
      {
        id: "gastroenterology",
        name: "Gastroenterology",
        description: "GI disorders and hepatic conditions",
        totalQuestions: 55,
        completedQuestions: 15,
        correctAnswers: 10,
        difficulty: "Intermediate",
        estimatedTime: 65,
      },
      {
        id: "nephrology",
        name: "Nephrology",
        description: "Kidney diseases and renal function",
        totalQuestions: 50,
        completedQuestions: 10,
        correctAnswers: 7,
        difficulty: "Advanced",
        estimatedTime: 60,
      },
    ],
  },
}

export default function ModulePage({ params }: { params: { slug: string } }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [module, setModule] = useState<ModuleData | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
      return
    }

    const moduleInfo = moduleData[params.slug]
    if (moduleInfo) {
      setModule(moduleInfo)
    } else {
      router.push("/")
    }
  }, [params.slug, user, isLoading, router])

  if (isLoading || !module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground font-serif">Loading module...</p>
        </div>
      </div>
    )
  }

  const IconComponent = module.icon
  const overallProgress = Math.round((module.completedQuestions / module.totalQuestions) * 100)
  const accuracy =
    module.completedQuestions > 0 ? Math.round((module.correctAnswers / module.completedQuestions) * 100) : 0

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-700"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-700"
      case "Advanced":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTopicStatus = (topic: Topic) => {
    const progress = (topic.completedQuestions / topic.totalQuestions) * 100
    if (progress === 100) return { icon: CheckCircle, color: "text-green-500", label: "Complete" }
    if (progress > 0) return { icon: Clock, color: "text-yellow-500", label: "In Progress" }
    return { icon: AlertCircle, color: "text-gray-400", label: "Not Started" }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${module.color}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-sans">{module.name}</h1>
              <p className="text-sm text-muted-foreground font-serif">{module.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Module Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-sans">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-serif">Questions Completed</span>
                  <span className="font-semibold">
                    {module.completedQuestions}/{module.totalQuestions}
                  </span>
                </div>
                <Progress value={overallProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">{overallProgress}% Complete</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-sans">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-serif">Correct Answers</span>
                  <span className="font-semibold">
                    {module.correctAnswers}/{module.completedQuestions}
                  </span>
                </div>
                <Progress value={accuracy} className="h-2" />
                <p className="text-sm text-muted-foreground">{accuracy}% Accuracy</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topics */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 font-sans">Lessons</h2>
          <div className="space-y-3">
            {module.topics.map((topic) => {
              const topicProgress = Math.round((topic.completedQuestions / topic.totalQuestions) * 100)
              const status = getTopicStatus(topic)
              const StatusIcon = status.icon

              return (
                <Card key={topic.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold font-sans">{topic.name}</h3>
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        </div>
                        <p className="text-sm text-muted-foreground font-serif mb-2">{topic.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getDifficultyColor(topic.difficulty)} size="sm">
                            {topic.difficulty}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            <Clock className="h-3 w-3 mr-1" />
                            {topic.estimatedTime}min
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {topic.completedQuestions}/{topic.totalQuestions} questions
                          </span>
                        </div>
                      </div>
                      <Link href={`/practice/${params.slug}/${topic.id}`}>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground ml-4">
                          <Play className="h-4 w-4 mr-1" />
                          Play
                        </Button>
                      </Link>
                    </div>
                    {topicProgress > 0 && (
                      <div className="mt-3">
                        <Progress value={topicProgress} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Final Test button */}
          <Card className="mt-6 bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold font-sans text-primary">Final Test</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    Test yourself on all lessons in this module
                  </p>
                </div>
                <Link href={`/practice/${params.slug}/final-test`}>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Target className="h-4 w-4 mr-2" />
                    Start Final Test
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Consistent bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 p-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <div className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <Play className="h-5 w-5" />
            <span className="text-xs font-medium">Practice</span>
          </div>
          <Link
            href="/analytics"
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-medium">Analytics</span>
          </Link>
          <Link
            href="/review"
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">Review</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
