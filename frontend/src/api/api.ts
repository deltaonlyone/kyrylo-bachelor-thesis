import type {
  Course,
  CourseSummary,
  CreateCourseRequest,
  Enrollment,
  PendingQuizAttempt,
  Quiz,
  QuizResult,
  ReviewQuizAttemptRequest,
  StudentProgress,
  SubmitQuizPayload,
} from '../types/course'
import type { MeContext, OrganizationMemberRow, OrganizationSummary } from '../types/org'
import type { User, UserRole } from '../types/user'
import type { CuratorOrgRole } from '../types/org'
import { apiClient } from './apiClient'

/** GET /api/me/context */
export async function fetchMeContext(): Promise<MeContext> {
  const res = await apiClient.get<MeContext>('/api/me/context')
  return res.data
}

/** GET /api/organizations */
export async function fetchOrganizations(): Promise<OrganizationSummary[]> {
  const res = await apiClient.get<OrganizationSummary[]>('/api/organizations')
  return res.data
}

/** POST /api/organizations */
export async function createOrganization(name: string): Promise<OrganizationSummary> {
  const res = await apiClient.post<OrganizationSummary>('/api/organizations', { name })
  return res.data
}

/** GET /api/organizations/{id}/members */
export async function fetchOrganizationMembers(
  organizationId: number,
): Promise<OrganizationMemberRow[]> {
  const res = await apiClient.get<OrganizationMemberRow[]>(
    `/api/organizations/${organizationId}/members`,
  )
  return res.data
}

/** PATCH /api/organizations/{id} */
export async function renameOrganization(
  organizationId: number,
  name: string,
): Promise<OrganizationSummary> {
  const res = await apiClient.patch<OrganizationSummary>(`/api/organizations/${organizationId}`, {
    name,
  })
  return res.data
}

/** POST /api/organizations/{id}/curators/invite */
export async function inviteCuratorToOrganization(
  organizationId: number,
  payload: {
    email: string
    password: string
    firstName: string
    lastName: string
  },
): Promise<OrganizationMemberRow> {
  const res = await apiClient.post<OrganizationMemberRow>(
    `/api/organizations/${organizationId}/curators/invite`,
    payload,
  )
  return res.data
}

/** POST /api/organizations/{id}/educators */
export async function addEducatorToOrganization(
  organizationId: number,
  userId: number,
): Promise<void> {
  await apiClient.post(`/api/organizations/${organizationId}/educators`, { userId })
}

/** POST /api/organizations/{id}/members/learners */
export async function addLearnerToOrganization(
  organizationId: number,
  userId: number,
): Promise<void> {
  await apiClient.post(`/api/organizations/${organizationId}/members/learners`, { userId })
}

/** PATCH /api/organizations/{id}/members/{userId}/curator-role */
export async function updateCuratorOrgRole(
  organizationId: number,
  userId: number,
  curatorOrgRole: CuratorOrgRole,
): Promise<void> {
  await apiClient.patch(`/api/organizations/${organizationId}/members/${userId}/curator-role`, {
    curatorOrgRole,
  })
}

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

/** POST /api/users — створення користувача (лише супер-адмін) */
export async function createUser(body: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  curatorGlobalRole?: 'NONE' | 'SUPER_ADMIN'
}): Promise<User> {
  const res = await apiClient.post<User>('/api/users', body)
  return res.data
}

/* ─── Enrollment ───────────────────────────────────────── */

/** POST /api/enrollments/{courseId} — самозапис слухача (JWT) */
export async function enrollInCourse(courseId: number): Promise<Enrollment> {
  const res = await apiClient.post<Enrollment>(`/api/enrollments/${courseId}`)
  return res.data
}

/** POST /api/enrollments/{courseId}/learners — запис слухача викладачем */
export async function enrollLearnerOnCourse(
  courseId: number,
  learnerUserId: number,
): Promise<Enrollment> {
  const res = await apiClient.post<Enrollment>(`/api/enrollments/${courseId}/learners`, {
    learnerUserId,
  })
  return res.data
}

/** GET /api/enrollments/my — усі записи поточного слухача */
export async function fetchMyEnrollments(): Promise<Enrollment[]> {
  const res = await apiClient.get<Enrollment[]>('/api/enrollments/my')
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

/** GET /api/quizzes/lesson/{lessonId}/editor — квіз з correct для кураторського редактора */
export async function fetchQuizForEdit(lessonId: number): Promise<Quiz> {
  const res = await apiClient.get<Quiz>(`/api/quizzes/lesson/${lessonId}/editor`)
  return res.data
}

/** Підтягує повні квізи з correct для кожного уроку (для PUT без втрати правильних відповідей). */
export async function enrichCourseWithEditorQuizzes(course: Course): Promise<Course> {
  const modules = await Promise.all(
    course.modules.map(async (m) => ({
      ...m,
      lessons: await Promise.all(
        m.lessons.map(async (l) => {
          if (!l.hasQuiz && !l.quiz) return l
          try {
            const quiz = await fetchQuizForEdit(l.id)
            return { ...l, quiz, hasQuiz: true }
          } catch {
            return l
          }
        }),
      ),
    })),
  )
  return { ...course, modules }
}

/** POST /api/quizzes/submit — перевірити відповіді слухача */
export async function submitQuiz(payload: SubmitQuizPayload): Promise<QuizResult> {
  const res = await apiClient.post<QuizResult>('/api/quizzes/submit', payload)
  return res.data
}

export async function fetchPendingQuizAttempts(): Promise<PendingQuizAttempt[]> {
  const res = await apiClient.get<PendingQuizAttempt[]>('/api/quizzes/attempts/pending')
  return res.data
}

export async function reviewQuizAttempt(
  attemptId: number,
  body: ReviewQuizAttemptRequest,
): Promise<QuizResult> {
  const res = await apiClient.post<QuizResult>(
    `/api/quizzes/attempts/${attemptId}/review`,
    body,
  )
  return res.data
}

export async function uploadMedia(file: File): Promise<{ mediaId: string; url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiClient.post<{ mediaId: string; url: string }>('/api/media', formData)
  const base = (apiClient.defaults.baseURL ?? '').replace(/\/$/, '')
  const path = res.data.url.startsWith('/') ? res.data.url : `/${res.data.url}`
  const url = `${base}${path}`
  return { ...res.data, url }
}
