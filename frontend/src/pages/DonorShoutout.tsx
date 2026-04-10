import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  loadDonorShoutoutTiers,
  type DonorShoutoutTier,
  type DonorShoutoutTierId,
} from '../data/donorShoutout';
import { useLanguage } from '../context/LanguageContext';

/** All tier-specific classes live here — edit one row to change how a tier looks. */
const TIER_STYLE: Record<
  DonorShoutoutTierId,
  { section: string; card: string; name: string; nameAnonymous: string }
> = {
  cornerstone: {
    section:
      'border-tertiary-fixed-dim/35 bg-gradient-to-b from-tertiary-fixed/50 to-tertiary-fixed/20',
    card:
      'rounded-xl border border-tertiary-fixed-dim/45 bg-tertiary-fixed px-5 py-4 text-center shadow-sm transition-shadow hover:shadow-md',
    name: 'font-manrope font-semibold text-on-tertiary-fixed',
    nameAnonymous: 'font-manrope font-semibold italic text-on-tertiary-fixed-variant',
  },
  partner: {
    section:
      'border-primary-fixed-dim/40 bg-gradient-to-b from-primary-fixed/70 to-primary-fixed/25',
    card:
      'rounded-xl border border-primary-fixed-dim/50 bg-primary-fixed px-5 py-4 text-center shadow-sm transition-shadow hover:shadow-md',
    name: 'font-manrope font-semibold text-primary',
    nameAnonymous: 'font-manrope font-semibold italic text-on-primary-fixed-variant',
  },
  friend: {
    section: 'border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80',
    card:
      'rounded-xl border border-slate-200/90 bg-white px-5 py-4 text-center shadow-sm transition-shadow hover:shadow-md',
    name: 'font-manrope font-semibold text-on-surface',
    nameAnonymous: 'font-manrope font-semibold italic text-on-surface-variant',
  },
};

export default function DonorShoutout() {
  const { t } = useLanguage();
  const [tiers, setTiers] = useState<DonorShoutoutTier[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDonorShoutoutTiers()
      .then((data) => {
        if (!cancelled) setTiers(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('shoutout.error'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allEmpty = tiers?.every((t) => t.donors.length === 0) ?? false;

  return (
    <div className="text-on-surface pt-10 pb-16">
      <main className="px-6 max-w-7xl mx-auto">
        <header className="mb-14 md:mb-16 grid gap-10 md:grid-cols-2 md:gap-12 md:items-center">
          <div>
            <p className="font-manrope text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
              {t('shoutout.thanks')}
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight">
              {t('shoutout.heading')}
            </h1>
            <p className="text-base md:text-xl text-on-surface-variant leading-relaxed">
              {t('shoutout.subheading')}
            </p>
          </div>
          <figure className="m-0 w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-slate-200/80 shadow-lg aspect-[3/4] md:aspect-auto md:max-w-none md:mx-0 md:h-[min(440px,52vh)]">
            <img
              src="/images/friends-stacking-hands.jpg"
              alt="Friends stacking their hands together"
              className="h-full w-full object-cover object-[center_35%]"
              width={4625}
              height={7443}
              decoding="async"
            />
          </figure>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-10 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-900 text-sm font-manrope"
          >
            {error}
          </div>
        )}

        {loading && !error && (
          <div className="space-y-6 animate-pulse">
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8">
              <div className="h-8 bg-slate-200 rounded-lg w-48 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-full max-w-xl mb-8" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="h-14 bg-slate-200 rounded-xl" />
                <div className="h-14 bg-slate-200 rounded-xl" />
                <div className="h-14 bg-slate-200 rounded-xl" />
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 h-48" />
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 h-48" />
          </div>
        )}

        {!loading && tiers && allEmpty && !error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-16 text-center">
            <p className="text-lg text-on-surface-variant font-manrope max-w-lg mx-auto">
              {t('shoutout.empty')}
            </p>
            <Link
              to="/impact"
              className="inline-block mt-6 text-sm font-bold text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline"
            >
              {t('shoutout.see_impact')}
            </Link>
          </div>
        )}

        {!loading && tiers && !allEmpty && !error && (
          <div className="flex flex-col gap-12 md:gap-16">
            {tiers.map((tier) => (
              <section
                key={tier.id}
                id={tier.id}
                className={`scroll-mt-28 rounded-2xl border p-8 md:p-10 shadow-sm ${TIER_STYLE[tier.id].section}`}
              >
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight mb-2">
                    {t(`shoutout.tier.${tier.id}.label` as const)}
                  </h2>
                  <p className="text-on-surface-variant max-w-2xl leading-relaxed">{t(`shoutout.tier.${tier.id}.subtitle` as const)}</p>
                </div>

                {tier.donors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
                    <p className="text-on-surface-variant font-manrope">
                      {t('shoutout.no_names')}
                    </p>
                    <Link
                      to="/login"
                      className="inline-block mt-4 text-sm font-bold text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline"
                    >
                      {t('shoutout.give_portal')}
                    </Link>
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
                    {tier.donors.map((d) => {
                      const anon = d.displayName.trim().toLowerCase() === 'anonymous';
                      const style = TIER_STYLE[tier.id];
                      return (
                        <li key={d.id}>
                          <div className={style.card}>
                            <p className={anon ? style.nameAnonymous : style.name}>
                              {anon ? t('shoutout.anonymous') : d.displayName}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
