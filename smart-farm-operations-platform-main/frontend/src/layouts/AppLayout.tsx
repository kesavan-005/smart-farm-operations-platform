// AppLayout — Premium application shell
// Desktop: sidebar + header + content
// Mobile: header + content + bottom nav

import { type ReactNode, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Tractor, Package, Wallet, Search, Bell, Moon, Sun,
  LogOut, Settings, HelpCircle,
  Leaf, Menu, X, Monitor, PanelLeftClose, PanelLeft, Activity
} from 'lucide-react';
import { useSyncStatus } from '@/offline';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

interface AppLayoutProps {
  children?: ReactNode;
}

// Navigation structure with groups
const NAV_GROUPS = [
  {
    label: 'nav:main',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav:dashboard' },
      { path: '/farms', icon: Tractor, labelKey: 'nav:farms' },
    ],
  },
  {
    label: 'nav:management',
    items: [
      { path: '/inventory', icon: Package, labelKey: 'nav:inventory' },
      { path: '/expenses', icon: Wallet, labelKey: 'nav:finance' },
    ],
  },
  {
    label: 'nav:operations',
    items: [
      { path: '/operations', icon: Activity, labelKey: 'nav:operations' },
    ],
  },
  {
    label: 'nav:system',
    items: [
      { path: '/notifications', icon: Bell, labelKey: 'nav:notifications' },
      { path: '/settings', icon: Settings, labelKey: 'nav:settings' },
      { path: '/help', icon: HelpCircle, labelKey: 'nav:help' },
    ],
  },
] as const;

const MOBILE_NAV = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav:dashboard' },
  { path: '/operations', icon: Activity, labelKey: 'nav:operations' },
  { path: '/inventory', icon: Package, labelKey: 'nav:inventory' },
  { path: '/settings', icon: Menu, labelKey: 'nav:more' },
] as const;

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation(['common', 'nav']);
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingCount, isOnline } = useSyncStatus();
  const { toggleLanguage, language } = useLanguageStore();
  const { user, clearSession } = useAuthStore();
  const { theme, setTheme, resolved } = useThemeStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  // Breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-background flex">
      {/* ========== Sidebar (Desktop) ========== */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 bottom-0 flex-col bg-card border-r border-border z-[var(--z-sticky)] transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-[var(--header-height)] border-b border-border shrink-0 ${isSidebarCollapsed ? 'px-4 justify-center' : 'px-5'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Leaf className="w-4.5 h-4.5 text-primary" />
            </div>
            {!isSidebarCollapsed && (
              <span className="text-sm font-bold text-foreground truncate tracking-tight">Smart Farm</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-5">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {!isSidebarCollapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-3 mb-1.5">
                  {t(group.label)}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ path, icon: Icon, labelKey }) => (
                  <NavLink
                    key={path}
                    to={path}
                    title={isSidebarCollapsed ? t(labelKey) : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isSidebarCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 h-9'
                      } ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !isSidebarCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />
                        )}
                        <Icon className="w-4 h-4 shrink-0" />
                        {!isSidebarCollapsed && <span>{t(labelKey)}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card + Collapse Toggle */}
        <div className="border-t border-border p-3 space-y-2 shrink-0">
          {/* User card */}
          <button
            onClick={() => navigate('/profile')}
            className={`w-full flex items-center gap-2.5 rounded-lg transition-colors hover:bg-accent ${
              isSidebarCollapsed ? 'justify-center p-2' : 'px-3 py-2.5'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {user?.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={t('common:logout') || 'Logout'}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors ${
              isSidebarCollapsed ? 'justify-center h-9 w-9 mx-auto' : 'px-3 h-9'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>{t('common:logout') || 'Logout'}</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ========== Main Area ========== */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[var(--sidebar-collapsed-width)]' : 'md:ml-[var(--sidebar-width)]'}`}>
        {/* Header */}
        <header className="sticky top-0 z-[var(--z-sticky)] h-[var(--header-height)] bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground min-w-0" aria-label="Breadcrumb">
              {pathSegments.map((seg, i) => (
                <span key={i} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <span className="text-border mx-0.5">/</span>}
                  <span className={`truncate capitalize ${i === pathSegments.length - 1 ? 'text-foreground font-medium' : ''}`}>
                    {seg}
                  </span>
                </span>
              ))}
            </nav>

            {/* Mobile title */}
            <span className="md:hidden text-sm font-semibold text-foreground capitalize truncate">
              {pathSegments[pathSegments.length - 1] || 'Dashboard'}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Sync status */}
            {!isOnline && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Offline
              </span>
            )}
            {isOnline && pendingCount > 0 && (
              <span className="hidden sm:flex text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mr-1">
                Syncing {pendingCount}
              </span>
            )}

            {/* Global Search (placeholder) */}
            <button className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-accent/50 text-muted-foreground text-sm hover:bg-accent transition-colors min-w-[180px]">
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] font-medium bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
            </button>

            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Toggle theme"
              title={`Theme: ${theme}`}
            >
              {resolved === 'dark' ? <Sun className="w-4 h-4" /> : theme === 'system' ? <Monitor className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-xs font-bold"
              aria-label="Switch language"
            >
              {language === 'en' ? 'த' : 'En'}
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-card" />
            </button>

            {/* Profile avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold ml-1 hover:ring-2 hover:ring-primary/20 transition-all"
            >
              {user?.name?.substring(0, 2).toUpperCase() || 'U'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-[var(--content-max-width)] mx-auto px-4 md:px-6 py-6">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      {/* ========== Mobile Bottom Navigation ========== */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[var(--z-fixed)] bg-card/95 backdrop-blur-md border-t border-border md:hidden pb-safe"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {MOBILE_NAV.map(({ path, icon: Icon, labelKey }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[10px] font-medium leading-none">{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ========== Mobile Slide Menu ========== */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[var(--z-modal-backdrop)] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-card z-[var(--z-modal)] md:hidden sf-animate-in flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between h-[var(--header-height)] px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">Smart Farm</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
              {NAV_GROUPS.map((group, gi) => (
                <div key={gi}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1.5">{t(group.label)}</p>
                  <div className="space-y-0.5">
                    {group.items.map(({ path, icon: Icon, labelKey }) => (
                      <NavLink
                        key={path}
                        to={path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t(labelKey)}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* User */}
            <div className="border-t border-border p-3 space-y-1">
              <button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-accent">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-muted-foreground">View profile</p>
                </div>
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] font-medium text-destructive/80 hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
