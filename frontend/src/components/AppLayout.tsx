// frontend/src/components/AppLayout.tsx
import { Avatar } from "@/components/ui/avatar";
import { AuthLoadingScreen } from "@/components/AuthLoadingScreen";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/components/ui/dropdown";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "@/components/ui/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "@/components/ui/sidebar";
import { Layout } from "@/components/ui/layout";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/16/solid";
import {
  Cog6ToothIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  Square2StackIcon,
  ClockIcon,
} from "@heroicons/react/20/solid";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { VoiceModal } from "./VoiceModal";

function AccountDropdownMenu({
  anchor,
  onSignOut,
}: {
  anchor: "top start" | "bottom end";
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      <DropdownItem href="#">
        <UserCircleIcon />
        <DropdownLabel>My account</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="#">
        <ShieldCheckIcon />
        <DropdownLabel>Privacy policy</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="#">
        <LightBulbIcon />
        <DropdownLabel>Share feedback</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem onClick={onSignOut}>
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Sign out</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  );
}

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isLoading } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <>
      <Layout
        navbar={
          <Navbar>
            <NavbarSpacer />
            <NavbarSection>
              <Dropdown>
                <DropdownButton as={NavbarItem}>
                  <Avatar src="/users/erica.jpg" square />
                </DropdownButton>
                <AccountDropdownMenu
                  anchor="bottom end"
                  onSignOut={handleSignOut}
                />
              </Dropdown>
            </NavbarSection>
          </Navbar>
        }
        sidebar={
          <Sidebar>
            <SidebarHeader>
              <Dropdown>
                <DropdownButton as={SidebarItem}>
                  <SidebarLabel className="dark:text-white text-black">
                    {user?.locations?.[0]?.name}
                  </SidebarLabel>
                  <ChevronDownIcon />
                </DropdownButton>
                <DropdownMenu
                  className="min-w-80 lg:min-w-64 z-[2001]"
                  anchor="bottom start"
                >
                  <DropdownItem href="/settings">
                    <Cog8ToothIcon />
                    <DropdownLabel>Settings</DropdownLabel>
                  </DropdownItem>
                  {user?.locations && user.locations.length > 1 && (
                    <>
                      <DropdownDivider />
                      {user.locations.map((location) => (
                        <DropdownItem key={location.id} href="#">
                          <Avatar
                            slot="icon"
                            initials={location.name
                              .substring(0, 2)
                              .toUpperCase()}
                            className="bg-purple-500 text-white"
                          />
                          <DropdownLabel>{location.name}</DropdownLabel>
                        </DropdownItem>
                      ))}
                      <DropdownDivider />
                    </>
                  )}
                  <DropdownItem href="#">
                    <PlusIcon />
                    <DropdownLabel>New location…</DropdownLabel>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </SidebarHeader>

            <SidebarBody>
              <SidebarSection>
                <SidebarItem href="/dashboard">
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/stocklist">
                  <Square2StackIcon />
                  <SidebarLabel>Stock</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/items">
                  <Square2StackIcon />
                  <SidebarLabel>Items</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/changelog">
                  <ClockIcon />
                  <SidebarLabel>Change Log</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/settings">
                  <Cog6ToothIcon />
                  <SidebarLabel>Settings</SidebarLabel>
                </SidebarItem>
              </SidebarSection>

              <SidebarSection className="max-lg:hidden">
                <SidebarHeading>Upcoming Events</SidebarHeading>
              </SidebarSection>

              <SidebarSpacer />

              <SidebarSection>
                <SidebarItem href="#">
                  <QuestionMarkCircleIcon />
                  <SidebarLabel>Support</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#">
                  <SparklesIcon />
                  <SidebarLabel>Development</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#">
                  {(() => {
                    const { theme } = useThemeStore();
                    return (
                      <Avatar
                        src={
                          theme === "dark"
                            ? "/teams/logo-light.svg"
                            : "/teams/logo-black.svg"
                        }
                        className="w-14 h-14 text-white"
                      />
                    );
                  })()}
                  <SidebarLabel>StockCount</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            </SidebarBody>

            <SidebarFooter className="max-lg:hidden">
              <Dropdown>
                <DropdownButton as={SidebarItem}>
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar
                      src="/users/erica.jpg"
                      className="size-10"
                      square
                      alt=""
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                        {user?.name || "User"}
                      </span>
                      <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                        {user?.email}
                      </span>
                    </span>
                  </span>
                  <ChevronUpIcon />
                </DropdownButton>
                <AccountDropdownMenu
                  anchor="top start"
                  onSignOut={handleSignOut}
                />
              </Dropdown>
            </SidebarFooter>
          </Sidebar>
        }
      >
        {children}
      </Layout>
      <VoiceModal />
    </>
  );
}
