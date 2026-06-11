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
      setHomePageContent('加载首页内容失败...');
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
          <div className='flex flex-col items-center justify-center min-h-[calc(100vh-64px)] w-full px-6'>
            <div className='text-center'>
              <div className='mb-3'>
                <span className='text-4xl md:text-5xl font-light tracking-widest' style={{ color: 'rgba(255,255,255,0.15)' }}>
                  KyeAI
                </span>
              </div>
              <h1 className='text-2xl md:text-3xl font-light tracking-wider mb-8' style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isChinese ? '灵界中转' : 'AI Gateway'}
              </h1>
              <div className='flex flex-col items-center gap-4 max-w-xs mx-auto'>
                <div className='w-full flex items-center gap-2 px-4 py-2 rounded-lg border' style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  <span className='text-xs font-mono flex-1 truncate' style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {serverAddress}
                  </span>
                  <button onClick={handleCopyBaseURL} className='flex-shrink-0 w-6 h-6 flex items-center justify-center rounded' style={{ color: 'rgba(255,255,255,0.25)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}>
                    <IconCopy size={14} />
                  </button>
                </div>
                <Link to='/console' className='w-full'>
                  <Button
                    block
                    size='large'
                    className='kye-btn kye-btn-primary'
                    icon={<IconKey />}
                    style={{ height: 44, fontSize: 14, letterSpacing: '0.05em' }}
                  >
                    {t('进入控制台')}
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
