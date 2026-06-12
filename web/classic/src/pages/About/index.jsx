import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Zap, Globe, Headphones, Gauge, Smile } from 'lucide-react';

const features = [
  {
    icon: <Zap size={22} />,
    title: '高速稳定',
    desc: '智能路由与负载均衡，毫秒级响应，保障业务连续不中断。',
  },
  {
    icon: <Shield size={22} />,
    title: '安全可靠',
    desc: '数据加密传输，多级鉴权体系，您的 API Key 安全无忧。',
  },
  {
    icon: <Globe size={22} />,
    title: '多模型聚合',
    desc: '30+ 顶尖模型统一接入，一次集成即可调用全部能力。',
  },
  {
    icon: <Headphones size={22} />,
    title: '专属服务',
    desc: '一对一技术支持，快速响应您的需求与疑问，服务贴心周到。',
  },
  {
    icon: <Gauge size={22} />,
    title: '高可用保障',
    desc: '多节点冗余部署，自动故障切换，服务可用性 99.9% 以上。',
  },
  {
    icon: <Smile size={22} />,
    title: '极致体验',
    desc: '简洁易用的管理面板，清晰的调用统计，让您对用量了如指掌。',
  },
];

const stats = [
  { label: '支持模型', value: '30+' },
  { label: '开源协议', value: 'AGPL v3' },
  { label: '技术栈', value: 'Go + React' },
  { label: '始于', value: '2024' },
];

const About = () => {
  const { i18n } = useTranslation();
  const isChinese = i18n.language.startsWith('zh');
  const currentYear = new Date().getFullYear();

  return (
    <div className='classic-page-fill' style={{ background: 'var(--kye-bg)', minHeight: '100vh' }}>
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <div className='mx-auto px-4 pt-[80px] flex-1' style={{ maxWidth: 720, width: '100%' }}>
        <div className='absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none'
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          }}
        />

        <div className='relative z-10 text-center mb-12'>
          <div className='mb-4'>
            {isChinese ? (
              <span className='text-3xl font-bold' style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                灵界
              </span>
            ) : (
              <span className='text-3xl font-bold tracking-tight' style={{ color: 'var(--kye-text)' }}>
                KyeAI
              </span>
            )}
          </div>
          <p className='text-sm mx-auto leading-relaxed' style={{ color: 'var(--kye-text-dim)', maxWidth: 480 }}>
            {isChinese
              ? '高品质私人 AI 调度中心 —— 一个极简的个人大模型中转服务。为开发者提供统一、稳定的多模型调用入口，无需为每个模型单独配置。'
              : 'High-quality private AI hub — a minimalist LLM relay service. One unified entry for top models, no per-model setup needed.'}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-10'>
          {features.map((f, i) => (
            <div key={i} className='kye-card' style={{ padding: '20px 22px' }}>
              <div className='flex items-start gap-3'>
                <div className='flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center'
                  style={{ background: 'var(--kye-surface)', color: 'var(--kye-text-dim)' }}>
                  {f.icon}
                </div>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold mb-0.5' style={{ color: 'var(--kye-text)' }}>{f.title}</div>
                  <p className='text-xs' style={{ color: 'var(--kye-text-dim)' }}>{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='kye-card mb-10' style={{ padding: '20px 24px' }}>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
            {stats.map((s, i) => (
              <div key={i}>
                <div className='text-lg font-semibold' style={{ color: 'var(--kye-text)' }}>{s.value}</div>
                <div className='text-xs mt-0.5' style={{ color: 'var(--kye-text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className='text-center text-xs py-4' style={{ color: 'var(--kye-text-muted)', flexShrink: 0 }}>
        <p>{isChinese ? '灵界' : 'KyeAI'} © {currentYear}</p>
      </div>
    </div>
  </div>
  );
};

export default About;
