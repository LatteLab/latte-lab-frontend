import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
// import Okta from 'next-auth/providers/okta'; // TODO: Uncomment when Okta is configured
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, verificationTokens } from '@/lib/db/schema';
import { isAdmin } from '@/lib/db/queries';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    // TODO: Uncomment when Okta is configured
    // Okta({
    //   clientId: process.env.AUTH_OKTA_ID,
    //   clientSecret: process.env.AUTH_OKTA_SECRET,
    //   issuer: process.env.AUTH_OKTA_ISSUER,
    //   allowDangerousEmailAccountLinking: true,
    // }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM,
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/login?verify=true',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.isAdmin = await isAdmin(user.email);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});
