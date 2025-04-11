import { FormEvent, useState } from "react";
import { ApplicationLayout } from "../components/AppLayout";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import supabase from "../config/supabase";

const secondaryNavigation = [
  { name: "Account", href: "#account", current: true },
  { name: "Notifications", href: "#notifications", current: false },
  { name: "Billing", href: "#billing", current: false },
  { name: "Teams", href: "#teams", current: false },
  { name: "Integrations", href: "#integrations", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Settings() {
  const { user, supabase, signOut } = useAuth();
  const { addNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState("Account");

  // Split the user's name into firstName and lastName for form initialization
  const fullName = user?.user_metadata?.name || "";
  const nameParts = fullName.split(" ");
  const defaultFirstName = user?.user_metadata?.firstName || nameParts[0] || "";
  const defaultLastName =
    user?.user_metadata?.lastName || nameParts.slice(1).join(" ") || "";

  const handlePersonalInfoSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const firstName = formData.get("first-name") as string;
      const lastName = formData.get("last-name") as string;
      const username = formData.get("username") as string;
      const timezone = formData.get("timezone") as string;

      // Create a combined name field
      const name = `${firstName} ${lastName}`.trim();

      // Update user metadata using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName,
          lastName,
          name,
          username,
          timezone,
        },
      });

      if (error) throw error;

      // Refresh the session to get updated user data
      await supabase.auth.refreshSession();

      addNotification("success", "Personal information updated successfully");
    } catch (error: any) {
      console.error("Error updating personal info:", error);
      addNotification(
        "error",
        error.message || "Failed to update personal information"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);

    try {
      const formData = new FormData(e.currentTarget);
      const currentPassword = formData.get("current_password") as string;
      const newPassword = formData.get("new_password") as string;
      const confirmPassword = formData.get("confirm_password") as string;

      if (newPassword !== confirmPassword) {
        addNotification("error", "New password and confirmation do not match");
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      addNotification("success", "Password updated successfully");
      e.currentTarget.reset();
    } catch (error: any) {
      console.error("Error updating password:", error);
      addNotification("error", error.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutOtherSessions = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.refreshSession();

      if (error) throw error;

      addNotification("success", "All other sessions have been logged out");
      e.currentTarget.reset();
    } catch (error: any) {
      console.error("Error logging out other sessions:", error);
      addNotification(
        "error",
        error.message || "Failed to log out other sessions"
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    try {
      // Delete the user account
      const { error } = await supabase.auth.admin.deleteUser(
        user?.id as string
      );

      if (error) throw error;

      addNotification("success", "Your account has been deleted");
      signOut(); // Sign out and redirect to login
    } catch (error: any) {
      console.error("Error deleting account:", error);
      addNotification("error", error.message || "Failed to delete account");
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <ApplicationLayout>
      <main className="h-full">
        <h1 className="sr-only">Account Settings</h1>

        <header className="border-b border-gray-200">
          {/* Secondary navigation */}
          <nav className="flex overflow-x-auto py-4">
            <ul
              role="list"
              className="flex min-w-full flex-none gap-x-6 px-4 text-sm/6 font-semibold text-gray-500 sm:px-6 lg:px-8"
            >
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(item.name);
                    }}
                    className={activeTab === item.name ? "text-indigo-500" : ""}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {/* Settings forms */}
        <div className="divide-y divide-gray-200">
          {activeTab === "Account" && (
            <>
              <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-500">
                    Use a permanent address where you can receive mail.
                  </p>
                </div>

                <form
                  className="md:col-span-2"
                  onSubmit={handlePersonalInfoSubmit}
                >
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                    <div className="col-span-full flex items-center gap-x-8">
                      <img
                        alt=""
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user?.user_metadata?.name || "User"
                        )}&background=0D9488&color=fff&size=96`}
                        className="size-24 flex-none rounded-lg bg-gray-100 object-cover"
                      />
                      <div>
                        <button
                          type="button"
                          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Change avatar
                        </button>
                        <p className="mt-2 text-xs/5 text-gray-500">
                          JPG, GIF or PNG. 1MB max.
                        </p>
                      </div>
                    </div>

                    {/* Test notification button */}
                    <div className="col-span-full">
                      <button
                        type="button"
                        onClick={() => {
                          addNotification(
                            "success",
                            "This is a test notification"
                          );
                          setTimeout(() => {
                            addNotification(
                              "error",
                              "This is an error notification"
                            );
                          }, 1000);
                          setTimeout(() => {
                            addNotification(
                              "warning",
                              "This is a warning notification"
                            );
                          }, 2000);
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Test notifications
                      </button>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="first-name"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        First name
                      </label>
                      <div className="mt-2">
                        <input
                          id="first-name"
                          name="first-name"
                          type="text"
                          autoComplete="given-name"
                          defaultValue={defaultFirstName}
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="last-name"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Last name
                      </label>
                      <div className="mt-2">
                        <input
                          id="last-name"
                          name="last-name"
                          type="text"
                          autoComplete="family-name"
                          defaultValue={defaultLastName}
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="email"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Email address
                      </label>
                      <div className="mt-2">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          defaultValue={user?.email || ""}
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="username"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Username
                      </label>
                      <div className="mt-2">
                        <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                          <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm/6">
                            example.com/
                          </span>
                          <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="janesmith"
                            defaultValue={user?.user_metadata?.username || ""}
                            className="flex-1 border-0 bg-transparent px-3 py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm/6"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="timezone"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Timezone
                      </label>
                      <div className="mt-2 grid grid-cols-1">
                        <select
                          id="timezone"
                          name="timezone"
                          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pl-3 pr-8 text-base outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                        >
                          <option>Pacific Standard Time</option>
                          <option>Eastern Standard Time</option>
                          <option>Greenwich Mean Time</option>
                        </select>
                        <ChevronDownIcon
                          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-70"
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Change password
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-500">
                    Update your password associated with your account.
                  </p>
                </div>

                <form className="md:col-span-2" onSubmit={handlePasswordChange}>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                    <div className="col-span-full">
                      <label
                        htmlFor="current-password"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Current password
                      </label>
                      <div className="mt-2">
                        <input
                          id="current-password"
                          name="current_password"
                          type="password"
                          autoComplete="current-password"
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="new-password"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        New password
                      </label>
                      <div className="mt-2">
                        <input
                          id="new-password"
                          name="new_password"
                          type="password"
                          autoComplete="new-password"
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="confirm-password"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Confirm password
                      </label>
                      <div className="mt-2">
                        <input
                          id="confirm-password"
                          name="confirm_password"
                          type="password"
                          autoComplete="new-password"
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
                    >
                      {isChangingPassword ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Log out other sessions
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-500">
                    Please enter your password to confirm you would like to log
                    out of your other sessions across all of your devices.
                  </p>
                </div>

                <form
                  className="md:col-span-2"
                  onSubmit={handleLogoutOtherSessions}
                >
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                    <div className="col-span-full">
                      <label
                        htmlFor="logout-password"
                        className="block text-sm/6 font-medium text-gray-900"
                      >
                        Your password
                      </label>
                      <div className="mt-2">
                        <input
                          id="logout-password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex">
                    <button
                      type="submit"
                      disabled={isLoggingOut}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
                    >
                      {isLoggingOut
                        ? "Processing..."
                        : "Log out other sessions"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Delete account
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-500">
                    No longer want to use our service? You can delete your
                    account here. This action is not reversible. All information
                    related to this account will be deleted permanently.
                  </p>
                </div>

                <form
                  className="flex items-start md:col-span-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShowDeleteConfirmation(true);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                  >
                    Yes, delete my account
                  </button>
                </form>
              </div>
            </>
          )}

          {activeTab === "Notifications" && (
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Notification Settings
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Manage how and when you receive notifications.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium leading-6 text-gray-900">
                        Email Notifications
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Receive email notifications about account activity.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
                    >
                      <span className="translate-x-5 pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out">
                        <span className="opacity-0 absolute inset-0 h-full w-full flex items-center justify-center transition-opacity"></span>
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium leading-6 text-gray-900">
                        Push Notifications
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Receive push notifications on your device.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
                    >
                      <span className="translate-x-0 pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out">
                        <span className="opacity-100 absolute inset-0 h-full w-full flex items-center justify-center transition-opacity"></span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Billing" && (
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Billing Information
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Manage your subscription and payment methods.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-md bg-gray-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Current Plan
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">Free Plan</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Teams" && (
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Team Management
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Manage your team members and their access.
                </p>
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Invite Team Member
                </button>

                <div className="mt-6">
                  <p className="text-sm text-gray-500">No team members yet.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Integrations" && (
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Connected Services
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Connect your account with third-party services.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Google
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Connect your Google account
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Connect
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        GitHub
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Connect your GitHub account
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon
                    className="h-6 w-6 text-red-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <DialogTitle
                    as="h3"
                    className="text-base font-semibold leading-6 text-gray-900"
                  >
                    Delete account
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete your account? All of your
                      data will be permanently removed from our servers forever.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </ApplicationLayout>
  );
}
