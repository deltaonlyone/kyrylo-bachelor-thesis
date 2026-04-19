import type {
  Course,
  CourseSummary,
  CreateCourseRequest,
  Enrollment,
  Quiz,
  QuizResult,
  StudentProgress,
  SubmitQuizPayload,
} from '../types/course'
import type { User, UserRole } from '../types/user'
import { apiClient } from './apiClient'

/** GET /api/courses — список курсів (CourseSummaryResponse[]) */
export async function fetchCourses(): Promise<CourseSummary[]> {
  const res = await apiClient.get<CourseSummary[]>('/api/courses')
  return res.data
}

/** GET /api/courses/{id} — повний курс (CourseResponse) */
export async function fetchCourseById(id: number): Promise<Course> {
  const res = await apiClient.get<Course>(`/api/courses/${id}`)
  return res.data
}

/** POST /api/courses — тіло CreateCourseRequest */
export async function createCourse(body: CreateCourseRequest): Promise<Course> {
  const res = await apiClient.post<Course>('/api/courses', body)
  return res.data
}

/** PUT /api/courses/{id} — повна заміна структури (CreateCourseRequest) */
export async function updateCourse(
  id: number,
  body: CreateCourseRequest,
): Promise<Course> {
  const res = await apiClient.put<Course>(`/api/courses/${id}`, body)
  return res.data
}

/** DELETE /api/courses/{id} */
export async function deleteCourse(id: number): Promise<void> {
  await apiClient.delete(`/api/courses/${id}`)
}

/** GET /api/users?role=... — список користувачів за роллю (UserResponse[]) */
export async function fetchUsersByRole(role: UserRole): Promise<User[]> {
  const res = await apiClient.get<User[]>('/api/users', { params: { role } })
  return res.data
}

/** POST /api/users — створення користувача (CreateUserRequest на бекенді) */
export async function createUser(body: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}): Promise<User> {
  const res = await apiClient.post<User>('/api/users', body)
  return res.data
}

/* ─── Enrollment ───────────────────────────────────────── */

/** POST /api/enrollments/{courseId} — Learner записується на курс */
export async function enrollInCourse(
  courseId: number,
  userId: number,
): Promise<Enrollment> {
  const res = await apiClient.post<Enrollment>(
    `/api/enrollments/${courseId}`,
    null,
    { headers: { 'X-User-Id': String(userId) } },
  )
  return res.data
}

/** GET /api/enrollments/my — усі записи поточного слухача */
export async function fetchMyEnrollments(userId: number): Promise<Enrollment[]> {
  const res = await apiClient.get<Enrollment[]>('/api/enrollments/my', {
    headers: { 'X-User-Id': String(userId) },
  })
  return res.data
}

/** GET /api/enrollments/students/{courseId} — список студентів курсу (для Educator) */
export async function fetchStudentsByCourse(
  courseId: number,
): Promise<StudentProgress[]> {
  const res = await apiClient.get<StudentProgress[]>(
    `/api/enrollments/students/${courseId}`,
  )
  return res.data
}

/* ─── Quiz ─────────────────────────────────────────────── */

/** GET /api/quizzes/lesson/{lessonId} — квіз для уроку (без правильних відповідей) */
export async function fetchQuizByLesson(lessonId: number): Promise<Quiz> {
  const res = await apiClient.get<Quiz>(`/api/quizzes/lesson/${lessonId}`)
  return res.data
}

/** POST /api/quizzes/submit — перевірити відповіді слухача */
export async function submitQuiz(
  payload: SubmitQuizPayload,
  userId: number,
): Promise<QuizResult> {
  const res = await apiClient.post<QuizResult>('/api/quizzes/submit', payload, {
    headers: { 'X-User-Id': String(userId) },
  })
  return res.data
}
