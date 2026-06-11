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
import { Button } from '@douyinfe/semi-ui';
import PricingGroups from '../filter/PricingGroups';
import PricingQuotaTypes from '../filter/PricingQuotaTypes';
import PricingEndpointTypes from '../filter/PricingEndpointTypes';
import PricingVendors from '../filter/PricingVendors';
import PricingTags from '../filter/PricingTags';
import { RotateCcw } from 'lucide-react';

import { resetPricingFilters } from '../../../../helpers/utils';
import { usePricingFilterCounts } from '../../../../hooks/model-pricing/usePricingFilterCounts';

const PricingSidebar = ({
  showWithRecharge,
  setShowWithRecharge,
  currency,
  setCurrency,
  handleChange,
  setActiveKey,
  showRatio,
  setShowRatio,
  viewMode,
  setViewMode,
  filterGroup,
  setFilterGroup,
  handleGroupClick,
  filterQuotaType,
  setFilterQuotaType,
  filterEndpointType,
  setFilterEndpointType,
  filterVendor,
  setFilterVendor,
  filterTag,
  setFilterTag,
  currentPage,
  setCurrentPage,
  tokenUnit,
  setTokenUnit,
  loading,
  t,
  ...categoryProps
}) => {
  const {
    quotaTypeModels,
    endpointTypeModels,
    vendorModels,
    tagModels,
    groupCountModels,
  } = usePricingFilterCounts({
    models: categoryProps.models,
    filterGroup,
    filterQuotaType,
    filterEndpointType,
    filterVendor,
    filterTag,
    searchValue: categoryProps.searchValue,
  });

  const handleResetFilters = () =>
    resetPricingFilters({
      handleChange,
      setShowWithRecharge,
      setCurrency,
      setShowRatio,
      setViewMode,
      setFilterGroup,
      setFilterQuotaType,
      setFilterEndpointType,
      setFilterVendor,
      setFilterTag,
      setCurrentPage,
      setTokenUnit,
    });

  return (
    <div className='p-3 h-full'>
      <div className='kye-model-card h-full p-4' style={{ borderRadius: 16 }}>
        <div className='flex items-center justify-between mb-1 relative z-10'>
          <div className='text-sm font-semibold' style={{ color: 'rgba(255,255,255,0.8)' }}>{t('筛选')}</div>
          <button
            onClick={handleResetFilters}
            className='flex items-center gap-1 text-xs transition-colors'
            style={{ color: '#666' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
          >
            <RotateCcw size={11} />
            {t('重置')}
          </button>
        </div>

        <div className='overflow-y-auto relative z-10' style={{ maxHeight: 'calc(100vh - 160px)' }}>
          <PricingVendors
            filterVendor={filterVendor}
            setFilterVendor={setFilterVendor}
            models={vendorModels}
            allModels={categoryProps.models}
            loading={loading}
            t={t}
          />

          <PricingGroups
            filterGroup={filterGroup}
            setFilterGroup={handleGroupClick}
            usableGroup={categoryProps.usableGroup}
            groupRatio={categoryProps.groupRatio}
            models={groupCountModels}
            loading={loading}
            t={t}
          />

          <PricingQuotaTypes
            filterQuotaType={filterQuotaType}
            setFilterQuotaType={setFilterQuotaType}
            models={quotaTypeModels}
            loading={loading}
            t={t}
          />

          <PricingTags
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            models={tagModels}
            allModels={categoryProps.models}
            loading={loading}
            t={t}
          />

          <PricingEndpointTypes
            filterEndpointType={filterEndpointType}
            setFilterEndpointType={setFilterEndpointType}
            models={endpointTypeModels}
            allModels={categoryProps.models}
            loading={loading}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

export default PricingSidebar;
