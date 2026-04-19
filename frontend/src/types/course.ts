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
  title: string
  status: CourseStatus
}

/** Відповідає com.kyrylo.thesis.course.web.dto.CreateLessonRequest */
export interface CreateLessonRequest {
  title: string
  content: string
}

/** Відповідає com.kyrylo.thesis.course.web.dto.CreateModuleRequest */
export interface CreateModuleRequest {
  name: string
  sortOrder: number
  lessons: CreateLessonRequest[]
}

/** Відповідає com.kyrylo.thesis.course.web.dto.CreateCourseRequest */
export interface CreateCourseRequest {
  title: string
  description: string | null
  status: CourseStatus
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
}

/** Відповідає QuizResponse.QuestionResponse */
export interface QuizQuestion {
  id: number
  text: string
  sortOrder: number
  options: QuizOption[]
}

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
  selectedOptionId: number
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
}

