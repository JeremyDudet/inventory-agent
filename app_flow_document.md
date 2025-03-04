# App Flow Document

## Introduction
This application is a voice-driven AI agent specifically designed for cafes and restaurants to streamline their inventory management through natural, real-time conversation. By leveraging speech recognition and a flexible confirmation system, staff, managers, and owners can perform updates or queries with minimal friction. The application supports multiple concurrent users, sustains multi-turn dialogues with contextual awareness, and offers a smooth fallback text-based interface if voice interaction fails. Built on a cloud-based, containerized backend and a mobile-friendly frontend, the system delivers low latency and secure data handling for both small and large operations.

## Onboarding and Sign-In/Sign-Up
Upon launching the app on a mobile device, tablet, or desktop, users encounter a clean, welcoming landing page.

### Account Creation
- **New User Registration**: Minimal personal details (name, email) and password are required. Users must also agree to voice permissions if they plan to utilize voice commands.
- **Social Login**: To reduce friction, users can opt for social login mechanisms (e.g., Google, Facebook) if configured.
- **Role Selection**:
  - **Owner**: Reserved for paying customers, who either provide proof of payment or an “owner invite code.”
  - **Staff/Manager**: Requires a valid invite code. If a user attempts to register as staff or manager without this code, the system rejects the registration.
  - **Inventory Specialist/Read-Only**: May be assigned directly by an owner or manager, or through specialized invites.
- **Invite Codes**:
  - The application validates employee invite codes (for staff or manager) through a secure lookup table (e.g., a Supabase table or an in-memory store with limited usage).
  - Owner roles may also require a special “owner invite code” or a separate payment validation step.
  - If a code is invalid, an error message is immediately displayed.

### Sign-In
- **Returning Users**: Provide credentials or use a saved session token from previous logins.
- **Password Recovery**: If credentials are forgotten, users can request a password reset link sent to their registered email.
- Once the user is authenticated, the system generates a session identifier (and corresponding JWT) to track context and permissions throughout their interaction.

## Main Dashboard or Home Page
After logging in, users land on a role-tailored dashboard:
- **Staff**: Sees large, high-contrast tiles showing critical inventory levels, a simple button to initiate voice updates, and minimal clutter.
- **Manager/Inventory Specialist**: Gains additional functionality, such as the ability to review audit logs, adjust reorder thresholds, or manage employee invites.
- **Owner**: Has full access to system-wide settings, billing details, and aggregated performance reports.
- A persistent header provides key navigation (e.g., to Inventory, Logs, Settings, or Account), along with real-time status indicators for session context and connectivity.

## Detailed Feature Flows and Page Transitions

### Starting a Voice Command
- Tapping the “Start Listening” button on the dashboard activates streaming ASR (Automatic Speech Recognition).
- As the user speaks, partial transcriptions appear in real time, allowing immediate correction if recognition drifts.

### Command Interpretation
- Once speech input concludes, the NLP pipeline interprets the user’s intent. Typical commands might be:
  - “Add three pounds of coffee beans”
  - “Remove two gallons of milk”
  - “Check how much sugar we have left”

### Adaptive Confirmations
- If the system detects high confidence and a routine update, it proceeds automatically.
- In ambiguous or high-impact scenarios (e.g., large quantity changes, uncertain recognition), the system requires explicit confirmation.
- The user receives a prompt (voice + on-screen) to confirm or correct the action.

### Updating Inventory & Feedback
- Confirmed commands update the inventory database in real time.
- A synthesized voice message and an on-screen notification confirm that the change was successful.
- In noisy conditions, or if repeated recognition errors occur, the system seamlessly offers a fallback text input to continue the same flow with typed commands.

## Settings and Account Management
From the main dashboard, users can navigate to Settings to manage:
- **Profile**: Update name, profile picture, password, or contact details.
- **Voice Preferences**: Set voice recognition language, toggle partial transcriptions, or choose the frequency of spoken feedback.
- **Notifications**: Adjust push/email notifications related to low-stock alerts or inventory changes.
- **Role Management & Invites (Managers/Owners)**:
  - Generate new invite codes for prospective employees.
  - Review current employee roles, edit permissions if necessary, or deactivate invites.
  - Owners can also confirm paying-customer status or invite additional owners.
- **Billing (Owners)**: Manage subscription plans or payment details.
- Changes are saved immediately. The user can return to the main dashboard with no interruption to their session context.

## Employee “Invite-Only” Onboarding

### Invite Validation
- Staff and Manager roles require a valid code at registration.
- The app checks this code against a secure store (e.g., Supabase table).
- If invalid or already used, registration is rejected with a clear error message.

### Owner Invite
- Paying customers may be provided a special “owner invite code,” or the system can automatically assign the owner role upon payment verification.
- Owners can generate new invite codes for their employees, simplifying staff onboarding.

## Error States and Alternate Paths
- **Voice Recognition Failures**: If speech input is too noisy or unclear, the system displays an error prompt and seamlessly offers a text field to re-enter the command.
- **Invalid Data or Permissions**: If a user attempts to exceed their permission level (e.g., staff tries a manager-only action), a friendly error message appears explaining that they must request higher privileges.
- **Connectivity Issues**: If the network is unreachable, users are alerted and can continue offline with a local queue that syncs once the connection is restored (if offline mode is supported).
- **Invite Code Errors**: When a user tries to register as staff/manager without a valid invite code, the system rejects the registration and prompts them to contact the owner or manager for a proper invite.
- All error events are logged for auditing, ensuring that system performance can be monitored and improved over time.

## Conclusion and Overall App Journey
This application unifies voice-driven inventory updates, adaptive confirmations, and robust role-based access control to create an efficient, user-friendly experience for cafes and restaurants. From invite-only onboarding for employees to paid-owner registrations, the system ensures that users are properly vetted and assigned the correct permissions. Once logged in, each user’s dashboard highlights relevant data and tools, making day-to-day inventory tasks straightforward. When commands are issued, immediate feedback—via both text and voice—reassures users that the system understands and applies changes accurately. If ambiguities arise, confirmation steps minimize the risk of critical errors. Fallback text-based inputs and thorough error handling provide continuity in even the busiest or noisiest conditions.

Overall, the combination of voice interaction, robust onboarding with invite codes and payment validation, and thoughtful role-based design allows businesses to maintain accurate, real-time inventory control with minimal friction and maximum reliability.