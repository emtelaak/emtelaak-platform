import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Eye, EyeOff, Save, RefreshCw, History } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MenuItem {
  id: number;
  name: string;
  labelEn: string;
  labelAr: string;
  path: string;
  icon: string;
  orderIndex: number;
  isVisible: boolean;
  permissionRequired: string | null;
  roleVisibility: Record<string, boolean>;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface MenuData {
  menuItems: MenuItem[];
  roles: Role[];
}

export function MenuManagement() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('investor');
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Fetch menu items with role visibility
  const { data: menuData, isLoading } = useQuery<MenuData>({
    queryKey: ['admin-menu-items'],
    queryFn: async () => {
      const response = await fetch('/api/admin/menu-items', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch menu items');
      const result = await response.json();
      return result;
    }
  });

  // Fetch audit log
  const { data: auditData } = useQuery({
    queryKey: ['menu-audit-log'],
    queryFn: async () => {
      const response = await fetch('/api/admin/menu-visibility-audit?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch audit log');
      return response.json();
    },
    enabled: showAuditLog
  });

  // Update single menu visibility
  const updateVisibility = useMutation({
    mutationFn: async ({ menuItemId, roleId, isVisible }: { menuItemId: number; roleId: number; isVisible: boolean }) => {
      const response = await fetch(
        `/api/admin/menu-items/${menuItemId}/roles/${roleId}/visibility`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ isVisible })
        }
      );
      if (!response.ok) throw new Error('Failed to update visibility');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
    }
  });

  // Bulk update menu visibility
  const bulkUpdateVisibility = useMutation({
    mutationFn: async (updates: Array<{ menuItemId: number; roleId: number; isVisible: boolean }>) => {
      const response = await fetch('/api/admin/menu-items/bulk-visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ updates })
      });
      if (!response.ok) throw new Error('Failed to bulk update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      setPendingChanges(new Map());
    }
  });

  const getRoleId = (roleName: string): number => {
    const role = menuData?.roles.find(r => r.name === roleName);
    return role?.id || 3;
  };

  const handleToggleVisibility = (menuItemId: number, currentValue: boolean) => {
    const key = `${menuItemId}-${selectedRole}`;
    const newValue = !currentValue;
    
    // Track pending change
    const newChanges = new Map(pendingChanges);
    newChanges.set(key, newValue);
    setPendingChanges(newChanges);
  };

  const handleSaveChanges = () => {
    const updates = Array.from(pendingChanges.entries()).map(([key, isVisible]) => {
      const [menuItemId] = key.split('-');
      return {
        menuItemId: parseInt(menuItemId),
        roleId: getRoleId(selectedRole),
        isVisible
      };
    });

    bulkUpdateVisibility.mutate(updates);
  };

  const handleDiscardChanges = () => {
    setPendingChanges(new Map());
  };

  const getEffectiveVisibility = (menuItem: MenuItem): boolean => {
    const key = `${menuItem.id}-${selectedRole}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!;
    }
    return menuItem.roleVisibility[selectedRole] ?? true;
  };

  const getRoleDisplayName = (roleName: string): string => {
    const names: Record<string, { en: string; ar: string }> = {
      super_admin: { en: 'Super Admin', ar: 'مدير عام' },
      admin: { en: 'Admin', ar: 'مدير' },
      investor: { en: 'Investor', ar: 'مستثمر' },
      guest: { en: 'Guest', ar: 'ضيف' }
    };
    return language === 'ar' ? names[roleName]?.ar : names[roleName]?.en;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-[#032941]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#032941]" />
              <div>
                <h1 className="text-3xl font-bold text-[#032941]">
                  {language === 'ar' ? 'إدارة رؤية القائمة' : 'Menu Visibility Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {language === 'ar' 
                    ? 'التحكم في رؤية عناصر القائمة لكل دور مستخدم'
                    : 'Control menu item visibility for each user role'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <History className="h-5 w-5" />
              {language === 'ar' ? 'سجل التدقيق' : 'Audit Log'}
            </button>
          </div>

          {/* Role Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              {language === 'ar' ? 'اختر الدور:' : 'Select Role:'}
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPendingChanges(new Map());
              }}
              className="flex-1 max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#032941]"
            >
              {menuData?.roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {getRoleDisplayName(role.name)} - {role.description}
                </option>
              ))}
            </select>
          </div>

          {/* Pending Changes Indicator */}
          {pendingChanges.size > 0 && (
            <div className="mt-4 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {language === 'ar' 
                    ? `${pendingChanges.size} تغييرات معلقة`
                    : `${pendingChanges.size} pending changes`}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDiscardChanges}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {language === 'ar' ? 'تجاهل' : 'Discard'}
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={bulkUpdateVisibility.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#032941] rounded-lg hover:bg-[#064B66] disabled:opacity-50"
                >
                  {bulkUpdateVisibility.isPending 
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    {language === 'ar' ? 'عنصر القائمة' : 'Menu Item'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    {language === 'ar' ? 'المسار' : 'Path'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    {language === 'ar' ? 'الصلاحية المطلوبة' : 'Permission Required'}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    {language === 'ar' ? 'مرئي' : 'Visible'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menuData?.menuItems.map((item) => {
                  const isVisible = getEffectiveVisibility(item);
                  const hasChanges = pendingChanges.has(`${item.id}-${selectedRole}`);

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${hasChanges ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-gray-900">
                            {language === 'ar' ? item.labelAr : item.labelEn}
                          </div>
                          {hasChanges && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              {language === 'ar' ? 'معدل' : 'Modified'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.path || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {item.permissionRequired ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.permissionRequired}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {language === 'ar' ? 'لا شيء' : 'None'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleVisibility(item.id, isVisible)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isVisible ? 'bg-[#CDE428]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isVisible ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          {isVisible ? (
                            <Eye className="h-5 w-5 text-green-600 ml-2" />
                          ) : (
                            <EyeOff className="h-5 w-5 text-gray-400 ml-2" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Modal */}
        {showAuditLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-[#032941]">
                  {language === 'ar' ? 'سجل التدقيق' : 'Audit Log'}
                </h2>
                <button
                  onClick={() => setShowAuditLog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-6">
                {auditData?.auditLogs?.map((log: any) => (
                  <div key={log.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {log.menuItemLabel} - {log.roleName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {log.isVisible ? (
                            <span className="text-green-600">✓ Visible</span>
                          ) : (
                            <span className="text-red-600">✗ Hidden</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Changed by: {log.changedByEmail}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{new Date(log.changedAt).toLocaleString()}</p>
                        <p>{log.ipAddress}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
