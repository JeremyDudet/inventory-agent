# Project Requirements Document (PRD)

This document outlines the detailed requirements for a voice-driven AI agent designed for cafes and restaurants to manage inventory using natural, real-time conversation. The system enables staff to update and query inventory simply by speaking commands while receiving immediate, context-aware responses. This project aims to streamline inventory workflows and reduce manual data entry errors by leveraging advanced speech recognition, natural language processing (NLP), and text-to-speech (TTS) technologies. By integrating pre-trained conversational models such as GPT-4 or Claude, the system will maintain conversational context, confirm ambiguous inputs, and adjust its confirmation strategy based on user behavior.

The project is being built to address the unique challenges of busy café and restaurant environments where noise, time pressure, and error-prone manual entry can affect inventory accuracy. Key objectives include achieving sub-1-second response times, ensuring role-based access control for various user types (e.g., staff, managers, inventory specialists, and owners), and providing a robust fallback interface for manual inputs when voice interaction fails. Success will be measured through improved operational efficiency, reduced error rates in inventory counts, and positive user feedback on system responsiveness and ease of use.

## In-Scope vs. Out-of-Scope

**In-Scope:**

*   Voice-driven inventory management:

    *   Real-time speech-to-text (ASR) processing for capturing spoken inventory commands.
    *   Natural language processing (NLP) using a pre-trained model (e.g., GPT-4/Claude) to interpret commands.
    *   Adaptive confirmation strategies (explicit confirmation at low confidence or high risk, implicit confirmation for routine updates).
    *   Multi-turn context retention to support coherent dialogues.
    *   Barge-in support allowing users to interrupt ongoing TTS for corrections.

Multi-user session management:
  * Role-based access control (RBAC) for owners, managers, inventory specialists, staff, read-only users, and system administrators, enforced via a centralized permissions table in Supabase.
  * Unique session identifiers (e.g., UUIDs) tied to JWTs for tracking user activity across sessions, with optional Redis integration for Post-MVP scalability.
  * Support for concurrent user sessions with isolation to prevent data conflicts, including logout and token revocation mechanisms.

*   Inventory database built from scratch:

    *   A comprehensive schema accommodating ingredients, supplies, perishables, and composite items with all required attributes.

*   Fallback UI:

    *   A text-based alternative for situations where voice recognition fails or users prefer manual input.

*   Real-time signaling and microservices:

    *   Use of containerized microservices (Docker/Kubernetes) for ASR, NLP, TTS, and communication.
    *   Streaming, event-driven pipelines to maintain response times under 1 second.

* Security and compliance:
  * Encrypted communications (TLS) for all data in transit, with mandatory JWT_SECRET validation at startup.
  * Robust authentication with rate limiting (e.g., 100 requests/15min per IP) and strong password policies (min. 8 characters, mixed case/numbers).
  * Minimal retention of voice recordings (deleted after processing unless explicitly retained for debugging with user consent) and secure storage of sensitive inventory data in Supabase with role-based policies.
  * Token revocation system to invalidate compromised or logged-out sessions, stored in a `revoked_tokens` table or Redis.

*   Deployment and scaling on cloud platforms:

    *   Hosting backend services (Bun.js/Express, Supabase) and the React front end with geographic co-location to maintain low latency.

**Out-of-Scope:**

*   Integration with any legacy or existing inventory management systems (initially, the database will be built from scratch with future integration potential).
*   Advanced analytics and reporting features outside high-level inventory overview and audit logging.
*   Complex machine learning model training beyond prompt engineering for pre-trained models.
*   Custom hardware solutions; the system will operate on standard mobile devices and tablets.
*   Offline-first native mobile apps in the first version (the MVP will focus on web/mobile web access with fallback UI for manual control).

## User Flow
A typical user journey begins when a staff member opens the application on a dedicated mobile device or tablet. Upon launching, the user encounters a login screen with options for email/password or social login (owners only). New users must register with an invite code (staff/manager) or payment verification (owners), validated against Supabase. After successful authentication, a JWT with session ID is issued, persisting the session across app restarts. Users are directed to a role-customized dashboard displaying real-time inventory data. Errors (e.g., invalid credentials, expired invite codes) trigger clear prompts with recovery options (e.g., password reset, contact manager).

When ready to update inventory, the user taps on a prominent “Start Listening” button to activate the voice interface. The system immediately begins capturing the spoken command with a streaming ASR pipeline, transcribing speech in real time. The displayed partial transcription gives users instant feedback, and the NLP engine processes the command to determine the intended action. If the command is routine and unambiguous, the system uses implicit confirmation and updates the inventory on the database while echoing the update in a natural language reply. For ambiguous or high-value commands, the system pauses to ask for explicit confirmation before proceeding. If voice input is unreliable, a fallback text interface is available, ensuring that updates can still be made smoothly.

## Core Features

*   **Voice-Driven Interaction:**

    *   Real-time speech recognition using streaming ASR.
    *   Processing of natural language commands for actions such as adding or removing stock.
    *   Adaptive confirmation strategies that switch between implicit and explicit confirmations based on confidence, ambiguity, and risk level.

*   **Real-Time Conversational Architecture:**

    *   Event-driven pipeline handling audio capture → transcription → NLP interpretation → inventory database update → response generation → TTS.
    *   Parallel and asynchronous processing to ensure responses under 1 second.

*   **Context Awareness & Session Memory:**

    *   Maintaining recent dialogue and key inventory details via session state.
    *   Multi-turn conversation support with dynamic context feeding to the NLP model.

* **Authentication & Authorization:**
  * Secure login via Supabase Auth with email/password and optional social login (Google/Facebook) for owners.
  * Registration restricted to invite-only for staff/managers (validated via Supabase `invite_codes` table) and payment-verified owners.
  * Custom JWT generation with role and permission payloads, validated on every protected request via middleware.
  * Permission checks for all inventory and user management actions, with audit logging of critical operations.

*   **Role-Based Access Control (RBAC):**

    *   Distinct permissions for Owners, Managers, Inventory Specialists, Staff, and Read-Only users.
    *   Voice-specific restrictions (e.g., critical actions require higher authority confirmation).

*   **Fallback User Interface:**

    *   Text-based input and interactive dashboards for manual updates.
    *   Seamless switch between voice and manual modes with similar confirmation and error handling mechanisms.

*   **Error Handling & Fallback Mechanisms:**

    *   Robust error detection, reprompting, and fallback flows.
    *   Human escalation and manual overrides to assure data accuracy.
    *   Logging of user actions and system responses for audit trails.

*   **Monolith Architecture for the MVP:**

    *   For an MVP using external APIs, the monolith mostly just orchestrates.

    *   We'll likely move faster in development.

    *   Fewer infrastructure tasks (service discovery, networking, logging across microservices).

    *   Lower hosting costs and simpler scaling for an early user base.

    *   A monolith can handle, for instance, 50 concurrent voice streams if properly scaled (multiple Node instances behind a load balancer, each running the same code).

    *   **Implement Good Modularity Internally**

        *   Even in a monolith, keep your code well-structured: separate folders/modules for voice, inventory, and AI logic. That way, if you ever need to “extract” a service, you can do so with fewer headaches.

    *   **Monolith Performance Profile:**

        *   In a **monolithic** app, all business logic is in the same process. You avoid extra hops between microservices. This can actually help reduce latency because you’re not dealing with internal HTTP calls or event buses.
        *   For the MVP scale, a well-optimized monolith can easily stay under 1 second for end-to-end voice interactions—**assuming** you choose a suitable hosting region near your STT and LLM providers and you’re not saturating your server’s CPU.

    *   **Typical Flow:**

        *   **User Speaks** → Audio to Bun/Express (monolith) → Immediately forwarded to STT (Deepgram) → Partial/Final transcript → Bun processes transcript (calls LLM) → Database updated (Supabase) → Response to user.

        *   This pipeline, if coded efficiently, can return final confirmations or partial results well under 1 second for most commands.

        *   **Avoiding Bottlenecks:**

            *   **Use Asynchronous/Non-Blocking** Node patterns so your main thread doesn’t block on heavy tasks.
            *   If you have CPU-intensive tasks (like on-prem speech or local LLM models), consider using worker threads or a separate service. But for an MVP using external APIs, the monolith mostly just orchestrates.
            *   Cache or reuse TCP/HTTPS connections where possible to reduce overhead.

*   **Revisit Architecture Once MVP is Validated:**

    *   **Scalable Deployment & Low Latency:**

        *   Containerized microservices architecture using Docker and Kubernetes.
        *   Cloud hosting on platforms such as AWS/GCP/Azure with co-located services for low latency.
        *   Persistent WebSocket connections to reduce connection overhead.

    *   **Security and Data Protection:**

        *   End-to-end encryption of all data in transit (TLS) and secure storage practices.
        *   Minimal audio retention, regular audits, and compliance with regulations like CCPA.

## Tech Stack & Tools

1.  **Frontend:**

    *   Regardless of stage (Pre-MVP or Post-MVP), the **frontend** can remain largely the same, with potential refinements as the user base grows and additional features are introduced.

    *   React for building a responsive, mobile-friendly interface.

    *   Deployment

        *   **Pre-MVP**: Deploy on Vercel or Netlify to leverage global static asset delivery and built-in CDN. Minimizes DevOps overhead.
        *   **Post-MVP**: Remains on Vercel/Netlify, possibly expanded to multi-region if traffic demands.

    *   Fallback UI & Accessibility:

        *   Integrated text-based UI components for situations where voice fails.
        *   Ensuring compliance with accessibility guidelines (WCAG) from the start.

**2. Backend:**

**2.1 Pre-MVP-Validation: Monolith:**

*   Can still containerize with Docker if desired, but typically a single container or a small cluster is enough.

    *   Consolidates API endpoints, real-time WebSocket communication, and business logic in one service.
    *   Simpler to develop, test, and deploy quickly for initial validation.
    *   Can still containerize with Docker if desired, but typically a single container or a small cluster is enough.

*   Deployment:

    *   Could use a basic IaaS or PaaS (e.g., Heroku, a single EC2 instance, or Docker on AWS Lightsail).
    *   Autoscaling is optional but feasible if concurrency grows.

*   Communication:

    *   **WebSockets** for persistent, low-latency connections.
    *   The monolith directly calls STT and NLP APIs.

**2.2 Post-MVP-Validation: Microservices Architecture:**

*   **Server Framework & Microservices**:

    *   **Bun.js/Express** split into specialized services (e.g., “Inventory Service,” “Voice Processing Service,” “NLP Orchestration Service”).
    *   Each microservice containerized with **Docker** and orchestrated using **Kubernetes** or a managed container platform (e.g., **AWS ECS/Fargate**).

*   **Deployment**:

    *   Each service independently scalable. Could run on AWS ECS, GCP GKE, or Azure AKS.
    *   Service discovery and load balancing (e.g., via an API Gateway or internal LB for microservice-to-microservice communication).

*   **Communication**:

    *   Internal microservices use REST/gRPC or messaging queues (e.g., RabbitMQ, NATS) for decoupled interactions.
    *   **WebSockets** remain for real-time updates to the client, but might be handled by a dedicated “Gateway” service.

**3. Database:**

*   Supabase/PostgreSQL as the inventory data store, ensuring ACID compliance and data integrity.

*   **Pre-MVP**:

    *   A straightforward schema designed for direct reads/writes from the monolithic backend.
    *   Minimal overhead—Supabase also provides authentication if needed.

*   **Post-MVP**:

    *   Possibly break out read replicas or isolate certain tables in dedicated microservices (e.g., a separate “Inventory DB” vs. “Analytics DB”).
    *   Use Supabase’s real-time features or replicate data to other systems for advanced analytics.

*   Schema designed from scratch to manage inventory items, locations, and session data.

**4. Speech and Language Processing:**

*   Deepgram (or a similar provider) for real-time ASR.
*   Pre-trained NLP models like GPT-4 or Claude for intent detection and natural language generation.
*   TTS engines to convert text confirmations and feedback into natural speech.

**5. Development Tools:**

*   Cursor as an advanced IDE for AI-powered coding and real-time code suggestions.

*   **Logging & Monitoring**:

    *   **Pre-MVP**: Basic logging to console or a single cloud service (like CloudWatch). Possibly Datadog or a simpler solution to track server metrics.
    *   **Post-MVP**: Expand to more robust monitoring (e.g., **Prometheus/Grafana**, **Datadog**) for each microservice. Implement distributed tracing (Jaeger, Zipkin) for multi-service request flows.

*   **Debugging**:

    *   Pre-MVP: Single-service logs.
    *   Post-MVP: Log aggregation, centralized dashboards, and structured logs across microservices

**6. Summary of Phased Approach:**

*   Pre-MVP (Monolith)

    *   Single codebase (Bun.js/Express) manages all backend logic.
    *   Deployed on a simple platform with minimal orchestration overhead.
    *   Straightforward database schema on Supabase/PostgreSQL.
    *   Direct calls to Deepgram/STT + GPT-4.
    *   Achieves sub-1-second response times by co-locating the server near STT/NLP endpoints and using WebSockets for real-time feedback.

*   Post-MVP (Microservices):

    *   Split backend into multiple Dockerized services, orchestrated via Kubernetes or ECS.
    *   Each service focuses on a domain (e.g., Inventory, Voice/AI, Analytics), allowing independent scaling and release cycles.
    *   Database structure might evolve to handle advanced features (read replicas, analytics pipelines).
    *   Enhanced logging, monitoring, and service-to-service communication patterns.

## Non-Functional Requirements

*   **Performance:**

    *   The system should provide end-to-end response times under **1 second** from voice input to completed action (sub-1-second when possible).
    *   Designed to handle **multiple simultaneous users** concurrently without noticeable performance degradation.
    *   Efficiently process voice commands from multiple sessions, ensuring quick feedback and minimal queueing.

*   **Security:**

    *   **End-to-end encryption (TLS)** for all data transmissions, including voice audio.
    *   **Minimal retention of voice recordings**; ideally process in real time and discard raw audio unless required for debugging/training.
    *   Implementation of role-based access control (RBAC) to limit actions based on user roles.
    *   Regular audits, logging, and monitoring to detect and mitigate potential security issues.

* Scalability:
  * MVP: Handle up to 50 concurrent voice streams and 100 simultaneous users with a single Bun.js/Express monolith, horizontally scaled via load balancer if needed.
  * Post-MVP: Support 500+ concurrent users across microservices, with independent scaling for auth, voice, and inventory services using Kubernetes autoscaling (e.g., CPU/memory thresholds at 70%).
  * Stateless backend services with session data offloaded to Redis or Supabase for distributed systems.
  * Geographic server optimization to cover target regions (North America and Mexico), with latency under 200ms for 95% of requests.

*   **Usability:**

    *   **Intuitive Onboarding**:

        *   Clear instructions for new users, covering voice commands, fallback UI, and manual entry for corrections.
        *   Simple sign-up / login flow and role assignment.

    *   **Feedback & Accessibility**:

        *   **Visual and auditory cues** during voice interactions to confirm recognition or request clarifications.
        *   **Fallback UI** (text-based input, clickable buttons) for noisy environments or user preference.

## Constraints & Assumptions

*   **Constraints:**

    *   **Sub-1-Second Responses**:

        *   The pipeline design (ASR → NLP → DB update) must be optimized, including geographic co-location of critical services.

    *   **Voice Confirmation for Critical Actions**:

        *   High-impact changes (e.g., deleting items, large quantity updates) require explicit user confirmation.

        *   Forced Confirmation for Large Updates

        *   Override Mechanisms:

            *   Managers or Owners can override staff updates if something seems incorrect.

    *   All microservices are designed to be stateless, requiring an external data store for session and state management.

    *   Deployment will leverage cloud infrastructure (AWS/GCP/Azure) and container orchestration which may introduce initial DevOps complexity.

*   **Assumptions:**

    *   Users will operate the system on mobile devices or tablets with built-in microphones and reliable connectivity.
    *   The voice recognition and NLP capabilities will be sufficient in typical cafe/restaurant environments but may struggle in extremely noisy conditions, hence the need for a fallback UI.
    *   Staff and managers will be trained on the system’s adaptive confirmation features and the fallback manual interface.
    *   Pre-trained language models (like GPT-4/Claude) are available and meet the performance requirements without requiring extensive custom training.

## Known Issues & Potential Pitfalls

*   **Speech Recognition in Noisy Environments:**

    *   ASR performance might degrade in loud kitchens or busy cafes.
    *   Mitigation: Implement robust fallback UI and allow manual corrections; provide a “Start Listening” button to control audio capture.

*   **Ambiguity in Voice Commands:**

    *   Similar-sounding product names or ambiguous quantities may lead to misinterpretation.
    *   Mitigation: Use explicit confirmation prompts, adaptive confirmation strategies, and logging for refining confidence thresholds over time.

*   **High-Concurrency Challenges:**

    *   Managing multiple simultaneous updates can risk data integrity or session confusion.
    *   Mitigation: Enforce strict session isolation using unique session IDs and centralized storage for state management.

*   **Latency and Cloud Dependency:**

    *   Ensuring sub-1-second responses across distributed microservices may be challenging.
    *   Mitigation: Co-locate critical services, optimize caching strategies, and maintain persistent WebSocket connections to reduce latency.

*   **Security and Data Privacy:**

    *   Handling voice data and sensitive inventory information securely is crucial.
    *   Mitigation: Apply strict encryption, minimal retention policies, audit logs, and secure access controls to protect sensitive data.

This PRD provides a clear roadmap for the development of a voice-driven inventory management system tailored for busy cafe and restaurant environments. It is intended to serve as the single source of truth for all subsequent technical documents, ensuring that every aspect—from user interaction to microservices deployment—is clearly defined and understood.
