import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@congress/ui/button";
import { LanguageSwitcher } from "@congress/ui/language-switcher";
import { WideLogo } from "@congress/ui/wide-logo";

import { useBeneficiaryAuth } from "~/lib/beneficiary-auth-provider";

export const Navbar = () => {
  const { signOut } = useBeneficiaryAuth();
  const { t } = useTranslation();

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <WideLogo className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="text-foreground hover:text-foreground" />
            <Button
              variant="outline"
              onClick={() => {
                void signOut();
              }}
            >
              {t("logout")}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
