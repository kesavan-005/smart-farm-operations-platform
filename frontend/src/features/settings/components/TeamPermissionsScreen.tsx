import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/apiClient';
import { useFarmStore } from '@/store/farmStore';
import type { ManagerPermissionSummary, FarmModule, ModuleAccessLevel } from '@/types/permissions';
import { ManagerPermissionModal } from './ManagerPermissionModal';
import { UserPlus, Shield, Edit2, Trash2, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const MODULE_NAMES: Record<FarmModule, string> = {
  FARM_MANAGEMENT: 'Farm Mgmt',
  OPERATIONS: 'Operations',
  MONITORING: 'Monitoring',
  INVENTORY: 'Inventory',
  FINANCE: 'Finance',
  AI_ADVISORY: 'AI Advisory',
  REPORTS: 'Reports',
  NOTIFICATIONS: 'Notifications',
};

export const TeamPermissionsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeFarmId } = useFarmStore();
  const { toast } = useToast();

  const [managers, setManagers] = useState<ManagerPermissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingManager, setEditingManager] = useState<ManagerPermissionSummary | null>(null);

  const fetchManagers = useCallback(async () => {
    if (!activeFarmId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get<ManagerPermissionSummary[]>(`/farms/${activeFarmId}/permissions/managers`);
      setManagers(res.data);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to fetch team members',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFarmId, toast]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const handleRemoveManager = async (manager: ManagerPermissionSummary) => {
    if (!activeFarmId) return;
    if (
      !window.confirm(
        t('permissions.confirmRemoveManager', 'Are you sure you want to remove access for this manager?')
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/farms/${activeFarmId}/permissions/managers/${manager.userId}`);
      toast({
        title: 'Manager Removed',
        description: `Removed ${manager.fullName} from farm permissions.`,
      });
      fetchManagers();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Removal Failed',
        description: err?.message || 'Failed to remove manager',
      });
    }
  };

  const renderAccessBadge = (level: ModuleAccessLevel) => {
    if (level === 'FULL_ACCESS') {
      return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">Full</span>;
    }
    if (level === 'VIEW_ONLY') {
      return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-950/80 text-amber-400 border border-amber-800/60">View</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-900 text-slate-500 border border-slate-800">None</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sf-card border border-border rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t('permissions.teamAndPermissions', 'Team & Permissions')}
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage module-level farm access for assigned Farm Managers.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingManager(null);
            setIsModalOpen(true);
          }}
          className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-900/20"
        >
          <UserPlus className="w-4 h-4" />
          {t('permissions.addManager', 'Add Manager')}
        </Button>
      </div>

      {/* Managers List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : managers.length === 0 ? (
        <div className="p-12 text-center sf-card border border-border rounded-2xl space-y-3">
          <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">No Farm Managers Configured</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You haven't assigned any Farm Managers to this farm yet. Click "Add Manager" to assign manager access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {managers.map((manager) => (
            <div
              key={manager.membershipId}
              className="p-5 sf-card border border-border rounded-2xl space-y-4 hover:border-slate-700 transition-colors"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-sm">
                    {manager.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{manager.fullName}</h4>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{manager.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingManager(manager);
                      setIsModalOpen(true);
                    }}
                    className="h-8 px-3 text-xs border-slate-800 text-slate-300 hover:bg-slate-800 gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t('edit', 'Edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveManager(manager)}
                    className="h-8 px-3 text-xs gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('delete', 'Remove')}
                  </Button>
                </div>
              </div>

              {/* Module access grid */}
              <div className="pt-3 border-t border-border">
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">Module Access Matrix</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(MODULE_NAMES) as FarmModule[]).map((moduleKey) => {
                    const level = manager.moduleAccess[moduleKey] || 'NO_ACCESS';
                    return (
                      <div
                        key={moduleKey}
                        className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/50 text-xs"
                      >
                        <span className="text-[11px] text-muted-foreground font-medium truncate">
                          {MODULE_NAMES[moduleKey]}
                        </span>
                        {renderAccessBadge(level)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sensitive permissions */}
              {manager.sensitivePermissions && manager.sensitivePermissions.length > 0 && (
                <div className="flex items-center gap-2 pt-2 text-xs text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-[11px]">
                    Sensitive Rights: {manager.sensitivePermissions.join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Permission Modal */}
      <ManagerPermissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchManagers()}
        editingManager={editingManager}
      />
    </div>
  );
};
