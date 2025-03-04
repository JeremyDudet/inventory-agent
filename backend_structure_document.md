# **Backend Structure Document**

## **Introduction**

The backend serves as the *nervous system* of our voice-driven inventory app, processing real-time speech commands and updating database records to provide immediate, context-aware responses. In the early stages, we’ll prioritize a **lightweight architecture** that’s quick to implement and maintain—perfect for **MVP validation**. Once we confirm market fit and usage patterns, we’ll **evolve** to a more modular, **microservices-based** approach for scalability and resilience.

## **Phase 1: MVP (Monolithic Approach)**

### **Overview**

For the **MVP**, the backend will be a **single Bun.js/Express application** containing the core functionalities:

1.  **Voice Processing** (calls to external ASR and NLP APIs)
2.  **Inventory Updates** (database queries against Supabase/PostgreSQL)
3.  **Real-Time Feedback** (via WebSockets for streaming responses to the frontend)

Keeping these features in one codebase simplifies development, reduces overhead, and allows rapid iteration while still delivering sub-1-second response times.

### **MVP Architecture**

*   **Bun.js/Express Monolith**

    *   A single containerized application that listens for incoming requests and manages session data.
    *   Directly calls third-party STT/NLP providers (e.g., Deepgram, GPT-4) with minimal internal overhead.
    *   Uses an **async, event-driven** approach for concurrency.

*   **Database (Supabase/PostgreSQL)**

    *   Stores all inventory data, user roles, and session information.
    *   MVP schema handles items, quantities, expiration dates, and location details.
    *   Real-time updates can be powered by Supabase’s built-in features or simple WebSocket events from the monolith.

*   **API Design & Endpoints**

    *   **REST + WebSockets**: A small set of endpoints for user login, inventory CRUD, and streaming partial transcriptions.
    *   **Confirmation Logic**: The monolith handles implicit vs. explicit confirmations, prompting the user in ambiguous cases.

*   **Hosting**

    *   Deployed in a single region (e.g., AWS or GCP) close to STT/NLP endpoints to minimize latency.
    *   Possibly on a simpler platform (like AWS Elastic Beanstalk, Heroku, or Docker on a single EC2 instance) to keep DevOps minimal.

* Authentication & Authorization:
  - Handled within the Bun.js/Express monolith via `authService.ts`, integrating Supabase Auth for login/registration and JWT generation.
  - Invite code validation and permission checks occur in-process, querying Supabase `invite_codes` and `user_roles` tables.
  - Session IDs generated via `sessionLogsService.ts` and embedded in JWTs for tracking.

### **MVP Rationale & Benefits**

1.  **Speed to Market**: Fewer moving parts = faster implementation.
2.  **Ease of Maintenance**: One repository, one deployment pipeline, straightforward debugging.
3.  **Performance**: With careful code and co-location with AI services, sub-1-second latencies are achievable, even as concurrency grows modestly.

### **Considerations for MVP Scale**

*   **Horizontal Scaling**: If needed, you can run multiple replicas of the monolith behind a load balancer.
*   **Caching**: Store frequently accessed data (e.g., repeated voice commands) in memory or Redis to speed up responses.
*   **Monitoring**: Basic logging and alerting (e.g., using Datadog or AWS CloudWatch) to watch CPU/memory usage and response times.

## **Phase 2: Post-MVP (Microservices Architecture)**

### **Overview**

Once the MVP is validated and user adoption rises, the system can **transition** to a **microservices** model. Each component—voice processing, inventory updates, user management—splits into its own service, containerized and orchestrated via Kubernetes or ECS. This approach offers **independent scaling**, **clearer ownership**, and **finer-grained deployments**.

### **Post-MVP Architecture**

*   **Microservices**

    *   **Voice Processing Service**: Dedicated to handling ASR streaming, partial transcripts, and TTS calls.
    *   **NLP/AI Orchestration Service**: Manages GPT-4 or Claude requests, advanced conversation context, and fallback logic.
    *   **Inventory Service**: Specializes in CRUD operations on Supabase/PostgreSQL, applying role-based rules.
    *   **Auth & Session Service**: (Optional) A separate service or integrated with Supabase to handle tokens, session states, and user profiles.

*   **Container Orchestration**

    *   **Kubernetes** or **AWS ECS/Fargate** to run each microservice container with autoscaling policies.
    *   Service discovery, load balancing, and rolling updates become standard parts of deployment.

*   **API Gateway & Messaging**

    *   A central **API Gateway** can route requests from frontend to the correct microservice.
    *   **Asynchronous Event Bus** or message queue (RabbitMQ, NATS, etc.) can handle cross-service communication for real-time or queued tasks (e.g., invoice scanning).

*   **Data Management**

    *   **Supabase/PostgreSQL** remains the single source of truth for inventory data, but microservices may each have their own additional caches or specialized storage if needed.
    *   For large-scale expansions (e.g., multi-tenant or analytics), you might add read replicas or a dedicated analytics database.

### **Post-MVP Scalability & Advantages**

1.  **Independent Scaling**: If voice processing sees heavy loads, you can scale that service alone without over-allocating resources for inventory logic.
2.  **Modular Development**: Different teams or squads can own each microservice, deploying changes independently.
3.  **Resilience**: A failure in one service (e.g., NLP) doesn’t bring down the entire system; graceful degradation is possible.

### **Challenges & Trade-Offs**

*   **Increased Complexity**: Requires advanced DevOps, monitoring, and debugging across multiple services.
*   **Inter-Service Latency**: Additional network hops can introduce overhead, but co-locating services and using efficient protocols (gRPC, WebSockets) helps maintain sub-1-second response times.

## **Database Management**

Regardless of phase, **Supabase/PostgreSQL** remains central:

*   **MVP**:

    *   Straightforward schema for items, stock, vendor details, user roles.
    *   Connection pooling from the monolith.
    *   Basic transaction handling to ensure data integrity.

*   **Post-MVP**:

    *   Potentially implement separate read replicas for heavy reporting or analytics.
    *   Enhance role-based policies for multi-service access.
    *   Maintain real-time triggers or subscriptions if you want to broadcast inventory changes across microservices.

## **API Design and Endpoints**

*   **MVP**:

    *   A single Express router (or minimal modular routing) handling inventory, user sessions, voice commands.
    *   WebSockets for partial transcription streaming and immediate UI feedback.

*   **Post-MVP**:

    *   **API Gateway** or dedicated microservice endpoints.
    *   Each service responsible for its domain logic (e.g., `/voice/`, `/inventory/`, `/auth/`).
    *   Possibly adopt an event-driven pattern for internal communication (publish/subscribe to inventory updates or user events).

## **Hosting Solutions**

*   **MVP**:

    *   Host the monolith in a single region (AWS, GCP, Azure, etc.) close to AI providers.
    *   Containerize with Docker for easy scaling if traffic demands it.
    *   Minimal orchestration overhead—could use a single managed service like AWS Elastic Beanstalk or Heroku.

*   **Post-MVP**:

    *   Deploy multiple containerized microservices in **Kubernetes** or **ECS** with auto-scaling.
    *   Possibly multi-region if you expand internationally or need lower latency in new markets.
    *   Add advanced CI/CD pipelines for rolling upgrades and canary releases.

## **Infrastructure Components**

*   **Load Balancing**

    *   **MVP**: A single load balancer (if needed) to distribute traffic across multiple monolith instances.
    *   **Post-MVP**: Kubernetes Ingress or an AWS ALB (Application Load Balancer) for microservices, plus an internal service mesh if desired.

*   **Caching & Real-Time**

    *   **MVP**: Basic in-memory caching or a Redis instance for frequently accessed data and session tokens.
    *   **Post-MVP**: Expand caching strategies across microservices. Possibly incorporate message queues to handle asynchronous tasks like invoice scanning or ML-based analytics.

*   **CDN**

    *   The React frontend is served via a CDN (like Vercel or Netlify’s built-in CDN) for rapid global access.
    *   Ensures minimal overhead for static asset delivery across devices.

## **Security Measures**

* Encryption: TLS 1.2+ for all endpoints, enforced via HSTS headers. Voice data encrypted in transit and discarded post-processing.
* RBAC & Auditing: JWTs carry role/permission payloads, validated by middleware. Critical actions logged to Supabase `audit_logs` table with user ID and timestamp.
* Secure Hosting: Docker images scanned for vulnerabilities (e.g., Trivy), secrets managed via AWS Secrets Manager, and rate limiting applied to auth endpoints.

## **Monitoring and Maintenance**

*   **MVP**:

    *   Simple logging in the monolith (console, cloud logging).
    *   Basic performance metrics for CPU, memory, response times.

*   **Post-MVP**:

    *   Dedicated APM tools (Datadog, New Relic) or open-source (Prometheus/Grafana).
    *   Distributed tracing (Jaeger, Zipkin) to correlate requests across multiple services.
    *   Automated alerts for anomalies, scaling events, or potential downtime.

## **Conclusion and Overall Backend Summary**

By **starting with a monolithic Bun.js/Express application** for the MVP, the team can focus on **core features**—voice-to-inventory updates, real-time responses, and a minimal fallback UI—while maintaining sub-1-second latency. Once the product is **validated** and user demands grow, we’ll **split out services** into a microservices architecture, enabling **independent scaling**, **modular development**, and **robust resilience**. Throughout both phases, **Supabase/PostgreSQL** provides a consistent database layer, and strong **security/monitoring** measures ensure the system stays protected, reliable, and fast.

This **two-phase strategy** sets up the backend for **rapid iteration** during initial development and long-term flexibility as the solution gains traction—ultimately delivering a smooth, voice-driven experience for busy cafe and restaurant environments.
