import { motion } from 'framer-motion';
import { Zap, Lock, Check, ArrowRight, Crown, Sparkles } from 'lucide-react';
import './PaywallPage.css';

interface PaywallPageProps {
  blockedResources: string[];
  currentPlan: string;
}

const RESOURCE_LABELS: Record<string, string> = {
  leads: 'Leads',
  proposals: 'Propostas',
  contacts: 'Clientes',
  products: 'Produtos',
  tasks: 'Tarefas',
  team_members: 'Membros da Equipe',
  wiki_docs: 'Documentos Wiki',
};

const PRO_FEATURES = [
  '500 Leads',
  '200 Propostas',
  '2.000 Clientes',
  '500 Produtos',
  '1.000 Tarefas',
  '20 Membros na equipe',
  '100 Documentos Wiki',
  'Relatórios avançados',
  'Suporte prioritário',
];

const ENTERPRISE_FEATURES = [
  'Recursos ilimitados',
  'API personalizada',
  'Suporte dedicado 24/7',
  'Consultoria especializada',
  'Treinamento para equipe',
  'SLA garantido',
];

export function PaywallPage({ blockedResources, currentPlan }: PaywallPageProps) {
  const blockedLabels = blockedResources.map(r => RESOURCE_LABELS[r] || r);

  return (
    <div className="paywall-overlay">
      <motion.div
        className="paywall-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="paywall-header">
          <motion.div
            className="paywall-lock-icon"
            initial={{ rotate: -10 }}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Lock size={32} />
          </motion.div>
          <h1 className="paywall-title">Limite do Plano Atingido</h1>
          <p className="paywall-subtitle">
            Você atingiu o limite de <strong>{blockedLabels.join(', ')}</strong> no Plano {currentPlan}.
            Faça o upgrade para continuar usando o Fluxio sem restrições.
          </p>
        </div>

        {/* Plans */}
        <div className="paywall-plans">
          {/* Pro Plan */}
          <motion.div
            className="paywall-plan pro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="paywall-plan-badge">
              <Sparkles size={14} />
              Mais Popular
            </div>
            <div className="paywall-plan-header">
              <Zap size={24} />
              <h2>Plano Pro</h2>
            </div>
            <div className="paywall-plan-price">
              <span className="price-value">R$97</span>
              <span className="price-period">/mês</span>
            </div>
            <ul className="paywall-features">
              {PRO_FEATURES.map((f, i) => (
                <li key={i}>
                  <Check size={16} className="feature-check" />
                  {f}
                </li>
              ))}
            </ul>
            <button className="paywall-btn pro-btn" onClick={() => window.open('https://wa.me/5511999999999?text=Quero%20assinar%20o%20Plano%20Pro%20do%20Fluxio', '_blank')}>
              Assinar Pro <ArrowRight size={16} />
            </button>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            className="paywall-plan enterprise"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="paywall-plan-header">
              <Crown size={24} />
              <h2>Enterprise</h2>
            </div>
            <div className="paywall-plan-price">
              <span className="price-value">Sob consulta</span>
            </div>
            <ul className="paywall-features">
              {ENTERPRISE_FEATURES.map((f, i) => (
                <li key={i}>
                  <Check size={16} className="feature-check" />
                  {f}
                </li>
              ))}
            </ul>
            <button className="paywall-btn enterprise-btn" onClick={() => window.open('https://wa.me/5511999999999?text=Quero%20saber%20mais%20sobre%20o%20Enterprise%20do%20Fluxio', '_blank')}>
              Falar com Consultor <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
