import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GithubIcon } from "lucide-react";
import { getServerSession } from "next-auth";
import { LogoutButton } from "@/components/shared/logout-button";
import { Badge } from "../ui/badge";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Hey, {session?.user.name}</h1>
        <Badge className="uppercase ">{session?.user.role || "user"}</Badge>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/devwithfarshi/multifunctional-task-app-next-js"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              <GithubIcon />
              GitHub
            </a>
          </Button>
          {session?.user && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
