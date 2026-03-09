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
  description: 'Learn about HRM Skate Spots — our mission, team, and story.',
};

// STUDENT: Replace with your actual team members
const team = [
  { name: 'Rhys Langdon', role: 'Developer', bio: '...' },
  { name: 'Braden Sampson', role: 'Developer', bio: '...' },
  { name: 'Zachary Boutilier', role: 'Developer', bio: '...' },
];

export default function AboutPage() {
  return (
    <div className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* --- Mission / Vision --- */}
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            About HRM Skate Spots
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            HRM Skate Spots helps skaters across the Halifax Regional Municipality discover, share,
            and review the best spots to ride. Finding quality skate spots in HRM has always relied
            on word of mouth — we&apos;re building a community-driven platform so every skater can
            explore new terrain and connect with the local scene.
          </p>
        </section>

        {/* --- Story --- */}
        <section className="mt-20 text-center">
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
              and more ways for the communities to connect and share their favorite spots.
            </p>
          </div>
        </section>

        {/* --- Team --- */}
        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold text-foreground">Meet the Team</h2>
          <p className="mt-4 text-center text-muted-foreground"></p>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="rounded-xl border border-border p-6 text-center">
                {/* STUDENT: Replace this placeholder with actual team photos */}
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl">
                  👤
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm font-medium text-primary">{member.role}</p>
                <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
