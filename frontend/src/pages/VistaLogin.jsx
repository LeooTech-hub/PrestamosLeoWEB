import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, KeyRound, X, ShieldCheck, BarChart3, UsersRound, BadgeCheck } from 'lucide-react';
import api from '../api';

export function VistaLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('remembered_email')));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estado para el modal de Olvidaste tu contraseña
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [forgotErrorMessage, setForgotErrorMessage] = useState('');

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
    <div className="min-h-screen lg:grid lg:grid-cols-[48%_52%] bg-white dark:bg-[#181614] font-sans transition-colors duration-300">
      <section className="hidden lg:flex relative overflow-hidden bg-[radial-gradient(circle_at_28%_10%,#d21616_0%,#8c0000_38%,#320505_100%)] text-white">
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(120deg,transparent_0%,transparent_58%,rgba(255,208,92,.18)_58.3%,transparent_58.8%)]"></div>
        <div className="absolute -right-14 top-0 h-full w-28 rounded-[50%] border-r-[5px] border-[#e1b43f] shadow-[18px_0_45px_rgba(255,190,54,.28)]"></div>
        <div className="relative z-10 flex w-full flex-col justify-center px-[10%] py-12">
          <div className="text-center">
            <img src="/Logo_LR.svg" alt="Logo PrestamosLeo" className="brand-logo-glow mx-auto h-48 w-48 object-contain" />
            <h1 className="mt-2 text-5xl font-black tracking-tight">Prestamos<span className="text-[#f2c24f]">Leo</span></h1>
            <p className="mt-2 text-base font-medium text-white/90">Sistema de <span className="text-[#f2c24f]">Gestión Integral</span> de Préstamos (S/.)</p>
          </div>
          <div className="mx-auto my-8 h-px w-4/5 bg-gradient-to-r from-transparent via-[#f2c24f] to-transparent"></div>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold leading-tight">Control total de préstamos<br/><span className="text-[#f2c24f]">en un solo lugar</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/85">Administra préstamos, cobros y clientes de manera eficiente, segura e inteligente.</p>
          </div>
          <div className="mt-9 grid grid-cols-4 gap-5 text-center">
            <div><div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8a72c] bg-black/10 text-[#f2c24f]"><ShieldCheck className="h-8 w-8"/></div><p className="font-bold text-[#f2c24f]">Seguro</p><p className="mt-1 text-xs text-white/80">Tu información protegida</p></div>
            <div><div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8a72c] bg-black/10 text-[#f2c24f]"><BarChart3 className="h-8 w-8"/></div><p className="font-bold text-[#f2c24f]">Eficiente</p><p className="mt-1 text-xs text-white/80">Procesos rápidos</p></div>
            <div><div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8a72c] bg-black/10 text-[#f2c24f]"><UsersRound className="h-8 w-8"/></div><p className="font-bold text-[#f2c24f]">Confiable</p><p className="mt-1 text-xs text-white/80">Información precisa</p></div>
            <div><div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8a72c] bg-black/10 text-[#f2c24f]"><BadgeCheck className="h-8 w-8"/></div><p className="font-bold text-[#f2c24f]">Profesional</p><p className="mt-1 text-xs text-white/80">Diseñado para tu negocio</p></div>
          </div>
          <div className="mt-10 rounded-2xl border border-[#a62b2b] bg-black/25 p-5">
            <div className="flex items-center gap-4"><ShieldCheck className="h-12 w-12 text-[#20b653]"/><div><p className="font-bold text-[#20c256]">Conexión segura</p><p className="mt-1 text-xs leading-5 text-white/85">Tus datos están protegidos con cifrado seguro.</p></div></div>
          </div>
        </div>
      </section>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fffdfb] px-5 py-10 dark:bg-[#181614]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(231,171,48,.10),transparent_23%),radial-gradient(circle_at_100%_100%,rgba(220,0,0,.06),transparent_26%)]"></div>
        <div className="w-full max-w-xl">
        {/* Header Logo Brand — visual only */}
        <div className="text-center mb-7 lg:hidden">
          <img src="/Logo_LR.svg" alt="PrestamosLeo" className="brand-logo-glow mx-auto h-28 w-28 object-contain" />
          <h1 className="text-3xl font-black text-[#171717] dark:text-[#F3F4F6] tracking-tight">
            Prestamos<span className="text-[#B40000] dark:text-[#F06A5C]">Leo</span>
          </h1>
        </div>

        {/* Login Card */}
        <div className="login-card bg-white/95 dark:bg-[#1E1E1E] border border-[#E8D7C5] dark:border-[#332F2C] rounded-[32px] p-7 sm:p-10 warm-shadow-lg relative overflow-hidden transition-colors duration-300 shadow-[0_24px_70px_rgba(91,55,25,.14)]">
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl font-black text-[#171717] dark:text-[#F3F4F6] text-center">Bienvenido de <span className="text-[#B40000] dark:text-[#F06A5C]">nuevo</span></h2>
            <p className="text-sm text-[#6E615A] dark:text-[#E5E7EB] mt-3 text-center leading-6">
              Ingresa tus credenciales para acceder al panel de administración
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#2C221E] dark:text-[#F3F4F6] uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E615A] dark:text-[#E5E7EB]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@prestamosleo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl text-sm font-medium text-[#2C221E] dark:text-[#F3F4F6] placeholder-[#9E918A] dark:placeholder-[#6E615A] focus:outline-none focus:ring-2 focus:ring-[#C89A2B]/20 focus:border-[#C89A2B] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#2C221E] dark:text-[#F3F4F6] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E615A] dark:text-[#E5E7EB]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl text-sm font-medium text-[#2C221E] dark:text-[#F3F4F6] placeholder-[#9E918A] dark:placeholder-[#6E615A] focus:outline-none focus:ring-2 focus:ring-[#C89A2B]/20 focus:border-[#C89A2B] transition-all"
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
              className="premium-action w-full mt-2 py-4 px-4 rounded-2xl bg-gradient-to-r from-[#8F0000] via-[#B40000] to-[#8D0000] text-white text-sm font-extrabold shadow-[0_12px_28px_rgba(157,0,0,.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(157,0,0,.32)] active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        
      </div>

      </section>

      {/* MODAL RECUPERACIÓN DE CONTRASEÑA */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1E1E1E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-3xl p-6 w-full max-w-md warm-shadow relative transition-colors duration-300">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6E615A] dark:text-[#E5E7EB] hover:bg-[#FAF8F5] dark:hover:bg-[#24211E] hover:text-[#2C221E] dark:hover:text-[#F3F4F6] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FDF3ED] dark:bg-[#2C221E] text-[#D96B27] dark:text-[#E07A5F] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#2C221E] dark:text-[#F3F4F6]">Recuperar Contraseña</h3>
                <p className="text-xs text-[#6E615A] dark:text-[#E5E7EB]">Recibirás un correo con las instrucciones</p>
              </div>
            </div>

            {forgotSuccessMessage ? (
              <div className="my-4 p-4 rounded-2xl bg-[#EAF5F0] dark:bg-[#1E2D27] border border-[#2D7A5D]/20 dark:border-[#2D7A5D]/40 text-[#2D7A5D] dark:text-[#3D9970] text-xs font-semibold flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-[#2D7A5D] dark:text-[#3D9970]" />
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
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{forgotErrorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#2C221E] dark:text-[#F3F4F6] uppercase tracking-wider mb-1.5">
                    Ingresa tu Correo Registrado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E615A] dark:text-[#E5E7EB]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@prestamosleo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl text-sm font-medium text-[#2C221E] dark:text-[#F3F4F6] placeholder-[#9E918A] dark:placeholder-[#6E615A] focus:outline-none focus:ring-2 focus:ring-[#C89A2B]/20 focus:border-[#C89A2B]"
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
