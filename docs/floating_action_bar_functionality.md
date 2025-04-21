FloatingActionBar Functionality and States
The FloatingActionBar will be the central interface for initiating and managing voice interactions in your app. It will transition through five distinct states, each with specific UI elements and behaviors to provide clear feedback and control to the user. Here’s the detailed breakdown:

State 1: Off
Description: The default state when no voice session is active.
UI:
A circular floating button featuring the WaveFormIcon (or a microphone icon) to signify voice functionality.
Positioned in the bottom-right corner of the screen for easy access.
Behavior:
Clicking the button starts a new voice session, moving the component to the Loading state.
Purpose: Gives users a simple, unobtrusive way to begin a voice interaction whenever they’re ready.
State 2: Loading
Description: A temporary state that occurs after the user clicks the button, while the backend connects to services and sets up the voice session.
UI:
The circular button transforms into a loading indicator, such as a spinning circle or an animated waveform.
Optional: A small label like "Connecting..." appears near the button for additional clarity.
Behavior:
Automatically shifts to the Listening state once the session is successfully initiated.
If an error occurs (e.g., connection failure), it reverts to the Off state and displays an error message.
Purpose: Keeps the user informed that the system is preparing to listen, enhancing transparency.
State 3: Listening
Description: The active state where the app records and processes the user’s voice input.
UI:
The circular button expands into a wider, pill-shaped "floating bar."
Features a voice input visualizer (e.g., a waveform or pulsing animation) to confirm that the user’s voice is being captured.
Includes a "Stop" button to end the session or a "Pause" button to temporarily halt recording.
Offers an "Expand" option to reveal more details (see Expanded state below).
Behavior:
Clicking "Pause" moves it to the Resting state.
Clicking "Stop" terminates the session and returns to the Off state.
After a period of inactivity, it automatically transitions to the Resting state.
Purpose: Provides real-time feedback and control during active voice input, making the interaction engaging and intuitive.
State 4: Resting
Description: A paused state where the session remains active but isn’t currently recording.
UI:
The floating bar stays visible but signals it’s paused (e.g., the visualizer stops, and the icon changes to a "paused" symbol).
Displays a "Resume" button to return to the Listening state.
Optional: Shows a timer indicating how much time remains before the session times out.
Behavior:
Clicking "Resume" switches back to the Listening state.
After a set timeout period with no activity, it moves to the Off state to conserve resources.
Purpose: Allows users to pause their session and resume later without losing context, improving flexibility.
State 5: Expanded
Description: An optional state where users can view detailed information about the current voice session.
UI:
The floating bar expands into a larger panel or modal window.
Shows recent conversation logs, past voice commands, and system responses.
Includes a "Collapse" button to return to the Listening or Resting state (whichever was active before expanding).
Behavior:
Triggered by clicking an "Expand" or "Details" button in the Listening or Resting states.
Collapses back to the previous state when the user closes or minimizes it.
Purpose: Offers transparency and control, letting users review and verify their voice interactions as needed.
State Transitions
To ensure a smooth and logical flow, here’s how the FloatingActionBar moves between states:

Off → Loading: User clicks the button to start a session.
Loading → Listening: Backend successfully sets up the session.
Listening → Resting: User pauses the session or an inactivity timeout occurs.
Resting → Listening: User resumes the session.
Listening/Resting → Expanded: User clicks to view session details.
Expanded → Listening/Resting: User collapses the detailed view.
Listening/Resting → Off: User ends the session manually, or a timeout fully terminates it.
Additional Features and Considerations
Error Handling: If the session fails to start (e.g., due to a network issue), the component returns to the Off state and notifies the user with a brief message or toast notification.
Session Timeout: In the Resting state, a timeout (e.g., 30 seconds or configurable) ensures the session doesn’t linger unnecessarily, saving system resources.
Visual Feedback: Use distinct colors, animations, or icons for each state to make transitions clear (e.g., grey for Off, blue for Listening, yellow for Resting).
Accessibility: Add ARIA labels (e.g., "Start voice session" for the Off state) and ensure keyboard navigation works for all controls.
