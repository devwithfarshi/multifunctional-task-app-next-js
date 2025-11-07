import { UserModel } from "@/models";
import {
  credentialsSchema,
  nextAuthSecretSchema,
  oauthProviderEnvSchema,
} from "@/schemas/auth.schema";
import { compare } from "bcrypt";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const providers: NextAuthOptions["providers"] = [];

const googleEnv = oauthProviderEnvSchema.safeParse({
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
});
if (googleEnv.success) {
  providers.push(
    GoogleProvider({
      clientId: googleEnv.data.clientId,
      clientSecret: googleEnv.data.clientSecret,
    })
  );
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }
      const { email, password } = parsed.data;
      const user = await UserModel.findByEmail(email);
      if (!user || !user.passwordHash) {
        return null;
      }
      const isValid = await compare(password, user.passwordHash);
      if (!isValid) {
        return null;
      }
      return { id: user._id.toString(), name: user.name, email: user.email };
    },
  })
);

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user?.email) return false;
        const existing = await UserModel.findByEmail(user.email);
        if (!existing) {
          await UserModel.createUser({
            name: user.name ?? user.email.split("@")[0],
            email: user.email,
            emailVerified: new Date(),
            provider: "google",
            passwordHash: null,
          });
        } else {
          const updates: Record<string, unknown> = {};
          if (!existing.emailVerified) {
            updates.emailVerified = new Date();
          }
          if (!existing.provider && !existing.passwordHash) {
            updates.provider = "google";
          }
          if (Object.keys(updates).length > 0) {
            await UserModel.updateUserById(existing._id, updates);
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (email) {
        const existing = await UserModel.findByEmail(email);
        if (existing) {
          token.userId = existing._id.toString();
          token.role = existing.role;
          token.provider = existing.provider;
        } else {
          delete token.userId;
          delete token.role;
          delete token.provider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.provider = token.provider;
      }
      return session;
    },
  },
  ...(nextAuthSecretSchema.safeParse(process.env.NEXTAUTH_SECRET).success
    ? { secret: process.env.NEXTAUTH_SECRET as string }
    : {}),
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
