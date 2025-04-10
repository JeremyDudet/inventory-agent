interface Event {
  id: string;
  name: string;
  url: string;
  date: string;
  location: string;
}

interface Order {
  id: string;
  date: string;
  url: string;
  customer: {
    name: string;
  };
  event: {
    name: string;
    thumbUrl: string;
  };
  amount: {
    usd: string;
  };
}

export function getEvents(): Event[] {
  return [
    {
      id: "1",
      name: "Annual Tech Conference",
      url: "/events/1",
      date: "2023-09-15",
      location: "San Francisco, CA",
    },
    {
      id: "2",
      name: "Product Launch",
      url: "/events/2",
      date: "2023-10-22",
      location: "New York, NY",
    },
    {
      id: "3",
      name: "Developer Workshop",
      url: "/events/3",
      date: "2023-11-05",
      location: "Austin, TX",
    },
    {
      id: "4",
      name: "Industry Summit",
      url: "/events/4",
      date: "2023-12-10",
      location: "Seattle, WA",
    },
  ];
}

export function getRecentOrders(): Order[] {
  return [
    {
      id: "ORD-001",
      date: "Jul 20, 2023",
      url: "/orders/ORD-001",
      customer: {
        name: "John Smith",
      },
      event: {
        name: "Annual Tech Conference",
        thumbUrl: "/events/tech-conf-thumb.jpg",
      },
      amount: {
        usd: "$599.00",
      },
    },
    {
      id: "ORD-002",
      date: "Jul 19, 2023",
      url: "/orders/ORD-002",
      customer: {
        name: "Sarah Johnson",
      },
      event: {
        name: "Product Launch",
        thumbUrl: "/events/product-launch-thumb.jpg",
      },
      amount: {
        usd: "$299.00",
      },
    },
    {
      id: "ORD-003",
      date: "Jul 18, 2023",
      url: "/orders/ORD-003",
      customer: {
        name: "Michael Brown",
      },
      event: {
        name: "Developer Workshop",
        thumbUrl: "/events/dev-workshop-thumb.jpg",
      },
      amount: {
        usd: "$149.00",
      },
    },
  ];
}
