import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Wallet, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../api';

export function VistaResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('El enlace de recuperación es inválido o no contiene un token válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setIsSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage(err.response?.data?.error || 'No se pudo restablecer la contraseña. El token puede haber expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Header Logo Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl terracotta-gradient text-white shadow-lg ring-4 ring-[#D96B27]/15 mb-3">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C221E] tracking-tight">
            Prestamos<span className="text-[#D96B27]">Leo</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#6E615A] mt-1">
            Restablecimiento Seguro de Contraseña (S/.)
          </p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white border border-[#E6DCD2] rounded-3xl p-6 sm:p-8 warm-shadow relative overflow-hidden">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#EAF5F0] border border-[#2D7A5D]/20 text-[#2D7A5D] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-[#2C221E]">¡Contraseña Actualizada!</h2>
              <p className="text-xs text-[#6E615A] leading-relaxed">
                Tu contraseña ha sido restablecida exitosamente en el sistema TiDB Cloud. Ya puedes acceder con tus nuevas credenciales.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full mt-4 py-3 px-4 rounded-xl terracotta-gradient text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ir al Inicio de Sesión</span>
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#2C221E]">Nueva Contraseña</h2>
                <p className="text-xs text-[#6E615A] mt-1">
                  Ingresa tu nueva clave de acceso para actualizar tu cuenta
                </p>
              </div>

              {!token && (
                <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Atención: No se detectó un token en la dirección de la página.</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E615A]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-medium text-[#2C221E] placeholder-[#9E918A] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 focus:border-[#D96B27]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6E615A] hover:text-[#D96B27]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E615A]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-medium text-[#2C221E] placeholder-[#9E918A] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 focus:border-[#D96B27]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6E615A] hover:text-[#D96B27]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !token}
                  className="w-full mt-2 py-3 px-4 rounded-xl terracotta-gradient text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Nueva Contraseña</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
