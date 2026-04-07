import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PagePlaceholderProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  children?: ReactNode;
}

export function PagePlaceholder({ icon: Icon, titleKey, descriptionKey, children }: PagePlaceholderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-indigo-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">
        {t(titleKey)}
      </h1>
      <p className="text-slate-400 max-w-md mb-8">
        {t(descriptionKey)}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-slate-400 text-sm">
        {t('common.comingSoon')}
      </div>
      {children}
    </div>
  );
}
