import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      mustRotatePassword: boolean;
    };
  }

  interface User {
    role: string;
    mustRotatePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    mustRotatePassword?: boolean;
  }
}
