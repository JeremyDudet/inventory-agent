const faqs = [
  {
    question: "What is voice-controlled stock counting?",
    answer:
      "Voice-controlled stock counting lets you update your inventory by speaking, like saying '5 gallons of whole milk.' StockCount records it instantly, replacing manual checklists with easy voice input.",
  },
  {
    question: "How does invoice processing work in StockCount?",
    answer:
      "Upload your invoices to StockCount, and our system will parse them to identify prices for your inventory items, helping you track true costs and profit margins.",
  },
  {
    question: "Can StockCount help me track my cost of goods sold (COGS)?",
    answer:
      "Yes, StockCount calculates your business's total COGS and per-menu-item costs using inventory counts and invoice data, giving you insights into profitability.",
  },
  {
    question: "How does the shopping list generation feature work?",
    answer:
      "StockCount analyzes your stock counts and usage trends to generate tailored shopping lists, ensuring you order the right quantities from vendors without missing items.",
  },
  {
    question: "Can I add team members to help with inventory management?",
    answer:
      "Yes, you can invite team members to use StockCount, assigning roles for tasks like stock counting or invoice processing, streamlining collaboration.",
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
