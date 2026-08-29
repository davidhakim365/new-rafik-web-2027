import { Toaster as Sonner } from "@/components/ui/sonner.tsx";
import { Toaster } from "@/components/ui/toaster.tsx";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import ModalProvider from "./components/modals/modal-provider.tsx";
import { ThemeProvider } from "@/components/theme-provider";
import "./i18n";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      // Background refetch failures (tablet sleep, flaky network) must not
      // unmount an in-progress quiz/exam. Only throw when we have nothing to show.
      throwOnError: (_error, query) => query.state.data === undefined,
    },
    mutations: {
      retry: false,
      throwOnError: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.log(error);
    },
  }),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <ModalProvider />
        <App />
        <Toaster />
        <Sonner />
      </BrowserRouter>
    </ThemeProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
  // </React.StrictMode>
);
