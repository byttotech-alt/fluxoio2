import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import './AuthPage.css';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const resetSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ResetForm = z.infer<typeof resetSchema>;

type AuthView = 'login' | 'register' | 'reset';

export function AuthPage() {
  const [view, setView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  async function handleLogin(data: LoginForm) {
    setIsSubmitting(true);
    try {
      await signInWithEmail(data.email, data.password);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(data: RegisterForm) {
    setIsSubmitting(true);
    try {
      await signUpWithEmail(data.email, data.password, data.fullName);
      toast.success('Conta criada! Bem-vindo.');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReset(data: ResetForm) {
    setIsSubmitting(true);
    try {
      await resetPassword(data.email);
      toast.success('E-mail de recuperação enviado!');
      setView('login');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar e-mail');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login com Google');
    }
  }

  return (
    <div className="auth-page">
      {/* Left Panel — Branding */}
      <div className="auth-branding">
        <div className="auth-branding-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="auth-logo">
              <div className="auth-logo-icon">F</div>
              <span className="auth-logo-text">Fluxio</span>
            </div>
            <h1 className="auth-branding-title">
              Gestão inteligente<br />para o seu negócio
            </h1>
            <p className="auth-branding-subtitle">
              Controle finanças, clientes, agenda e equipe em uma única plataforma.
              Potencializada por IA e feita para escalar.
            </p>
          </motion.div>

          {/* Animated gradient orbs */}
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="auth-form-title">Bem-vindo de volta</h2>
                <p className="auth-form-subtitle">Entre na sua conta para continuar</p>

                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="login-email">E-mail</label>
                    <div className="auth-input-wrapper">
                      <Mail size={18} />
                      <input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <span className="auth-error">{loginForm.formState.errors.email.message}</span>
                    )}
                  </div>

                  <div className="auth-field">
                    <label htmlFor="login-password">Senha</label>
                    <div className="auth-input-wrapper">
                      <Lock size={18} />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...loginForm.register('password')}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <span className="auth-error">{loginForm.formState.errors.password.message}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="auth-forgot-btn"
                    onClick={() => setView('reset')}
                  >
                    Esqueceu a senha?
                  </button>

                  <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={20} className="spin" /> : <>Entrar <ArrowRight size={18} /></>}
                  </button>
                </form>

                <div className="auth-divider">
                  <span>ou continue com</span>
                </div>

                <button className="auth-google-btn" onClick={handleGoogleLogin}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar com Google
                </button>

                <p className="auth-switch">
                  Não tem conta?{' '}
                  <button onClick={() => setView('register')}>Criar conta</button>
                </p>
              </motion.div>
            )}

            {view === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="auth-form-title">Criar conta</h2>
                <p className="auth-form-subtitle">Comece sua jornada com o Fluxio</p>

                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="reg-name">Nome completo</label>
                    <div className="auth-input-wrapper">
                      <User size={18} />
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="Seu nome"
                        {...registerForm.register('fullName')}
                      />
                    </div>
                    {registerForm.formState.errors.fullName && (
                      <span className="auth-error">{registerForm.formState.errors.fullName.message}</span>
                    )}
                  </div>

                  <div className="auth-field">
                    <label htmlFor="reg-email">E-mail</label>
                    <div className="auth-input-wrapper">
                      <Mail size={18} />
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="seu@email.com"
                        {...registerForm.register('email')}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <span className="auth-error">{registerForm.formState.errors.email.message}</span>
                    )}
                  </div>

                  <div className="auth-field">
                    <label htmlFor="reg-password">Senha</label>
                    <div className="auth-input-wrapper">
                      <Lock size={18} />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        {...registerForm.register('password')}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <span className="auth-error">{registerForm.formState.errors.password.message}</span>
                    )}
                  </div>

                  <div className="auth-field">
                    <label htmlFor="reg-confirm">Confirmar senha</label>
                    <div className="auth-input-wrapper">
                      <Lock size={18} />
                      <input
                        id="reg-confirm"
                        type="password"
                        placeholder="Repita a senha"
                        {...registerForm.register('confirmPassword')}
                      />
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <span className="auth-error">{registerForm.formState.errors.confirmPassword.message}</span>
                    )}
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={20} className="spin" /> : <>Criar conta <ArrowRight size={18} /></>}
                  </button>
                </form>

                <div className="auth-divider">
                  <span>ou continue com</span>
                </div>

                <button className="auth-google-btn" onClick={handleGoogleLogin}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar com Google
                </button>

                <p className="auth-switch">
                  Já tem conta?{' '}
                  <button onClick={() => setView('login')}>Fazer login</button>
                </p>
              </motion.div>
            )}

            {view === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="auth-form-title">Recuperar senha</h2>
                <p className="auth-form-subtitle">Enviaremos um link para redefinir sua senha</p>

                <form onSubmit={resetForm.handleSubmit(handleReset)} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="reset-email">E-mail</label>
                    <div className="auth-input-wrapper">
                      <Mail size={18} />
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="seu@email.com"
                        {...resetForm.register('email')}
                      />
                    </div>
                    {resetForm.formState.errors.email && (
                      <span className="auth-error">{resetForm.formState.errors.email.message}</span>
                    )}
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={20} className="spin" /> : <>Enviar link <ArrowRight size={18} /></>}
                  </button>
                </form>

                <p className="auth-switch">
                  <button onClick={() => setView('login')}>← Voltar ao login</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
