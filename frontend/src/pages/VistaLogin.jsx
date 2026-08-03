import React, { useState, useEffect } from 'react';
import { Wallet, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, KeyRound, X } from 'lucide-react';
import api from '../api';

export function VistaLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estado para el modal de Olvidaste tu contraseña
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [forgotErrorMessage, setForgotErrorMessage] = useState('');

  // Cargar correo recordado si existe
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      onLoginSuccess(token, user);
    } catch (err) {
      console.error('Login error:', err);
      // Requisito de Seguridad & UX: Ocultar mensajes de error específicos en login
      setErrorMessage('Correo o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotErrorMessage('');
    setForgotSuccessMessage('');
    setIsForgotLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccessMessage(res.data.message || 'Si el correo está registrado, recibirás las instrucciones de recuperación.');
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotErrorMessage(err.response?.data?.error || 'Ocurrió un error al enviar el correo de recuperación.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Header Logo Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl terracotta-gradient text-white shadow-lg ring-4 ring-[#D96B27]/15 mb-3 transform hover:scale-105 transition-transform duration-300">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C221E] tracking-tight">
            Prestamos<span className="text-[#D96B27]">Leo</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#6E615A] mt-1">
            Sistema de Gestión Integral de Préstamos (S/.)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E6DCD2] rounded-3xl p-6 sm:p-8 warm-shadow relative overflow-hidden">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2C221E]">Iniciar Sesión</h2>
            <p className="text-xs text-[#6E615A] mt-1">
              Ingresa tus credenciales para acceder al panel de administración
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E615A]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@prestamosleo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-medium text-[#2C221E] placeholder-[#9E918A] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 focus:border-[#D96B27] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5">
                Contraseña
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-medium text-[#2C221E] placeholder-[#9E918A] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 focus:border-[#D96B27] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6E615A] hover:text-[#D96B27] transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options: Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#D96B27] border-[#E6DCD2] rounded focus:ring-[#D96B27] accent-[#D96B27]"
                />
                <span className="text-xs font-semibold text-[#6E615A]">Recordarme</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSuccessMessage('');
                  setForgotErrorMessage('');
                  setIsForgotModalOpen(true);
                }}
                className="text-xs font-bold text-[#D96B27] hover:underline focus:outline-none"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl terracotta-gradient text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Hint */}
        <div className="mt-6 text-center text-xs text-[#6E615A] bg-white/70 border border-[#E6DCD2] rounded-2xl p-3.5">
          <span className="font-bold text-[#2C221E]">Cuenta Demo Inicial:</span>{' '}
          <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E6DCD2] font-mono text-[#D96B27]">admin@prestamosleo.com</code> / <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E6DCD2] font-mono text-[#2D7A5D]">admin123</code>
        </div>
      </div>

      {/* MODAL RECUPERACIÓN DE CONTRASEÑA */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E6DCD2] rounded-3xl p-6 w-full max-w-md warm-shadow relative">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6E615A] hover:bg-[#FAF8F5] hover:text-[#2C221E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FDF3ED] text-[#D96B27] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#2C221E]">Recuperar Contraseña</h3>
                <p className="text-xs text-[#6E615A]">Recibirás un correo con las instrucciones</p>
              </div>
            </div>

            {forgotSuccessMessage ? (
              <div className="my-4 p-4 rounded-2xl bg-[#EAF5F0] border border-[#2D7A5D]/20 text-[#2D7A5D] text-xs font-semibold flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-[#2D7A5D]" />
                <p className="leading-relaxed">{forgotSuccessMessage}</p>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#2D7A5D] text-white text-xs font-bold hover:brightness-110 transition-all"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotErrorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{forgotErrorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5">
                    Ingresa tu Correo Registrado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E615A]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@prestamosleo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-medium text-[#2C221E] placeholder-[#9E918A] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 focus:border-[#D96B27]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E6DCD2] text-[#6E615A] text-xs font-bold hover:bg-[#FAF8F5]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-5 py-2.5 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-sm hover:brightness-110 disabled:opacity-60 flex items-center gap-2"
                  >
                    {isForgotLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar Enlace</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
