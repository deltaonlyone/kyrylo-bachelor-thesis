/**
 * Відповідає com.kyrylo.thesis.course.domain.CourseStatus.
 */
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/**
 * Відповідає com.kyrylo.thesis.course.web.dto.LessonResponse
 */
export interface Lesson {
  id: number
  title: string
  content: string
  hasQuiz?: boolean
  quiz?: Quiz
}

/**
 * Відповідає com.kyrylo.thesis.course.web.dto.CourseModuleResponse
 */
export interface CourseModule {
  id: number
  name: string
  sortOrder: number
  lessons: Lesson[]
}

/**
 * Відповідає com.kyrylo.thesis.course.web.dto.CourseResponse
 * (description може бути null).
 */
export interface Course {
  id: number
  organizationId: number
  title: string
  description: string | null
  status: CourseStatus
  modules: CourseModule[]
}

/**
 * Відповідає com.kyrylo.thesis.course.web.dto.CourseSummaryResponse
 */
export interface CourseSummary {
  id: number
  organizationId: number
  title: string
  status: CourseStatus
}

/** Відповідає com.kyrylo.thesis.course.web.dto.CreateLessonRequest */
export interface CreateLessonRequest {
  id?: number
  title: string
  content: string
  quiz?: CreateQuizRequest | null
}

/** Відповідає com.kyrylo.thesis.course.web.dto.CreateModuleRequest */
export interface CreateModuleRequest {
  id?: number
  name: string
  sortOrder: number
  lessons: CreateLessonRequest[]
}

/** Відповідає com.kyrylo.thesis.course.web.dto.CreateCourseRequest */
export interface CreateCourseRequest {
  title: string
  description: string | null
  status: CourseStatus
  organizationId: number
  modules: CreateModuleRequest[]
}

/**
 * Відповідає com.kyrylo.thesis.course.domain.EnrollmentStatus
 */
export type EnrollmentStatus = 'ENROLLED' | 'COMPLETED'

/**
 * Відповідає com.kyrylo.thesis.course.web.dto.EnrollmentResponse
 */
export interface Enrollment {
  id: number
  userId: number
  courseId: number
  courseTitle: string
  status: EnrollmentStatus
  progressPercentage: number
}

/**
 * Відповідає com.kyrylo.thesis.course.web.dto.StudentProgressResponse
 */
export interface StudentProgress {
  enrollmentId: number
  userId: number
  status: EnrollmentStatus
  progressPercentage: number
}

/* ─── Quiz Types ───────────────────────────────────────── */

/** Відповідає QuizResponse.OptionResponse */
export interface QuizOption {
  id: number
  text: string
  /** Лише в відповіді редактора куратора (`/api/quizzes/lesson/.../editor`). */
  correct?: boolean
}

/** Відповідає QuizResponse.QuestionResponse */
export interface QuizQuestion {
  id: number
  text: string
  sortOrder: number
  type: QuestionType
  options: QuizOption[]
}

export type QuestionType = 'SINGLE' | 'MULTI' | 'TRUE_FALSE' | 'OPEN_TEXT'

/** Відповідає QuizResponse */
export interface Quiz {
  id: number
  title: string
  passingScore: number
  lessonId: number
  questions: QuizQuestion[]
}

/** Відповідає SubmitQuizRequest.AnswerEntry */
export interface SubmitQuizAnswer {
  questionId: number
  selectedOptionId?: number
  selectedOptionIds?: number[]
  textAnswer?: string
}

/** Відповідає SubmitQuizRequest */
export interface SubmitQuizPayload {
  quizId: number
  answers: SubmitQuizAnswer[]
}

/** Відповідає QuizResultResponse */
export interface QuizResult {
  attemptId: number
  quizId: number
  correctCount: number
  totalCount: number
  scorePercentage: number
  passingScore: number
  passed: boolean
  status: 'AUTO_GRADED' | 'PENDING_REVIEW' | 'REVIEWED'
}

export interface CreateAnswerOptionRequest {
  id?: number
  text: string
  correct?: boolean
}

export interface CreateQuestionRequest {
  id?: number
  text: string
  sortOrder: number
  type: QuestionType
  options: CreateAnswerOptionRequest[]
}

export interface CreateQuizRequest {
  id?: number
  title: string
  passingScore: number
  questions: CreateQuestionRequest[]
}

export interface PendingQuizAttemptItem {
  itemId: number
  questionId: number
  questionText: string
  textAnswer: string
  manualPoints: number | null
}

export interface PendingQuizAttempt {
  attemptId: number
  userId: number
  quizId: number
  quizTitle: string
  attemptedAt: string
  openItems: PendingQuizAttemptItem[]
}

export interface ReviewQuizAttemptRequest {
  reviews: { itemId: number; manualPoints: number }[]
}

