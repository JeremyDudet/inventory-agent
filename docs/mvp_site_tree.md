Site Tree for the MVP
Unauthenticated Routes
These pages are accessible to users who are not logged in.

Landing Page
Purpose: Introduces the app to unauthenticated users and directs them to login or register.
Components:
Hero: Highlights the app’s value proposition.
Features: Showcases key features like voice control.
Benefits: Explains user benefits.
Pricing: Displays pricing options (if applicable).
FAQ: Answers common questions.
Contact: Provides a contact form or information.
Notes: Already implemented in src/pages/Landing/index.tsx with its sub-components.

Login Page
Purpose: Allows users to authenticate.
Components:
Login form (email and password inputs).
LoadingSpinner: Displays during authentication.
Links to ForgotPassword and Register.
Notes: Already built in src/pages/Login.tsx using AuthLayout.

Register Page
Purpose: Enables new users to sign up.
Components:
Registration form (email, name, password, etc.).
LoadingSpinner: Shows during submission.
Link to Login.
Notes: Implemented in src/pages/Register.tsx with AuthLayout.

Forgot Password Page
Purpose: Facilitates password recovery.
Components:
Email input form for reset link.
LoadingSpinner: Displays during processing.
Link to Login.
Notes: Exists in src/pages/ForgotPassword.tsx with AuthLayout.

Authenticated Routes (within AppLayout)
These pages are accessible only to logged-in users and are wrapped in the AppLayout component, which provides navigation via a sidebar and navbar, plus the FloatingActionBar for quick updates.

Dashboard Page
Purpose: Provides an overview of inventory status and recent activity.
Components:
InventoryStats: Displays key metrics (e.g., total items, low stock).
RecentUpdates: Shows recent inventory changes with timestamps.
Optional: Chart or summary widget for visual insights.
Notes: Located in src/pages/Dashboard.tsx. Currently includes InventoryGrid, but for the MVP, focus on stats and updates to keep it lightweight.

Inventory Page
Purpose: Allows users to view, filter, and manage inventory items.
Components:
InventoryFilter: Filters items by category or other criteria.
InventoryGrid: Displays items in a grid layout using InventoryCard components.
InventoryModal: Opens for viewing or editing item details when an item is selected.
FloatingActionBar: Provides quick voice and text update options:
Voice input: Triggers VoiceControl for hands-free updates.
Text input: Opens a form or modal (e.g., InventoryModal) for manual updates.
Notes: Currently a placeholder in App.tsx as /items. Needs full implementation by replacing the placeholder <div>Items Page</div> with the components above.

Settings Page
Purpose: Manages user account preferences.
Components:
User profile form (e.g., name, email).
Notification settings toggle.
Password change form.
Logout and account deletion options.
Notes: Exists in src/pages/Settings.tsx with forms for personal info, password changes, and more. Refine to focus on essentials for the MVP.

Additional Notes on AppLayout
Structure: AppLayout (in src/components/AppLayout.tsx) wraps all authenticated pages, providing:
Sidebar: Navigation links to Dashboard, Inventory (Items), and Settings.
Navbar: User avatar with a dropdown for account options (e.g., sign out).
FloatingActionBar: Persistent across pages for quick inventory updates via voice (VoiceControl) or text input.
Enhancements: Ensure the FloatingActionBar triggers appropriate actions (e.g., opening VoiceControl or a text input modal) from any page, with primary use on the Inventory page.

Why This Structure?
Core Functionality: The MVP focuses on inventory management, the app’s primary purpose. The Inventory page, with its grid and update capabilities, is central, supported by Dashboard for oversight and Settings for user management.
Voice Control: Integrated via FloatingActionBar and VoiceControl, making it accessible everywhere but most relevant on the Inventory page.
Minimal Yet Complete: Includes only essential pages (Landing, Login, Register, ForgotPassword, Dashboard, Inventory, Settings) to deliver value without overcomplicating the initial release.
Leverages Existing Code: Builds on your implemented AppLayout, auth pages, and components like InventoryGrid and VoiceControl.
