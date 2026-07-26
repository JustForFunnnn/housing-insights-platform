"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SubNavigation({
  label,
  links,
}: {
  label: string;
  links: Array<{ href: string; text: string }>;
}) {
  const pathname = usePathname();
  return (
    <nav className="subnav" aria-label={label}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
        >
          {link.text}
        </Link>
      ))}
    </nav>
  );
}
