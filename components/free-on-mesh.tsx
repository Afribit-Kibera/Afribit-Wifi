import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import freeAccess from "@/lib/free-access.json";

// What works without a pass. The same list sets the router rules
// (scripts/mesh/free_access.py), so nothing here is promised but not allowed.
export function FreeOnMesh() {
  return <>
    <p className="flow-copy">These work without a pass.</p>
    <ul className="flow-options" aria-label="Free apps">
      {freeAccess.apps.map(app => <li key={app.id} className="flow-option is-static">
        <Image src={`/images/apps/${app.id}.svg`} alt="" width={32} height={32} unoptimized />
        <span><strong>{app.name}</strong><small>{app.note}</small></span>
      </li>)}
    </ul>
    <p className="flow-note">Already have the app? Just open it.</p>
    <ul className="flow-options" aria-label="Free websites">
      {freeAccess.sites.map(site => <li key={site.id}><a className="flow-option" href={site.url}>
        <span><strong>{site.name}</strong><small>{site.note}</small></span><ChevronRight size={18} aria-hidden="true" />
      </a></li>)}
      <li><Link className="flow-option" href="/app"><span><strong>Get the Mesh app</strong><small>Mesh on your home screen</small></span><ChevronRight size={18} aria-hidden="true" /></Link></li>
    </ul>
  </>;
}
