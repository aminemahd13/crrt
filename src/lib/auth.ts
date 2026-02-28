
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/admin/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("[AUTH] Authorize called with email:", credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    console.log("[AUTH] Missing credentials");
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                }) as { id: string; email: string | null; name: string | null; password: string | null; role: string } | null;

                if (!user || !user.password) {
                    console.log("[AUTH] User not found or no password. Email:", credentials.email);
                    return null;
                }

                console.log("[AUTH] User found, comparing password...");
                const isValid = await bcrypt.compare(credentials.password, user.password);
                console.log("[AUTH] Password match:", isValid);

                if (!isValid) {
                    return null;
                }

                // Only allow admin and editor roles to log in
                console.log("[AUTH] User role:", user.role);
                if (!["admin", "editor"].includes(user.role)) {
                    console.log("[AUTH] Role rejected:", user.role);
                    return null;
                }

                console.log("[AUTH] Login successful for:", user.email);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as unknown as { role: string }).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as unknown as { role: string }).role = token.role as string;
                (session.user as unknown as { id: string }).id = token.id as string;
            }
            return session;
        },
    },
};
