# Mesh intellectual property and stewardship

**Classification:** Internal working document for authorized project
maintainers and legal reviewers; not for public release without review  
**Audience:** Legal counsel, project/entity leadership, maintainers, product,
design, procurement, security and release owners  
**Document owner:** Project IP/stewardship owner role (individual and legal
entity not yet recorded)  
**Prepared:** 22 October 2026, Africa/Nairobi  
**Evidence checked through:** 22 October 2026  
**Status:** Factual diligence framework based on the local internal dossier,
checked-in project records and observed repository structure. This is not legal
advice, an ownership determination, an assignment, a licence, trademark
clearance, regulatory approval, patent opinion or authorization to publish.

> **Internal handling:** The separate [Project IP, Brand and Technical
> Stewardship Dossier](../../PROJECT_IP_AND_LEGAL_STEWARDSHIP.md) is maintained
> locally as an internal working document. Keep it and supporting contracts,
> contributor identities, private release records and legal advice out of
> public Git history and public documentation. Confirm the intended secure
> storage/access policy with the authorized owner. This chapter summarizes
> review topics; it does not reproduce private evidence or make the dossier
> public.

## Contents

- [1. Purpose, scope and legal-review boundary](#1-purpose-scope-and-legal-review-boundary)
- [2. Project identity and asset categories](#2-project-identity-and-asset-categories)
- [3. Current evidence and open title questions](#3-current-evidence-and-open-title-questions)
- [4. Contributor and chain-of-title diligence](#4-contributor-and-chain-of-title-diligence)
- [5. Copyright, source and documentation licensing](#5-copyright-source-and-documentation-licensing)
- [6. Software, service and protocol dependencies](#6-software-service-and-protocol-dependencies)
- [7. Brand, marks and third-party references](#7-brand-marks-and-third-party-references)
- [8. Visual, font, content and generated-asset provenance](#8-visual-font-content-and-generated-asset-provenance)
- [9. Confidential information and publication controls](#9-confidential-information-and-publication-controls)
- [10. Agreements, privacy, telecom and financial review](#10-agreements-privacy-telecom-and-financial-review)
- [11. Patent, disclosure and freedom-to-operate questions](#11-patent-disclosure-and-freedom-to-operate-questions)
- [12. Release, contribution and maintainer controls](#12-release-contribution-and-maintainer-controls)
- [13. Legal-team diligence workflow](#13-legal-team-diligence-workflow)
- [14. Decisions and evidence register](#14-decisions-and-evidence-register)
- [15. Source records](#15-source-records)

## 1. Purpose, scope and legal-review boundary

This chapter gives authorized reviewers a structured way to examine the
project's software, brand, content, network materials, contributors,
dependencies, business relationships and publication posture. The goal is to
identify evidence to collect and decisions to make, not to state legal
conclusions.

Mesh combines a customer portal and application, payment/access workflows,
operator tools, gateway software/configuration and project documentation. It
also uses third-party platforms, standards, provider APIs and content. These
categories can have different creators, owners, contracts, license terms,
territories and publication histories. A single repository or product name
does not resolve those questions.

The record uses these terms:

- **Observed fact:** stated in an identified repository record, file, release
  or dated project note. It may still require independent confirmation.
- **Candidate project material:** material that may include original
  expression or project-controlled assets, subject to creator/title and
  applicable-law review.
- **Third-party material/service:** material or service whose owner/provider
  and terms must be identified; presence in the project is not a grant of
  permission.
- **Question for counsel/authorized owner:** a decision or legal assessment
  that this handbook cannot make.
- **Not established:** the reviewed evidence does not demonstrate the
  proposition. This is not proof that a right or agreement does not exist.

### 1.1 No implied legal conclusions

Nothing here decides:

- which person or entity owns code, documentation, marks, designs, accounts,
  equipment, domains, data, inventions or business goodwill;
- whether a contribution is a work made for hire, assigned, licensed or
  jointly owned;
- whether a name, logo, invention, configuration, dataset or business method
  is registrable, protectable, novel or free of third-party rights;
- whether a dependency or asset license is compatible with a particular
  distribution or commercial model;
- whether any service complies with Kenyan or other law, provider contract,
  telecom, consumer, privacy, tax, payment, virtual-asset or radio
  requirements; or
- whether a public release, customer sale, app distribution, sublicensing,
  trademark filing or enforcement action is authorized.

Those decisions require current evidence and appropriately qualified,
authorized review. A legal memorandum or contract may be privileged or
confidential; keep it in counsel-approved storage and do not paste it into
public issues or general project docs.

### 1.2 Relationship to the internal dossier

The internal dossier is the broader legal-team brief and source inventory.
This chapter is a handbook index of stewardship tasks and release controls.
Keep one authoritative evidence register for ownership and agreements to avoid
conflicting copies. If counsel updates the dossier, record its revision/date
and approved conclusions in a restricted decision register; do not copy legal
advice or confidential deal terms into the general handbook.

## 2. Project identity and asset categories

### 2.1 Names appearing in records

The project records use **Afribit**, **Afribit Wi-Fi / Afribit WiFi**,
**Kibera Mesh**, **Mesh**, the GitHub repository name **Afribit-Wifi**, and
historical **3WEST** service context. Current product guidance uses **Mesh**
with a separate **Powered by Afribit** attribution; 3WEST is the existing
site/service context, not an automatic substitute product name.

This is an observed naming convention and project preference, not trademark
clearance, registration, ownership, or approval to use a mark in every
territory, class, domain, app listing or partnership context. The word “mesh”
is widely used descriptively in networking; counsel should assess distinct
source-identifying protection and conflicts before filing or making exclusivity
claims. Do not use ® or other status symbols without an approved, verified
basis.

### 2.2 Asset and rights map

The following categories should be inventoried separately. For each item,
capture its creator/source, date, version/hash, applicable terms, permission
evidence, intended use, attribution, modifications, geographic/medium limits,
owner/custodian, review date and approved public status.

| Category | Examples in the project | Review questions |
| --- | --- | --- |
| Application source | Portal, APIs, admin interface, payment/access logic, database models, gateway agent | Who wrote/commissioned each component? What agreements apply? What distribution/use license will govern it? |
| Network/configuration code | RouterOS templates, firewall rules, commissioning scripts, recovery utilities | Original expression versus vendor/example-derived material? Can it expose site-sensitive information? What vendor/software terms apply? |
| Documentation | Handbook, architecture, runbooks, customer copy, research and legal materials | Authors, external quotations, confidential material, third-party manuals, public/private classification and publication permissions |
| Brand identifiers | Mesh wordmark/woven symbol, Afribit house mark, product/site names | Creator and title; clearance, filing strategy, approved form, domains/social handles and third-party association risk |
| Visual design | Layouts, icons, diagrams, photos, generated artwork, voucher designs | Creator/source, license/assignment, model/property releases where relevant, prompt/source files and allowed derivative uses |
| Fonts and type | Geist font files/derivatives and other UI fonts | Exact upstream version and license notice; whether redistribution in router/PDF/software is covered |
| External marks | Signal, Blink, Bitcoin, provider, hardware and app marks/logos | Official asset source, brand rules, nominative reference versus endorsement, permitted resizing/background/use |
| Educational/media content | Bitcoin Diploma PDF, card links, community photos, audio/media samples | Publisher/creator, copyright/license, attribution, linking versus copying, cache/translation/print permissions and consent |
| Third-party software | Direct/transitive packages, containers, OS, RouterOS/UniFi, local relays | Exact release/SBOM, license and service terms, source/notices, obligations triggered by distribution or network operation |
| Data and records | Customer/device/payment data, event/media content, logs, training fixtures | Controller/processor roles, privacy basis, data rights, retention/deletion, contracts and security classification |
| Domains/accounts/operations | Repository, DNS, hosting, database, provider accounts, certificates and keys | Legal/account holder, administrator, continuity, transfer authority, third-party terms and recovery custody |
| Inventions/know-how | Potential novel mechanism, internal design or non-public operational knowledge | Specific contribution, inventors, dated evidence, disclosure history, secrecy measures and counsel review |

This table is not a conclusion that each category is owned by the project or
protected as intellectual property. It is an evidence-collection map.

## 3. Current evidence and open title questions

The separate dossier states that, at its 6 October review, no root `LICENSE`
file was found; package metadata marked the project `private`; recent inspected
Git commits showed the author string “Novyrix”; and the working tree included
uncommitted/untracked material. These are historical observations in that
dossier, not a fresh audit of every current branch, package, asset, or release.
Recheck exact repository and distribution state before relying on them.

The following propositions are **not established by those observations**:

- that “Novyrix” is the sole legal author or owner;
- that an employer, contractor, founder, community contributor or funder has
  assigned rights to a named entity;
- that repository visibility or the package's `private` field grants or
  denies rights to third parties;
- that every file has the same creator, license or owner;
- that the legal entity using Afribit is the intended rights holder;
- that Git history is a complete contribution record; or
- that code/assets may be commercially distributed, copied, modified,
  sublicensed or used to enforce a mark.

No root `LICENSE`, `LICENCE`, `COPYING` or `NOTICE` was found by the local
filename check at the time of this chapter. This bounded check does not
replace a full inventory of nested package licenses, vendored notices,
font/asset license files, service terms or files outside the repository.
Absence of a root license is not itself a legal determination; obtain counsel's
release recommendation before distributing or accepting contributions.

### 3.1 Ownership versus account control

Control of GitHub, a domain, cloud account, database, payment-provider account,
router, signing key or computer may be important operational evidence. Account
administration does not on its own answer legal ownership of code, a mark,
customer data, equipment, funds or inventions. Inventory each account's legal
holder, authorized administrator, recovery contact, billing party, transfer
limits, continuity plan and governing terms separately.

## 4. Contributor and chain-of-title diligence

### 4.1 Build the contribution register

Create a restricted register covering every known material contributor:
founders, employees, contractors, agencies, volunteers, community members,
designers, developers, network engineers, writers, testers, translators,
photographers, prompt/image creators and consultants.

For each contributor, record only information needed for the review in the
authorized location:

| Field | Evidence to seek |
| --- | --- |
| Identity and relationship | Legal name/entity, role, location/jurisdiction, employee/contractor/volunteer/funder/partner relationship |
| Contribution | Work/product area, files/assets, dates, scope and significant revisions |
| Pre-existing material | Background code, templates, designs, tools or content brought in; its owner and original terms |
| Agreement | Employment/contract/SOW, assignment, license, confidentiality, waiver, grant/sponsor/community conditions |
| Payment and direction | Invoices, payroll/funding records, acceptance/review and who commissioned the work |
| Evidence | Commit/review history, source/design files, delivery records, meeting notes and signed documents |
| Exceptions | Third-party, jointly created, community-owned, disputed, unknown or restricted material |
| Follow-up | Counsel/owner, needed instrument, due date, publication hold and decision status |

Avoid collecting unrelated personal information. Keep identity documents,
contracts and legal advice in counsel-approved restricted storage; this
general handbook should contain only status and non-sensitive references.

### 4.2 Reconcile source history with agreements

Preserve read-only snapshots of relevant repositories/releases with commit
hashes, branches/tags, lockfiles, release artifacts and a record of
uncommitted/untracked changes where material. Git author/committer metadata is
one evidence source; compare it with contracts, work records, invoices, design
handoffs and contributor statements.

Do not rewrite authorship history or backdate an assignment to make the record
appear cleaner. If an authorized entity is intended to hold title, have
counsel determine and prepare appropriate present-dated assignments or
confirmatory documents, record execution and scope, and preserve the original
creation evidence.

### 4.3 Community, sponsor and partner contributions

Before accepting contributions from a community site, sponsor, funder,
university, employer, NGO, vendor, or partner, identify:

- whether the contribution is money, equipment, bandwidth, code, data,
  content, labor, a logo, a site or access to premises;
- any grant purpose, public-funding rule, attribution, reporting,
  publication, ownership, exclusivity or return condition;
- whether contributors expect shared ownership, a license, recognition,
  revenue participation or withdrawal rights;
- whether their employees/students/volunteers have authority to contribute;
- how third-party material and personal/community data will be cleared; and
- who may accept, modify, publish, sublicense, maintain and retire the
  contribution.

Obtain written terms before integrating material where feasible. Do not
assume an informal handover or payment for services transfers all rights.

### 4.4 Chain-of-title outcome

The legal review should produce a restricted asset/contributor schedule with:

1. intended rights holder(s) by asset class and territory, if determinable;
2. authors/creators and relevant contribution dates;
3. agreements/licenses supporting current use and proposed distribution;
4. missing, conflicting or unclear rights and owners to contact;
5. required assignments, permissions, attribution or replacement work;
6. publication/release blocks and authorized approver; and
7. evidence location, counsel status and review date.

Use “unresolved” for an incomplete chain. Do not treat a verbal assurance,
repository commit, payment receipt or private Git access as a substitute for
written evidence when counsel advises otherwise.

## 5. Copyright, source and documentation licensing

### 5.1 Decide policy by component and audience

The project has not recorded a final source/documentation license decision in
the reviewed dossier. Leadership and counsel should choose a policy before
external distribution or contribution intake. Options may include proprietary
distribution, open-source release of selected components, or a deliberate
split license. The choice should identify covered materials, recipients,
permitted uses, notices, modification/redistribution terms, contribution
policy, patent/copyright grants where applicable, and how hosted service,
router scripts, docs and brand assets are treated.

Do not label software open source solely because it is visible in a public
repository. Do not infer “all rights reserved” language, commercial
restrictions or permission from a `private` package field. Ask counsel to
confirm the exact legal effect and the approved notices.

### 5.2 Separate licensing decisions

Review separately:

- application source and packages;
- gateway/controller source and operational scripts;
- router configuration templates and static portal assets;
- documentation, training materials and customer copy;
- images, fonts, logos, diagrams and design files;
- generated/source samples and test fixtures;
- APIs, protocols and interface specifications;
- container images, operating systems, vendor platforms and server software;
- public website content and downloadable materials; and
- contributions or forks from outside maintainers.

One repository-wide license may not appropriately cover all assets or
third-party materials. Keep third-party notices and excluded assets clear.

### 5.3 Before adding copyright headers or notices

Do not insert a named copyright owner, “all rights reserved,” a license
identifier, contributor assignment statement or trademark claim until the
authorized owner and counsel approve the wording and scope. A notice does not
create title, cure an incompatible dependency, or replace a signed agreement.
Once the policy is approved, apply it consistently to the correct packages,
source distributions, binary releases, docs and asset bundles.

### 5.4 Documentation and quotation practice

The handbook contains original explanatory text alongside factual observations
and references to third-party documents. Maintain source attribution for
quoted/adapted material, use links rather than reproducing substantial
third-party text where appropriate, and record permission/license for any
reproduced manual, PDF, image, diagram or training content.

Keep internal legal, customer, operational and security evidence clearly
classified. Moving text from an internal record into a public handbook is a
publication decision; sanitize identifiers and verify rights and accuracy
first.

## 6. Software, service and protocol dependencies

### 6.1 Release-specific software review

The dossier's package list is indicative, not a current license/SBOM audit.
For each external release, produce a versioned bill of materials from the
actual lockfiles and deployed artifacts, including direct and transitive
packages, vendored code, build tooling shipped to users, container images,
fonts and embedded assets. Record:

- package/name, exact version, source and hash;
- direct/transitive/vendored/build/runtime role;
- license identifier and upstream license/notice file;
- obligations that may apply to modification, distribution or network use;
- attribution/notices delivered to users or operators;
- source availability or offer requirements, if applicable;
- patent, trademark, field-of-use or commercial restrictions to verify;
- security/support status and dependency owner; and
- review result, reviewer and date.

Automated license scanners can identify candidates but may misclassify
metadata, exceptions, generated files, bundled fonts or custom terms. Counsel
or a qualified reviewer should resolve material ambiguity against the exact
upstream text and use.

### 6.2 Software versus hosted services and hardware terms

Review contracts and terms for the deployment platforms, database, DNS,
registrar, tunnel, payment/settlement providers, app distribution services,
ISP, RouterOS/UniFi and any local relay/storage service. Capture allowed use,
resale/redistribution, API rate/branding terms, data processing and location,
retention, service levels, audit, suspension, price changes, export,
termination and exit rights.

A software license does not necessarily grant a right to use a provider's
hosted service for resale or community access. Conversely, an API integration
does not make Mesh the owner or controller of the external protocol/service.
The exact account owner and contract party must be identified.

### 6.3 Standards and interoperability

The documented system uses established technologies such as IEEE 802.11,
Ethernet, IP, DHCP, DNS, OSPF, HTTPS, Bitcoin/Lightning and third-party
RouterOS/UniFi implementations. It also discusses external app and content
protocols. These references do not imply that Afribit invented or owns the
underlying standard, protocol, implementation or mark.

Preserve relevant specification/version/implementation references for
interoperability, but separate:

- a public protocol/specification;
- a vendor's proprietary implementation and documentation;
- Mesh-authored integration code or configuration;
- compatibility claims for a tested version; and
- rights in any copied sample/example or logo.

Do not claim exclusive protocol rights, certification or endorsement without
evidence and authorized review.

### 6.4 AI-assisted and externally sourced material

The project may contain AI-assisted text, code, prompts or generated visuals,
as well as material adapted from vendor documentation, forums or community
examples. Record provenance and meaningful human review for material that
ships. Preserve prompts/source files for generated artwork where available,
but do not make assumptions about copyright status, originality, training
rights or exclusivity; request jurisdiction- and use-specific legal review.

For code suggestions, identify relevant upstream/source references, inspect
for copied expressive material and dependencies, run project tests and review
security/licensing implications. AI assistance is not a source or title
record.

## 7. Brand, marks and third-party references

### 7.1 Internal brand direction versus legal status

The project design direction uses the name **Mesh** with a separate
**Powered by Afribit** attribution; the woven symbol and wordmark are used in
the application. This is a current project direction only. It does not show
that the name/logo are registered, cleared, distinctive, legally owned by a
particular entity or available in target markets.

Counsel/brand owners should determine:

- canonical owner/entity name and product/service names;
- target countries, goods/services and priority markets;
- clearance searches for identical/confusingly similar marks, domains and
  app/social identifiers;
- whether a word mark, composite mark, logo or other designation is suitable;
- applicant/owner, filing strategy, classes, use evidence and renewal controls;
- proper ™/® use, attribution and approved lockups;
- third-party app/provider/hardware mark references and logo permissions;
- coexistence, opposition, domain dispute or enforcement procedure; and
- who approves partner, reseller, community-site and media usage.

Do not use ® without verified registration and approved geographic/scope
rules. Do not use a mark or logo in a way that implies endorsement,
partnership, certification, wallet custody or provider operation without
documented authorization.

### 7.2 Brand controls

Maintain an approved asset package containing dated vector masters, raster
derivatives, color/type specification, accessibility guidance, attribution
and permitted contexts. Record creator/designer, source files, commissioning
terms, revisions, approval and rights evidence. Keep third-party logos
unmodified except where their terms and approved brand guidance permit
proportional display changes.

The [captive art-direction record](../mesh-captive-art-direction.md) describes
current design choices and an Afribit-published photograph source. It is
design/provenance evidence, not itself proof of photographer assignment,
model releases, or permission for every promotional, print, fundraising or
commercial use. Verify those matters before reusing the photograph outside
its recorded context.

## 8. Visual, font, content and generated-asset provenance

### 8.1 Asset register minimum

For each nontrivial image, font, icon, logo, photograph, illustration, audio,
video, diagram, PDF, template or dataset, record:

| Field | Example of what to capture |
| --- | --- |
| Asset ID and file | Stable ID, repository path or restricted storage reference |
| Creator/source | Person, entity, official URL, collection, generative tool or project source |
| Original date/version/hash | Provenance and change tracking |
| Rights basis | Assignment, license, written permission, public-domain evidence, link-only use or unresolved status |
| Scope | Web/app/router/print/video/social, territory, duration and commercial use if granted |
| Modifications | Crop, resize, translation, color change, generated variation or derivative |
| Attribution/notice | Exact credit, logo rules, license text and delivery location |
| People/property | Consent/model/property release review where identifiable people or locations are involved |
| Owner/reviewer | Responsible maintainer, counsel/brand reviewer and review date |
| Restrictions | No redistribution, no AI training, no endorsement, no modification, expiry or takedown condition |

Keep invoices, releases, contracts and confidential permission correspondence
in restricted records. Link an asset ID from public source material rather
than publishing private agreements.

### 8.2 Known examples requiring separate handling

- **Geist font:** project notes say a Latin variable WOFF2 was copied from the
  existing Next.js build for the static router portal and bundled with an
  SIL Open Font License text. Verify the exact font version, file/hash,
  accompanying notice and scope of the actual distribution before release.
- **Signal and Blink logos:** the local source note records official download
  sources and unmodified SVGs used to identify independent apps. Recheck each
  provider's current brand rules and use context; local hosting does not
  transfer ownership or endorsement.
- **Bitcoin Diploma:** the learning card links to a publisher-hosted English
  workbook PDF. The reviewed record says the original large PDF was not copied
  into the router or web deployment; a locally displayed cover thumbnail
  preserves publisher identity. Linking, downloading for review, caching,
  translating, printing and redistributing are distinct uses; obtain
  permission/license evidence for any reuse beyond the approved link/context.
- **Afribit community photograph:** the art-direction record cites a
  photograph published on Afribit's website and describes resized
  derivatives. Confirm the photographer/commission agreement, identifiable
  person permissions and allowed promotional contexts before broader reuse.
- **Generated wildlife voucher art:** the design record identifies generated
  bitmap artwork and retained prompts/source files. Record tool/date,
  human edits, output files and any applicable platform terms. Do not claim
  exclusivity or settled copyright ownership without review.
- **Payment and hardware marks:** local source notes cite official Blink and
  Signal mark sources; other payment, wallet, ISP and router marks should be
  similarly sourced and reviewed. A factual textual reference may still need
  context/brand review; logo use is a separate asset question.
- **Community/user media:** obtain a documented permission/consent and define
  purpose, audience, storage, editing, removal and retention before publishing.
  Consent to appear in one project photo is not automatically permission for
  every future campaign or derivative.

The examples above are prompts for the asset register, not a completed
clearance. The designated reviewer should verify actual assets and terms as
used in each release.

### 8.3 Generated, derivative and print artwork

Keep original prompts, source images, editable project files, fonts, output
hashes and revision notes for generated or derived illustrations. Separate
design-review proofs from production-ready output. Confirm printer,
stock-photo, font-embedding, color-conversion and distribution terms for
voucher or promotional print runs.

Never publish genuine voucher codes, customer receipts, private images or
active account data in artwork/proofs. The voucher design notes say supplied
codes are dummy samples; verify proof redaction and actual print separation
before each print run.

## 9. Confidential information and publication controls

### 9.1 Information categories

Use the project’s approved information-classification scheme if one exists.
Until it is documented, handle conservatively:

| Category | Examples | Default handling |
| --- | --- | --- |
| Public-approved | Reviewed product summary, approved release note, sanitized diagram | Publish only after designated content/security/rights review |
| Internal working | Draft handbook, unapproved roadmap, release checklist, design option | Restricted project workspace; no public mirror without owner review |
| Confidential/legal | Internal IP dossier, contracts, legal advice, contributor identities, provider terms, negotiation | Counsel/authorized-owner storage with least privilege; do not copy into public docs |
| Restricted operational/security | Credentials, keys, router pins, exact management topology, private logs, recovery exports | Encrypted approved secret/evidence systems; never commit or attach to public issue |
| Personal/customer/financial | Identifiers, payment payloads, vouchers, receipts, support records | Approved private processing/storage, minimum access and retention; redact before evidence sharing |

The internal dossier is currently excluded from ordinary Git tracking through
a local Git exclude rule. Preserve that separation; it is not a substitute for
access control, encryption, backup policy or a review of other copies. Do not
remove the exclude, add the dossier to a commit, or quote its confidential
evidence in a public release without explicit authorization.

### 9.2 Publication and repository hygiene

Before publishing a release, demo, pitch, print item, app listing, public
repository or customer support page:

1. identify its audience, purpose, owner and disclosure classification;
2. check authorship/title, third-party terms, attribution and brand use;
3. remove credentials, customer/payment data, private site details and
   incident evidence;
4. verify claims against current dated acceptance evidence;
5. obtain product, legal/rights, privacy and security approvals as applicable;
6. record the approved artifact, version, date, approver and publication
   locations; and
7. retain the source/editable file and permitted evidence in approved storage.

Git history is durable publication. If a secret, customer record or
confidential attachment is committed, removing it in a later commit does not
erase earlier copies, forks, caches or clones. Follow the security incident
process, assess scope, rotate/revoke credentials as appropriate and coordinate
history remediation; do not treat “delete file” as complete containment.

## 10. Agreements, privacy, telecom and financial review

### 10.1 Agreements and counterparties

Build a contract register for the legal entity and sites, covering as
applicable:

- employment, contractor, consultant, founder and contributor agreements;
- site-hosting, premises, power, equipment, bandwidth and maintenance
  arrangements;
- ISP/upstream contracts, resale/redistribution and service-use limitations;
- cloud, database, DNS, domain, certificate, tunnel and app-distribution
  terms;
- payment collection, settlement, treasury, wallet, exchange and provider API
  terms;
- printer/retailer, voucher stock, education/content and photo permissions;
- community/funder/grant conditions, reporting, deliverables and ownership;
- data processing, confidentiality, security and incident notification terms;
- customer service terms, support, price, service limits, refunds/remedies
  and complaint route; and
- termination, transition, export, credential revocation, equipment return,
  data deletion and continuity.

For each agreement, capture parties, authorized signatories, effective/expiry
dates, territory, service, data/asset scope, renewal/termination, restrictions,
responsible owner and secure document location. Legal counsel should review
the underlying instrument; this inventory is not contract interpretation.

### 10.2 Privacy and data protection

The application/network may process payment references, phone/device
identifiers, MAC/IP addresses, access and voucher records, operator identities,
logs, support evidence and hosted user content. Identify, for each service:

- purposes and minimum necessary data;
- accountable organization and processor/subprocessor relationships;
- notices, consent/other lawful basis and customer expectations;
- retention, deletion, backup expiry and legal hold behavior;
- access/export/correction/deletion request process;
- hosting location, cross-border transfers and provider contracts;
- security controls and breach notification/escalation; and
- community content, moderation and child/vulnerable-user considerations.

Obtain jurisdiction-specific advice from qualified privacy counsel. Follow
[Volume 08](08-security-and-privacy.md); a technical field or app trial is not
a privacy compliance determination.

### 10.3 Telecom, consumer, payment and radio questions

The service model may involve public internet resale/redistribution, payment
collection and settlement, consumer advertising/terms, taxation, virtual
assets, radio equipment/spectrum and third-party connectivity. Requirements
depend on jurisdiction, service, parties, equipment and operational facts.

Provide counsel/regulatory reviewers with the actual intended service,
customer journey, ISP agreement, funds flow, provider contracts, operating
territory, radio device/profile and public claims. Ask them to identify
applicable authorizations, notices, registrations, consumer protections,
payment/AML/virtual-asset responsibilities, tax and spectrum/equipment
requirements. This handbook does not assert whether any such rule applies or
has been satisfied.

## 11. Patent, disclosure and freedom-to-operate questions

The internal dossier notes that current materials primarily describe
integration and deployment of established standards/products. It does not
establish a novel invention, inventorship, novelty, patent ownership,
patentability or freedom to operate.

If a contributor identifies a specific potentially novel technical mechanism:

1. record the mechanism and contribution in a restricted invention disclosure;
2. identify all contributors/inventors and their employment/assignment
   circumstances;
3. preserve dated notebooks, prototypes, source history and third-party
   references;
4. record any public talk, repository push, demo, pitch, customer disclosure,
   paper or external collaboration and dates;
5. avoid making a patentability or exclusivity claim;
6. ask qualified patent counsel to assess inventorship, ownership, prior art,
   disclosure timing, relevant territories and filing strategy; and
7. separately ask about freedom-to-operate or third-party patent risk if the
   product/use changes.

Do not delay safety/security fixes or misrepresent protocol integration as an
invention. A confidential label alone cannot undo a prior public disclosure.

## 12. Release, contribution and maintainer controls

### 12.1 Release gate

Before external code/assets/docs or an operational product are released, the
release owner should confirm a versioned clearance packet:

- source revision, lockfiles, build outputs and release date;
- contributor/assignment status for material included;
- SBOM, dependency/license notices and container/software inventory;
- asset/provenance/permission list with required attribution;
- approved brand lockups, third-party mark references and content permissions;
- public/privacy/security claims review and sanitized evidence;
- required licenses, notices, source offers or attribution bundled as approved;
- provider/ISP/content terms and account/contract status;
- privacy/consumer/regulatory review outcomes or explicit unresolved blockers;
- publication classification, approvers and intended distribution channels; and
- decision to proceed, hold, replace/remove material or limit distribution.

If a material rights issue is unresolved, do not assume that replacing a single
logo or adding a notice cures it. Seek counsel's scoped disposition. Options
may include obtaining permission/assignment, substituting a cleared asset,
removing the component or limiting the distribution pending review.

### 12.2 Contributions and inbound rights

Before accepting outside code, art, copy, photos, translations, configuration
or datasets, publish a counsel-approved contribution process stating:

- who may contribute and how authority/third-party ownership is confirmed;
- what rights or license the project requires and whether the contributor
  retains rights;
- how attribution, license compatibility and confidentiality are handled;
- how security and privacy review applies to contributions;
- how contributions are reviewed, accepted, modified or rejected; and
- how project decisions and any later relicensing are governed.

Do not ask contributors to certify more than the project can reasonably verify.
Do not accept employer-owned, client-owned or community-owned material without
the necessary authority and terms.

### 12.3 Maintainer evidence and change control

Maintain:

- a designated maintainer/rights contact and backup;
- restricted evidence indexes for agreements and legal decisions;
- versioned asset and dependency provenance records;
- release approval and publication-history records;
- a takedown/correction and rights-complaint intake path;
- escalation to counsel for ownership/license disputes or threatened claims;
- periodic review when product, jurisdiction, provider or distribution changes;
- a retention schedule for source evidence and released artifacts; and
- a process for correcting public misstatements without erasing historical
  records.

## 13. Legal-team diligence workflow

### Phase A — establish scope and client

1. Confirm the instructing entity/person, its legal form, jurisdiction,
   affiliates and authorized signatory.
2. Confirm whether counsel represents the entity, founders, contributors,
   site partners or another party; identify potential conflicts.
3. Define the intended decision: internal use, hosted service, source release,
   binary/app distribution, customer sale, brand filing, investment diligence
   or partner agreement.
4. Identify territories, target audience, distribution method and deadlines.
5. Confirm confidentiality, privilege, secure data room and evidence retention.

### Phase B — preserve and inventory

1. Preserve read-only repository snapshots and exact releases without
   rewriting authorship history.
2. Inventory relevant repositories, forks, untracked working materials,
   packages, assets, domains, accounts and deployments.
3. Generate release-specific SBOM and asset/provenance manifest.
4. Build the contributor, agreement, provider, content and account-holder
   registers.
5. Identify public disclosures, repository history, marketing, app listings,
   demos and prior partner/customer communications.
6. Keep private operational/customer evidence in a separate restricted
   evidence store.

### Phase C — analyze rights and obligations

1. Reconcile chain of title and missing assignments/licenses.
2. Resolve dependency, font, image, content, data, provider and API terms.
3. Review brand clearance and permitted third-party mark use.
4. Review privacy/data, telecom/ISP, customer, payment/tax and spectrum
   questions based on actual operating facts.
5. Review specific invention disclosures and any third-party rights concerns.
6. Identify release blockers, mitigations, owners and required approvals.

### Phase D — decide, implement and preserve

1. Record authorized decisions and conditions in the restricted decision log.
2. Execute assignments, permissions, notices, licenses or contract changes
   through authorized signatories.
3. Implement only counsel/owner-approved repository notices and public copy.
4. Confirm public repository visibility and history are consistent with the
   information classification; do not publish confidential dossier material.
5. Archive executed instruments, cleared asset manifests, exact release
   hashes and approved statements.
6. Set review triggers for ownership changes, new contributors/assets,
   countries, providers, product scope or distribution.

## 14. Decisions and evidence register

The register below identifies work; it does not assign a legal result or
replace counsel's privileged advice. Fill names, dates and statuses in the
authorized internal tracker, not by inserting personal or confidential
details into this public-facing handbook.

| ID | Question/decision | Current evidence status | Required reviewer/output |
| --- | --- | --- | --- |
| IP-01 | Which legal entity/person is the intended owner/licensor of each asset class? | Not established in reviewed records | Entity documentation, asset scope and counsel-confirmed ownership position |
| IP-02 | Who contributed source, design, docs, network work and media, and under what agreements? | Git history is incomplete evidence; agreements not compiled here | Restricted contributor/chain-of-title register and executed instruments |
| IP-03 | What source, docs, scripts, config, assets and hosted-service distribution policy is intended? | No final policy recorded; dossier observed no root license at 6 October review | Authorized business decision and counsel-reviewed license/notice package |
| IP-04 | Are direct/transitive dependencies and runtime/container materials compatible with intended use? | Indicative list only; no complete release-specific clearance shown | SBOM, notice inventory and resolved exceptions for exact release |
| IP-05 | Is Mesh/Afribit naming available and what mark strategy is appropriate? | Internal naming direction only; no clearance conclusion | Search, jurisdiction/class strategy, owner and approved brand rules |
| IP-06 | Are photos, fonts, logos, icons, illustrations, generated art and education PDFs cleared for each use? | Multiple source notes exist; complete asset register/permissions not established | Asset manifest, licenses/releases/permissions and approved contexts |
| IP-07 | Are provider, ISP, cloud, database, hosting and app-store terms compatible with service use? | Provider integrations and dependencies are documented; current contract review not established | Contract/API terms register and authorized commercial/legal review |
| IP-08 | What privacy/telecom/payment/tax/consumer/radio requirements apply in each territory? | No legal determination in this dossier/handbook | Qualified jurisdiction-specific advice based on actual operating facts |
| IP-09 | Is any specific contribution an invention requiring early review? | No patentable invention established | Restricted invention disclosure and patent-counsel assessment if warranted |
| IP-10 | What may be public versus internal/confidential, and who approves release? | Internal dossier locally excluded from Git; broader classification/approval owner must be confirmed | Approved classification, release checklist, access/retention and disclosure route |
| IP-11 | What terms apply to inbound community, partner, employee and contractor contributions? | No comprehensive contribution process recorded here | Counsel-reviewed inbound policy, agreements and authorized acceptance process |
| IP-12 | Who maintains rights evidence, notices, takedowns and periodic review? | Named rights owner not recorded | Primary/backup role, restricted evidence repository, cadence and escalation |

### 14.1 Legal-team packet checklist

Assemble a restricted diligence packet with:

- instructing entity and authorized decision-maker;
- exact source/release identifiers and read-only repository snapshots;
- contribution/assignment/contract register and known gaps;
- release-specific SBOM, asset and content provenance manifests;
- current brand samples, domains, app listings and actual mark uses;
- provider, ISP, cloud, database, payment, site and content agreements;
- product/customer flow and funds-flow diagrams with dummy data;
- privacy/data map and operational geography;
- public disclosure timeline and prior marketing/pitches/demos;
- security/release/field evidence with scope and known limitations; and
- a question list ranked by release blocker, exposure and decision deadline.

Use synthetic identifiers in general review materials. Share confidential
contracts, personal data, source snapshots or security evidence only through
the approved secure channel and on a need-to-know basis.

## 15. Source records

| Topic | Source |
| --- | --- |
| Internal legal-team brief and detailed diligence questions | [Project IP, Brand and Technical Stewardship Dossier](../../PROJECT_IP_AND_LEGAL_STEWARDSHIP.md) — internal working document; retain its local restricted handling |
| Handbook evidence and status | [Volume 00](00-start-here.md) |
| Product identity and customer-facing limits | [Volume 01](01-product-and-service.md) |
| Code architecture and dependency boundaries | [Volume 05](05-architecture.md); [API/data contracts](06-api-and-data.md) |
| Field/operations scope and information handling | [Volume 02](02-field-deployment.md); [operations and reliability](09-operations.md) |
| Privacy/security and secret handling | [Volume 08](08-security-and-privacy.md) |
| Apps and third-party service scope | [Volume 10](10-apps-and-local-services.md) |
| Brand mark and portal artwork evidence | [Captive art direction](../mesh-captive-art-direction.md); [official app-mark sources](../../../public/images/apps/SOURCES.md) |
| Font provenance and router asset use | [Captive shell](../mesh-captive-shell.md); [voucher artwork/provenance](../mesh-physical-voucher-cards.md) |
| Learning resource source and copy limits | [Free learning entry](../mesh-free-access.md#learning-sites) |
| Community, contributor and site roles | [Scale and community governance](11-scale-and-governance.md) |
| Documentation plan and release status | [Mesh documentation plan](../mesh-documentation-plan-and-toc.md) |

Re-check the actual repository, agreements, release artifacts, service
contracts, brand uses and operating jurisdictions before relying on any
observation. Keep legal conclusions and executed instruments in the
authorized internal record, not in this general handbook.
