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
        className='fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full border'
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderColor: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
      >
        <Sun size={16} />
      </button>
      <div className='classic-page-fill classic-home-page w-full overflow-x-hidden'>
        <NoticeModal visible={noticeVisible} onClose={() => setNoticeVisible(false)} isMobile={isMobile} />
        {homePageContentLoaded && homePageContent === '' ? (
          <div className='flex flex-col items-center justify-center min-h-[calc(100vh-64px)] w-full px-6 relative overflow-hidden'>
            <div className='absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none'
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
              }}
            />
            <div className='relative z-10 text-center max-w-lg mx-auto'>
              <h1 className='text-[28px] md:text-[36px] font-semibold leading-tight mb-4 tracking-tight'
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '0 0 40px rgba(99,102,241,0.15)',
                }}
              >
                {isChinese ? '一个接口，接驳所有 AI' : 'One API to Connect All AI'}
              </h1>
              <p className='text-sm md:text-base mb-8 leading-relaxed'
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {isChinese
                  ? '一套密钥打通 OpenAI、Claude、Gemini 等主流模型，即插即用'
                  : 'One set of keys for OpenAI, Claude, Gemini, and more. Plug and play.'}
              </p>
              <div className='flex flex-col items-center gap-4'>
                <div className='w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border'
                  style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <span className='text-sm font-mono flex-1 truncate text-center'
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {serverAddress}
                  </span>
                  <button
                    onClick={handleCopyBaseURL}
                    className='flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200'
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <IconCopy size={15} />
                  </button>
                </div>
                <Link to='/console' className='w-full'>
                  <Button
                    block
                    size='large'
                    className='kye-btn kye-btn-primary'
                    icon={<IconKey />}
                    style={{ height: 46, fontSize: 15, borderRadius: 12, letterSpacing: '0.03em' }}
                  >
                    {t('免费使用')}
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
