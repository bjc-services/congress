import { z } from "zod/v4";

import { desc, eq } from "@congress/db";
import { db } from "@congress/db/client";
import { CreatePostSchema, Post } from "@congress/db/schema";

import { protectedProcedure, publicProcedure } from "../orpc";

export const postRouter = {
  all: publicProcedure({ captcha: false }).handler(() => {
    return db.query.Post.findMany({
      orderBy: desc(Post.id),
      limit: 10,
    });
  }),

  byId: publicProcedure({ captcha: false })
    .input(z.object({ id: z.string() }))
    .handler(({ input }) => {
      return db.query.Post.findFirst({
        where: eq(Post.id, input.id),
      });
    }),

  create: protectedProcedure.input(CreatePostSchema).handler(({ input }) => {
    return db.insert(Post).values(input);
  }),

  delete: protectedProcedure.input(z.string()).handler(({ input }) => {
    return db.delete(Post).where(eq(Post.id, input));
  }),
};
