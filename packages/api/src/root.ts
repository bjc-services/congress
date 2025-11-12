import { authRouter } from "./router/auth";
import { beneficiaryAuthRouter } from "./router/beneficiary-auth";
import { locationRouter } from "./router/location";
import { postRouter } from "./router/post";
import { uploadRouter } from "./router/upload";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  beneficiaryAuth: beneficiaryAuthRouter,
  location: locationRouter,
  post: postRouter,
  health: publicProcedure({ captcha: false }).query(() => {
    return "ok";
  }),
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
