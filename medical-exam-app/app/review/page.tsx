"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  BookOpen,
  Brain,
  Heart,
  Pill,
  Stethoscope,
  RotateCcw,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface ReviewQuestion {
  id: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
  module: string
  topic: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  dateAnswered: string
}

// Sample review data - in a real app, this would come from user's practice history
const reviewData: ReviewQuestion[] = [
  {
    id: "1",
    question:
      "A 65-year-old patient presents with irregular heart rhythm. ECG shows absence of P waves and irregularly irregular RR intervals. What is the most likely diagnosis?",
    userAnswer: "b",
    correctAnswer: "a",
    isCorrect: false,
    explanation:
      "Atrial fibrillation is characterized by the absence of P waves and irregularly irregular RR intervals on ECG.",
    module: "Cardiology",
    topic: "Arrhythmias",
    difficulty: "Intermediate",
    dateAnswered: "2024-01-15",
  },
  {
    id: "2",
    question: "Which medication is considered first-line treatment for rate control in atrial fibrillation?",
    userAnswer: "b",
    correctAnswer: "b",
    isCorrect: true,
    explanation: "Beta-blockers like metoprolol are first-line agents for rate control in atrial fibrillation.",
    module: "Cardiology",
    topic: "Arrhythmias",
    difficulty: "Intermediate",
    dateAnswered: "2024-01-15",
  },
  {
    id: "3",
    question: "What is the mechanism of action of levodopa in Parkinson's disease?",
    userAnswer: "c",
    correctAnswer: "a",
    isCorrect: false,
    explanation:
      "Levodopa is converted to dopamine in the brain, replacing the depleted dopamine in Parkinson's disease.",
    module: "Neurology",
    topic: "Movement Disorders",
    difficulty: "Advanced",
    dateAnswered: "2024-01-14",
  },
  {
    id: "4",
    question: "Which antibiotic is most appropriate for treating MRSA infections?",
    userAnswer: "d",
    correctAnswer: "d",
    isCorrect: true,
    explanation: "Vancomycin is the gold standard treatment for MRSA infections.",
    module: "Pharmacology",
    topic: "Antibiotics",
    difficulty: "Intermediate",
    dateAnswered: "2024-01-13",
  },
  {
    id: "5",
    question: "What is the most common cause of acute pancreatitis?",
    userAnswer: "a",
    correctAnswer: "b",
    isCorrect: false,
    explanation: "Gallstones are the most common cause of acute pancreatitis, followed by alcohol.",
    module: "Internal Medicine",
    topic: "Gastroenterology",
    difficulty: "Beginner",
    dateAnswered: "2024-01-12",
  },
]

const moduleIcons = {
  Cardiology: Heart,
  Neurology: Brain,
  Pharmacology: Pill,
  "Internal Medicine": Stethoscope,
}

const moduleColors = {
  Cardiology: "bg-red-100 text-red-700",
  Neurology: "bg-purple-100 text-purple-700",
  Pharmacology: "bg-blue-100 text-blue-700",
  "Internal Medicine": "bg-green-100 text-green-700",
}

export default function ReviewPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModule, setSelectedModule] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [showIncorrectOnly, setShowIncorrectOnly] = useState<string>("all")

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
          <p className="text-muted-foreground font-serif">Loading review...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Filter questions based on search and filters
  const filteredQuestions = reviewData.filter((question) => {
    const matchesSearch =
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.topic.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesModule = selectedModule === "all" || question.module === selectedModule
    const matchesDifficulty = selectedDifficulty === "all" || question.difficulty === selectedDifficulty
    const matchesCorrectness = showIncorrectOnly === "all" || (showIncorrectOnly === "incorrect" && !question.isCorrect)

    return matchesSearch && matchesModule && matchesDifficulty && matchesCorrectness
  })

  const incorrectQuestions = reviewData.filter((q) => !q.isCorrect)
  const correctQuestions = reviewData.filter((q) => q.isCorrect)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-sans">Review Questions</h1>
            <p className="text-sm text-muted-foreground font-serif">
              Review your practice history and learn from mistakes
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-sans flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Total Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">{reviewData.length}</div>
              <p className="text-sm text-muted-foreground font-serif">questions answered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-sans flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Correct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500 mb-1">{correctQuestions.length}</div>
              <p className="text-sm text-muted-foreground font-serif">
                {Math.round((correctQuestions.length / reviewData.length) * 100)}% accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-sans flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Need Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500 mb-1">{incorrectQuestions.length}</div>
              <p className="text-sm text-muted-foreground font-serif">incorrect answers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Pharmacology">Pharmacology</SelectItem>
                  <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={showIncorrectOnly} onValueChange={setShowIncorrectOnly}>
                <SelectTrigger>
                  <SelectValue placeholder="All Questions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questions</SelectItem>
                  <SelectItem value="incorrect">Incorrect Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold font-sans mb-2">No questions found</h3>
                <p className="text-muted-foreground font-serif">Try adjusting your filters or search terms.</p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question) => {
              const IconComponent = moduleIcons[question.module as keyof typeof moduleIcons]
              const moduleColor = moduleColors[question.module as keyof typeof moduleColors]

              return (
                <Card
                  key={question.id}
                  className={`border-l-4 ${question.isCorrect ? "border-l-green-500" : "border-l-red-500"}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded ${moduleColor}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <Badge variant="outline">{question.module}</Badge>
                          <Badge variant="outline">{question.topic}</Badge>
                          <Badge variant="outline">{question.difficulty}</Badge>
                        </div>
                        <CardTitle className="text-lg font-sans leading-relaxed">{question.question}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {question.isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-serif leading-relaxed">{question.explanation}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Answered on {new Date(question.dateAnswered).toLocaleDateString()}</span>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <RotateCcw className="h-3 w-3" />
                          Practice Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
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
          <Link
            href="/analytics"
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-serif">Analytics</span>
          </Link>
          <Link href="/review" className="flex flex-col items-center gap-1 p-2 text-primary">
            <RotateCcw className="h-5 w-5" />
            <span className="text-xs font-serif">Review</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
