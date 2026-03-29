import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/themeStore';
import { AuthPage } from '@/pages/AuthPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { ProposalsPage } from '@/pages/ProposalsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { CommissionsPage } from '@/pages/CommissionsPage';
import { FinancePage } from '@/pages/FinancePage';
import { InventoryPage } from '@/pages/InventoryPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { WaitListPage } from '@/pages/WaitListPage';
import { TeamPage } from '@/pages/TeamPage';
import { TasksPage } from '@/pages/TasksPage';
import { WikiPage } from '@/pages/WikiPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  
  // If we finished loading and profile is missing or incomplete, go to onboarding
  if (!profile || !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  
  // If profile is loaded and onboarding is done, send them to dashboard
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  
  // Only redirect away from auth page if profile is LOADED and confirmed
  if (user && profile) {
    if (profile.onboarding_completed) return <Navigate to="/" replace />;
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { mode } = useThemeStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/reset" element={<AuthPage />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

          {/* Protected App Routes */}
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="propostas" element={<ProposalsPage />} />
            <Route path="metas" element={<GoalsPage />} />
            <Route path="comissoes" element={<CommissionsPage />} />
            <Route path="financeiro" element={<FinancePage />} />
            <Route path="estoque" element={<InventoryPage />} />
            <Route path="agenda" element={<CalendarPage />} />
            <Route path="clientes" element={<ContactsPage />} />
            <Route path="lista-espera" element={<WaitListPage />} />
            <Route path="equipe" element={<TeamPage />} />
            <Route path="tarefas" element={<TasksPage />} />
            <Route path="wiki" element={<WikiPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="perfil" element={<SettingsPage />} />
            {/* Catch-all for segment-specific routes */}
            <Route path="*" element={<ComingSoonPage />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          },
        }}
        theme={mode}
        richColors
      />
    </QueryClientProvider>
  );
}
