import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido').transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'La contraseña es requerida').max(256),
}).strict()

export const strongPasswordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .regex(/[a-z]/, 'Debe incluir una letra minúscula')
  .regex(/[A-Z]/, 'Debe incluir una letra mayúscula')
  .regex(/\d/, 'Debe incluir un número')

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: strongPasswordSchema,
}).strict()
