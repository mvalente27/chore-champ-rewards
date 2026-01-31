import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Approvals from "./pages/Approvals";
import Rewards from "./pages/Rewards";
import Quiz from "./pages/Quiz";
import Wallet from "./pages/Wallet";
import StockMarket from "./pages/StockMarket";
import EntrepreneurQuest from "./pages/EntrepreneurQuest";
import History from "./pages/History";
import Install from "./pages/Install";
import SkillTree from "./pages/SkillTree";
import Savings from "./pages/Savings";
import ParentAnalytics from "./pages/ParentAnalytics";
import MiniGames from "./pages/MiniGames";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import DeleteAccount from "./pages/DeleteAccount";
import DeleteData from "./pages/DeleteData";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/stocks" element={<StockMarket />} />
            <Route path="/entrepreneur" element={<EntrepreneurQuest />} />
            <Route path="/history" element={<History />} />
            <Route path="/install" element={<Install />} />
            <Route path="/skills" element={<SkillTree />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/analytics" element={<ParentAnalytics />} />
            <Route path="/games" element={<MiniGames />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/delete-data" element={<DeleteData />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
