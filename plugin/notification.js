/**
 * @file: .opencode/plugin/notification.js
 * @description: An OpenCode plugin that sends desktop notifications for key events.
 */

// A helper function to avoid repeating the notification command.
const sendNotification = async ($, title, message) => {
  // Using shell-escape to handle special characters safely.
  await $`notify-send ${title} ${message}`;
};

export const NotificationPlugin = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  return {
    event: async ({ event }) => {
      // Use a switch statement to handle different event types.
      switch (event.type) {
        case "session.complete":
          await sendNotification(
            $,
            "✅ Task Completed",
            "OpenCode has finished the task. Ready for review.",
          );
          break;

        case "permission.request":
          await sendNotification(
            $,
            "🔒 Permission Required",
            "OpenCode is waiting for your permission to proceed.",
          );
          break;

        case "session.error":
          await sendNotification(
            $,
            "❌ Error Occurred",
            "An error happened in your OpenCode session. Please check the terminal.",
          );
          break;

        // You can add more cases here as you discover more event types.
        // For example, if there's a 'review.request' event:
        // case 'review.request':
        //   await sendNotification($, "👀 Review Needed", "A review is required for the current task.");
        //   break;

        default:
          // This is helpful for discovering other event types.
          // Check your terminal for logs to see what other events are fired.
          // console.log(`OpenCode Event Fired: ${event.type}`);
          break;
      }
    },
  };
};
