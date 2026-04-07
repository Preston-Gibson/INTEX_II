export default function GeographicSection() {
  return (
    <div className="space-y-8">
      <div className="p-8 bg-surface-container-low rounded-xl">
        <h3 className="text-2xl font-bold text-primary mb-6">Geographic Reach</h3>
        <div className="aspect-video relative bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
          <img
            alt="Map of Central America"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuATgFL3w7J3C0SUWdNIVy1NzI6LG7pX7han4WmS9wPSl2sx8nNS9mdJx5pSoa64hAN8PRArxRFOGS96_ORKj8PT29uRDpagh1pKCRQK_L9TAeVCjmphJpedW13eR3xhq0UnQyUklVOYbJb3h8Otcb0zgbUm_UzBfyON7ha8NG0aZLd3W3BZNJoae1uxHusRIjRlarD9d7zDWwQkjR0BCdwTXkUnihzGZO_1WdsJzMBhS_ITeXEp-LESNWV_DrGldU8Zy3cCLeai9A"
          />
          <div className="relative z-10 flex flex-col items-center">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              Santa Rosa de Copán
            </span>
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center text-sm font-medium text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            Honduras (65%)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary"></span>
            Guatemala (20%)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim"></span>
            Others (15%)
          </div>
        </div>
      </div>

      <div className="p-8 bg-surface-container-low rounded-xl">
        <h3 className="text-2xl font-bold text-primary mb-6">Year-Over-Year Impact</h3>
        <div className="space-y-4">
          <div className="flex items-end gap-2 h-48">
            <div className="flex-1 bg-surface-container-highest rounded-t-lg transition-all hover:bg-primary-fixed" style={{ height: '40%' }}></div>
            <div className="flex-1 bg-surface-container-highest rounded-t-lg transition-all hover:bg-primary-fixed" style={{ height: '55%' }}></div>
            <div className="flex-1 bg-surface-container-highest rounded-t-lg transition-all hover:bg-primary-fixed" style={{ height: '70%' }}></div>
            <div className="flex-1 bg-primary rounded-t-lg transition-all" style={{ height: '95%' }}></div>
          </div>
          <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase px-2">
            <span>2021</span>
            <span>2022</span>
            <span>2023</span>
            <span>2024 (Projected)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
