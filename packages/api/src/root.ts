import { publicProcedure } from "./orpc";
import { applicationRouter } from "./router/application";
import { authRouter } from "./router/auth";
import { beneficiaryAuthRouter } from "./router/beneficiary-auth";
import { locationRouter } from "./router/location";
import { postRouter } from "./router/post";
import { uploadRouter } from "./router/upload";

export const appRouter = {
  application: applicationRouter,
  auth: authRouter,
  beneficiaryAuth: beneficiaryAuthRouter,
  location: locationRouter,
  post: postRouter,
  health: publicProcedure({ captcha: false }).handler(() => {
    return "ok";
  }),
  upload: uploadRouter,
};

export type AppRouter = typeof appRouter;
