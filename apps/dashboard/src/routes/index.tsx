import { Suspense } from "react";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { RouterOutputs } from "@congress/api";
import { CreatePostSchema } from "@congress/db/schema";
import { cn } from "@congress/ui";
import { Button } from "@congress/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@congress/ui/field";
import { Input } from "@congress/ui/input";
import { toast } from "@congress/ui/toast";

import { AuthShowcase } from "~/component/auth-showcase";

const DISABLE_POST_LIST = true as boolean;

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    if (DISABLE_POST_LIST) return;
    const { orpc, queryClient } = context;
    void queryClient.prefetchQuery(orpc.post.all.queryOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          {t("create_t3_turbo")}
        </h1>
        <AuthShowcase />

        <CreatePostForm />
        <div className="w-full max-w-2xl overflow-y-scroll">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            {DISABLE_POST_LIST ? (
              <div>{t("post_list_is_disabled")}</div>
            ) : (
              <PostList />
            )}
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function CreatePostForm() {
  const { t } = useTranslation();
  const { orpc } = useRouteContext({ from: "/" });

  const queryClient = useQueryClient();
  const createPost = useMutation(
    orpc.post.create.mutationOptions({
      onSuccess: async () => {
        form.reset();
        await queryClient.invalidateQueries({ queryKey: [["post"]] });
      },
      onError: (err: unknown) => {
        const error = err as { code?: string };
        toast.error(
          error.code === "UNAUTHORIZED"
            ? t("failed_to_create_post")
            : t("you_must_be_logged_in_to_post"),
        );
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      content: "",
      title: "",
    },
    validators: {
      onSubmit: CreatePostSchema,
    },
    onSubmit: (data) => {
      createPost.mutate(data.value);
    },
  });

  return (
    <form
      className="w-full max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field
          name="title"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>{t("bug_title")}</FieldLabel>
                </FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("bug_title")}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
        <form.Field
          name="content"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>
                    {t("bug_content")}
                  </FieldLabel>
                </FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("bug_content")}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <Button type="submit">{t("create_post")}</Button>
    </form>
  );
}

function PostList() {
  const { orpc } = useRouteContext({ from: "/" });
  const { t } = useTranslation();
  const { data: posts } = useSuspenseQuery(orpc.post.all.queryOptions()) as {
    data: RouterOutputs["post"]["all"];
  };

  if (posts.length === 0) {
    return (
      <div className="relative flex w-full flex-col gap-4">
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <p className="text-2xl font-bold text-white">{t("no_posts_yet")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {posts.map((p) => {
        return <PostCard key={p.id} post={p} />;
      })}
    </div>
  );
}

function PostCard(props: { post: RouterOutputs["post"]["all"][number] }) {
  const { orpc } = useRouteContext({ from: "/" });
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const deletePost = useMutation(
    orpc.post.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [["post"]] });
      },
      onError: (err: unknown) => {
        const error = err as { code?: string };
        toast.error(
          error.code === "UNAUTHORIZED"
            ? t("you_must_be_logged_in_to_delete_a_post")
            : t("failed_to_delete_post"),
        );
      },
    }),
  );

  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2 className="text-primary text-2xl font-bold">{props.post.title}</h2>
        <p className="mt-2 text-sm">{props.post.content}</p>
      </div>
      <div>
        <Button
          variant="ghost"
          className="text-primary cursor-pointer text-sm font-bold uppercase hover:bg-transparent hover:text-white"
          onClick={() => {
            deletePost.mutate(props.post.id);
          }}
        >
          {t("delete_post")}
        </Button>
      </div>
    </div>
  );
}

function PostCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;
  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2
          className={cn(
            "bg-primary w-1/4 rounded-sm text-2xl font-bold",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </h2>
        <p
          className={cn(
            "mt-2 w-1/3 rounded-sm bg-current text-sm",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </p>
      </div>
    </div>
  );
}
