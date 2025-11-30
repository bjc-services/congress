import { createContext, useCallback, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";

import type { RouterOutputs } from "@congress/api";

type BeneficiarySession = RouterOutputs["beneficiaryAuth"]["getSession"];

interface BeneficiaryAuthContextValue {
  session: BeneficiarySession | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

const BeneficiaryAuthContext = createContext<
  BeneficiaryAuthContextValue | undefined
>(undefined);

export function BeneficiaryAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orpc } = useRouteContext({ from: "__root__" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Always fetch session - the server-side getSession endpoint can read httpOnly cookies
  // and will return null if the cookie doesn't exist or is invalid
  const {
    data: session,
    isLoading,
    refetch: refetchSession,
  } = useQuery({
    ...orpc.beneficiaryAuth.getSession.queryOptions(),
    retry: false, // Don't retry if there's no session
    retryOnMount: false, // Don't retry on mount if there's no session
    staleTime: 0, // Always check for fresh session
  });

  const isAuthenticated = !!session;

  // Sign out mutation
  const logoutMutation = useMutation(
    orpc.beneficiaryAuth.logout.mutationOptions({
      onSuccess: async () => {
        // Invalidate session query
        await queryClient.invalidateQueries({
          queryKey: [["beneficiaryAuth", "getSession"]],
        });
        // Navigate to home
        await navigate({ href: "/", replace: true });
      },
    }),
  );

  const signOut = useCallback(async () => {
    await logoutMutation.mutateAsync(undefined);
  }, [logoutMutation]);

  const refetchSessionCallback = useCallback(async () => {
    await refetchSession();
  }, [refetchSession]);

  return (
    <BeneficiaryAuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated,
        signOut,
        refetchSession: refetchSessionCallback,
      }}
    >
      {children}
    </BeneficiaryAuthContext.Provider>
  );
}

export function useBeneficiaryAuth() {
  const context = useContext(BeneficiaryAuthContext);
  if (context === undefined) {
    throw new Error(
      "useBeneficiaryAuth must be used within a BeneficiaryAuthProvider",
    );
  }
  return context;
}
