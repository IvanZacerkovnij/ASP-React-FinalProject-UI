import { z } from "zod";

import { AUTH_LIMITS, MAX_NAME_LENGTH } from "../constants/auth";

export const emailSchema = z.string().min(1, "Введіть email").max(255, "Максимум 255 символів").email("Некоректний email");
export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Введіть email або username").max(255, "Максимум 255 символів"),
  password: z.string().min(AUTH_LIMITS.PASSWORD_MIN_LENGTH, "Мінімум 8 символів").max(AUTH_LIMITS.PASSWORD_MAX_LENGTH, "Максимум 64 символи"),
});

export const passwordSchema = z
  .string()
  .min(
    AUTH_LIMITS.PASSWORD_MIN_LENGTH,
    `Мінімум ${AUTH_LIMITS.PASSWORD_MIN_LENGTH} символів`,
  )
  .max(
    AUTH_LIMITS.PASSWORD_MAX_LENGTH,
    `Максимум ${AUTH_LIMITS.PASSWORD_MAX_LENGTH} символів`,
  );

export const verificationCodeSchema = z.object({
  code: z
    .string()
    .length(
      AUTH_LIMITS.VERIFICATION_CODE_LENGTH,
      `Код має містити ${AUTH_LIMITS.VERIFICATION_CODE_LENGTH} цифр`,
    )
    .regex(/^\d+$/, "Код має містити лише цифри"),
});
export type VerificationCodeFormValues = z.infer<typeof verificationCodeSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Підтвердіть пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не збігаються",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const registerSchema = z.object({
  displayName: z
    .string()
    .min(1, "Введіть ім'я")
    .max(MAX_NAME_LENGTH, `Максимум ${MAX_NAME_LENGTH} символів`),

  username: z
    .string()
    .min(
      AUTH_LIMITS.USERNAME_MIN_LENGTH,
      `Мінімум ${AUTH_LIMITS.USERNAME_MIN_LENGTH} символи`,
    )
    .max(
      AUTH_LIMITS.USERNAME_MAX_LENGTH,
      `Максимум ${AUTH_LIMITS.USERNAME_MAX_LENGTH} символів`,
    )
    .regex(/^[a-zA-Z0-9._]+$/, "Лише літери, цифри, крапка та _"),

  email: emailSchema,

  password: passwordSchema,
});

export const changePasswordBaseSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Підтвердіть новий пароль"),
  code: z.string().optional(),
});

export const changePasswordSchema = changePasswordBaseSchema.refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Паролі не збігаються",
    path: ["confirmPassword"],
  },
);

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
