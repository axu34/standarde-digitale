"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { IconClose, IconMenu } from "./Icons";

const links = [
  { href: "/", label: "Verificare" },
  { href: "/metodologie", label: "Metodologie" },
  { href: "/exemplu", label: "Exemplu raport" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white">
      <div className="mx-auto flex h-20 max-w-[1216px] items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Standarde digitale — acasă">
          <img
            src="/DACIA_K.svg"
            alt="Dacia"
            className="h-8 w-auto border-r border-black pr-3 lg:h-10"
          />
          <span className="font-block text-sm font-bold uppercase tracking-wide text-black lg:text-base">
            Standarde digitale
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`font-block text-sm uppercase tracking-wide ${
                pathname === l.href ? "text-kaki" : "text-ink hover:text-black"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <a
          href={BRAND.agencyUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden font-block text-sm font-bold uppercase tracking-wide text-ink lg:inline-block"
        >
          {BRAND.agency}
        </a>

        <button
          type="button"
          className="lg:hidden"
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-black/10 bg-white px-4 py-4 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 font-block text-sm uppercase"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={BRAND.agencyUrl}
            target="_blank"
            rel="noreferrer"
            className="block py-3 font-block text-sm uppercase"
          >
            {BRAND.agency}
          </a>
        </div>
      ) : null}
    </header>
  );
}
