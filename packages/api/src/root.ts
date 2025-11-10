import { authRouter } from "./router/auth";
import { beneficiaryAuthRouter } from "./router/beneficiary-auth";
import { postRouter } from "./router/post";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  beneficiaryAuth: beneficiaryAuthRouter,
  post: postRouter,
  health: publicProcedure({ captcha: false }).query(() => {
    return "ok";
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
