import {Link} from "@/i18n/navigation";

export default function NotFound() {
  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">404</span>
        <h1>Model nije pronađen / Model not found</h1>
        <p className="page-lead">
          Tražena stranica ne postoji ili model više nije objavljen.
        </p>
        <Link href="/models" className="button primary">Nazad na modele</Link>
      </div>
    </section>
  );
}
