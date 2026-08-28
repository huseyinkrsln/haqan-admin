import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

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

          const { Token, RefreshToken, Expiration, Claims, Roles } = result.Data;

          // Backend'den gelen gerçek rolleri (Groups) ve Claims listesini kontrol ediyoruz
          const rolesList: string[] = Array.isArray(Roles)
            ? Roles
            : (Array.isArray(result.Data?.roles) ? result.Data.roles : []);

          // Yalnızca ve kesinlikle SuperAdmin rolüne sahip kullanıcılar giriş yapabilir
          const isSuperAdmin =
            rolesList.some((r: string) => {
              const clean = r.toLowerCase().replace(/[\s_-]/g, "");
              return clean === "superadmin" || clean === "superadministrator";
            }) ||
            (Claims as string[])?.some((c: string) => {
              const clean = c.toLowerCase().replace(/[\s_-]/g, "");
              return (
                clean === "superadmin" ||
                clean === "role:superadmin" ||
                clean === "role:super_admin"
              );
            });

          if (!isSuperAdmin) {
            console.warn(`Access Denied: User "${credentials.email}" does not have SuperAdmin role.`);
            return null;
          }

          // JWT Token içinden kullanıcının gerçek Ad Soyad (FullName) ve ID bilgisini alıyoruz
          let fullName = credentials.email;
          let userId: number | undefined = undefined;

          if (Token) {
            try {
              const base64Payload = Token.split(".")[1];
              if (base64Payload) {
                const decodedPayload = JSON.parse(
                  Buffer.from(base64Payload, "base64").toString("utf-8")
                );
                fullName =
                  decodedPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
                  decodedPayload["name"] ||
                  credentials.email;
                const idStr =
                  decodedPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
                  decodedPayload["nameid"] ||
                  decodedPayload["sub"];
                if (idStr) userId = Number(idStr);
              }
            } catch (e) {
              console.error("Token payload decode error:", e);
            }
          }

          return {
            id: userId ? String(userId) : credentials.email,
            email: credentials.email,
            name: fullName,
            fullName: fullName,
            role: "SUPER_ADMIN",
            roles: rolesList,
            accessToken: Token,
            refreshToken: RefreshToken,
            expiration: Expiration,
          };
        } catch (error: any) {
          console.error("Auth Exception:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.name = user.name;
        token.fullName = user.fullName;
        token.role = user.role;
        token.roles = user.roles;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiration = user.expiration;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        (session.user as any).name = token.name || token.fullName;
        (session.user as any).fullName = token.fullName || token.name;
        (session.user as any).role = token.role;
        (session.user as any).roles = token.roles;
      }
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiration = token.expiration;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 8, // 8 saat
  },
  secret: process.env.NEXTAUTH_SECRET || "haqanwear-secret-key-12345",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
