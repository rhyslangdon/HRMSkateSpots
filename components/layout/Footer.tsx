// =============================================================================
// FOOTER COMPONENT
// =============================================================================
// The footer displayed at the bottom of every page.
//
// STUDENT: Update this component with your app's information:
//   - Replace HRM Skate Spots with your actual app name
//   - Update navigation links to match your routes
//   - Replace social media placeholder links with real URLs
//   - Add any additional sections relevant to your product
// =============================================================================

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          style={{ textAlign: 'center', alignItems: 'center' }}
        >
          {/* --- Brand --- */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-center justify-center space-y-2">
            <img src="/bearingLogo.png" alt="HRM Skate Spots Logo" className="h-20 w-20" />
            <h3 className="text-lg font-semibold text-foreground">HRM Skate Spots</h3>
          </div>

          {/* --- Product Links --- */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Resources</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* --- Resources Links --- */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Profile</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          {/* --- Social / Legal --- */}
          <div></div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} HRM Skate Spots. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
