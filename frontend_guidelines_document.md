Frontend Guidelines Document

Introduction
The frontend of our voice-driven AI agent is the primary touchpoint for busy café and restaurant staff. From the MVP to a more mature, feature-rich system, the goal is to provide intuitive, real-time interactions—whether staff speak commands in a noisy kitchen or type manual updates via a fallback interface. This document sets forth the frontend architecture, design principles, scalability plan, and style guide to ensure responsive and reliable user experiences at every stage.

Phase 1: MVP Frontend
Objectives
Validate the core voice and fallback text features quickly.
Keep the UI simple and easy to maintain, focusing on primary use cases (view/update inventory, confirm actions).
Achieve sub-1-second response times by efficiently handling real-time voice data and immediate UI updates.
MVP Architecture
React with Vite

Uses a single-page application (SPA) approach with Vite
Deployed on Vercel for global CDN delivery and minimal setup.
Component-Based: Each core feature (voice prompt, inventory list, fallback text UI) is separated into small, reusable components.

Design & Navigation

Minimal Layout: A simple top-level nav or menu linking to “Inventory Dashboard” and “Voice Command” pages.
Responsive: Focus on small screens (tablets, smartphones), ensuring text remains legible and buttons are finger-friendly.
Role Awareness (Basic): Staff sees essential inventory screens, while managers can see extra details or history.
Fallback UI

Provide a manual text input and basic forms for updating items if voice commands fail.
Keep the fallback interface easily discoverable (e.g., a “Switch to Manual Entry” button).

State Management

Could rely on React Context (or minimal Redux if preferred).
Core states: user session, live inventory updates, voice transcription results.
Minimal overhead: keep local state where possible, only share global states if essential.


Performance & Testing

Basic optimizations: code splitting for major routes, lazy loading for heavy components.
Unit Tests with Jest for critical components (voice input, inventory list).
Possibly a few Cypress end-to-end tests to confirm major user flows (voice -> inventory update, fallback text -> inventory update).
Why Start with a Simplified MVP?
Faster Time to Market: Focus on essential features for validating user adoption.
Easier Maintenance: Fewer complex routing or advanced state patterns to manage early on.
Direct Feedback Loop: Gather real-world usage data before investing in advanced UI flows.
Phase 2: Post-Validation Enhancements
Once the MVP demonstrates viability and user feedback is in, the frontend can expand to support multiple roles, more sophisticated voice interactions, and advanced scalability.

Advanced Architecture
Refined Component Structure

Introduce more specialized, reusable components for voice confirmations, item detail modals, and advanced reporting.
Adopt a design system or UI library if uniform styling across multiple new features is needed (in our case, Tailwind CSS + DaisyUI).
Enhanced Role-Based UI

Provide distinct dashboards for managers, owners, or specialized inventory personnel.
Dynamically render or hide features depending on user permissions (e.g., global settings for owners, advanced metrics for managers).
Scalable State Management

If concurrency or complexity grows, consider Redux or Zustand for more robust state handling.
Implement offline caching or local storage strategies if connectivity can be erratic (especially in remote café settings).
Multi-Language Support

Expand beyond English to additional languages (Spanish, French, etc.) using an i18n library (e.g., react-i18next).
Provide localized UI texts, error messages, and a fallback language strategy.
Performance Optimization

Add deeper optimization: prefetch routes, advanced caching for frequently accessed data.
Implement WebSocket streaming for partial voice transcriptions or real-time inventory changes.
Monitor rendering performance via tools like React Profiler and optimize large lists or complex forms.
Comprehensive Testing

Increase coverage with end-to-end tests (Cypress) for more complex user flows (manager approvals, large updates, voice overrides).
Testing different locales (multi-language) and different roles.
Design Principles & Usability
Consistency: As the system grows, maintain a consistent component library or design system so new features integrate seamlessly.
Accessibility: Ensure full screen-reader compatibility, keyboard navigation, and color contrast compliance—especially if staff with varying abilities use the app.
Seamless Voice/Text Hybrid: Post-MVP, refine how the system transitions between voice input and text-based corrections or overrides, ensuring minimal friction.
Styling and Theming
MVP:

A simple, cohesive theme (brand colors + utility classes).
Use Tailwind CSS as a utility-first framework.
Post-MVP:

Adoption of a more advanced styling solution and theming approach—Tailwind CSS + DaisyUI for consistent UI patterns, easy theming, and custom brand expansions.
Possibly dynamic themes (day/night mode, brand customization) if customers request it.
Component Structure
MVP:

A handful of high-level components (VoiceCommandPanel, InventoryList, FallbackForm).
Shared UI elements (buttons, modals) in a simple “Common” folder.
Post-MVP:

Decompose into domain-specific components (e.g., “ItemCard,” “ConfirmationDialog,” “AnalyticsChart”), each with well-defined props/events.
Create a separate library or “design system” repo if multiple teams are contributing.
Routing and Navigation
MVP:

React Router to handle minimal routes: “/inventory,” “/voice,” “/login.”
Basic role-based gating: staff vs. manager/owner.
Post-MVP:

Larger route structure for specialized dashboards, reporting pages, and user management screens.
Possibly nested or dynamic routes, e.g. “/inventory/:itemId” for editing item details.
Performance Optimization
MVP:

Code Splitting & Lazy Loading for major chunks.
Basic caching of inventory data, real-time updates via WebSockets or short polling.
Post-MVP:

Deeper optimization (e.g., SSR or pre-rendering certain pages, though a purely dynamic app might be sufficient).
Add a dedicated performance budget and continuous monitoring (Lighthouse scores, bundle analysis).
Testing and Quality Assurance
MVP:

Jest unit tests for critical logic (voice interaction component, fallback form, inventory update).
Cypress or Playwright for a few end-to-end flows.
Post-MVP:

Expand coverage to all main user flows, including multi-role interactions and advanced features (manager approvals, analytics).
Continuous Integration pipeline automates test runs on every pull request.
Style Guide (Tailwind CSS + DaisyUI)
This section outlines how to maintain a consistent look and feel using Tailwind CSS utility classes and DaisyUI components/themes. Adhering to these guidelines ensures each feature looks unified while remaining flexible enough to accommodate evolving design requirements.

1. Tailwind CSS Setup
Installation
In your React project, install Tailwind and DaisyUI:
bash
Copy
npm install -D tailwindcss postcss autoprefixer daisyui
Initialize Tailwind configuration:
bash
Copy
npx tailwindcss init -p
Project Structure
Make sure your tailwind.config.js file references relevant directories (e.g., ./src/**/*.{js,jsx,ts,tsx}) for purging unused styles.
Add Tailwind + DaisyUI to CSS
In your main CSS file (e.g., index.css or App.css), include:
css
Copy
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "daisyui";
2. DaisyUI Configuration
In the tailwind.config.js:

js
Copy
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Your custom tailwind extensions here
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    // DaisyUI config
    styled: true,
    themes: ["light", "dark"], 
    base: true,
    utils: true,
    logs: true,
  },
};
Themes Array: DaisyUI ships with multiple preset themes (light, dark, cupcake, etc.). Include the ones you need.
Custom Themes: You can define your own brand colors under the themes array for a more tailored look.
3. Color Palette
Primary Brand Color: Use primary from DaisyUI for your main brand color.
Secondary/Accent: Use secondary and accent for complementary actions or highlights.
Neutral/Background: For backgrounds, rely on base-100, base-200 for layering.
Example usage:
jsx
Copy
<button className="btn btn-primary">Submit</button>
<button className="btn btn-secondary">Cancel</button>
<div className="bg-base-200 p-4">Content</div>
4. Typography and Sizing
Tailwind Utility Classes:
Use classes like text-xl, font-semibold, etc., for headings.
Keep headings consistent by creating small utility components if desired:
jsx
Copy
export const H1 = ({ children }) => (
  <h1 className="text-2xl font-bold mb-2">{children}</h1>
);
DaisyUI Typography:
DaisyUI provides .text-primary, .text-secondary, etc., plus ready-to-use components like .card-title, .card-body.
Example:
jsx
Copy
<h2 className="card-title text-primary">Inventory Details</h2>
5. Spacing and Layout
Tailwind Utilities:
Use margin (m-), padding (p-), gap (gap-), and flex/grid utilities to control layout.
Example:
jsx
Copy
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <InventoryList />
  <AnalyticsChart />
</div>
Consistent Spacing:
Follow an 8px or 4px baseline for margins/paddings. For instance, p-4 or p-2 to keep design uniform.
6. DaisyUI Components and Patterns
Buttons:
Use built-in classes like btn, btn-primary, btn-outline, etc.
Example:
jsx
Copy
<button className="btn btn-primary">Save Changes</button>
<button className="btn btn-outline btn-secondary">Cancel</button>
Cards:
DaisyUI provides .card, .card-body, .card-title.
Example:
jsx
Copy
<div className="card w-96 bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title text-primary">Item Title</h2>
    <p>Description of the item...</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">View</button>
    </div>
  </div>
</div>
Modals:
Use .modal classes to create dialogs for confirmations or advanced settings.
Control open/close state with class toggles or by conditionally rendering in React.
7. Responsiveness
Tailwind Breakpoints:
sm: (640px), md: (768px), lg: (1024px), etc.
Example usage:
jsx
Copy
<div className="p-2 md:p-4 lg:p-8">Responsive Padding</div>
Mobile-First:
Start with defaults for small screens, then add prefix classes for larger breakpoints.
8. Accessibility
Contrast: Ensure text has enough contrast with background. DaisyUI’s default themes typically meet basic contrast requirements, but verify with brand colors.
Focus States: Tailwind and DaisyUI provide default focus outlines. Maintain or customize them for clarity.
ARIA Attributes: For custom components, add aria-label, role, etc., as needed.
9. Customizing and Extending
Custom Classes:
If DaisyUI’s classes don’t fully cover your needs, supplement with Tailwind utility classes or create reusable React components.
Tailwind extend:
In tailwind.config.js, add custom color palette, spacing, or breakpoints under the extend field.
10. Theming Strategy
If you want dynamic theming (e.g., day/night modes), use the built-in DaisyUI theme toggler or create a custom toggle:
jsx
Copy
const [theme, setTheme] = useState("light");

useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
}, [theme]);
Keep brand color overrides in your custom DaisyUI theme for consistent, site-wide updates.