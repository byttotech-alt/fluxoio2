import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { PaywallPage } from '@/pages/PaywallPage';
import { useUIStore } from '@/store/uiStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import './AppLayout.css';

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore();
  const { isBlocked, blockedResources, plan, overallPercent } = usePlanLimits();

  return (
    <div className="app-layout">
      <Sidebar planPercent={overallPercent} />
      <div className="app-main" style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}>
        <Topbar />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
      <CommandPalette />
      {isBlocked && (
        <PaywallPage
          blockedResources={blockedResources}
          currentPlan={plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Enterprise'}
        />
      )}
    </div>
  );
}

