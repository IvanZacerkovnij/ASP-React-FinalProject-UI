import { describe, expect, it } from "vitest";

import { AUTH_LIMITS } from "../constants/auth";

import {
  changePasswordSchema,
  passwordSchema,
  resetPasswordSchema,
  verificationCodeSchema,
  registerSchema,
  loginSchema,
} from "../schemas/auth.schema";

describe("shared authentication rules", () => {
  it("accepts the backend username boundaries and dots", () => {
    for (const username of ['a', 'ivan.z', 'a'.repeat(50)]) {
      expect(registerSchema.safeParse({ username, displayName: 'Іван', email: 'ivan@example.com', password: 'password' }).success).toBe(true);
    }
    for (const username of ['', 'a'.repeat(51), 'ivan-name', 'ivan name']) {
      expect(registerSchema.safeParse({ username, displayName: 'Іван', email: 'ivan@example.com', password: 'password' }).success).toBe(false);
    }
  });

  it("matches backend login password and identity limits", () => {
    expect(loginSchema.safeParse({ emailOrUsername: 'ivan', password: 'short' }).success).toBe(false);
    expect(loginSchema.safeParse({ emailOrUsername: 'a'.repeat(256), password: 'password' }).success).toBe(false);
    expect(loginSchema.safeParse({ emailOrUsername: 'ivan', password: 'password' }).success).toBe(true);
  });
  it("accepts a numeric verification code, including leading zeroes", () => {
    expect(
      verificationCodeSchema.safeParse({
        code: "0".repeat(AUTH_LIMITS.VERIFICATION_CODE_LENGTH),
      }).success,
    ).toBe(true);
  });

  it.each(["12345", "1234567", "abcdef", "12 456"])(
    "rejects invalid code %s",
    (code) => {
      expect(verificationCodeSchema.safeParse({ code }).success).toBe(false);
    },
  );

  it("uses the same password boundaries for resetting and changing passwords", () => {
    for (const length of [
      AUTH_LIMITS.PASSWORD_MIN_LENGTH - 1,
      AUTH_LIMITS.PASSWORD_MIN_LENGTH,
      AUTH_LIMITS.PASSWORD_MAX_LENGTH,
      AUTH_LIMITS.PASSWORD_MAX_LENGTH + 1,
    ]) {
      const password = "a".repeat(length);
      const expected = passwordSchema.safeParse(password).success;
      expect(
        resetPasswordSchema.safeParse({ password, confirmPassword: password })
          .success,
      ).toBe(expected);
      expect(
        changePasswordSchema.safeParse({
          currentPassword: "old-password",
          newPassword: password,
          confirmPassword: password,
        }).success,
      ).toBe(expected);
    }
  });

  it("reports a mismatched password against the confirmation field", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);

    if (!result.success) expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
  });
});
