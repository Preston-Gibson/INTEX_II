const BOARD_MEMBERS = [
  {
    name: 'Margaret L. Harmon',
    title: 'Chair, Board of Directors',
    photo: '/images/Woman Smiling at Camera.jpg',
  },
  {
    name: 'Dr. James K. Osei',
    title: 'Vice Chair',
    photo: '/images/SmilingDoctor.jpg',
  },
  {
    name: 'Priya Nair-Chandran',
    title: 'Treasurer',
    photo: '/images/Woman Hand Chin Smiling.jpg',
  },
  {
    name: 'Marco A. Rivera',
    title: 'Secretary',
    photo: '/images/Man Wearing Blue T-shirt.jpg',
  },
]

export default function HowWeWork() {
  return (
    <section className="bg-surface py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-manrope text-[clamp(2rem,3.2vw,2.75rem)] font-extrabold text-primary mb-4">
            Board of Directors
          </h2>
          <p className="text-[1.05rem] leading-[1.8] text-on-surface-variant max-w-2xl mx-auto">
            Our board brings together decades of expertise in child welfare, law, finance, and international development to guide our mission.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl lg:max-w-none mx-auto">
          {BOARD_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden flex flex-col shadow-sm"
            >
              <div className="w-full h-80 overflow-hidden">
                <img src={member.photo} alt={member.name} className="w-full block" />
              </div>
              <div className="p-4 flex flex-col">
                <h3 className="font-manrope font-bold text-on-surface text-sm mb-0.5">{member.name}</h3>
                <p className="text-[0.7rem] font-semibold text-primary uppercase tracking-widest">{member.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
