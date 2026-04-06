export default function HowWeWork() {
  return (
    <section className="howwework-section">
      <div className="container howwework-inner">
        {/* Left — text + bullets */}
        <div className="howwework-text">
          <div className="howwework-glow" />
          <h2>The Buffer Against Exploitation</h2>
          <p>
            We operate in the critical gap between vulnerability and assault. Our mission
            is to create a multi-layered defense that protects children before the worst
            can happen, and heals them if it already has.
          </p>

          <div className="howwework-bullets">
            <div className="bullet-item">
              <div className="bullet-icon bullet-icon--teal">
                <span className="material-symbols-outlined">radar</span>
              </div>
              <div>
                <h4>Early Detection</h4>
                <p>Community-based monitoring systems to identify at-risk children before exploitation occurs.</p>
              </div>
            </div>

            <div className="bullet-item">
              <div className="bullet-icon bullet-icon--blue">
                <span className="material-symbols-outlined">shield</span>
              </div>
              <div>
                <h4>Rapid Response</h4>
                <p>Immediate legal and physical intervention protocols to remove survivors from harm's way.</p>
              </div>
            </div>

            <div className="bullet-item">
              <div className="bullet-icon bullet-icon--amber">
                <span className="material-symbols-outlined">favorite</span>
              </div>
              <div>
                <h4>Generational Healing</h4>
                <p>Working with families to break cycles of vulnerability and poverty through sustainable support.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — staggered image grid */}
        <div className="howwework-images">
          <div className="img-col img-col--offset">
            <img
              className="howwework-img img-tall"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc-5Iw58mAex94y_ECAHQtA4n9hf0av1NHNuByU4bMoHAAT9oTpS22jhbYV4R04MzTsyjC5F_Q9vX3TDWxe8YC1jAO61pQhD_A1U1rV4w5Etiles8BzLN8GYbrYNQjyW-uXEZXDyGPuBRo4Cp18vM3mF-ytwFoI-0tk2i6K9mcERRu5_Df12LhMTrpIK7YgNoo2cPn-i8zMgjSRWAJZbtMj4jZXnYYTmi01esoBylFXyNOIfgywbDSZNM0z9RmmcS-0uWYVJghRg"
              alt="Child walking toward a bright horizon"
            />
            <img
              className="howwework-img img-square"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1q-u2Mc2oyrCMEjBOVkG3KGUwFcLeizR7Wh3FmsWxbiXHaVj6y9lxLV2YThZsifR-Gc0Sl47Fj3yanHlY_N3GdWCBrry9bmYZE2bML9kbsaqHLS5PTwWx-8zJgbhL9yOEqf0mZHb_lIP89ee2_Z3LR66_fYjtzMxHxCXyG6HU9KFOt7NSczq8LoD841BlovzwXe37o1h9DjCgMMa_mFteWnW8XXVLXiXWfWIxDzWrUbdg9DXzM0silvbTyvWgcXDoxsrrpUVIHw"
              alt="Hands joined in support"
            />
          </div>
          <div className="img-col">
            <img
              className="howwework-img img-square"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfr45ik6Eaq1qzASF519xMQnsneeX6k04ynS3oQlKu28hjqEv6fcsPXVM27AEHwTMtPnNgRczQpcIxL7cOd7iZ8KdJs5GRrI5qjPWNHgrgFP_ez94dGNhG9xtaDvLioQvzt3BftmVj2LAiTnItFMsqAN5WECJ0n3zObjBNy2A24LQih7KH2YfL-sd9Tdp1sb8npBlKN1H9hYKI6rSE9W0Y02y6ggdBIs7HZY_2idNibV68OpagTKdns5TRc8xyeGvCXsPKL3qzMg"
              alt="Colorful village community"
            />
            <img
              className="howwework-img img-tall"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyS8-zhBehfSldtHFWdfUTMRkPhR0mJDqvom_LNVrTx5wtCXBWxWQ4JclaWhumyGTQZZCfp93PZWY9FWdoFqD4oqXTVkTnyz8V5_VsOIGsypoVRn3Qb2jLiZfv4L_Jb20HqXKpmus_mFqWPjQkHBd1P-6HbgpNHtEmnDdSfFFHO5RVQZhO6dz7CdQS_f_anwJipnjYsyiVlB-gKraBYY2mBxutv_McRRns3yddrtgAv7fYXPbmZIPBIk6rUyRmQcEMnxFAnSj5VQ"
              alt="Bright classroom scene"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
