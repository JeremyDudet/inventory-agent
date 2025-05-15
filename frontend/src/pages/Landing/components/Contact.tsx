// frontend/src/pages/Landing/components/Contact.tsx
import { useState, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Field, Label, Switch } from "@headlessui/react";
import emailjs from "@emailjs/browser";

export default function Contact() {
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    emailjs.init({
      publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string,
    });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed) {
      alert("Please agree to the privacy policy.");
      return;
    }
    setLoading(true);
    emailjs
      .sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID as string,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string,
        e.target as HTMLFormElement
      )
      .then(
        () => {
          setSubmitted(true);
          setError(false);
          setLoading(false);
          (e.target as HTMLFormElement).reset();
          setAgreed(false);
        },
        (error) => {
          setError(true);
          setSubmitted(false);
          setLoading(false);
          console.log("FAILED...", error);
        }
      );
  };

  return (
    <div
      id="contact"
      className="isolate bg-white dark:bg-zinc-900 px-6 py-24 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Contact us
        </h2>
        <p className="mt-2 text-lg/8 text-gray-600 dark:text-gray-400">
          We'd love to hear from you!
        </p>
      </div>
      <form
        id="contact-form"
        onSubmit={handleSubmit}
        className="mx-auto mt-16 max-w-xl sm:mt-20"
      >
        <input type="hidden" name="time" value={new Date().toLocaleString()} />
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="block text-sm/6 font-semibold text-gray-900 dark:text-white"
            >
              Name
            </label>
            <div className="mt-2.5">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md bg-white dark:bg-zinc-800 px-3.5 py-2 text-base text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-zinc-600 dark:focus:outline-zinc-400"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="title"
              className="block text-sm/6 font-semibold text-gray-900 dark:text-white"
            >
              Subject
            </label>
            <div className="mt-2.5">
              <input
                id="title"
                name="title"
                type="text"
                required
                className="block w-full rounded-md bg-white dark:bg-zinc-800 px-3.5 py-2 text-base text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-zinc-600 dark:focus:outline-zinc-400"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="email"
              className="block text-sm/6 font-semibold text-gray-900 dark:text-white"
            >
              Email
            </label>
            <div className="mt-2.5">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md bg-white dark:bg-zinc-800 px-3.5 py-2 text-base text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-zinc-950 dark:focus:outline-zinc-400"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="message"
              className="block text-sm/6 font-semibold text-gray-900 dark:text-white"
            >
              Message
            </label>
            <div className="mt-2.5">
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                className="block w-full rounded-md bg-white dark:bg-zinc-800 px-3.5 py-2 text-base text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-zinc-600 dark:focus:outline-zinc-400"
                defaultValue={""}
              />
            </div>
          </div>
          <Field className="flex gap-x-4 sm:col-span-2">
            <div className="flex h-6 items-center">
              <Switch
                checked={agreed}
                onChange={setAgreed}
                className="group flex w-8 flex-none cursor-pointer rounded-full bg-gray-200 dark:bg-gray-700 p-px ring-1 ring-inset ring-gray-900/5 dark:ring-gray-100/5 transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:focus-visible:outline-zinc-400 data-[checked]:bg-zinc-600 dark:data-[checked]:bg-zinc-500"
              >
                <span className="sr-only"> Agree to policies</span>
                <span
                  aria-hidden="true"
                  className="size-4 transform rounded-full bg-white dark:bg-gray-100 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5 transition duration-200 ease-in-out group-data-[checked]:translate-x-3.5"
                />
              </Switch>
            </div>
            <Label className="text-sm/6 text-gray-600 dark:text-gray-400">
              By selecting this, you agree to our{" "}
              <a
                href="#"
                className="font-semibold text-zinc-600 dark:text-zinc-400"
              >
                privacy policy
              </a>
              .
            </Label>
          </Field>
        </div>
        <div className="mt-10">
          <button
            type="submit"
            disabled={loading}
            className="block w-full rounded-md bg-zinc-950 dark:bg-zinc-500 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:focus-visible:outline-zinc-400"
          >
            {loading ? "Sending..." : "Let's talk"}
          </button>
        </div>
      </form>
      {submitted && (
        <p className="text-green-600 dark:text-green-400 mt-4">
          Thank you for contacting us! We'll get back to you soon.
        </p>
      )}
      {error && (
        <p className="text-red-600 dark:text-red-400 mt-4">
          Failed to send message. Please try again later.
        </p>
      )}
    </div>
  );
}
