import type { CourseStatus, EnrollmentStatus, SkillCategory, SkillLevel } from '../types/course'
import type { UserRole } from '../types/user'

export const courseStatusUa: Record<CourseStatus, string> = {
  DRAFT: 'Чернетка',
  PUBLISHED: 'Опубліковано',
  ARCHIVED: 'Архів',
}

export const userRoleUa: Record<UserRole, string> = {
  CURATOR: 'Куратор навчання',
  EDUCATOR: 'Викладач / ментор',
  LEARNER: 'Слухач (ІТ-працівник)',
}

export const enrollmentStatusUa: Record<EnrollmentStatus, string> = {
  ENROLLED: 'Навчається',
  COMPLETED: 'Завершено',
}

export const skillLevelUa: Record<SkillLevel, string> = {
  TRAINEE: 'Trainee',
  JUNIOR: 'Junior',
  MIDDLE: 'Middle',
  SENIOR: 'Senior',
}

export const skillCategoryUa: Record<SkillCategory, string> = {
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  CLOUD: 'Cloud',
  DEVOPS: 'DevOps',
  DATA: 'Data',
  SOFT_SKILLS: 'Soft Skills',
}
