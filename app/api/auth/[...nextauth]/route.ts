import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.role) return null;
        
        // Mocking user roles based on credentials input
        let role = credentials.role.toUpperCase();
        if (!["SUPER_ADMIN", "EDITOR", "VIEWER"].includes(role)) {
          return null;
        }

        return {
          id: role.toLowerCase() + "-id",
          name: `${role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')} User`,
          email: `${role.toLowerCase()}@example.com`,
          role: role,
          accessToken: `mock-token-${role}`, // Mock access token for Axios interceptor
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
