// =============================================================================
// ABOUT PAGE
// =============================================================================
// Tells visitors about your product, team, and mission.
//
// STUDENT: Replace ALL placeholder content with your actual information:
//   - Mission and vision statements
//   - Team member names, roles, and photos
//   - Your product's origin story
// =============================================================================

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about HRM Skate Spots, the Halifax skateboarding community map built to help skaters discover and share spots across HRM.',
  keywords: [
    'about HRM Skate Spots',
    'Halifax skateboarding community',
    'HRM skate community',
    'Halifax skateboard map',
  ],
};

// STUDENT: Replace with your actual team members
const team = [
  { name: 'Rhys Langdon', role: 'Developer', icon: '💻' },
  { name: 'Braden Sampson', role: 'Developer', icon: '💻' },
  { name: 'Zachary Boutilier', role: 'Developer', icon: '💻' },
];

export default function AboutPage() {
  return (
    <div className=" px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* --- Mission / Vision --- */}
        <section className="retro-panel overflow-hidden p-6 text-center sm:p-10">
          <h1 className="mt-5 text-4xl font-black tracking-[0.08em] text-foreground uppercase sm:text-6xl">
            About HRM Skate Spots
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            HRM Skate spots is for skaters to find spots and get buck.
          </p>
          <p className="mt-4 text-base text-muted-foreground">
            Since your&apos;e reading the about page, you should probably watch the latest{' '}
            <a
              href="https://www.youtube.com/@budzo420"
              className="font-bold text-primary underline decoration-2 underline-offset-4"
              target="_blank"
            >
              Budzo
            </a>{' '}
            video.
          </p>
        </section>

        {/* --- Story --- */}
        {/* <section className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-foreground">Our Story</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              We wanted an app that could show skaters the best spots in HRM — but when we looked,
              there was nothing out there. So we built HRM Skate Spots so we could share our
              favourite spots and help other skaters discover new ones.
            </p>
            <p>
              We started with a simple map and a few reviews, but as our community grew, we added
              features like user profiles, photo galleries, and a spot rating system. Along the way,
              we learned a lot about building a product from scratch — the challenges of scaling,
              the importance of user feedback, and the joy of creating something that people love to
              use.
            </p>
            <p>
              We plan to keep improving HRM Skate Spots with new features, better user experiences,
              and more ways for the communities to connect and share their favourite spots.
            </p>
          </div>
        </section> */}

        {/* --- Team --- */}
        <section className="mt-20">
          <h2 className="text-center text-3xl font-black uppercase tracking-[0.12em] text-foreground">
            Developers
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="retro-card p-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-primary/10 text-3xl shadow-[0_4px_0_rgba(0,0,0,0.15)]">
                  {member.icon}
                </div>
                <h3 className="mt-5 text-xl font-black uppercase tracking-[0.08em] text-foreground">
                  {member.name}
                </h3>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-primary">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
