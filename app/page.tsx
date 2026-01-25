"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Mail, RotateCcw, User, Phone } from "lucide-react"
import { DEPARTMENTS, SKILLS, QUESTIONS, QUESTION_FORMAT, QUESTION_TYPE } from "@/lib/quiz-data"

const questions = QUESTIONS

type Answers = Record<number, number[]>

export default function SpiritualGiftsTest() {
  const [stage, setStage] = useState<"intro" | "test" | "results">("intro")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const progress = ((currentQuestion + 1) / questions.length) * 100

  // Format phone number with mask
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, "")

    // Apply mask based on length
    if (numbers.length <= 10) {
      // Landline: (11) 1234-5678
      return numbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    } else {
      // Mobile: (11) 91234-5678
      return numbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15) // Limit to (11) 91234-5678
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setUserPhone(formatted)
  }

  // Load from localStorage on mount
  useEffect(() => {
    const loadSavedData = async () => {
      if (typeof window !== "undefined") {
        // Simulate minimum loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 500))

        const saved = localStorage.getItem("spiritualGiftsTest")
        if (saved) {
          try {
            const data = JSON.parse(saved)
            const savedDate = new Date(data.timestamp)
            const now = new Date()
            const diffDays = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24)

            // If saved data is older than 2 days, clear it
            if (diffDays > 2) {
              localStorage.removeItem("spiritualGiftsTest")
            } else {
              // Restore saved data
              setStage(data.stage)
              setCurrentQuestion(data.currentQuestion)
              setAnswers(data.answers)
              setSelectedOptions(data.selectedOptions || [])
              setUserName(data.userName || "")
              setUserEmail(data.userEmail || "")
              setUserPhone(data.userPhone || "")
            }
          } catch (error) {
            console.error("Error loading saved data:", error)
            localStorage.removeItem("spiritualGiftsTest")
          }
        }
      }
      setIsLoading(false)
    }

    loadSavedData()
  }, [])

  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    if (typeof window !== "undefined" && stage !== "intro") {
      const dataToSave = {
        stage,
        currentQuestion,
        answers,
        selectedOptions,
        userName,
        userEmail,
        userPhone,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem("spiritualGiftsTest", JSON.stringify(dataToSave))
    }
  }, [stage, currentQuestion, answers, selectedOptions, userName, userEmail, userPhone])

  const handleResetTest = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("spiritualGiftsTest")
    }
    setStage("intro")
    setCurrentQuestion(0)
    setAnswers({})
    setSelectedOptions([])
    setUserName("")
    setUserEmail("")
    setUserPhone("")
  }

  const handleOptionToggle = (optionIndex: number) => {
    const q = questions[currentQuestion]
    const qFormat = q?.format ?? QUESTION_FORMAT.MULTIPLE_CHOICE

    if (
      qFormat === QUESTION_FORMAT.SINGLE_CHOICE ||
      qFormat === QUESTION_FORMAT.YES_NO ||
      qFormat === QUESTION_FORMAT.RANKING
    ) {
      // single-choice, yes_no, and ranking: only one option can be selected
      setSelectedOptions([optionIndex])
    } else {
      // multiple-choice: toggle multiple selections
      setSelectedOptions((prev) =>
        prev.includes(optionIndex) ? prev.filter((i) => i !== optionIndex) : [...prev, optionIndex],
      )
    }
  }

  const handleNext = () => {
    // Save answers only if user selected something
    if (selectedOptions.length > 0) {
      setAnswers((prev) => ({
        ...prev,
        [questions[currentQuestion].id]: selectedOptions,
      }))
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setSelectedOptions(answers[questions[currentQuestion + 1]?.id] || [])
    } else {
      setStage("results")
    }
  }

  const handleSkip = () => {
    // Remove any previous answer for this question
    setAnswers((prev) => {
      const newAnswers = { ...prev }
      delete newAnswers[questions[currentQuestion].id]
      return newAnswers
    })

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setSelectedOptions(answers[questions[currentQuestion + 1]?.id] || [])
    } else {
      setStage("results")
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
      setSelectedOptions(answers[questions[currentQuestion - 1].id] || [])
    }
  }

  const calculateResults = () => {
    // Scores for hability questions
    const habilityDepartmentScores: Record<string, number> = {}
    const habilitySkillScores: Record<string, number> = {}

    // Scores for interest questions
    const interestDepartmentScores: Record<string, number> = {}
    const interestSkillScores: Record<string, number> = {}

    const departmentNames = Object.values(DEPARTMENTS).map((d) => d.name)
    const skillNames = Object.values(SKILLS).map((s) => s.name)

    // Initialize all scores
    departmentNames.forEach((dept) => {
      habilityDepartmentScores[dept] = 0
      interestDepartmentScores[dept] = 0
    })
    skillNames.forEach((skill) => {
      habilitySkillScores[skill] = 0
      interestSkillScores[skill] = 0
    })

    Object.entries(answers).forEach(([questionId, optionIndices]) => {
      const question = questions.find((q) => q.id === Number.parseInt(questionId))
      if (!question) return

      // Determine which score objects to use based on question type
      const isHability = question.type === QUESTION_TYPE.HABILITY
      const deptScores = isHability ? habilityDepartmentScores : interestDepartmentScores
      const skillScoresObj = isHability ? habilitySkillScores : interestSkillScores

      optionIndices.forEach((optionIndex) => {
        const option = question.options[optionIndex]

        const hasPoints = Object.keys(option?.points || {}).length > 0

        if (!hasPoints) {
          return
        }

        Object.entries(option.points).forEach(([name, points]) => {
          if (departmentNames.includes(name)) {
            deptScores[name] = (deptScores[name] || 0) + points
          } else if (skillNames.includes(name)) {
            skillScoresObj[name] = (skillScoresObj[name] || 0) + points
          }
        })
      })
    })

    // Process hability results
    const habilityDepartments = Object.entries(habilityDepartmentScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)

    const habilitySkills = Object.entries(habilitySkillScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)

    // Process interest results
    const interestDepartments = Object.entries(interestDepartmentScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)

    const interestSkills = Object.entries(interestSkillScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)

    return {
      habilityDepartments,
      habilitySkills,
      interestDepartments,
      interestSkills
    }
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 shadow-xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted animate-pulse">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">Carregando</p>
              <p className="text-sm text-muted-foreground">Verificando dados salvos...</p>
            </div>
            <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-14">
        <div className="w-full max-w-4xl space-y-8">
          {/* Hero Section - sem card */}
          <div className="text-center space-y-6 py-12">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight mb-0">
              Descubra seus <span className="text-[#0EA5E9]">dons</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Para quem deseja servir na igreja, é fundamental conhecer seus dons espirituais
            </p>
          </div>

          {/* Cards de Conteúdo */}
          <div className="space-y-6">
            <Card className="p-6 shadow-xl">
              <h2 className="font-semibold text-foreground mb-4">Como funciona:</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary font-semibold">1.</span>
                  <span>Responda cada pergunta selecionando as opções que mais se identificam com você</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-semibold">2.</span>
                  <span>Você pode pular perguntas se preferir</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-semibold">3.</span>
                  <span>Ao final, descubra suas principais áreas de atuação</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 shadow-xl">
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-foreground mb-3">Habilidades analisadas neste teste:</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {Object.values(SKILLS)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((d, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{d.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <hr className="border-border" />
                <div>
                  <h2 className="font-semibold text-foreground mb-3">Departamentos analisados neste teste:</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {Object.values(DEPARTMENTS)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((d, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{d.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-xl">
              <h2 className="font-semibold text-foreground mb-4">Seus Dados:</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={userPhone}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                    placeholder="(11) 91234-5678"
                  />
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={() => setStage("test")}
                disabled={!userName}
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                Iniciar Teste
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                onClick={() => window.location.href = '/estatisticas'}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-border cursor-pointer"
              >
                Ver Estatísticas
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-6">
              <Mail className="w-4 h-4" />
              <span>
                Sugestões:{" "}
                <a href="mailto:hm2lp3893@mozmail.com" className="text-primary hover:underline cursor-pointer">
                  hm2lp3893@mozmail.com
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "results") {
    const { habilityDepartments, habilitySkills, interestDepartments, interestSkills } = calculateResults()

    // Hability (areas of action)
    const top3HabilityDepartments = habilityDepartments.slice(0, 3)
    const otherHabilityDepartments = habilityDepartments.slice(3)
    const top3HabilitySkills = habilitySkills.slice(0, 3)
    const otherHabilitySkills = habilitySkills.slice(3)

    // Interest (areas of interest)
    const top3InterestDepartments = interestDepartments.slice(0, 3)
    const otherInterestDepartments = interestDepartments.slice(3)

    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Seus resultados
            </h1>
            <p className="text-lg text-muted-foreground">Descubra onde seus dons podem fazer a diferença</p>
          </div>

          {/* User Information Card */}
          {(userName || userEmail || userPhone) && (
            <Card className="p-6 shadow-xl">
              <h2 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do participante
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userName && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</p>
                      <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                    </div>
                  </div>
                )}
                {userEmail && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">E-mail</p>
                      <p className="text-sm font-semibold text-foreground truncate">{userEmail}</p>
                    </div>
                  </div>
                )}
                {userPhone && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telefone</p>
                      <p className="text-sm font-semibold text-foreground truncate">{userPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Top 3 Hability Departments */}
          {top3HabilityDepartments.length > 0 && (
            <Card className="p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-foreground mb-4">🌟 Suas principais áreas de atuação</h2>
              <div className="space-y-4">
                {top3HabilityDepartments.map(([dept, score]: [string, number], index: number) => {
                  const deptKey = Object.keys(DEPARTMENTS).find(key => DEPARTMENTS[key as keyof typeof DEPARTMENTS].name === dept)
                  const description = deptKey ? DEPARTMENTS[deptKey as keyof typeof DEPARTMENTS].description : undefined

                  return (
                    <div
                      key={dept}
                      className="bg-accent border border-border rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{dept}</h3>
                            {description && (
                              <p className="text-sm text-muted-foreground">{description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-primary">{score}</span>
                      </div>
                      <div className="mt-4">
                        <Progress value={(score / top3HabilityDepartments[0][1]) * 100} className="h-3" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Other Hability Departments */}
          {otherHabilityDepartments.length > 0 && (
            <Card className="p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-foreground mb-4">Outras áreas de atuação</h2>
              <div className="grid gap-3">
                {otherHabilityDepartments.map(([dept, score]: [string, number]) => {
                  const deptKey = Object.keys(DEPARTMENTS).find(key => DEPARTMENTS[key as keyof typeof DEPARTMENTS].name === dept)
                  const description = deptKey ? DEPARTMENTS[deptKey as keyof typeof DEPARTMENTS].description : undefined

                  return (
                    <div
                      key={dept}
                      className="bg-muted border border-border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{dept}</span>
                        {description && (
                          <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                      </div>
                      <span className="text-lg font-semibold text-muted-foreground ml-4">{score}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Top 3 Interest Departments */}
          {top3InterestDepartments.length > 0 && (
            <Card className="p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-foreground mb-4">💡 Suas principais áreas de interesse</h2>
              <div className="space-y-4">
                {top3InterestDepartments.map(([dept, score]: [string, number], index: number) => {
                  const deptKey = Object.keys(DEPARTMENTS).find(key => DEPARTMENTS[key as keyof typeof DEPARTMENTS].name === dept)
                  const description = deptKey ? DEPARTMENTS[deptKey as keyof typeof DEPARTMENTS].description : undefined

                  return (
                    <div
                      key={dept}
                      className="bg-accent border border-border rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{dept}</h3>
                            {description && (
                              <p className="text-sm text-muted-foreground">{description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-primary">{score}</span>
                      </div>
                      <div className="mt-4">
                        <Progress value={(score / top3InterestDepartments[0][1]) * 100} className="h-3" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Other Interest Departments */}
          {otherInterestDepartments.length > 0 && (
            <Card className="p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-foreground mb-4">Outras áreas de interesse</h2>
              <div className="grid gap-3">
                {otherInterestDepartments.map(([dept, score]: [string, number]) => {
                  const deptKey = Object.keys(DEPARTMENTS).find(key => DEPARTMENTS[key as keyof typeof DEPARTMENTS].name === dept)
                  const description = deptKey ? DEPARTMENTS[deptKey as keyof typeof DEPARTMENTS].description : undefined

                  return (
                    <div
                      key={dept}
                      className="bg-muted border border-border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{dept}</span>
                        {description && (
                          <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                      </div>
                      <span className="text-lg font-semibold text-muted-foreground ml-4">{score}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Top 3 Hability Skills */}
          {top3HabilitySkills.length > 0 && (
            <Card className="p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-foreground mb-4">🌟 Suas principais habilidades</h2>
              <div className="space-y-4">
                {top3HabilitySkills.map(([skill, score]: [string, number], index: number) => {
                  const skillKey = Object.keys(SKILLS).find(key => SKILLS[key as keyof typeof SKILLS].name === skill)
                  const description = skillKey ? SKILLS[skillKey as keyof typeof SKILLS].description : undefined

                  return (
                    <div
                      key={skill}
                      className="bg-accent border border-border rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{skill}</h3>
                            {description && (
                              <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-primary">{score}</span>
                      </div>
                      <div className="mt-4">
                        <Progress value={(score / top3HabilitySkills[0][1]) * 100} className="h-3" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Other Hability Skills */}
          {otherHabilitySkills.length > 0 && (
            <Card className="p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-foreground mb-4">Outras habilidades</h2>
              <div className="grid gap-3">
                {otherHabilitySkills.map(([skill, score]: [string, number]) => {
                  const skillKey = Object.keys(SKILLS).find(key => SKILLS[key as keyof typeof SKILLS].name === skill)
                  const description = skillKey ? SKILLS[skillKey as keyof typeof SKILLS].description : undefined

                  return (
                    <div
                      key={skill}
                      className="bg-muted border border-border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{skill}</span>
                        {description && (
                          <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                      </div>
                      <span className="text-lg font-semibold text-muted-foreground ml-4">{score}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card className="p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleResetTest}
                variant="outline"
                className="border-border cursor-pointer"
              >
                Refazer Teste
              </Button>
              <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
                Imprimir Resultados
              </Button>
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>
                Sugestões:{" "}
                <a href="mailto:hm2lp3893@mozmail.com" className="text-primary hover:underline">
                  hm2lp3893@mozmail.com
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]

  const getQuestionFormatHelperText = (format: QUESTION_FORMAT): string => {
    switch (format) {
      case QUESTION_FORMAT.SINGLE_CHOICE:
        return "Escolha apenas uma das alternativas"
      case QUESTION_FORMAT.MULTIPLE_CHOICE:
        return "Escolha uma ou várias alternativas"
      case QUESTION_FORMAT.RANKING:
        return "De 1 a 5, considerando 1 como discordo totalmente e 5 como concordo totalmente"
      case QUESTION_FORMAT.YES_NO:
        return "Responda de forma objetiva"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Pergunta {currentQuestion + 1} de {questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <Button
            onClick={handleResetTest}
            variant="outline"
            size="sm"
            className="border-border cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refazer
          </Button>
        </div>

        <Card className="p-6 md:p-8 shadow-xl">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground text-balance leading-relaxed">
                {question.text}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">{getQuestionFormatHelperText(question.format)}</p>
            </div>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedOptions.includes(index)
                    ? "border-primary bg-accent"
                    : "border-border hover:border-muted-foreground bg-card"
                    }`}
                >
                  <Checkbox
                    checked={selectedOptions.includes(index)}
                    onCheckedChange={() => handleOptionToggle(index)}
                    className="mt-0.5"
                  />
                  <span className="text-foreground leading-relaxed">{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            variant="outline"
            className="border-border bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            className="border-border text-foreground hover:bg-muted hover:text-foreground bg-transparent cursor-pointer"
          >
            Pular
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedOptions.length === 0}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted cursor-pointer disabled:cursor-not-allowed"
          >
            {currentQuestion === questions.length - 1 ? "Ver Resultados" : "Próxima"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
