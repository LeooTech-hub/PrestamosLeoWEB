'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, BarChart3, UsersRound, BadgeCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { AuthUser, storeAuth } from '@/lib/auth';

interface LoginScreenProps {
  onAuthenticated: (user: AuthUser) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('admin@prestamosleo.com');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('prestamosleo:remembered-email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.token || !data?.user) {
        throw new Error(data?.message || data?.error || 'No se pudo iniciar sesión');
      }

      if (remember) {
        localStorage.setItem('prestamosleo:remembered-email', email.trim());
      } else {
        localStorage.removeItem('prestamosleo:remembered-email');
      }

      storeAuth(data.token, data.user as AuthUser);
      onAuthenticated(data.user as AuthUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = window.prompt('Ingresa tu correo para recuperar la contraseña:', email);
    if (!targetEmail) return;

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      window.alert(data?.message || 'Si el correo existe, recibirás un enlace de recuperación.');
    } catch {
      window.alert('No se pudo procesar la recuperación en este momento.');
    }
  };

  const featureItems = [
    { icon: ShieldCheck, title: 'Seguro', text: 'Tu información protegida' },
    { icon: BarChart3, title: 'Eficiente', text: 'Procesos rápidos y automatizados' },
    { icon: UsersRound, title: 'Confiable', text: 'Información precisa en tiempo real' },
    { icon: BadgeCheck, title: 'Profesional', text: 'Sistema diseñado para tu negocio' },
  ];

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[48%_52%]">
      <section className="relative hidden lg:flex overflow-hidden bg-[radial-gradient(circle_at_30%_10%,#d61515_0%,#8f0000_36%,#330505_100%)] text-white">
        <div className="absolute inset-0 opacity-35 bg-[linear-gradient(120deg,transparent_0%,transparent_58%,rgba(255,204,88,.18)_58.3%,transparent_58.8%)]" />
        <div className="absolute -right-16 top-0 h-full w-32 rounded-[50%] border-r-[5px] border-[#e6b847] bg-transparent shadow-[18px_0_45px_rgba(255,190,54,.28)]" />
        <div className="absolute left-0 right-20 bottom-0 h-40 bg-[radial-gradient(circle_at_20%_100%,rgba(255,30,30,.2),transparent_60%)]" />

        <div className="relative z-10 flex w-full flex-col justify-center px-[10%] py-12">
          <div className="flex flex-col items-center text-center">
            <div className="brand-logo-glow mb-4 rounded-full p-1">
              <Image src="/Logo_PrestamosLeo.png" alt="Logo LR PrestamosLeo" width={210} height={210} className="h-48 w-48 object-contain" priority />
            </div>
            <h1 className="text-5xl font-black tracking-tight">Prestamos<span className="text-[#f2c24f]">Leo</span></h1>
            <p className="mt-2 text-base font-medium text-white/90">Sistema de <span className="text-[#f2c24f]">Gestión Integral</span> de Préstamos (S/.)</p>
          </div>

          <div className="mx-auto my-8 h-px w-4/5 bg-gradient-to-r from-transparent via-[#f2c24f] to-transparent" />

          <div className="text-center">
            <h2 className="text-3xl font-extrabold leading-tight">Control total de préstamos<br /><span className="text-[#f2c24f]">en un solo lugar</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/85">Administra préstamos, cobros y clientes de manera eficiente, segura e inteligente.</p>
          </div>

          <div className="mt-9 grid grid-cols-4 gap-5">
            {featureItems.map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8a72c] bg-black/10 text-[#f2c24f] shadow-[0_12px_30px_rgba(0,0,0,.18)]">
                  <Icon className="h-8 w-8" strokeWidth={1.7} />
                </div>
                <p className="font-bold text-[#f2c24f]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-white/80">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#ba2a2a] bg-black/25 shadow-[0_18px_40px_rgba(0,0,0,.22)]">
            <div className="flex items-center gap-4 p-5">
              <ShieldCheck className="h-12 w-12 text-[#20a34a]" />
              <div>
                <p className="font-bold text-[#20c256]">Conexión segura</p>
                <p className="mt-1 text-xs leading-5 text-white/85">Tus datos están protegidos con cifrado de nivel bancario.</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 border-l border-white/15 p-5">
              <LockKeyhole className="h-9 w-9 text-[#f2c24f]" />
              <div>
                <p className="font-bold text-[#20c256]">SSL</p>
                <p className="text-sm text-white/90">256 bits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fffdfb] px-5 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(231,171,48,.10),transparent_23%),radial-gradient(circle_at_100%_100%,rgba(220,0,0,.06),transparent_26%)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-50 bg-[radial-gradient(#d9b252_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

        <form onSubmit={handleSubmit} className="login-card relative z-10 w-full max-w-[610px] rounded-[32px] border border-[#ead9c6] bg-white/95 px-7 py-8 shadow-[0_24px_70px_rgba(91,55,25,.14)] sm:px-12 sm:py-10">
          <div className="text-center">
            <Image src="/Logo_PrestamosLeo.png" alt="PrestamosLeo" width={120} height={120} className="mx-auto h-28 w-28 object-contain" />
            <h2 className="mt-2 text-4xl font-black text-[#171717]">Bienvenido de <span className="text-[#b40000]">nuevo</span></h2>
            <div className="mx-auto my-5 flex items-center justify-center gap-3 text-[#d9a327]">
              <span className="h-px w-20 bg-gradient-to-r from-transparent to-[#d9a327]" />
              <span>◆</span>
              <span className="h-px w-20 bg-gradient-to-l from-transparent to-[#d9a327]" />
            </div>
            <p className="text-base leading-6 text-[#6a6a6a]">Ingresa tus credenciales para acceder<br className="hidden sm:block" /> al panel de administración</p>
          </div>

          <div className="mt-10 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold tracking-wide text-[#2f2f2f]">CORREO ELECTRÓNICO</span>
              <div className="group flex h-16 items-center gap-3 rounded-2xl border border-[#dedede] bg-white px-4 transition-all duration-300 focus-within:border-[#d7a62f] focus-within:shadow-[0_0_0_4px_rgba(215,166,47,.10)]">
                <Mail className="h-5 w-5 text-[#666]" />
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-full flex-1 bg-transparent text-base text-[#333] outline-none placeholder:text-[#a0a0a0]" placeholder="admin@prestamosleo.com" required />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold tracking-wide text-[#2f2f2f]">CONTRASEÑA</span>
              <div className="group flex h-16 items-center gap-3 rounded-2xl border border-[#dedede] bg-white px-4 transition-all duration-300 focus-within:border-[#d7a62f] focus-within:shadow-[0_0_0_4px_rgba(215,166,47,.10)]">
                <LockKeyhole className="h-5 w-5 text-[#666]" />
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-full flex-1 bg-transparent text-base text-[#333] outline-none placeholder:text-[#a0a0a0]" placeholder="Ingresa tu contraseña" required />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="rounded-lg p-2 text-[#666] transition-colors hover:bg-[#f7f2ec] hover:text-[#b40000]" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-[#4c4c4c]">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#087b3c]" />
              Recordarme
            </label>
            <button type="button" onClick={handleForgotPassword} className="font-semibold text-[#b40000] transition-colors hover:text-[#7c0000]">¿Olvidaste tu contraseña?</button>
          </div>

          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <button type="submit" disabled={isLoading} className="premium-action mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#8f0000] via-[#b40000] to-[#8d0000] px-6 text-lg font-extrabold text-white shadow-[0_12px_28px_rgba(157,0,0,.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(157,0,0,.32)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70">
            <LockKeyhole className="h-5 w-5" />
            <span>{isLoading ? 'Ingresando...' : 'Ingresar al Sistema'}</span>
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="my-7 flex items-center gap-4 text-sm text-[#777]">
            <span className="h-px flex-1 bg-[#e7e7e7]" />
            <span>o continúa con</span>
            <span className="h-px flex-1 bg-[#e7e7e7]" />
          </div>

          <button type="button" className="mx-auto flex items-center gap-2 rounded-xl border border-[#58a96c] px-5 py-3 font-semibold text-[#087b3c] transition-all hover:-translate-y-0.5 hover:bg-[#f3fff6] hover:shadow-md">
            <MessageCircle className="h-5 w-5" />
            Acceder con WhatsApp
          </button>

          <div className="mt-9 flex items-center justify-center gap-3 border-t border-[#eee] pt-6 text-sm text-[#666]">
            <ShieldCheck className="h-6 w-6 text-[#17843f]" />
            <div>
              <p className="font-semibold text-[#343434]">PrestamosLeo © 2026</p>
              <p>Todos los derechos reservados</p>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
};
