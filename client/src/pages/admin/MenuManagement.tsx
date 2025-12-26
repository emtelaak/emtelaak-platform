import { useState } from 'react';
import { Shield, Eye, EyeOff, Save, RefreshCw, History } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { trpc } from '../../lib/trpc';

interface MenuItem {
  id: number;
  name: string;
  labelEn: string;
  labelAr: string;
  path: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
  permissionRequired: string | null;
  roleVisibility: Record<string, boolean>;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

export function MenuManagement() {
  const { language } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<string>('investor');
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [showAuditLog, setShowAuditLog] = useState(false);

  const utils = trpc.useUtils();

  // Fetch menu items with role visibility
  const { data: menuData, isLoading } = trpc.rbacMenu.getMenuItemsWithRoles.useQuery();

  // Fetch audit log
  const { data: auditData } = trpc.rbacMenu.getMenuVisibilityAudit.useQuery(
    { limit: 50, offset: 0 },
    { enabled: showAuditLog }
  );

  // Update single menu visibility
  const updateVisibility = trpc.rbacMenu.updateMenuVisibility.useMutation({
    onSuccess: (data) => {
      console.log('✅ Visibility updated successfully:', data);
      utils.rbacMenu.getMenuItemsWithRoles.invalidate();
      // Remove from pending changes after successful save
      setPendingChanges(new Map());
    },
    onError: (error) => {
      console.error('❌ Failed to update visibility:', error);
      alert(`Error: ${error.message}`);
    }
  });

  const handleToggleVisibility = (menuItemId: number, roleId: number, currentValue: boolean) => {
    const key = `${menuItemId}-${roleId}`;
    const newValue = !currentValue;
    console.log('🔄 Toggling visibility:', { menuItemId, roleId, currentValue, newValue });
    
    setPendingChanges(new Map(pendingChanges.set(key, newValue)));
    
    // Auto-save immediately
    updateVisibility.mutate({
      menuItemId,
      roleId,
      isVisible: newValue
    });
  };

  const handleSaveAll = () => {
    // All changes are auto-saved, just clear pending changes
    setPendingChanges(new Map());
  };

  const handleReset = () => {
    setPendingChanges(new Map());
    utils.rbacMenu.getMenuItemsWithRoles.invalidate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const menuItems = menuData?.menuItems || [];
  const roles = menuData?.roles || [];
  const selectedRoleData = roles.find(r => r.name === selectedRole);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'إدارة القوائم والأدوار' : 'Menu & Role Management'}
                </h1>
                <p className="text-sm text-gray-600">
                  {language === 'ar' 
                    ? 'التحكم في رؤية عناصر القائمة لكل دور' 
                    : 'Control menu item visibility for each role'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <History className="w-4 h-4" />
              {language === 'ar' ? 'سجل التدقيق' : 'Audit Log'}
            </button>
          </div>
        </div>

        {/* Role Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'ar' ? 'اختر الدور' : 'Select Role'}
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {roles.map(role => (
              <option key={role.id} value={role.name}>
                {role.name.replace('_', ' ').toUpperCase()} - {role.description}
              </option>
            ))}
          </select>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'عنصر القائمة' : 'Menu Item'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'المسار' : 'Path'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الصلاحية المطلوبة' : 'Required Permission'}
                  </th>
                  {roles.map(role => (
                    <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {role.name.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {language === 'ar' ? item.labelAr : item.labelEn}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.permissionRequired || '-'}
                    </td>
                    {roles.map(role => {
                      const key = `${item.id}-${role.id}`;
                      const isVisible = pendingChanges.has(key) 
                        ? pendingChanges.get(key)! 
                        : item.roleVisibility[role.name];
                      
                      return (
                        <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleVisibility(item.id, role.id, isVisible)}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                              isVisible
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {isVisible ? (
                              <Eye className="w-5 h-5" />
                            ) : (
                              <EyeOff className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        {pendingChanges.size > 0 && (
          <div className="mt-6 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              {language === 'ar' 
                ? `${pendingChanges.size} تغيير معلق` 
                : `${pendingChanges.size} pending change(s)`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </button>
              <button
                onClick={handleSaveAll}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {language === 'ar' ? 'حفظ الكل' : 'Save All'}
              </button>
            </div>
          </div>
        )}

        {/* Audit Log */}
        {showAuditLog && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'ar' ? 'سجل التدقيق' : 'Audit Log'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'ar' ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'ar' ? 'الدور' : 'Role'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'ar' ? 'عنصر القائمة' : 'Menu Item'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'ar' ? 'الإجراء' : 'Action'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'ar' ? 'بواسطة' : 'By'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditData?.auditLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.changedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.roleName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.menuItemLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.isVisible 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.isVisible 
                            ? (language === 'ar' ? 'مرئي' : 'Visible')
                            : (language === 'ar' ? 'مخفي' : 'Hidden')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.changedByEmail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuManagement;
