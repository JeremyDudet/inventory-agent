const faqs = [
  {
    question: "What is voice-controlled stock counting?",
    answer:
      "Speak your inventory updates, like '5 gallons of whole milk,' and StockCount instantly records it, replacing manual checklists with easy voice input.",
  },
  {
    question: "How do you make holy water?",
    answer:
      "You boil the hell out of it. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
];

export default function FAQ() {
  return (
    <div id="faq" className="bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:pt-32 lg:px-8 lg:py-40">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <h2 className="text-pretty text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-pretty text-base/7 text-gray-600 dark:text-gray-400">
              Can't find the answer you're looking for? Reach out to our{" "}
              <a
                href="#"
                className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-500 dark:hover:text-zinc-300"
              >
                customer support
              </a>{" "}
              team.
            </p>
          </div>
          <div className="mt-10 lg:col-span-7 lg:mt-0">
            <dl className="space-y-10">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-base/7 font-semibold text-gray-900 dark:text-white">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-base/7 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
