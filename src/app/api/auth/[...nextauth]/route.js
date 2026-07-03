import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Email et Mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials, req) {
        if (credentials?.code) {
          const stored = global.verificationCodes?.get(credentials.email);
          if (!stored || stored.code !== credentials.code || Date.now() > stored.expires) {
            throw new Error("Code invalide ou expiré");
          }
          global.verificationCodes.delete(credentials.email);
          
          const dbUser = await prisma.user.upsert({
            where: { email: credentials.email },
            update: { name: credentials.name || credentials.email.split('@')[0] },
            create: { 
              email: credentials.email, 
              name: credentials.name || credentials.email.split('@')[0],
              image: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + credentials.email
            }
          });
          return { id: dbUser.id, name: dbUser.name, email: dbUser.email, image: dbUser.image };
        }

        if (credentials?.email && credentials?.password) {
          const dbUser = await prisma.user.upsert({
            where: { email: credentials.email },
            update: {},
            create: { 
              email: credentials.email, 
              name: credentials.name || credentials.email.split('@')[0],
              image: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + credentials.email
            }
          });
          return { id: dbUser.id, name: dbUser.name, email: dbUser.email, image: dbUser.image };
        }
        return null;
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (user && user.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name, image: user.image },
          create: { email: user.email, name: user.name, image: user.image }
        });
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        try {
          const dbUser = await prisma.user.upsert({
            where: { email: session.user.email },
            update: {},
            create: { email: session.user.email, name: session.user.name, image: session.user.image }
          });
          session.user.id = dbUser.id;
        } catch (e) {
          session.user.id = token.sub;
        }
      } else if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
