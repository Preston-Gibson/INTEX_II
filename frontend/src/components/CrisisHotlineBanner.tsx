export default function CrisisHotlineBanner() {
  return (
    <div className="fixed top-0 w-full z-[60] h-9 bg-secondary flex items-center justify-center px-4">
      <p className="text-white text-sm font-semibold tracking-wide text-center">
        <span className="opacity-80 font-normal mr-2">If you need immediate help, please call the National Sexual Assault Hotline:</span>
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
