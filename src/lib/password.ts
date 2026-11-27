export const PASSWORD_RULE = "Kata sandi harus 8–72 karakter";

// bcrypt hanya memproses 72 byte pertama
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && new TextEncoder().encode(password).length <= 72;
}
