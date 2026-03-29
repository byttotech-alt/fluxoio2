import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { getMenuItemsForSegments } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, LogOut, ChevronsUpDown, Zap
} from 'lucide-react';
import type { MenuItem } from '@/lib/constants';
import './Sidebar.css';

export function Sidebar({ planPercent: externalPercent }: { planPercent?: number }) {
  const { profile } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const menuItems = useMemo(() => {
    if (!profile?.segments?.length) return [];
    return getMenuItemsForSegments(profile.segments as any);
  }, [profile?.segments]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    menuItems.forEach(item => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, [menuItems]);

  const planLabel = profile?.plan === 'enterprise' ? 'Enterprise' : profile?.plan === 'pro' ? 'Pro' : 'Free';
  const planPercent = externalPercent ?? (profile?.plan === 'free' ? 35 : profile?.plan === 'pro' ? 68 : 90);

  async function handleLogout() {
    await signOut();
    navigate('/auth');
  }

  return (
    <>
      {/* Overlay mobile */}
      {sidebarMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarMobileOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => navigate('/')}>
            <div className="sidebar-logo-icon">F</div>
            {!sidebarCollapsed && (
              <motion.div className="sidebar-brand-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="sidebar-brand-name">{profile?.display_name || profile?.company_name || 'Fluxio'}</span>
                <span className="sidebar-brand-plan">{planLabel}</span>
              </motion.div>
            )}
          </div>
          <button className="sidebar-collapse-btn" onClick={toggleSidebar} title={sidebarCollapsed ? 'Expandir' : 'Recolher'}>
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group} className="sidebar-group">
              {!sidebarCollapsed && <div className="sidebar-group-label">{group}</div>}
              {items.map(item => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setSidebarMobileOpen(false)}
                >
                  <item.icon size={20} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {item.badge && item.badge > 0 && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Plan indicator */}
        {!sidebarCollapsed && (
          <div className="sidebar-plan">
            <div className="sidebar-plan-header">
              <Zap size={14} />
              <span>Plano {planLabel}</span>
            </div>
            <div className="sidebar-plan-bar">
              <div className="sidebar-plan-fill" style={{ width: `${planPercent}%` }} />
            </div>
            <span className="sidebar-plan-usage">{planPercent}% do limite usado</span>
          </div>
        )}

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="sidebar-avatar" />
            ) : (
              <div className="sidebar-avatar-fallback">
                {getInitials(profile?.full_name || 'U')}
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{profile?.full_name || 'Usuário'}</span>
                <span className="sidebar-user-role">Administrador</span>
              </div>
            )}
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
