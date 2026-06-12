import React, { useContext, useEffect, useState } from 'react';
import { Button, Typography, Input, ScrollList, ScrollItem } from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme, useTheme, useSetTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { IconCopy, IconKey } from '@douyinfe/semi-icons';
import { Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';

const { Text } = Typography;

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const theme = useTheme();
  const setTheme = useSetTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const serverAddress = statusState?.status?.server_address || `${window.location.origin}`;
  const endpointItems = API_ENDPOINTS.map((e) => ({ value: e }));
  const [endpointIndex, setEndpointIndex] = useState(0);
  const isChinese = i18n.language.startsWith('zh');

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('');
    }
    setHomePageContentLoaded(true);
  };

  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      showSuccess(t('已复制到剪切板'));
    }
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };
    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  return (
    <>
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className='kye-theme-toggle'
      >
        <Sun size={16} />
      </button>
      <div className='classic-page-fill classic-home-page w-full overflow-x-hidden'>
        <NoticeModal visible={noticeVisible} onClose={() => setNoticeVisible(false)} isMobile={isMobile} />
        {homePageContentLoaded && homePageContent === '' ? (
          <div className='flex flex-col items-center justify-center min-h-[calc(100vh-64px)] w-full px-6 relative overflow-hidden kye-hero'>
            <div className='kye-hero-glow' />
            <div className='relative z-10 text-center max-w-lg mx-auto'>
              <img src='/logo.png' alt='KyeAI' className='w-16 h-16 mx-auto mb-5 rounded-2xl object-cover' style={{ boxShadow: '0 0 30px rgba(139,92,246,0.15)' }} />
              <h1 className='kye-hero-title text-[26px] md:text-[34px] mb-3'
                style={{ textShadow: '0 0 40px rgba(139,92,246,0.12)' }}
              >
                {isChinese ? '灵界：高品质私人 AI 调度中心' : 'Lingjie: High-Quality Private AI Hub'}
              </h1>
              <p className='kye-hero-sub text-sm md:text-[15px] mb-3'>
                {isChinese
                  ? '一个极简的个人大模型中转服务。无需为每个模型单独配置，统一入口直接打通 30+ 顶尖模型。'
                  : 'A minimalist personal LLM relay service. One unified entry for 30+ top models, no per-model setup needed.'}
              </p>
              <p className='text-[13px] md:text-sm mb-8 leading-relaxed'
                style={{ color: 'var(--kye-text-muted)' }}
              >
                {isChinese
                  ? '提供稳定、无感的优质调用体验，把精力留给真正重要的事。'
                  : 'Stable, seamless experience. Focus on what matters.'}
              </p>
              <div className='flex flex-col items-center gap-4'>
                <div className='kye-hero-url-card'>
                  <span className='kye-hero-url-text'>
                    {serverAddress}
                  </span>
                  <button
                    onClick={handleCopyBaseURL}
                    className='kye-hero-copy-btn'
                  >
                    <IconCopy size={15} />
                  </button>
                </div>
                <Link to='/login' className='inline-block'>
                  <Button
                    size='large'
                    className='kye-btn kye-btn-primary'
                    icon={<IconKey />}
                    style={{ height: 44, fontSize: 14, borderRadius: 10, letterSpacing: '0.03em', paddingInline: 28 }}
                  >
                    {t('开始调用')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className='classic-page-fill overflow-x-hidden w-full'>
            {homePageContent.startsWith('https://') ? (
              <iframe src={homePageContent} className='w-full h-full border-none' />
            ) : (
              <div className='mt-[60px]' dangerouslySetInnerHTML={{ __html: homePageContent }} />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
