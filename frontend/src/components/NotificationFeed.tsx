import { CheckIcon, HandThumbUpIcon, UserIcon } from '@heroicons/react/20/solid'
import { formatDistanceToNow } from 'date-fns'

const timeline = [
  {
    id: 1,
    content: 'Applied to',
    target: 'Front End Developer',
    href: '#',
    date: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    datetime: new Date(Date.now() - 1000 * 60 * 5),
    icon: UserIcon,
    iconBackground: 'bg-gray-400',
  },
  {
    id: 2,
    content: 'Advanced to phone screening by',
    target: 'Bethany Blake',
    href: '#',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    datetime: new Date(Date.now() - 1000 * 60 * 60 * 2),
    icon: HandThumbUpIcon,
    iconBackground: 'bg-blue-500',
  },
  {
    id: 3,
    content: 'Completed phone screening with',
    target: 'Martha Gardner',
    href: '#',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    datetime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    icon: CheckIcon,
    iconBackground: 'bg-green-500',
  },
  {
    id: 4,
    content: 'Advanced to interview by',
    target: 'Bethany Blake',
    href: '#',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    datetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    icon: HandThumbUpIcon,
    iconBackground: 'bg-blue-500',
  },
  {
    id: 5,
    content: 'Completed interview with',
    target: 'Katherine Snyder',
    href: '#',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    datetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    icon: CheckIcon,
    iconBackground: 'bg-green-500',
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function formatShortTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

export default function NotificationFeed() {
  return (
    <div className="flow-root">
      <h3 className="text-xs font-semibold text-gray-400 mb-2">Recent Activity</h3>
      <ul role="list" className="-mb-8">
        {timeline.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-4">
              {eventIdx !== timeline.length - 1 ? (
                <span aria-hidden="true" className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={classNames(
                      event.iconBackground,
                      'flex size-6 items-center justify-center rounded-full ring-4 ring-white',
                    )}
                  >
                    <event.icon aria-hidden="true" className="size-4 text-white" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                  <div>
                    <p className="text-xs text-gray-500">
                      {event.content}{' '}
                      <a href={event.href} className="font-medium text-gray-900">
                        {event.target}
                      </a>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-500">
                    <time dateTime={event.datetime.toISOString()}>
                      {formatShortTime(event.date)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
