/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Typography,
  Input,
  ScrollList,
  ScrollItem,
} from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme, useTheme, useSetTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
  IconFile,
  IconCopy,
} from '@douyinfe/semi-icons';
import { Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
} from '@lobehub/icons';

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
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
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

      // 如果内容是 URL，则发送主题模式
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
        className='fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200'
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderColor: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
        }}
      >
        <Sun size={16} />
      </button>
      <div className='classic-page-fill classic-home-page w-full min-h-[calc(100vh-64px)] overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='classic-home-default w-full overflow-x-hidden'>
          {/* Banner 部分 */}
          <div className='kye-hero w-full border-b flex-1' style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className='relative z-10 flex items-center justify-center px-4 pt-24 pb-8 min-h-full'>
              <div className='flex flex-col items-center justify-center text-center max-w-4xl mx-auto'>
                <div className='flex flex-col items-center justify-center mb-6 md:mb-8'>
                  <h1 className={`kye-hero-title ${isChinese ? 'tracking-wide md:tracking-wider' : ''}`}>
                    <>
                      {t('统一的')}
                      <br />
                      <span className='kye-gradient-text'>{t('大模型接口网关')}</span>
                    </>
                  </h1>
                  <p className='kye-hero-sub mt-4 md:mt-6 max-w-xl'>
                    {t('多模型统一接入，只需将基址替换为：')}
                  </p>
                  <div className='kye-hero-url flex flex-col md:flex-row items-center justify-center gap-4 w-full mt-4 md:mt-6 max-w-md'>
                    <Input
                      readonly
                      value={serverAddress}
                      className='flex-1'
                      size={isMobile ? 'default' : 'large'}
                      suffix={
                        <div className='flex items-center gap-2'>
                          <ScrollList
                            bodyHeight={32}
                            style={{ border: 'unset', boxShadow: 'unset' }}
                          >
                            <ScrollItem
                              mode='wheel'
                              cycled={true}
                              list={endpointItems}
                              selectedIndex={endpointIndex}
                              onSelect={({ index }) => setEndpointIndex(index)}
                            />
                          </ScrollList>
                          <Button
                            className='kye-btn kye-btn-primary'
                            onClick={handleCopyBaseURL}
                            icon={<IconCopy />}
                            style={{ height: 36, width: 36, borderRadius: 8 }}
                          />
                        </div>
                      }
                    />
                  </div>
                </div>

                <div className='flex flex-row gap-4 justify-center items-center'>
                  <Link to='/console'>
                    <Button
                      className='kye-btn kye-btn-primary'
                      size={isMobile ? 'default' : 'large'}
                      icon={<IconPlay />}
                    >
                      {t('获取密钥')}
                    </Button>
                  </Link>
                  {isDemoSiteMode && statusState?.status?.version ? (
                    <Button
                      className='kye-btn kye-btn-outline'
                      size={isMobile ? 'default' : 'large'}
                      icon={<IconGithubLogo />}
                      onClick={() =>
                        window.open(
                          'https://github.com/QuantumNous/new-api',
                          '_blank',
                        )
                      }
                    >
                      {statusState.status.version}
                    </Button>
                  ) : (
                    docsLink && (
                      <Button
                        className='kye-btn kye-btn-outline'
                        size={isMobile ? 'default' : 'large'}
                        icon={<IconFile />}
                        onClick={() => window.open(docsLink, '_blank')}
                      >
                        {t('文档')}
                      </Button>
                    )
                  )}
                </div>

                <div className='mt-12 md:mt-16 lg:mt-20 w-full'>
                  <div className='flex items-center mb-6 md:mb-8 justify-center'>
                    <Text className='kye-hero-sub'>
                      {t('支持众多的大模型供应商')}
                    </Text>
                  </div>
                  <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto px-4'>
                    <div className='kye-provider-icon'>
                      <Moonshot size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <OpenAI size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <XAI size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Zhipu.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Volcengine.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Cohere.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Claude.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Gemini.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Suno size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Minimax.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Wenxin.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Spark.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Qingyan.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <DeepSeek.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Qwen.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Midjourney size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Grok size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <AzureAI.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Hunyuan.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Xinference.Color size={24} />
                    </div>
                    <div className='kye-provider-icon'>
                      <Typography.Text className='!text-sm font-bold' style={{ color: 'rgba(255,255,255,0.5)' }}>
                        30+
                      </Typography.Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='classic-page-fill overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-full border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default Home;
