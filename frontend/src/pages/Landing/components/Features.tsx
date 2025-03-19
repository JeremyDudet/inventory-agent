import { MicrophoneIcon, LightBulbIcon, ClockIcon } from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Voice-Driven Interface',
    description:
      'Update inventory with natural voice commands. Say "Add 5 bags of flour," and it’s done instantly.',
    href: '#voice-interface',
    icon: MicrophoneIcon,
  },
  {
    name: 'Contextual Understanding',
    description:
      'StockCount.io learns your habits, making updates faster and smarter over time.',
    href: '#contextual-understanding',
    icon: LightBulbIcon,
  },
  {
    name: 'Quick Response Times',
    description:
      'Get accurate responses in under a second, even in a busy, noisy kitchen.',
    href: '#quick-response',
    icon: ClockIcon,
  },
]

export default function Features() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Simplify your stock with tools that work for you
          </h2>
          <p className="mt-6 text-lg/8 text-gray-600">
            StockCount.io makes inventory management intuitive and stress-free. Our innovative features let you update and track stock effortlessly, so your team can focus on delighting customers.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="text-base/7 font-semibold text-gray-900">
                  <div className="mb-6 flex size-10 items-center justify-center rounded-lg bg-indigo-600">
                    <feature.icon aria-hidden="true" className="size-6 text-white" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base/7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <a href={feature.href} className="text-sm/6 font-semibold text-indigo-600">
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}