import type { Course, CreateCourseRequest } from '../types/course'

/** Перетворює CourseResponse у тіло PUT (повна структура для бекенду). */
export function courseToCreatePayload(course: Course): CreateCourseRequest {
  return {
    title: course.title,
    description: course.description,
    status: course.status,
    modules: [...course.modules]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((m) => ({
        name: m.name,
        sortOrder: m.sortOrder,
        lessons: m.lessons.map((l) => ({
          title: l.title,
          content: l.content,
        })),
      })),
  }
}
