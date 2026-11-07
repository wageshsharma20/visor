import React from 'react';
import { Drawer } from '@/components/ui';
import { IntelContent } from './IntelContent';
import { useUiStore } from '@/stores/uiStore';

export const IntelPanel: React.FC = () => {
  const { isDrawerOpen, setIsDrawerOpen } = useUiStore();

  return (
    <>
      {/* Desktop view (≥ 1024px): right-column fixed width */}
      <aside className="hidden lg:flex flex-col w-intel-sm xl:w-intel shrink-0 h-full overflow-y-auto no-scrollbar">
        <IntelContent />
      </aside>

      {/* Drawer view (< 1024px): slide-in drawer from right */}
      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Intelligence Panel"
        side="right"
        width="w-[360px]"
      >
        <div className="p-3">
          <IntelContent />
        </div>
      </Drawer>
    </>
  );
};
