"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, BookOpen, RotateCcw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface Answer {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  question: string
  answers: Answer[]
  explanation: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  topic: string
  reference: string
}

interface PracticeSession {
  questions: Question[]
  currentQuestionIndex: number
  userAnswers: Record<string, string>
  showExplanation: boolean
  isCompleted: boolean
  startTime: Date
  endTime?: Date
}

// Sample questions data - in a real app, this would come from an API
const sampleQuestions: Record<string, Question[]> = {
  "cardiology-arrhythmias": [
    {
      id: "1",
      question:
        "A 65-year-old patient presents with irregular heart rhythm. ECG shows absence of P waves and irregularly irregular RR intervals. What is the most likely diagnosis?",
      answers: [
        { id: "a", text: "Atrial fibrillation", isCorrect: true },
        { id: "b", text: "Atrial flutter", isCorrect: false },
        { id: "c", text: "Ventricular tachycardia", isCorrect: false },
        { id: "d", text: "Sinus arrhythmia", isCorrect: false },
      ],
      explanation:
        "Atrial fibrillation is characterized by the absence of P waves and irregularly irregular RR intervals on ECG. The atrial activity appears as fibrillatory waves, and the ventricular response is irregular due to random conduction through the AV node.",
      difficulty: "Intermediate",
      topic: "Arrhythmias",
      reference: "Braunwald's Heart Disease, 12th Edition",
    },
    {
      id: "2",
      question: "Which medication is considered first-line treatment for rate control in atrial fibrillation?",
      answers: [
        { id: "a", text: "Amiodarone", isCorrect: false },
        { id: "b", text: "Metoprolol", isCorrect: true },
        { id: "c", text: "Digoxin", isCorrect: false },
        { id: "d", text: "Flecainide", isCorrect: false },
      ],
      explanation:
        "Beta-blockers like metoprolol are first-line agents for rate control in atrial fibrillation. They effectively slow the ventricular response by blocking beta-adrenergic receptors at the AV node, reducing conduction velocity.",
      difficulty: "Intermediate",
      topic: "Arrhythmias",
      reference: "AHA/ACC/HRS Guidelines for Atrial Fibrillation",
    },
    {
      id: "3",
      question:
        "A patient with atrial fibrillation has a CHA2DS2-VASc score of 3. What is the recommended anticoagulation strategy?",
      answers: [
        { id: "a", text: "No anticoagulation needed", isCorrect: false },
        { id: "b", text: "Aspirin therapy", isCorrect: false },
        { id: "c", text: "Oral anticoagulation with warfarin or DOAC", isCorrect: true },
        { id: "d", text: "Dual antiplatelet therapy", isCorrect: false },
      ],
      explanation:
        "A CHA2DS2-VASc score of 3 indicates high stroke risk, requiring oral anticoagulation. Direct oral anticoagulants (DOACs) or warfarin are recommended to prevent thromboembolic complications in atrial fibrillation patients with elevated stroke risk.",
      difficulty: "Advanced",
      topic: "Arrhythmias",
      reference: "ESC Guidelines for Atrial Fibrillation 2020",
    },
  ],
}

export default function PracticePage({ params }: { params: { module: string; topic: string } }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
      return
    }

    // Initialize practice session
    const questionKey = `${params.module}-${params.topic}`
    const questions = sampleQuestions[questionKey] || []

    if (questions.length === 0) {
      router.push(`/module/${params.module}`)
      return
    }

    setSession({
      questions,
      currentQuestionIndex: 0,
      userAnswers: {},
      showExplanation: false,
      isCompleted: false,
      startTime: new Date(),
    })
  }, [params.module, params.topic, user, isLoading, router])

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground font-serif">Loading practice session...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = session.questions[session.currentQuestionIndex]
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100
  const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1

  const handleAnswerSelect = (answerId: string) => {
    if (session.showExplanation) return
    setSelectedAnswer(answerId)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return

    const newUserAnswers = {
      ...session.userAnswers,
      [currentQuestion.id]: selectedAnswer,
    }

    setSession({
      ...session,
      userAnswers: newUserAnswers,
      showExplanation: true,
    })
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Complete the session
      setSession({
        ...session,
        isCompleted: true,
        endTime: new Date(),
      })
    } else {
      // Move to next question
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex + 1,
        showExplanation: false,
      })
      setSelectedAnswer("")
    }
  }

  const handlePreviousQuestion = () => {
    if (session.currentQuestionIndex > 0) {
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex - 1,
        showExplanation: false,
      })
      setSelectedAnswer(session.userAnswers[session.questions[session.currentQuestionIndex - 1].id] || "")
    }
  }

  const getAnswerStatus = (answer: Answer) => {
    if (!session.showExplanation) return "default"
    if (answer.isCorrect) return "correct"
    if (selectedAnswer === answer.id && !answer.isCorrect) return "incorrect"
    return "default"
  }

  const getAnswerStyles = (status: string, isSelected: boolean) => {
    const baseStyles = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 font-serif"

    if (status === "correct") {
      return `${baseStyles} border-green-500 bg-green-50 text-green-800`
    }
    if (status === "incorrect") {
      return `${baseStyles} border-red-500 bg-red-50 text-red-800`
    }
    if (isSelected) {
      return `${baseStyles} border-primary bg-primary/10 text-primary-foreground`
    }
    return `${baseStyles} border-border hover:border-primary/50 hover:bg-primary/5`
  }

  if (session.isCompleted) {
    const correctAnswers = Object.entries(session.userAnswers).filter(([questionId, answerId]) => {
      const question = session.questions.find((q) => q.id === questionId)
      return question?.answers.find((a) => a.id === answerId)?.isCorrect
    }).length

    const accuracy = Math.round((correctAnswers / session.questions.length) * 100)
    const duration = session.endTime
      ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)
      : 0

    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl font-sans">Practice Complete!</CardTitle>
                <CardDescription className="font-serif">Great job on completing this practice session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {correctAnswers}/{session.questions.length}
                    </p>
                    <p className="text-sm text-muted-foreground font-serif">Correct</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">{accuracy}%</p>
                    <p className="text-sm text-muted-foreground font-serif">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{duration}min</p>
                    <p className="text-sm text-muted-foreground font-serif">Duration</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => window.location.reload()}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Practice Again
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Review Answers
                  </Button>
                </div>

                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-serif">Progress</span>
              <span className="font-semibold">
                {session.currentQuestionIndex + 1}/{session.questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-sans leading-relaxed">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentQuestion.answers.map((answer) => {
                  const status = getAnswerStatus(answer)
                  const isSelected = selectedAnswer === answer.id

                  return (
                    <button
                      key={answer.id}
                      onClick={() => handleAnswerSelect(answer.id)}
                      disabled={session.showExplanation}
                      className={getAnswerStyles(status, isSelected)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                          {answer.id.toUpperCase()}
                        </div>
                        <span className="flex-1">{answer.text}</span>
                        {session.showExplanation && answer.isCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {session.showExplanation && selectedAnswer === answer.id && !answer.isCorrect && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Explanation */}
          {session.showExplanation && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg font-sans flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Explanation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif leading-relaxed mb-4">{currentQuestion.explanation}</p>
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold">Reference: {currentQuestion.reference}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={session.currentQuestionIndex === 0}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {!session.showExplanation ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                Submit Answer
                <CheckCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isLastQuestion ? "Complete Practice" : "Next Question"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
