import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import bcrypt from "bcryptjs";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password<DataModel>({
      id: "password",
      profile(params) {
        return {
          email: params.email as string,
        };
      },
      async verify(ctx, credentials) {
        const { email, password } = credentials;

        // Look up user by username (we use email field for username)
        const user = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", email))
          .unique();

        if (!user) {
          throw new Error("Invalid credentials");
        }

        // Verify password using existing bcrypt hash
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Return user ID as the subject - this will be available in ctx.auth.getUserIdentity()
        return {
          userId: user._id,
        };
      },
    }),
  ],
});
