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

import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import { getFooterHTML, getLogo, getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';

const FooterBar = () => {
  const { t } = useTranslation();
  const [footer, setFooter] = useState(getFooterHTML());
  const systemName = getSystemName();
  const logo = getLogo();
  const [statusState] = useContext(StatusContext);
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;

  const loadFooter = () => {
    let footer_html = localStorage.getItem('footer_html');
    if (footer_html) {
      setFooter(footer_html);
    }
  };

  const currentYear = new Date().getFullYear();

  const customFooter = useMemo(
    () => (
      <footer className='relative py-6 px-6 md:px-24 w-full flex flex-col items-center'>
        {isDemoSiteMode && (
          <div className='flex flex-col md:flex-row justify-between w-full max-w-[1110px] mb-6 gap-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 w-full'>
              <div className='text-left'>
                <p className='!text-semi-color-text-0 font-semibold mb-3 text-sm'>
                  {t('关于我们')}
                </p>
                <div className='flex flex-col gap-2'>
                  <a href='https://docs.newapi.pro/wiki/project-introduction/' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>关于项目</a>
                  <a href='https://docs.newapi.pro/support/community-interaction/' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>联系我们</a>
                  <a href='https://docs.newapi.pro/wiki/features-introduction/' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>功能特性</a>
                </div>
              </div>
              <div className='text-left'>
                <p className='!text-semi-color-text-0 font-semibold mb-3 text-sm'>{t('文档')}</p>
                <div className='flex flex-col gap-2'>
                  <a href='https://docs.newapi.pro/getting-started/' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>快速开始</a>
                  <a href='https://docs.newapi.pro/installation/' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>安装指南</a>
                  <a href='https://docs.newapi.pro/api/' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>API 文档</a>
                </div>
              </div>
              <div className='text-left'>
                <p className='!text-semi-color-text-0 font-semibold mb-3 text-sm'>{t('相关项目')}</p>
                <div className='flex flex-col gap-2'>
                  <a href='https://github.com/songquanpeng/one-api' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>One API</a>
                  <a href='https://github.com/novicezk/midjourney-proxy' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>Midjourney-Proxy</a>
                  <a href='https://github.com/Calcium-Ion/new-api-key-tool' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>new-api-key-tool</a>
                </div>
              </div>
              <div className='text-left'>
                <p className='!text-semi-color-text-0 font-semibold mb-3 text-sm'>{t('友情链接')}</p>
                <div className='flex flex-col gap-2'>
                  <a href='https://github.com/Calcium-Ion/new-api-horizon' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>new-api-horizon</a>
                  <a href='https://github.com/coaidev/coai' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>CoAI</a>
                  <a href='https://www.gpt-load.com/' target='_blank' rel='noopener noreferrer' className='!text-semi-color-text-1 text-sm'>GPT-Load</a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='flex flex-col md:flex-row items-center justify-between w-full max-w-[1110px] gap-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Typography.Text className='text-sm !text-[var(--kye-text-dim)]'>
              © {currentYear} {systemName}. {t('版权所有')}
            </Typography.Text>
          </div>
          <div className='text-sm'>
            <span className='!text-[var(--kye-text-dim)]'>
              {t('设计与开发由')}{' '}
            </span>
            <a href='https://github.com/QuantumNous/new-api' target='_blank' rel='noopener noreferrer' className='kye-gradient-text font-medium'>New API</a>
          </div>
        </div>
      </footer>
    ),
    [logo, systemName, t, currentYear, isDemoSiteMode],
  );

  useEffect(() => {
    loadFooter();
  }, []);

  return (
    <div className='w-full'>
      {footer ? (
        <footer className='relative py-4 px-6 md:px-24 w-full flex items-center justify-center'>
          <div className='flex flex-col md:flex-row items-center justify-between w-full max-w-[1110px] gap-4'>
            <div
              className='custom-footer na-cb6feafeb3990c78 text-sm !text-[var(--kye-text-dim)]'
              dangerouslySetInnerHTML={{ __html: footer }}
            ></div>
            <div className='text-sm flex-shrink-0'>
              <span className='!text-[var(--kye-text-dim)]'>
                {t('设计与开发由')}{' '}
              </span>
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='kye-gradient-text font-medium'
              >
                New API
              </a>
            </div>
          </div>
        </footer>
      ) : (
        customFooter
      )}
    </div>
  );
};

export default FooterBar;
