"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Heart, Brain, Pill, Stethoscope, Home, Search, BarChart3, RotateCcw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface QuizConfig {
  modules: string[]
  topics: string[]
  difficulties: string[]
  questionCount: number
  timeLimit: number | null
  randomOrder: boolean
}

const moduleData = {
  Cardiology: {
    icon: Heart,
    color: "bg-red-100 text-red-700",
    topics: ["Arrhythmias", "Heart Failure", "Coronary Artery Disease", "Valvular Disease"],
  },
  Neurology: {
    icon: Brain,
    color: "bg-purple-100 text-purple-700",
    topics: ["Stroke", "Epilepsy", "Movement Disorders", "Dementia"],
  },
  Pharmacology: {
    icon: Pill,
    color: "bg-blue-100 text-blue-700",
    topics: ["Cardiovascular Drugs", "Antibiotics", "CNS Drugs", "Endocrine Drugs"],
  },
  "Internal Medicine": {
    icon: Stethoscope,
    color: "bg-green-100 text-green-700",
    topics: ["Infectious Diseases", "Endocrinology", "Gastroenterology", "Nephrology"],
  },
}

export default function CustomQuizPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [config, setConfig] = useState<QuizConfig>({
    modules: [],
    topics: [],
    difficulties: [],
    questionCount: 10,
    timeLimit: null,
    randomOrder: true,
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground font-sans">Custom Quiz</h1>
          <p className="text-sm text-muted-foreground font-serif">Loading quiz builder...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleModuleToggle = (module: string) => {
    setConfig((prev) => ({
      ...prev,
      modules: prev.modules.includes(module) ? prev.modules.filter((m) => m !== module) : [...prev.modules, module],
    }))
  }

  const handleTopicToggle = (topic: string) => {
    setConfig((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic) ? prev.topics.filter((t) => t !== topic) : [...prev.topics, topic],
    }))
  }

  const handleDifficultyToggle = (difficulty: string) => {
    setConfig((prev) => ({
      ...prev,
      difficulties: prev.difficulties.includes(difficulty)
        ? prev.difficulties.filter((d) => d !== difficulty)
        : [...prev.difficulties, difficulty],
    }))
  }

  const getAvailableTopics = () => {
    if (config.modules.length === 0) return []

    return config.modules.flatMap((module) => moduleData[module as keyof typeof moduleData]?.topics || [])
  }

  const canStartQuiz = config.modules.length > 0 && config.difficulties.length > 0

  const handleStartQuiz = () => {
    if (canStartQuiz) {
      // In a real app, this would navigate to a custom quiz session
      console.log("Starting custom quiz with config:", config)
      router.push("/practice/custom/quiz")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-sans">Custom Quiz</h1>
            <p className="text-sm text-muted-foreground font-serif">Create a personalized practice session</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Module Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans">Select Modules</CardTitle>
                  <CardDescription className="font-serif">Choose which medical modules to include</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(moduleData).map(([module, data]) => {
                      const IconComponent = data.icon
                      const isSelected = config.modules.includes(module)

                      return (
                        <div
                          key={module}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleModuleToggle(module)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isSelected} readOnly />
                            <div className={`p-2 rounded-lg ${data.color}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold font-sans">{module}</h3>
                              <p className="text-sm text-muted-foreground font-serif">{data.topics.length} topics</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Topic Selection */}
              {config.modules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-sans">Select Topics (Optional)</CardTitle>
                    <CardDescription className="font-serif">
                      Leave empty to include all topics from selected modules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getAvailableTopics().map((topic) => (
                        <div key={topic} className="flex items-center space-x-2">
                          <Checkbox
                            id={topic}
                            checked={config.topics.includes(topic)}
                            onCheckedChange={() => handleTopicToggle(topic)}
                          />
                          <Label htmlFor={topic} className="font-serif text-sm cursor-pointer">
                            {topic}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Difficulty Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans">Select Difficulty</CardTitle>
                  <CardDescription className="font-serif">Choose question difficulty levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {["Beginner", "Intermediate", "Advanced"].map((difficulty) => {
                      const isSelected = config.difficulties.includes(difficulty)
                      const colors = {
                        Beginner: "border-green-500 bg-green-50 text-green-700",
                        Intermediate: "border-yellow-500 bg-yellow-50 text-yellow-700",
                        Advanced: "border-red-500 bg-red-50 text-red-700",
                      }

                      return (
                        <div
                          key={difficulty}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                            isSelected
                              ? colors[difficulty as keyof typeof colors]
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleDifficultyToggle(difficulty)}
                        >
                          <Checkbox checked={isSelected} readOnly className="mb-2" />
                          <div className="font-semibold font-sans">{difficulty}</div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quiz Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans flex items-center gap-2">Quiz Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Count */}
                  <div className="space-y-3">
                    <Label className="font-serif">Number of Questions: {config.questionCount}</Label>
                    <Slider
                      value={[config.questionCount]}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, questionCount: value[0] }))}
                      max={50}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5</span>
                      <span>25</span>
                      <span>50</span>
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div className="space-y-3">
                    <Label className="font-serif">Time Limit</Label>
                    <Select
                      value={config.timeLimit?.toString() || "none"}
                      onValueChange={(value) =>
                        setConfig((prev) => ({
                          ...prev,
                          timeLimit: value === "none" ? null : Number.parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No time limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No time limit</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Random Order */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="randomOrder"
                      checked={config.randomOrder}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          randomOrder: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="randomOrder" className="font-serif">
                      Randomize question order
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="font-sans">Quiz Summary</CardTitle>
                  <CardDescription className="font-serif">Review your quiz configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-serif text-sm text-muted-foreground">Modules</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.modules.length > 0 ? (
                        config.modules.map((module) => (
                          <Badge key={module} variant="secondary" className="text-xs">
                            {module}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground font-serif">None selected</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="font-serif text-sm text-muted-foreground">Topics</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.topics.length > 0 ? (
                        config.topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground font-serif">All topics</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="font-serif text-sm text-muted-foreground">Difficulty</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.difficulties.length > 0 ? (
                        config.difficulties.map((difficulty) => (
                          <Badge key={difficulty} variant="outline" className="text-xs">
                            {difficulty}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground font-serif">None selected</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="font-serif">Questions:</span>
                      <span className="font-semibold">{config.questionCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-serif">Time Limit:</span>
                      <span className="font-semibold">{config.timeLimit ? `${config.timeLimit} min` : "None"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-serif">Random Order:</span>
                      <span className="font-semibold">{config.randomOrder ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartQuiz}
                    disabled={!canStartQuiz}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    Start Custom Quiz
                  </Button>

                  {!canStartQuiz && (
                    <p className="text-xs text-muted-foreground font-serif text-center">
                      Please select at least one module and difficulty level
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          <Link href="/">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Button variant="ghost" className="flex-col gap-1 h-auto py-2 text-primary">
            <Search className="h-5 w-5" />
            <span className="text-xs">Practice</span>
          </Button>
          <Link href="/analytics">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Analytics</span>
            </Button>
          </Link>
          <Link href="/review">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
              <RotateCcw className="h-5 w-5" />
              <span className="text-xs">Review</span>
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  )
}
