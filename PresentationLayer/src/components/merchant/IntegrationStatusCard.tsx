import React from 'react';
import { Layers, Server, Code2, Globe2, ShoppingBag, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  status: 'active_internal' | 'prototype' | 'in_development' | 'planned';
  statusBadge: string;
  statusColor: 'emerald' | 'indigo' | 'amber' | 'zinc';
  description: string;
  endpointOrMethod?: string;
}

export const IntegrationStatusCard: React.FC = () => {
  const integrations: IntegrationItem[] = [
    {
      id: 'internal-engine',
      name: 'Internal Sizing & Inference Service',
      category: 'Core Service',
      status: 'active_internal',
      statusBadge: 'Active (Internal Flask Service)',
      statusColor: 'emerald',
      description: 'Internal backend service executing body-to-garment ease calculations and ML size prediction.',
      endpointOrMethod: 'POST /predict_size (Internal prototype endpoint, session-based)',
    },
    {
      id: 'storefront-widget',
      name: 'Embeddable Storefront Widget',
      category: 'Shopper UI',
      status: 'prototype',
      statusBadge: 'Prototype Embed Available',
      statusColor: 'indigo',
      description: 'Interactive PDP drawer previewing size recommendations, 2D mannequin, and ease metrics.',
      endpointOrMethod: 'Embedded component demonstrated on B2B homepage and /recommendation',
    },
    {
      id: 'merchant-api',
      name: 'Public Merchant REST API',
      category: 'Platform API',
      status: 'in_development',
      statusBadge: 'In Development',
      statusColor: 'amber',
      description: 'Token-authenticated merchant API for automated catalog synchronization and webhook size requests.',
      endpointOrMethod: 'Scoped API key authentication, rate limiting, and multi-tenant schema required',
    },
    {
      id: 'shopify',
      name: 'Shopify App Extension',
      category: 'E-commerce Connector',
      status: 'planned',
      statusBadge: 'Planned Roadmap',
      statusColor: 'zinc',
      description: 'One-click Shopify Theme App Extension injecting the FitVision sizing modal directly into product templates.',
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce Plugin',
      category: 'E-commerce Connector',
      status: 'planned',
      statusBadge: 'Planned Roadmap',
      statusColor: 'zinc',
      description: 'Standard WordPress/WooCommerce plugin connecting product variations to FitVision size grading charts.',
    },
    {
      id: 'magento',
      name: 'Magento 2 (Adobe Commerce)',
      category: 'E-commerce Connector',
      status: 'planned',
      statusBadge: 'Planned Roadmap',
      statusColor: 'zinc',
      description: 'Enterprise Magento 2 extension for high-volume apparel catalogs and complex multi-store grading.',
    },
  ];

  const renderBadge = (color: IntegrationItem['statusColor'], label: string) => {
    switch (color) {
      case 'emerald':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-mono font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {label}
          </Badge>
        );
      case 'indigo':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-mono font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {label}
          </Badge>
        );
      case 'amber':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-mono font-medium">
            <Clock className="w-3 h-3 mr-1" />
            {label}
          </Badge>
        );
      case 'zinc':
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-500 border-zinc-200 text-[11px] font-mono font-medium">
            <Clock className="w-3 h-3 mr-1" />
            {label}
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E9EAF3] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#E9EAF3] gap-2">
        <div>
          <h3 className="text-base font-bold text-[#0F1117] flex items-center gap-2">
            Integration & API Status
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              Technical Verification
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real implementation status of storefront connectors and platform endpoints.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-[#E9EAF3] bg-[#F8F9FC]/50 hover:bg-[#F8F9FC] transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {item.category}
                </span>
                {renderBadge(item.statusColor, item.statusBadge)}
              </div>

              <h4 className="text-sm font-bold text-[#0F1117] mb-1.5">
                {item.name}
              </h4>

              <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                {item.description}
              </p>
            </div>

            {item.endpointOrMethod && (
              <div className="pt-2 border-t border-[#E9EAF3]/80">
                <p className="text-[10px] font-mono text-zinc-400 truncate" title={item.endpointOrMethod}>
                  {item.endpointOrMethod}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Engineering Note:</strong> The current Flask prediction endpoint (<code className="font-mono text-[11px] bg-amber-100/70 px-1 py-0.5 rounded">/predict_size</code>) serves the integrated frontend demo. It is not an externally accessible, multi-tenant merchant API with token authorization. Production connectors will require dedicated organization API keys.
        </p>
      </div>
    </div>
  );
};

export default IntegrationStatusCard;

