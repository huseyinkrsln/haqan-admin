import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:5000";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error("Login failed on backend. Status:", res.status, "Response:", errText);
            return null;
          }

          const result = await res.json();
          console.log("Login Success Result:", JSON.stringify(result));

          // Backend: { Success: true, Data: { Token, RefreshToken, Expiration, Claims } }
          if (!result.Success || !result.Data?.Token) {
            console.error("Login data format error. Success flag or token missing.");
            return null;
          }

          const { Token, RefreshToken, Expiration, Claims } = result.Data;

          // Eğer backend özel bir "role:ADMIN" göndermiyorsa varsayılan SUPER_ADMIN yapıyoruz
          const roleClaim = (Claims as string[])?.find((c: string) => c.toLowerCase().startsWith("role:"));
          const role = roleClaim ? roleClaim.split(":")[1] : "SUPER_ADMIN";

          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email,
            role,
            accessToken: Token,
            refreshToken: RefreshToken,
            expiration: Expiration,
          };
        } catch (error) {
          console.error("Auth Exception:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiration = user.expiration;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiration = token.expiration;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 8, // 8 saat
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
