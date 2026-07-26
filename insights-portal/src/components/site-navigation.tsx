"use client";

import { BarChart3, Calculator, Grid2X2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Portal", icon: Grid2X2 },
  { href: "/estimator", label: "Estimator", icon: Calculator },
  { href: "/market", label: "Market", icon: BarChart3 },
];

export function SiteNavigation() {
  const pathname = usePathname();

  return (
    <aside className="site-rail">
      <Link className="brand" href="/" aria-label="Housing Insights home">
        <Image
          className="brand-mark"
          src="/parcel-mark.svg"
          alt=""
          width={42}
          height={42}
          priority
        />
        <span>
          <span className="brand-title">Housing Insights</span>
          <span className="brand-subtitle">Measured decisions</span>
        </span>
      </Link>
      <nav className="site-nav" aria-label="Applications">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="rail-coordinate">
        GRID / 40.7128° N
        <br />
        DATUM / HOUSING-01
      </p>
    </aside>
  );
}
