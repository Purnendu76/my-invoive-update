// src/utils/notify.ts
import { notifications } from "@mantine/notifications";

// Success Notification
export const notifySuccess = (message: string, title = "Success") => {
  notifications.show({
    title,
    message,
    color: "teal",
  
    autoClose: 4000,
  });
};

// Error Notification
export const notifyError = (message: string, title = "Error") => {
  notifications.show({
    title,
    message,
    color: "red",
  
    autoClose: 5000,
  });
};

// Warning Notification
export const notifyWarning = (message: string, title = "Warning") => {
  notifications.show({
    title,
    message,
    color: "yellow",
  
    autoClose: 4500,
  });
};
