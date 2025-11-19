import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider,  } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import App from "./App";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { LoadingProvider } from "./context/LoadingContext";
import { ModalsProvider } from "@mantine/modals";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider >
      <LoadingProvider children={undefined} />
      <Notifications position="top-center" />
      <ModalsProvider />
      <App />

    </MantineProvider>
  </React.StrictMode>
);
