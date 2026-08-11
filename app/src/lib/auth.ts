export const AUTH_COOKIE = "library3d_admin_auth";

export function isValidAuthToken(token: string | undefined) {
  if (!token) return false;
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD;
  const expected = Buffer.from(`${expectedUser}:${expectedPass}`).toString("base64");
  return token === expected;
}
