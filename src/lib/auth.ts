

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { Role } from "@prisma/client";

/**
 * Configuration NextAuth v5
 * 
 * IMPORTANT : Ce fichier NE doit PAS importer Prisma
 * L'authentification se fait via une route API en Node.js runtime
 */

export const { handlers, signIn, signOut, auth } = NextAuth({
  // debug: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Tentative de connexion:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Email ou mot de passe manquant");
          return null;
        }

        try {
          // Appeler la route API pour vérifier les credentials
          const response = await fetch(
            `${process.env.AUTH_URL || "http://localhost:3000"}/api/auth/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            console.log("❌ Échec authentification:", error.error);
            return null;
          }

          const user = await response.json();
          console.log("✅ Connexion réussie pour:", user.email);
          
          return user;
        } catch (error) {
          console.error("❌ Erreur lors de l'authentification:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.departmentId = user.departmentId as string | null;
        token.departmentName = user.departmentName as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.departmentId = token.departmentId as string | null;
        session.user.departmentName = token.departmentName as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 heures
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});