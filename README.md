# RealTimeTrains status emitter

Small Next.js app that polls RealTimeTrains and pushes a simplified “service status” view for a given route. It focuses on turning the API into something you can easily display on a dashboard, stream overlay or status screen.

The project is a standard `app/`-router Next.js + TypeScript + Tailwind stack. Configuration is done through environment variables and a thin client in `src/app/page.tsx` that calls a server route to fetch and normalise data.

---

## How it works

At a high level:

```ts
// src/app/page.tsx (simplified)
const response = await fetch('/api/status');
const status = await response.json();

// render reduced status
return <StatusPanel data={status} />;
```

The API route encapsulates the RealTimeTrains integration:

```ts
// src/app/api/status/route.ts (shape)
export async function GET() {
  const raw = await fetchRealTimeTrains({ /* origin, destination, time */ });
  const mapped = mapToStatus(raw);
  return Response.json(mapped);
}
```

The mapping step strips the RealTimeTrains response down to the essentials for a display:

```ts
type ServiceStatus = {
  serviceId: string;
  scheduled: string;
  expected: string;
  platform?: string;
  cancelled: boolean;
};

function mapToStatus(raw: unknown): ServiceStatus[] {
  // take the upstream response and produce a small, typed model
  return [];
}
```

Styling uses Tailwind with a small component layer:

```ts
// src/components/status-panel.tsx (example)
export function StatusPanel({ data }: { data: ServiceStatus[] }) {
  return (
    <div className="grid gap-2">
      {data.map(item => (
        <div
          key={item.serviceId}
          className={item.cancelled ? 'bg-red-100' : 'bg-emerald-100'}
        >
          <span>{item.scheduled}</span>
          <span>{item.expected}</span>
          {item.platform && <span>Platform {item.platform}</span>}
        </div>
      ))}
    </div>
  );
}
```

Environment configuration is kept in `next.config.mjs` / `process.env` and wired into the fetch helper, e.g.:

```ts
const API_KEY = process.env.RTT_API_KEY;
const ORIGIN = process.env.RTT_ORIGIN;
const DESTINATION = process.env.RTT_DESTINATION;
```

---

## Running locally

```bash
npm install
npm run dev
# then visit http://localhost:3000
```

You will need appropriate RealTimeTrains configuration in your environment (API key, origin / destination etc.) before the status endpoint can return anything meaningful.
