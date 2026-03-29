import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { SEGMENTS, ACCENT_COLORS, ROLES } from '@/lib/constants';
import { toast } from 'sonner';
import {
  Building2, MapPin, Phone, FileText, Upload, ChevronRight,
  ChevronLeft, Users, Mail, X, Check, Palette, Sun, Moon, Loader2
} from 'lucide-react';
import type { Segment, UserRole } from '@/types/database';
import './OnboardingPage.css';

interface CompanyData {
  company_name: string;
  cnpj: string;
  phone: string;
  cep: string;
  address_street: string;
  address_number: string;
  address_city: string;
  address_state: string;
  logo_file: File | null;
  logo_preview: string;
}

interface TeamInvite {
  email: string;
  role: UserRole;
}

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  // Step 1 — Company
  const [company, setCompany] = useState<CompanyData>({
    company_name: '', cnpj: '', phone: '', cep: '',
    address_street: '', address_number: '', address_city: '',
    address_state: '', logo_file: null, logo_preview: '',
  });

  // Step 2 — Segments
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);

  // Step 3 — Team
  const [teamSize, setTeamSize] = useState(1);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('operacional');

  // Step 4 — Personalization
  const [accentColor, setAccentColor] = useState('#6C63FF');
  const [customColor, setCustomColor] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [displayName, setDisplayName] = useState('');

  // CEP auto-fill
  async function handleCepBlur() {
    const cep = company.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setCompany(prev => ({
          ...prev,
          address_street: data.logradouro || '',
          address_city: data.localidade || '',
          address_state: data.uf || '',
        }));
      }
    } catch { /* ignore */ }
  }

  // Segment toggle
  function toggleSegment(id: Segment) {
    if (id === 'multissegmento') {
      setSelectedSegments(['multissegmento']);
      return;
    }
    setSelectedSegments(prev => {
      const filtered = prev.filter(s => s !== 'multissegmento');
      return filtered.includes(id) ? filtered.filter(s => s !== id) : [...filtered, id];
    });
  }

  // Add team invite
  function addInvite() {
    if (!inviteEmail || !inviteEmail.includes('@')) return;
    if (invites.find(i => i.email === inviteEmail)) return;
    setInvites(prev => [...prev, { email: inviteEmail, role: inviteRole }]);
    setInviteEmail('');
  }

  function removeInvite(email: string) {
    setInvites(prev => prev.filter(i => i.email !== email));
  }

  // Logo upload
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompany(prev => ({
      ...prev,
      logo_file: file,
      logo_preview: URL.createObjectURL(file),
    }));
  }

  // Submit all
  async function handleComplete() {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Create a timeout promise to prevent infinite hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tempo limite excedido. O servidor demorou muito para responder.')), 15000)
      );

      // Wrap the actual operations in an async IIFE to race against the timeout
      await Promise.race([
        (async () => {
          // Upload logo if present
          let logo_url = null;
          if (company.logo_file) {
            const ext = company.logo_file.name.split('.').pop();
            const path = `${user.id}/logo.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from('logos')
              .upload(path, company.logo_file, { upsert: true });
            
            if (uploadErr) {
              console.error('Logo upload error:', uploadErr);
            } else {
              const { data } = supabase.storage.from('logos').getPublicUrl(path);
              logo_url = data.publicUrl;
            }
          }

          // Update profile
          await updateProfile({
            company_name: company.company_name,
            cnpj: company.cnpj,
            phone: company.phone,
            address: {
              cep: company.cep,
              street: company.address_street,
              number: company.address_number,
              city: company.address_city,
              state: company.address_state,
            },
            logo_url,
            segments: selectedSegments,
            accent_color: accentColor,
            theme,
            display_name: displayName || `${company.company_name} — Gestão`,
            onboarding_completed: true,
          });

          // Insert team invites
          if (invites.length > 0) {
            const teamRows = invites.map(inv => ({
              profile_id: user.id,
              invited_email: inv.email,
              role: inv.role,
              status: 'invited',
            }));
            const { error: inviteErr } = await supabase.from('team_members').insert(teamRows);
            if (inviteErr) throw new Error(`Erro ao convidar equipe: ${inviteErr.message}`);
          }
        })(),
        timeout
      ]);

      toast.success('Configuração concluída! Bem-vindo ao Fluxio!');
      navigate('/');
    } catch (err: any) {
      console.error('Onboarding falhou:', err);
      toast.error(err.message || 'Erro ao salvar configuração');
    } finally {
      setIsSubmitting(false);
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return company.company_name.length >= 2;
      case 2: return selectedSegments.length > 0;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }

  return (
    <div className="onboarding-page">
      {/* Progress bar */}
      <div className="onboarding-header">
        <div className="onboarding-logo">
          <div className="onboarding-logo-icon">F</div>
          <span>Fluxio</span>
        </div>
        <div className="onboarding-progress">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`onboarding-step-dot ${s <= step ? 'active' : ''} ${s === step ? 'current' : ''}`}>
              {s < step ? <Check size={14} /> : s}
            </div>
          ))}
          <div className="onboarding-progress-bar">
            <div className="onboarding-progress-fill" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="onboarding-body">
        <AnimatePresence mode="wait">
          {/* STEP 1 — Company */}
          {step === 1 && (
            <motion.div key="step1" className="onboarding-card"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <h2>🏢 Informações da Empresa</h2>
              <p className="onboarding-desc">Conte-nos sobre seu negócio</p>

              <div className="onboarding-form-grid">
                <div className="onboarding-field full">
                  <label><Building2 size={16} /> Nome da empresa/loja</label>
                  <input type="text" placeholder="Ex: Doce Sabor Confeitaria"
                    value={company.company_name}
                    onChange={e => setCompany(p => ({ ...p, company_name: e.target.value }))}
                  />
                </div>

                <div className="onboarding-field">
                  <label><FileText size={16} /> CNPJ ou CPF</label>
                  <input type="text" placeholder="00.000.000/0000-00"
                    value={company.cnpj}
                    onChange={e => setCompany(p => ({ ...p, cnpj: e.target.value }))}
                  />
                </div>

                <div className="onboarding-field">
                  <label><Phone size={16} /> Telefone</label>
                  <input type="text" placeholder="(00) 00000-0000"
                    value={company.phone}
                    onChange={e => setCompany(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="onboarding-field">
                  <label><MapPin size={16} /> CEP</label>
                  <input type="text" placeholder="00000-000"
                    value={company.cep}
                    onChange={e => setCompany(p => ({ ...p, cep: e.target.value }))}
                    onBlur={handleCepBlur}
                  />
                </div>

                <div className="onboarding-field">
                  <label>Rua</label>
                  <input type="text" placeholder="Rua..."
                    value={company.address_street}
                    onChange={e => setCompany(p => ({ ...p, address_street: e.target.value }))}
                  />
                </div>

                <div className="onboarding-field half">
                  <label>Número</label>
                  <input type="text" placeholder="Nº"
                    value={company.address_number}
                    onChange={e => setCompany(p => ({ ...p, address_number: e.target.value }))}
                  />
                </div>

                <div className="onboarding-field">
                  <label>Cidade</label>
                  <input type="text"
                    value={company.address_city}
                    onChange={e => setCompany(p => ({ ...p, address_city: e.target.value }))}
                  />
                </div>

                <div className="onboarding-field half">
                  <label>UF</label>
                  <input type="text" maxLength={2}
                    value={company.address_state}
                    onChange={e => setCompany(p => ({ ...p, address_state: e.target.value }))}
                  />
                </div>

                <div className="onboarding-field full">
                  <label><Upload size={16} /> Logo da empresa</label>
                  <div className="onboarding-logo-upload">
                    {company.logo_preview ? (
                      <img src={company.logo_preview} alt="Logo" className="onboarding-logo-preview" />
                    ) : (
                      <div className="onboarding-logo-placeholder">
                        <Upload size={24} />
                        <span>Clique para enviar</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Segments */}
          {step === 2 && (
            <motion.div key="step2" className="onboarding-card"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <h2>🎯 Segmento de Atuação</h2>
              <p className="onboarding-desc">Escolha os segmentos do seu negócio. Isso define os módulos disponíveis.</p>

              <div className="onboarding-segments-grid">
                {SEGMENTS.map(seg => (
                  <button
                    key={seg.id}
                    className={`onboarding-segment-card ${selectedSegments.includes(seg.id) ? 'selected' : ''} ${seg.id === 'multissegmento' ? 'multi' : ''}`}
                    onClick={() => toggleSegment(seg.id)}
                    style={{ '--seg-color': seg.color } as React.CSSProperties}
                  >
                    <div className="seg-icon-wrapper">
                      <seg.icon size={28} />
                    </div>
                    <span className="seg-emoji">{seg.emoji}</span>
                    <h3>{seg.label}</h3>
                    <p>{seg.description}</p>
                    {selectedSegments.includes(seg.id) && (
                      <div className="seg-check"><Check size={16} /></div>
                    )}
                    {seg.id === 'multissegmento' && selectedSegments.includes('multissegmento') && (
                      <span className="seg-badge">Full Access</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Team */}
          {step === 3 && (
            <motion.div key="step3" className="onboarding-card"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <h2>👥 Configuração da Equipe</h2>
              <p className="onboarding-desc">Quantas pessoas trabalham na empresa?</p>

              <div className="onboarding-team-slider">
                <input type="range" min={1} max={100} value={teamSize}
                  onChange={e => setTeamSize(Number(e.target.value))}
                />
                <div className="onboarding-team-count">{teamSize} {teamSize === 1 ? 'colaborador' : 'colaboradores'}</div>
              </div>

              <div className="onboarding-invite-section">
                <h3><Mail size={18} /> Convidar membros por e-mail</h3>
                <div className="onboarding-invite-form">
                  <input type="email" placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInvite())}
                  />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}>
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button className="onboarding-invite-add" onClick={addInvite}>Adicionar</button>
                </div>

                {invites.length > 0 && (
                  <div className="onboarding-invite-list">
                    {invites.map(inv => (
                      <div key={inv.email} className="onboarding-invite-tag">
                        <span>{inv.email}</span>
                        <span className="invite-role">{ROLES.find(r => r.value === inv.role)?.label}</span>
                        <button onClick={() => removeInvite(inv.email)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Personalization */}
          {step === 4 && (
            <motion.div key="step4" className="onboarding-card"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <h2>🎨 Personalização</h2>
              <p className="onboarding-desc">Deixe o Fluxio com a cara do seu negócio</p>

              <div className="onboarding-personalize">
                <div className="onboarding-colors-section">
                  <label><Palette size={16} /> Cor de destaque</label>
                  <div className="onboarding-color-grid">
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.hex}
                        className={`onboarding-color-btn ${accentColor === c.hex ? 'selected' : ''}`}
                        style={{ background: c.hex }}
                        onClick={() => setAccentColor(c.hex)}
                        title={c.name}
                      >
                        {accentColor === c.hex && <Check size={14} color="#fff" />}
                      </button>
                    ))}
                    <div className="onboarding-color-custom">
                      <input
                        type="color"
                        value={customColor || '#6C63FF'}
                        onChange={e => { setCustomColor(e.target.value); setAccentColor(e.target.value); }}
                      />
                      <span>Custom</span>
                    </div>
                  </div>
                </div>

                <div className="onboarding-theme-section">
                  <label>Tema inicial</label>
                  <div className="onboarding-theme-toggle">
                    <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                      <Moon size={18} /> Escuro
                    </button>
                    <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                      <Sun size={18} /> Claro
                    </button>
                  </div>
                </div>

                <div className="onboarding-field full">
                  <label>Nome de exibição da plataforma</label>
                  <input type="text" placeholder={`${company.company_name || 'Minha Loja'} — Gestão`}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="onboarding-footer">
        {step > 1 && (
          <button className="onboarding-back-btn" onClick={() => setStep(s => s - 1)}>
            <ChevronLeft size={18} /> Voltar
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 ? (
          <button
            className="onboarding-next-btn"
            disabled={!canProceed()}
            onClick={() => setStep(s => s + 1)}
          >
            Próximo <ChevronRight size={18} />
          </button>
        ) : (
          <button
            className="onboarding-next-btn complete"
            disabled={isSubmitting}
            onClick={handleComplete}
          >
            {isSubmitting ? <Loader2 size={20} className="spin" /> : <>Concluir e Entrar no Dashboard <ChevronRight size={18} /></>}
          </button>
        )}
      </div>
    </div>
  );
}
