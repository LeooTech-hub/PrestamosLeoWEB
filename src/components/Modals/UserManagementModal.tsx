'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Trash2, Shield, User, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { userService, AppUser } from '@/services/userService';
import { getStoredUser } from '@/lib/auth';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'COBRADOR' as 'ADMIN' | 'COBRADOR' });
  const currentUser = getStoredUser();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.listUsers();
      setUsers(data.users || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setShowCreateForm(false);
      setError('');
      setSuccess('');
      setForm({ name: '', email: '', password: '', role: 'COBRADOR' });
    }
  }, [isOpen, loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await userService.createUser(form);
      setSuccess(`Usuario "${form.name}" creado exitosamente.`);
      setForm({ name: '', email: '', password: '', role: 'COBRADOR' });
      setShowCreateForm(false);
      await loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (user.id === currentUser?.id) {
      setError('No puedes eliminar tu propio usuario.');
      return;
    }
    if (!confirm(`¿Eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`)) return;
    setError('');
    setSuccess('');
    try {
      await userService.deleteUser(user.id);
      setSuccess(`Usuario "${user.name}" eliminado.`);
      await loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Gestión de Usuarios">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-lg bg-[#FAF8F5] dark:bg-[#26221F] rounded-3xl shadow-2xl border border-[#E6DCD2] dark:border-[#3D352E] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6DCD2] dark:border-[#3D352E] bg-white dark:bg-[#2A241F] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3ED] dark:bg-[#D96B27]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#D96B27] dark:text-[#E07A5F]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C221E] dark:text-[#EAE0D5]">Gestión de Usuarios</h2>
              <p className="text-[11px] text-[#6E615A] dark:text-[#C2B29F]">Control de acceso — Solo ADMIN</p>
            </div>
          </div>
          <button
            id="user-management-close-btn"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[#6E615A] dark:text-[#C2B29F] hover:bg-[#F4EBE1] dark:hover:bg-neutral-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Feedback messages */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[#FDF2F0] dark:bg-[#C84B31]/15 border border-[#C84B31]/30 text-[#C84B31] text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl bg-[#EEF6F2] dark:bg-[#3D9970]/15 border border-[#2D7A5D]/30 text-[#2D7A5D] dark:text-[#3D9970] text-sm font-medium">
              {success}
            </div>
          )}

          {/* Create Form Toggle */}
          {!showCreateForm ? (
            <button
              id="show-create-user-form-btn"
              onClick={() => { setShowCreateForm(true); setError(''); setSuccess(''); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D96B27] hover:bg-[#C25A19] text-white text-sm font-semibold transition-all active:scale-95 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Crear Nuevo Usuario
            </button>
          ) : (
            <form onSubmit={handleCreate} className="bg-white dark:bg-[#2A241F] rounded-2xl border border-[#E6DCD2] dark:border-[#3D352E] p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#D96B27]" />
                Nuevo Registrante
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]" htmlFor="new-user-name">Nombre completo</label>
                <input
                  id="new-user-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: María García"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6DCD2] dark:border-[#3D352E] bg-[#FAF8F5] dark:bg-[#1C1917] text-[#2C221E] dark:text-[#EAE0D5] text-sm placeholder-[#B5A49A] dark:placeholder-[#6E615A] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]" htmlFor="new-user-email">Correo electrónico</label>
                <input
                  id="new-user-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6DCD2] dark:border-[#3D352E] bg-[#FAF8F5] dark:bg-[#1C1917] text-[#2C221E] dark:text-[#EAE0D5] text-sm placeholder-[#B5A49A] dark:placeholder-[#6E615A] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]" htmlFor="new-user-password">Contraseña</label>
                <div className="relative">
                  <input
                    id="new-user-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-[#E6DCD2] dark:border-[#3D352E] bg-[#FAF8F5] dark:bg-[#1C1917] text-[#2C221E] dark:text-[#EAE0D5] text-sm placeholder-[#B5A49A] dark:placeholder-[#6E615A] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]" htmlFor="new-user-role">Rol</label>
                <select
                  id="new-user-role"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'ADMIN' | 'COBRADOR' }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E6DCD2] dark:border-[#3D352E] bg-[#FAF8F5] dark:bg-[#1C1917] text-[#2C221E] dark:text-[#EAE0D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D96B27]/50 transition-all"
                >
                  <option value="COBRADOR">COBRADOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2 rounded-xl border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] text-sm font-semibold hover:bg-[#F4EBE1] dark:hover:bg-neutral-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="create-user-submit-btn"
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 rounded-xl bg-[#D96B27] hover:bg-[#C25A19] disabled:opacity-60 text-white text-sm font-semibold transition-all active:scale-95"
                >
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E615A] dark:text-[#C2B29F]">
                Usuarios del Sistema ({users.length})
              </h3>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6E615A] dark:text-[#C2B29F] hover:bg-[#F4EBE1] dark:hover:bg-neutral-700 transition-all disabled:opacity-50"
                title="Actualizar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#D96B27] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-6 text-[#6E615A] dark:text-[#C2B29F] text-sm">No hay usuarios registrados.</div>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#2A241F] border border-[#E6DCD2] dark:border-[#3D352E] gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        u.role === 'ADMIN'
                          ? 'bg-[#FDF3ED] dark:bg-[#D96B27]/20'
                          : 'bg-[#F4F4F4] dark:bg-[#3D352E]'
                      }`}>
                        {u.role === 'ADMIN'
                          ? <Shield className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F]" />
                          : <User className="w-4 h-4 text-[#6E615A] dark:text-[#C2B29F]" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#2C221E] dark:text-[#EAE0D5] truncate">
                          {u.name}
                          {u.id === currentUser?.id && (
                            <span className="ml-1.5 text-[10px] font-bold text-[#D96B27] dark:text-[#E07A5F]">(tú)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6E615A] dark:text-[#C2B29F] truncate">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        u.role === 'ADMIN'
                          ? 'bg-[#FDF3ED] dark:bg-[#D96B27]/20 text-[#D96B27] dark:text-[#E07A5F] border-[#D96B27]/30'
                          : 'bg-[#F4F4F4] dark:bg-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#4A3F38]'
                      }`}>
                        {u.role}
                      </span>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#C84B31] hover:bg-[#FDF2F0] dark:hover:bg-[#C84B31]/15 transition-all active:scale-95"
                          title={`Eliminar ${u.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
