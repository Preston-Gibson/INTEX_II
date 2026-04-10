import { useLanguage } from '../context/LanguageContext';

export default function CrisisHotlineBanner() {
  const { t } = useLanguage();

  return (
    <div className="fixed top-0 w-full z-[1002] h-9 bg-secondary flex items-center justify-center px-4">
      <p className="text-white text-sm font-semibold tracking-wide text-center">
        <span className="opacity-80 font-normal mr-2">{t('crisis.message')}</span>
        <a
          href="tel:1-800-656-4673"
          className="underline underline-offset-2 hover:opacity-80 transition font-bold text-white"
        >
          1-800-656-4673
        </a>
      </p>
    </div>
  );
}
