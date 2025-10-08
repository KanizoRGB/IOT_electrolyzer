// import { Switch, Route } from "wouter";
// import { queryClient } from "./lib/queryClient";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { ThemeProvider } from "@/components/ThemeProvider";
// import Dashboard from "@/components/Dashboard";
// import NotFound from "@/pages/not-found";
// import {Sidebar} from "@/components/ui/sidebar";

// function Router() {
//   return (
//     <Switch>
//       <Route path="/" component={Dashboard} />
//       <Route component={NotFound} />
//     </Switch>
//   );
// }

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <ThemeProvider defaultTheme="dark">
//           <Toaster />
//           <Router />
//         </ThemeProvider>
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }

//export default App;
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "@/components/Dashboard";
import NotFound from "@/pages/not-found";
import Controller from "@/components/Controller";
import Electrolyzer from "@/components/Electrolyzer";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarProvider";

function Router() {
  return (
    <Switch>
      {/* <Route path="/" component={Dashboard} /> */}
      <Route path="/" component={Controller} />
      <Route path="/electrolyzer" component={Electrolyzer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Layout() {
  const { isOpen } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={`
          flex-1 transition-all duration-300
          ${isOpen ? "ml-64" : "ml-0"}
          md:ml-64
        `}
      >
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="dark">
          <Toaster />
          <SidebarProvider>
            <Layout />
          </SidebarProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
