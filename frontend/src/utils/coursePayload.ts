import type { Course, CreateCourseRequest } from '../types/course'

/** Перетворює CourseResponse у тіло PUT (повна структура для бекенду). */
export function courseToCreatePayload(course: Course): CreateCourseRequest {
  return {
    title: course.title,
    description: course.description,
    status: course.status,
    organizationId: course.organizationId,
    modules: [...course.modules]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((m) => ({
        id: m.id,
        name: m.name,
        sortOrder: m.sortOrder,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          content: l.content,
          quiz: l.quiz
            ? {
                id: l.quiz.id,
                title: l.quiz.title,
                passingScore: l.quiz.passingScore,
                questions: l.quiz.questions.map((q) => ({
                  id: q.id,
                  text: q.text,
                  sortOrder: q.sortOrder,
                  type: q.type,
                  options: q.options.map((o) => ({
                    id: o.id,
                    text: o.text,
                    correct: o.correct ?? false,
                  })),
                })),
              }
            : null,
        })),
      })),
  }
}
