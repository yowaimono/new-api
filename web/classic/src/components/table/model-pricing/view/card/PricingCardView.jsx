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

import React from 'react';
import {
  Card,
  Tag,
  Tooltip,
  Checkbox,
  Empty,
  Pagination,
  Button,
  Avatar,
} from '@douyinfe/semi-ui';
import { IconHelpCircle } from '@douyinfe/semi-icons';
import { Copy } from 'lucide-react';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import {
  stringToColor,
  calculateModelPrice,
  formatPriceInfo,
  formatDynamicPriceSummary,
  getLobeHubIcon,
} from '../../../../../helpers';
import { renderLimitedItems } from '../../../../common/ui/RenderUtils';
import { useIsMobile } from '../../../../../hooks/common/useIsMobile';

const CARD_STYLES = {
  container:
    'w-9 h-9 rounded-xl flex items-center justify-center relative',
  icon: 'w-6 h-6 flex items-center justify-center',
};

const PricingCardView = ({
  filteredModels,
  loading,
  rowSelection,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  selectedGroup,
  groupRatio,
  copyText,
  setModalImageUrl,
  setIsModalOpenurl,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  t,
  selectedRowKeys = [],
  setSelectedRowKeys,
  openModelDetail,
}) => {
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedModels = filteredModels.slice(
    startIndex,
    startIndex + pageSize,
  );
  const getModelKey = (model) => model.key ?? model.model_name ?? model.id;
  const isMobile = useIsMobile();

  const handleCheckboxChange = (model, checked) => {
    if (!setSelectedRowKeys) return;
    const modelKey = getModelKey(model);
    const newKeys = checked
      ? Array.from(new Set([...selectedRowKeys, modelKey]))
      : selectedRowKeys.filter((key) => key !== modelKey);
    setSelectedRowKeys(newKeys);
    rowSelection?.onChange?.(newKeys, null);
  };

  // 获取模型图标
  const getModelIcon = (model) => {
    if (!model || !model.model_name) {
      return (
        <div className={CARD_STYLES.container}>
          <Avatar size='large'>?</Avatar>
        </div>
      );
    }
    // 1) 优先使用模型自定义图标
    if (model.icon) {
      return (
        <div className={CARD_STYLES.container}>
          <div className={CARD_STYLES.icon}>
            {getLobeHubIcon(model.icon, 32)}
          </div>
        </div>
      );
    }
    // 2) 退化为供应商图标
    if (model.vendor_icon) {
      return (
        <div className={CARD_STYLES.container}>
          <div className={CARD_STYLES.icon}>
            {getLobeHubIcon(model.vendor_icon, 32)}
          </div>
        </div>
      );
    }

    // 如果没有供应商图标，使用模型名称生成头像

    const avatarText = model.model_name.slice(0, 2).toUpperCase();
    return (
      <div className={CARD_STYLES.container}>
        <Avatar
          size='small'
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: 'rgba(99,91,255,0.15)',
            color: '#8A85FF',
          }}
        >
          {avatarText}
        </Avatar>
      </div>
    );
  };

  // 获取模型描述
  const getModelDescription = (record) => {
    return record.description || '';
  };

  // 渲染标签
  const renderTags = (record) => {
    let billingTag = (
      <span className='kye-tag'>-</span>
    );
    if (record.quota_type === 1) {
      billingTag = (
        <span className='kye-tag'>{t('按次计费')}</span>
      );
    } else if (record.quota_type === 0) {
      billingTag = (
        <span className='kye-tag'>{t('按量计费')}</span>
      );
    }

    const customTags = [];
    if (record.tags) {
      const tagArr = record.tags.split(',').filter(Boolean);
      tagArr.forEach((tg, idx) => {
        customTags.push(
          <span key={`custom-${idx}`} className='kye-tag'>{tg}</span>
        );
      });
    }

    return (
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>{billingTag}</div>
        <div className='flex items-center gap-1'>
          {customTags.length > 0 &&
            renderLimitedItems({
              items: customTags.map((tag, idx) => ({
                key: `custom-${idx}`,
                element: tag,
              })),
              renderItem: (item, idx) => item.element,
              maxDisplay: 3,
            })}
        </div>
      </div>
    );
  };

  if (!filteredModels || filteredModels.length === 0) {
    return (
      <div className='flex justify-center items-center py-20'>
        <Empty
          image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
          }
          description={t('搜索无结果')}
        />
      </div>
    );
  }

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      <div className='flex-1 overflow-auto px-2 pt-2'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
        {paginatedModels.map((model, index) => {
          const modelKey = getModelKey(model);
          const isSelected = selectedRowKeys.includes(modelKey);

          const priceData = calculateModelPrice({
            record: model,
            selectedGroup,
            groupRatio,
            tokenUnit,
            displayPrice,
            currency,
            quotaDisplayType: siteDisplayType,
          });

          return (
            <div
              key={modelKey || index}
              className={`kye-card kye-model-card ${isSelected ? 'selected' : ''}`}
              onClick={() => openModelDetail && openModelDetail(model)}
            >
              <div className='flex flex-col relative z-10 gap-1.5'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-start space-x-2.5 flex-1 min-w-0'>
                    {getModelIcon(model)}
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-sm font-semibold truncate' style={{ color: 'var(--kye-text)' }}>
                        {model.model_name}
                      </h3>
                      <div className='text-xs mt-0.5' style={{ color: 'var(--kye-text-dim)' }}>
                        {priceData.isDynamicPricing ? (
                          formatDynamicPriceSummary(priceData.billingExpr, t, priceData.usedGroupRatio)
                        ) : (
                          formatPriceInfo(priceData, t, siteDisplayType)
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center space-x-1.5 ml-2 flex-shrink-0'>
                    <Button
                      size='small'
                      type='tertiary'
                      icon={<Copy size={11} />}
                      style={{
                        background: 'var(--kye-surface)',
                        border: '1px solid var(--kye-border)',
                        color: 'var(--kye-text-dim)',
                        borderRadius: 6,
                        width: 26,
                        height: 26,
                        minWidth: 26,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(model.model_name);
                      }}
                    />

                    {rowSelection && (
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheckboxChange(model, e.target.checked);
                        }}
                      />
                    )}
                  </div>
                </div>

                {getModelDescription(model) && (
                  <div>
                    <p className='text-[11px] truncate' style={{ color: 'var(--kye-text-muted)' }}>
                      {getModelDescription(model)}
                    </p>
                  </div>
                )}

                <div>
                  {renderTags(model)}

                  {showRatio && (
                    <div className='pt-2 mt-2 border-t' style={{ borderColor: 'var(--kye-border)' }}>
                      <div className='flex items-center space-x-1 mb-2'>
                        <span className='text-xs font-medium' style={{ color: 'var(--kye-text-dim)' }}>
                          {t('倍率信息')}
                        </span>
                        <Tooltip
                          content={t('倍率是为了方便换算不同价格的模型')}
                        >
                          <IconHelpCircle
                            className='cursor-pointer'
                            size='small'
                            style={{ color: 'var(--kye-text-muted)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageUrl('/ratio.png');
                              setIsModalOpenurl(true);
                            }}
                          />
                        </Tooltip>
                      </div>
                      <div className='grid grid-cols-3 gap-2 text-xs' style={{ color: 'var(--kye-text-muted)' }}>
                        <div>
                          {t('模型')}:{' '}
                          {model.quota_type === 0 ? model.model_ratio : t('无')}
                        </div>
                        <div>
                          {t('补全')}:{' '}
                          {model.quota_type === 0
                            ? parseFloat(model.completion_ratio.toFixed(3))
                            : t('无')}
                        </div>
                        <div>
                          {t('分组')}: {priceData?.usedGroupRatio ?? '-'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* 分页 */}
      {filteredModels.length > 0 && (
        <div className='flex justify-center py-3 px-2 pricing-pagination-divider' style={{ flexShrink: 0 }}>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            total={filteredModels.length}
            showSizeChanger={true}
            pageSizeOptions={[10, 20, 50, 100]}
            size={isMobile ? 'small' : 'default'}
            showQuickJumper={isMobile}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PricingCardView;
