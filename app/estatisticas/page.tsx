"use client"

import { Card } from "@/components/ui/card"
import { ArrowLeft, BarChart3, ChevronDown, ChevronUp } from "lucide-react"
import { DEPARTMENTS, SKILLS, QUESTIONS, QUESTION_FORMAT, QUESTION_TYPE } from "@/lib/quiz-data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type QuestionDetail = {
  id: number
  text: string
  format: QUESTION_FORMAT
  type: QUESTION_TYPE
  options: {
    text: string
    points: number
  }[]
}

type StatItem = {
  name: string
  description?: string
  questionCount: number
  maxPoints: number
  maxPointsHability: number
  maxPointsInterest: number
  questions: QuestionDetail[]
}

export default function StatisticsPage() {
  const calculateStatistics = () => {
    const departmentStats: Record<string, StatItem> = {}
    const skillStats: Record<string, StatItem> = {}

    // Initialize with all departments and skills
    Object.values(DEPARTMENTS).forEach((dept) => {
      departmentStats[dept.name] = {
        name: dept.name,
        description: dept.description,
        questionCount: 0,
        maxPoints: 0,
        maxPointsHability: 0,
        maxPointsInterest: 0,
        questions: [],
      }
    })

    Object.values(SKILLS).forEach((skill) => {
      skillStats[skill.name] = {
        name: skill.name,
        description: skill.description,
        questionCount: 0,
        maxPoints: 0,
        maxPointsHability: 0,
        maxPointsInterest: 0,
        questions: [],
      }
    })

    // Count questions and points for each department and skill
    QUESTIONS.forEach((question) => {
      const departmentsInQuestion = new Set<string>()
      const skillsInQuestion = new Set<string>()

      // For single-choice questions (single_choice, yes_no, ranking),
      // we need to find the maximum points among options, not sum them
      const isSingleChoice =
        question.format === QUESTION_FORMAT.SINGLE_CHOICE ||
        question.format === QUESTION_FORMAT.YES_NO ||
        question.format === QUESTION_FORMAT.RANKING

      if (isSingleChoice) {
        // Track the max points per department/skill across all options
        const maxPointsPerDept: Record<string, number> = {}
        const maxPointsPerSkill: Record<string, number> = {}
        const deptQuestionDetails: Record<string, { text: string; points: number }[]> = {}
        const skillQuestionDetails: Record<string, { text: string; points: number }[]> = {}

        question.options.forEach((option) => {
          Object.entries(option.points).forEach(([name, points]) => {
            if (departmentStats[name]) {
              maxPointsPerDept[name] = Math.max(maxPointsPerDept[name] || 0, points)
              departmentsInQuestion.add(name)
              if (!deptQuestionDetails[name]) deptQuestionDetails[name] = []
              if (points > 0) {
                deptQuestionDetails[name].push({ text: option.text, points })
              }
            } else if (skillStats[name]) {
              maxPointsPerSkill[name] = Math.max(maxPointsPerSkill[name] || 0, points)
              skillsInQuestion.add(name)
              if (!skillQuestionDetails[name]) skillQuestionDetails[name] = []
              if (points > 0) {
                skillQuestionDetails[name].push({ text: option.text, points })
              }
            }
          })
        })

        // Add the maximum points to the stats and store question details
        Object.entries(maxPointsPerDept).forEach(([name, points]) => {
          departmentStats[name].maxPoints += points
          if (question.type === QUESTION_TYPE.HABILITY) {
            departmentStats[name].maxPointsHability += points
          } else {
            departmentStats[name].maxPointsInterest += points
          }
          departmentStats[name].questions.push({
            id: question.id,
            text: question.text,
            format: question.format,
            type: question.type,
            options: deptQuestionDetails[name],
          })
        })
        Object.entries(maxPointsPerSkill).forEach(([name, points]) => {
          skillStats[name].maxPoints += points
          if (question.type === QUESTION_TYPE.HABILITY) {
            skillStats[name].maxPointsHability += points
          } else {
            skillStats[name].maxPointsInterest += points
          }
          skillStats[name].questions.push({
            id: question.id,
            text: question.text,
            format: question.format,
            type: question.type,
            options: skillQuestionDetails[name],
          })
        })
      } else {
        // For multiple-choice questions, sum all possible points
        const deptQuestionDetails: Record<string, { text: string; points: number }[]> = {}
        const skillQuestionDetails: Record<string, { text: string; points: number }[]> = {}

        question.options.forEach((option) => {
          Object.entries(option.points).forEach(([name, points]) => {
            if (departmentStats[name]) {
              departmentStats[name].maxPoints += points
              departmentsInQuestion.add(name)
              if (!deptQuestionDetails[name]) deptQuestionDetails[name] = []
              deptQuestionDetails[name].push({ text: option.text, points })
            } else if (skillStats[name]) {
              skillStats[name].maxPoints += points
              skillsInQuestion.add(name)
              if (!skillQuestionDetails[name]) skillQuestionDetails[name] = []
              skillQuestionDetails[name].push({ text: option.text, points })
            }
          })
        })

        // Store question details for multiple choice
        Object.entries(deptQuestionDetails).forEach(([name, options]) => {
          // For multiple choice, sum up all points for this department
          const totalPoints = options.reduce((sum, opt) => sum + opt.points, 0)
          if (question.type === QUESTION_TYPE.HABILITY) {
            departmentStats[name].maxPointsHability += totalPoints
          } else {
            departmentStats[name].maxPointsInterest += totalPoints
          }
          departmentStats[name].questions.push({
            id: question.id,
            text: question.text,
            format: question.format,
            type: question.type,
            options,
          })
        })
        Object.entries(skillQuestionDetails).forEach(([name, options]) => {
          // For multiple choice, sum up all points for this skill
          const totalPoints = options.reduce((sum, opt) => sum + opt.points, 0)
          if (question.type === QUESTION_TYPE.HABILITY) {
            skillStats[name].maxPointsHability += totalPoints
          } else {
            skillStats[name].maxPointsInterest += totalPoints
          }
          skillStats[name].questions.push({
            id: question.id,
            text: question.text,
            format: question.format,
            type: question.type,
            options,
          })
        })
      }

      // Increment question count for each department/skill mentioned in this question
      departmentsInQuestion.forEach((name) => {
        departmentStats[name].questionCount++
      })
      skillsInQuestion.forEach((name) => {
        skillStats[name].questionCount++
      })
    })

    // Separate departments and skills with and without questions
    const departments = Object.values(departmentStats)
      .filter((stat) => stat.maxPoints > 0)
      .sort((a, b) => b.maxPoints - a.maxPoints)

    const departmentsWithoutQuestions = Object.values(departmentStats)
      .filter((stat) => stat.maxPoints === 0)
      .sort((a, b) => a.name.localeCompare(b.name))

    const skills = Object.values(skillStats)
      .filter((stat) => stat.maxPoints > 0)
      .sort((a, b) => b.maxPoints - a.maxPoints)

    const skillsWithoutQuestions = Object.values(skillStats)
      .filter((stat) => stat.maxPoints === 0)
      .sort((a, b) => a.name.localeCompare(b.name))

    return { departments, skills, departmentsWithoutQuestions, skillsWithoutQuestions }
  }

  const { departments, skills, departmentsWithoutQuestions, skillsWithoutQuestions } = calculateStatistics()

  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set(QUESTIONS.map(q => q.id)) // All questions expanded by default
  )

  // Section-level collapse state
  const [showDepartmentsSection, setShowDepartmentsSection] = useState(true)
  const [showSkillsSection, setShowSkillsSection] = useState(true)
  const [showQuestionsSection, setShowQuestionsSection] = useState(true)
  const [showDepartmentsWithoutQuestionsSection, setShowDepartmentsWithoutQuestionsSection] = useState(false)
  const [showSkillsWithoutQuestionsSection, setShowSkillsWithoutQuestionsSection] = useState(false)

  const toggleDepartment = (name: string) => {
    setExpandedDepts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      return newSet
    })
  }

  const toggleSkill = (name: string) => {
    setExpandedSkills((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      return newSet
    })
  }

  const toggleQuestion = (id: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getPointType = (name: string): "Departamento" | "Habilidade" => {
    // Check if it's a department
    if (Object.values(DEPARTMENTS).some(dept => dept.name === name)) {
      return "Departamento"
    }
    return "Habilidade"
  }

  const getQuestionFormatLabel = (format: QUESTION_FORMAT) => {
    switch (format) {
      case QUESTION_FORMAT.SINGLE_CHOICE:
        return "Escolha única"
      case QUESTION_FORMAT.MULTIPLE_CHOICE:
        return "Múltipla escolha"
      case QUESTION_FORMAT.RANKING:
        return "Escala de 1 a 5"
      case QUESTION_FORMAT.YES_NO:
        return "Sim/Não"
    }
  }

  const getQuestionTypeLabel = (type: QUESTION_TYPE) => {
    switch (type) {
      case QUESTION_TYPE.HABILITY:
        return "Habilidade"
      case QUESTION_TYPE.INTEREST:
        return "Interesse"
    }
  }

  const getQuestionTypeBadge = (type: QUESTION_TYPE) => {
    const isHability = type === QUESTION_TYPE.HABILITY
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isHability
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      }`}>
        {isHability ? "Habilidade" : "Interesse"}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Estatísticas do teste
          </h1>
          <p className="text-lg text-muted-foreground">
            Análise completa de {QUESTIONS.length} perguntas, {departments.length} departamentos e {skills.length} habilidades
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 text-center shadow-xl">
            <div className="text-3xl font-bold text-primary">{QUESTIONS.length}</div>
            <div className="text-sm font-medium text-muted-foreground">Perguntas no Teste</div>
          </Card>
          <Card className="p-6 text-center shadow-xl">
            <div className="text-3xl font-bold text-primary">{departments.length}</div>
            <div className="text-sm font-medium text-muted-foreground">Departamentos Avaliados</div>
            <div className="text-xs text-muted-foreground mt-2">
              {departmentsWithoutQuestions.length} sem perguntas
            </div>
          </Card>
          <Card className="p-6 text-center shadow-xl">
            <div className="text-3xl font-bold text-primary">{skills.length}</div>
            <div className="text-sm font-medium text-muted-foreground">Habilidades Avaliadas</div>
            <div className="text-xs text-muted-foreground mt-2">
              {skillsWithoutQuestions.length} sem perguntas
            </div>
          </Card>
        </div>

        {/* Departments Statistics */}
        <Card className="p-6 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Departamentos
              </h2>
              <button
                onClick={() => setShowDepartmentsSection(!showDepartmentsSection)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg hover:bg-accent"
              >
                {showDepartmentsSection ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Ocultar todos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Mostrar todos
                  </>
                )}
              </button>
            </div>
            {showDepartmentsSection && (
              <div className="grid gap-4">
                {departments.map((dept) => {
                  const isExpanded = expandedDepts.has(dept.name)
                  return (
                    <div
                      key={dept.name}
                      className="bg-accent border border-border rounded-lg overflow-hidden"
                    >
                      <div className="p-5 hover:bg-muted transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">{dept.name}</h3>
                            {dept.description && (
                              <p className="text-sm text-muted-foreground">{dept.description}</p>
                            )}
                          </div>
                          <div className="flex gap-4 md:gap-6 flex-shrink-0 flex-wrap">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{dept.questionCount}</div>
                              <div className="text-xs text-muted-foreground font-medium">
                                {dept.questionCount === 1 ? "pergunta" : "perguntas"}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{dept.maxPoints}</div>
                              <div className="text-xs text-muted-foreground font-medium">
                                {dept.maxPoints === 1 ? "ponto" : "pontos"}
                              </div>
                            </div>
                            {dept.maxPointsHability > 0 && (
                              <div className="text-center">
                                <div className="text-2xl font-bold">{dept.maxPointsHability}</div>
                                <div className="text-xs text-muted-foreground font-medium">habilidade</div>
                              </div>
                            )}
                            {dept.maxPointsInterest > 0 && (
                              <div className="text-center">
                                <div className="text-2xl font-bold">{dept.maxPointsInterest}</div>
                                <div className="text-xs text-muted-foreground font-medium">interesse</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {dept.questions.length > 0 && (
                          <button
                            onClick={() => toggleDepartment(dept.name)}
                            className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Ocultar perguntas
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Ver {dept.questions.length} {dept.questions.length === 1 ? "pergunta" : "perguntas"}
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {isExpanded && dept.questions.length > 0 && (
                        <div className="border-t border-border bg-card p-5 space-y-4">
                          {dept.questions.map((q) => (
                            <div key={`${dept.name}-${q.id}`} className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                                  {q.id}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">{q.text}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">{getQuestionFormatLabel(q.format)}</span>
                                    {getQuestionTypeBadge(q.type)}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-8 space-y-1">
                                {q.options.map((opt, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-sm bg-muted rounded px-3 py-2"
                                  >
                                    <span className="text-foreground">{opt.text}</span>
                                    <span className="font-semibold text-primary">
                                      +{opt.points} {opt.points === 1 ? "ponto" : "pontos"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Skills Statistics */}
        <Card className="p-6 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Habilidades
              </h2>
              <button
                onClick={() => setShowSkillsSection(!showSkillsSection)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg hover:bg-accent"
              >
                {showSkillsSection ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Ocultar todos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Mostrar todos
                  </>
                )}
              </button>
            </div>
            {showSkillsSection && (
              <div className="grid gap-4">
                {skills.map((skill) => {
                  const isExpanded = expandedSkills.has(skill.name)
                  return (
                    <div
                      key={skill.name}
                      className="bg-accent border border-border rounded-lg overflow-hidden"
                    >
                      <div className="p-5 hover:bg-muted transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">{skill.name}</h3>
                            {skill.description && (
                              <p className="text-sm text-muted-foreground">{skill.description}</p>
                            )}
                          </div>
                          <div className="flex gap-4 md:gap-6 flex-shrink-0 flex-wrap">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{skill.questionCount}</div>
                              <div className="text-xs text-muted-foreground font-medium">
                                {skill.questionCount === 1 ? "pergunta" : "perguntas"}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{skill.maxPoints}</div>
                              <div className="text-xs text-muted-foreground font-medium">
                                {skill.maxPoints === 1 ? "ponto" : "pontos"}
                              </div>
                            </div>
                            {skill.maxPointsHability > 0 && (
                              <div className="text-center">
                                <div className="text-2xl font-bold">{skill.maxPointsHability}</div>
                                <div className="text-xs text-muted-foreground font-medium">habilidade</div>
                              </div>
                            )}
                            {skill.maxPointsInterest > 0 && (
                              <div className="text-center">
                                <div className="text-2xl font-bold">{skill.maxPointsInterest}</div>
                                <div className="text-xs text-muted-foreground font-medium">interesse</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {skill.questions.length > 0 && (
                          <button
                            onClick={() => toggleSkill(skill.name)}
                            className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Ocultar perguntas
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Ver {skill.questions.length} {skill.questions.length === 1 ? "pergunta" : "perguntas"}
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {isExpanded && skill.questions.length > 0 && (
                        <div className="border-t border-border bg-card p-5 space-y-4">
                          {skill.questions.map((q) => (
                            <div key={`${skill.name}-${q.id}`} className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                                  {q.id}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">{q.text}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">{getQuestionFormatLabel(q.format)}</span>
                                    {getQuestionTypeBadge(q.type)}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-8 space-y-1">
                                {q.options.map((opt, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-sm bg-muted rounded px-3 py-2"
                                  >
                                    <span className="text-foreground">{opt.text}</span>
                                    <span className="font-semibold text-primary">
                                      +{opt.points} {opt.points === 1 ? "ponto" : "pontos"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Departments Without Questions */}
        {departmentsWithoutQuestions.length > 0 && (
          <Card className="p-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  Departamentos sem perguntas vinculadas
                </h2>
                <button
                  onClick={() => setShowDepartmentsWithoutQuestionsSection(!showDepartmentsWithoutQuestionsSection)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg hover:bg-accent"
                >
                  {showDepartmentsWithoutQuestionsSection ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Ocultar todos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Mostrar todos ({departmentsWithoutQuestions.length})
                    </>
                  )}
                </button>
              </div>
              {showDepartmentsWithoutQuestionsSection && (
                <div className="grid gap-3">
                  {departmentsWithoutQuestions.map((dept) => (
                    <div
                      key={dept.name}
                      className="bg-accent/50 border border-border rounded-lg p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <h3 className="text-base font-semibold text-foreground">{dept.name}</h3>
                          {dept.description && (
                            <p className="text-sm text-muted-foreground">{dept.description}</p>
                          )}
                        </div>
                        <div className="flex gap-4 flex-shrink-0">
                          <div className="text-center">
                            <div className="text-xl font-bold text-muted-foreground">0</div>
                            <div className="text-xs text-muted-foreground font-medium">perguntas</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Skills Without Questions */}
        {skillsWithoutQuestions.length > 0 && (
          <Card className="p-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  Habilidades sem perguntas vinculadas
                </h2>
                <button
                  onClick={() => setShowSkillsWithoutQuestionsSection(!showSkillsWithoutQuestionsSection)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg hover:bg-accent"
                >
                  {showSkillsWithoutQuestionsSection ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Ocultar todos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Mostrar todos ({skillsWithoutQuestions.length})
                    </>
                  )}
                </button>
              </div>
              {showSkillsWithoutQuestionsSection && (
                <div className="grid gap-3">
                  {skillsWithoutQuestions.map((skill) => (
                    <div
                      key={skill.name}
                      className="bg-accent/50 border border-border rounded-lg p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <h3 className="text-base font-semibold text-foreground">{skill.name}</h3>
                          {skill.description && (
                            <p className="text-sm text-muted-foreground">{skill.description}</p>
                          )}
                        </div>
                        <div className="flex gap-4 flex-shrink-0">
                          <div className="text-center">
                            <div className="text-xl font-bold text-muted-foreground">0</div>
                            <div className="text-xs text-muted-foreground font-medium">perguntas</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* All Questions */}
        <Card className="p-6 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Todas as perguntas
              </h2>
              <button
                onClick={() => setShowQuestionsSection(!showQuestionsSection)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg hover:bg-accent"
              >
                {showQuestionsSection ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Ocultar todos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Mostrar todos
                  </>
                )}
              </button>
            </div>
            {showQuestionsSection && (
              <div className="grid gap-4">
                {QUESTIONS.map((question) => {
                  const isExpanded = expandedQuestions.has(question.id)
                  return (
                    <Card key={question.id} className="shadow-md">
                      <div className="p-5">
                        <div className="space-y-3">
                          {/* Question Header */}
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                              {question.id}
                            </span>
                            <div className="flex-1">
                              <p className="text-base font-semibold text-foreground">{question.text}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                                  {getQuestionFormatLabel(question.format)}
                                </span>
                                {getQuestionTypeBadge(question.type)}
                                <span className="text-xs text-muted-foreground">
                                  {question.options.length} {question.options.length === 1 ? "opção" : "opções"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Toggle Button */}
                          <button
                            onClick={() => toggleQuestion(question.id)}
                            className="ml-11 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Ocultar alternativas
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Ver alternativas
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Options */}
                      {isExpanded && (
                        <div className="border-t border-border bg-accent p-5">
                          <div className="ml-11 space-y-2">
                            {question.options.map((option, idx) => {
                              const pointsEntries = Object.entries(option.points)
                              const hasPoints = pointsEntries.length > 0

                              return (
                                <div
                                  key={idx}
                                  className="bg-card border border-border rounded-lg p-3 space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm text-foreground flex-1 font-medium">{option.text}</p>
                                    {!hasPoints && (
                                      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                                        Sem pontos
                                      </span>
                                    )}
                                  </div>

                                  {hasPoints && (
                                    <div className="flex flex-wrap gap-2">
                                      {pointsEntries.map(([name, points]) => {
                                        const type = getPointType(name)
                                        const isDepartment = type === "Departamento"
                                        return (
                                          <div
                                            key={name}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${isDepartment
                                                ? "bg-primary/10 border-primary/20"
                                                : "bg-secondary/10 border-secondary/20"
                                              }`}
                                          >
                                            <span className="text-xs text-foreground font-medium">{name}</span>
                                            <span className="text-xs font-bold text-primary">
                                              +{points}
                                            </span>
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isDepartment
                                                ? "bg-primary/20 text-primary"
                                                : "bg-secondary/20 text-foreground"
                                              }`}>
                                              {type}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <Link href="/">
          <Button variant="outline" className="border-border cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o teste
          </Button>
        </Link>
      </div>
    </div>
  )
}
