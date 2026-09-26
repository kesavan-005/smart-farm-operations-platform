import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/apiClient';
import { useFarmStore } from '@/store/farmStore';
import type {
  FarmModule,
  ModuleAccessLevel,
  SensitivePermission,
  ManagerPermissionSummary,
  UserSummary,
} from '@/types/permissions';
import { X, ShieldCheck, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ManagerPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingManager?: ManagerPermissionSummary | null;
}

const MODULE_LIST: { key: FarmModule; labelKey: string; defaultLabel: string }[] = [
  { key: 'FARM_MANAGEMENT', labelKey: 'nav.farms', defaultLabel: 'Farm Management' },
  { key: 'OPERATIONS', labelKey: 'nav.operations', defaultLabel: 'Operations' },
  { key: 'MONITORING', labelKey: 'nav.monitoring', defaultLabel: 'Monitoring' },
  { key: 'INVENTORY', labelKey: 'nav.inventory', defaultLabel: 'Inventory' },
  { key: 'FINANCE', labelKey: 'nav.finance', defaultLabel: 'Finance' },
  { key: 'AI_ADVISORY', labelKey: 'nav.aiAdvisory', defaultLabel: 'AI Advisory' },
  { key: 'REPORTS', labelKey: 'nav.reports', defaultLabel: 'Reports' },
  { key: 'NOTIFICATIONS', labelKey: 'nav.notifications', defaultLabel: 'Notifications' },
];

const PRESETS: Record<string, { modules: Record<FarmModule, ModuleAccessLevel>; sensitive: SensitivePermission[] }> = {
  OPERATIONS_MANAGER: {
    modules: {
      FARM_MANAGEMENT: 'VIEW_ONLY',
      OPERATIONS: 'FULL_ACCESS',
      MONITORING: 'FULL_ACCESS',
      INVENTORY: 'VIEW_ONLY',
      FINANCE: 'NO_ACCESS',
      AI_ADVISORY: 'FULL_ACCESS',
      REPORTS: 'VIEW_ONLY',
      NOTIFICATIONS: 'FULL_ACCESS',
    },
    sensitive: [],
  },
  FARM_SUPERVISOR: {
    modules: {
      FARM_MANAGEMENT: 'VIEW_ONLY',
      OPERATIONS: 'FULL_ACCESS',
      MONITORING: 'FULL_ACCESS',
      INVENTORY: 'FULL_ACCESS',
      FINANCE: 'NO_ACCESS',
      AI_ADVISORY: 'VIEW_ONLY',
      REPORTS: 'VIEW_ONLY',
      NOTIFICATIONS: 'VIEW_ONLY',
    },
    sensitive: [],
  },
  FULL_MANAGER: {
    modules: {
      FARM_MANAGEMENT: 'FULL_ACCESS',
      OPERATIONS: 'FULL_ACCESS',
      MONITORING: 'FULL_ACCESS',
      INVENTORY: 'FULL_ACCESS',
      FINANCE: 'FULL_ACCESS',
      AI_ADVISORY: 'FULL_ACCESS',
      REPORTS: 'FULL_ACCESS',
      NOTIFICATIONS: 'FULL_ACCESS',
    },
    sensitive: ['INVENTORY_ADJUST'],
  },
};

export const ManagerPermissionModal: React.FC<ManagerPermissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingManager,
}) => {
  const { t } = useTranslation();
  const { activeFarmId } = useFarmStore();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eligibleUsers, setEligibleUsers] = useState<UserSummary[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('CUSTOM');

  const [moduleAccess, setModuleAccess] = useState<Record<FarmModule, ModuleAccessLevel>>({
    FARM_MANAGEMENT: 'NO_ACCESS',
    OPERATIONS: 'NO_ACCESS',
    MONITORING: 'NO_ACCESS',
    INVENTORY: 'NO_ACCESS',
    FINANCE: 'NO_ACCESS',
    AI_ADVISORY: 'NO_ACCESS',
    REPORTS: 'NO_ACCESS',
    NOTIFICATIONS: 'NO_ACCESS',
  });

  const [sensitivePermissions, setSensitivePermissions] = useState<SensitivePermission[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingManager) {
      setSelectedUserId(editingManager.userId);
      setModuleAccess(editingManager.moduleAccess || {});
      setSensitivePermissions(editingManager.sensitivePermissions || []);
      setSelectedPreset('CUSTOM');
    } else {
      setSelectedUserId('');
      setModuleAccess({
        FARM_MANAGEMENT: 'NO_ACCESS',
        OPERATIONS: 'NO_ACCESS',
        MONITORING: 'NO_ACCESS',
        INVENTORY: 'NO_ACCESS',
        FINANCE: 'NO_ACCESS',
        AI_ADVISORY: 'NO_ACCESS',
        REPORTS: 'NO_ACCESS',
        NOTIFICATIONS: 'NO_ACCESS',
      });
      setSensitivePermissions([]);
      setSelectedPreset('CUSTOM');
      fetchEligibleUsers('');
    }
  }, [editingManager, isOpen]);

  const fetchEligibleUsers = async (query: string) => {
    if (!activeFarmId) return;
    setIsSearching(true);
    try {
      const res = await apiClient.get<UserSummary[]>(
        `/farms/${activeFarmId}/permissions/eligible-managers`,
        { params: { query } }
      );
      setEligibleUsers(res.data);
    } catch (e) {
      // ignore search errors
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (PRESETS[presetKey]) {
      setModuleAccess({ ...PRESETS[presetKey]!.modules });
      setSensitivePermissions([...PRESETS[presetKey]!.sensitive]);
    }
  };

  const handleModuleAccessChange = (module: FarmModule, level: ModuleAccessLevel) => {
    setSelectedPreset('CUSTOM');
    setModuleAccess((prev) => ({ ...prev, [module]: level }));
  };

  const handleToggleSensitive = (perm: SensitivePermission) => {
    setSelectedPreset('CUSTOM');
    setSensitivePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    if (!activeFarmId) return;
    if (!editingManager && !selectedUserId) {
      setErrorMessage(t('permissions.selectManager', 'Please select a manager to assign'));
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingManager) {
        await apiClient.put(
          `/farms/${activeFarmId}/permissions/managers/${editingManager.userId}`,
          {
            moduleAccess,
            sensitivePermissions,
          }
        );
      } else {
        await apiClient.post(`/farms/${activeFarmId}/permissions/managers`, {
          userId: selectedUserId,
          moduleAccess,
          sensitivePermissions,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {editingManager
                  ? t('permissions.editPermissions', 'Edit Manager Permissions')
                  : t('permissions.addManager', 'Add Farm Manager')}
              </h2>
              <p className="text-xs text-slate-400">
                {editingManager ? editingManager.fullName : 'Configure module access levels for your manager'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Manager Selection (for Add) */}
        {!editingManager && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              {t('permissions.selectManager', 'Select Manager')}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder={t('permissions.searchManagerPlaceholder', 'Search by name or email...')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchEligibleUsers(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 divide-y divide-slate-800/60">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading managers...
                </div>
              ) : eligibleUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No eligible users found
                </div>
              ) : (
                eligibleUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/60 transition-colors ${
                      selectedUserId === user.id ? 'bg-emerald-950/40 border-l-2 border-emerald-500' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{user.fullName}</p>
                      <p className="text-[10px] text-slate-400">{user.email}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {user.role}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            {t('permissions.preset', 'Preset Configurations')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'CUSTOM', label: t('permissions.customPreset', 'Custom') },
              { id: 'OPERATIONS_MANAGER', label: t('permissions.operationsManagerPreset', 'Operations Mgr') },
              { id: 'FARM_SUPERVISOR', label: t('permissions.farmSupervisorPreset', 'Supervisor') },
              { id: 'FULL_MANAGER', label: t('permissions.fullManagerPreset', 'Full Manager') },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                  selectedPreset === preset.id
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Module Access Matrix */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300">
            {t('permissions.moduleName', 'Module Access Levels')}
          </label>
          <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden divide-y divide-slate-800/60">
            {MODULE_LIST.map(({ key, labelKey, defaultLabel }) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2">
                <span className="text-xs font-medium text-slate-200">
                  {t(labelKey, defaultLabel)}
                </span>
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['NO_ACCESS', 'VIEW_ONLY', 'FULL_ACCESS'] as ModuleAccessLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleModuleAccessChange(key, level)}
                      className={`py-1 px-2 text-[10px] font-semibold rounded transition-all text-center ${
                        moduleAccess[key] === level
                          ? level === 'FULL_ACCESS'
                            ? 'bg-emerald-600 text-white'
                            : level === 'VIEW_ONLY'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {level === 'NO_ACCESS'
                        ? t('permissions.noAccess', 'No Access')
                        : level === 'VIEW_ONLY'
                        ? t('permissions.viewOnly', 'View Only')
                        : t('permissions.fullAccess', 'Full Access')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensitive Permissions */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Sensitive Operations
          </label>
          <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={sensitivePermissions.includes('INVENTORY_ADJUST')}
              onChange={() => handleToggleSensitive('INVENTORY_ADJUST')}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-medium text-slate-200">
                {t('permissions.inventoryAdjustPermission', 'Allow Inventory Stock Adjustment')}
              </p>
              <p className="text-[10px] text-slate-500">
                Grants physical stock level overrides without full financial clearance
              </p>
            </div>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-xs border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 gap-2"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSaving ? t('permissions.saving', 'Saving...') : t('permissions.savePermissions', 'Save Permissions')}
          </Button>
        </div>
      </div>
    </div>
  );
};
