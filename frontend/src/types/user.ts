/**
 * Відповідає com.kyrylo.thesis.user.domain.UserRole (Jackson серіалізує як рядок).
 */
export type UserRole = 'CURATOR' | 'EDUCATOR' | 'LEARNER'

/**
 * Відповідає com.kyrylo.thesis.user.web.dto.UserResponse
 * (Long id у JSON — число).
 */
export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
}
