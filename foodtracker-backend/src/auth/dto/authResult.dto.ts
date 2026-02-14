
export type AuthResult = {
  accessToken: string;
  refreshToken?: string;
  userId: number;
  username: string;
  csrfToken?: string;
};
