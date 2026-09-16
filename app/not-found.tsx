import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-block text-3xl uppercase text-ink">Pagina nu există</h1>
      <p className="mt-4 font-read text-ink">Reveniți la verificare.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-[46px] items-center bg-kaki px-6 font-block text-sm uppercase text-white hover:bg-black"
      >
        Acasă
      </Link>
    </div>
  );
}
