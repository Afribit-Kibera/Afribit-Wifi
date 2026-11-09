# Mesh: a community network for Kibera

**The idea in one line:** Mesh is a network the community owns and uses every day. Internet access is one service on it, not the whole point.

*Afribit Africa · November 2026 · Each "##" section is one slide. The notes under each section are the talking points.*

---

## 1. The idea

- Most Wi-Fi in Kibera is sold as "internet or nothing". When the line or the power drops, everything stops.
- Mesh flips that. The network itself is the product:
  - messaging between neighbours,
  - learning material and media stored locally,
  - payments in shillings and Bitcoin,
  - and, later, AI that runs on community hardware.
- The internet is one more layer on top, bought by the hour, day or month.
- If the internet line goes down, Mesh stays up. If a node loses power, its batteries keep it running.

**Talking point:** we are building a local network that happens to sell internet, not an internet reseller.

---

## 2. What already works (live today)

Mesh is running in Kibera now, on our own hardware and software.

| Area | What is live |
|---|---|
| Joining | Open "Mesh" Wi-Fi. A welcome page appears, and the router vouches for the device, so nobody types a MAC address or a password. |
| Passes | Personal, household (several devices on one pass) and TV passes, from 80 minutes to a month. |
| Paying | M-Pesa (through Bitika) and Bitcoin over Lightning, with an admin-set discount for paying in Bitcoin. Printed 6-digit voucher tickets too. |
| Getting back online | A phone that reconnects is restored automatically. Pass codes are saved on the phone. A phone whose pass ended is told so, instead of looking disconnected. |
| TVs | A smart TV shows a QR code. A phone scans it and pays, and the TV comes online by itself. |
| Free on Mesh | Signal, the Blink wallet and selected learning sites work without buying a pass. |
| The Mesh app | Installs from the welcome page and shows your pass, time left and saved codes. |
| Admin | Overview, live connections and history, a pass finder (staff can read a lost code back to its owner; every look is logged), packages and prices, payments, customer notices, router health, disconnect and end pass. |
| Safety | Customers can't reach each other's devices. Router management is never exposed. Every admin page checks sign-in. |
| Without internet | Mesh pages, passes and codes keep working during an internet outage. Mesh shows an outage notice and pauses sales until the line is back. |

**Talking point:** this is a working system, not a slide.

---

## 3. How it fits together today

```
 Phone / TV / laptop
        │  Wi-Fi "Mesh"
        ▼
 UniFi mesh access point
        │  VLAN 30
        ▼
 MikroTik router (HotSpot) ── private encrypted link ──► Mesh server (at home, Proxmox)
        │                                                  • Mesh pages and app
        │                                                  • pass and payment records
        │                                                  • controller (turns access on and off)
        ▼
 Internet line (home ISP)  ◄── a paid service for customers
                           ◄── also how M-Pesa and Bitcoin payments reach us
```

- The router and the Mesh server talk over a private link inside the building. That link doesn't use the internet.
- Phones on Mesh find the Mesh server through the router, not through the internet. That's why Mesh pages still load when the internet line is down.
- From the outside world, Mesh is reached through a Cloudflare Tunnel, so nothing at home is opened to the internet.

---

## 4. When the internet is down

| Keeps working | Pauses |
|---|---|
| The Mesh welcome page and the Mesh app | Buying passes with M-Pesa or Bitcoin (both need the internet) |
| Signing in with a pass code or voucher | Internet browsing for everyone |
| Pass recovery and "your pass ended" messages | "Free on Mesh" internet sites (Signal, Blink, learning sites) |
| Admin pages on the local network | |
| Future local services: chat, learning library, media, AI | |

- Mesh checks the internet line every 20 seconds or so.
- When the line is down, every Mesh page says so, the shop shows "Payments are paused", and the server refuses new payments before contacting any provider.
- Two failed checks in a row are needed before sales pause, so one slow answer doesn't stop sales. Sales resume on the first good check.

**Next step:** add the time lost during an outage back onto live passes, so customers never pay for internet they couldn't use.

---

## 5. Mesh in layers

Think of Mesh as six layers. Each one can grow on its own.

| Layer | What it is | Today | Next |
|---|---|---|---|
| 6. Internet | A paid service on Mesh | One home ISP line | A second line plus a Starlink backup that switches over automatically |
| 5. Apps | What people use | Welcome page, passes, Mesh app | Chat, library, media, AI in one Mesh "super app" |
| 4. Service nodes | Small servers with SSD storage | One server at home | A service node at each big site, copying data between them |
| 3. Routers | Decide who gets what | One MikroTik router | A stronger core router, and operators' routers joining Mesh |
| 2. Links | How sites connect | One access point | More access points and rooftop links between buildings |
| 1. Power | Keeps it all running | Mains power | Batteries and solar at every node, 24 h+ without mains |

**Talking point:** the internet is layer 6. Layers 1–5 are ours and work without it.

---

## 6. Two ways to grow

### A. Grow from our own router

- **Add coverage without new software.** More UniFi mesh access points, and rooftop point-to-point radios to nearby buildings. Every new area joins the same Mesh network.
- **Upgrade the core router.** Today's MikroTik is an older single-core model with 100 Mb ports, good for roughly 50–100 people online at once. A MikroTik RB5009-class router handles many hundreds.
- **Add internet capacity.** A second line, or Starlink, with automatic failover and load sharing.
- **Good for:** growing densely around our first site, fast, with full control.
- **Limits:** we buy and maintain every access point, link and rooftop, and all internet traffic goes through our own lines.

### B. Bring existing operators onto Mesh

Kibera already has people running MikroTik hotspots on their own lines, with their own customers.

- They keep their router, internet line, network name and customers.
- They switch to Mesh's software, payments and app.
- They keep their income, minus a platform fee, and see it in their own admin view.
- **Good for:** covering Kibera quickly, with a local technician at every site.
- **Limits:** mixed hardware and setups. We need clear agreements, trust and fast payouts.

### Recommendation: do both

- Grow our own area around the first site.
- Bring in one friendly operator as a pilot.
- Learn from the pilot, then open onboarding to others.

---

## 7. Onboarding an operator's router without moving customers

1. **Check the router.** It must run RouterOS v7, which our encrypted link needs. Old or very small routers are upgraded or replaced.
2. **Save the current setup**, so we can switch back the same night.
3. **Carry over paid time.** Read every active customer's Wi-Fi address and remaining time off the router and turn them into Mesh passes. Nobody loses time they paid for.
4. **Install Mesh on the router:**
   - the encrypted link to the Mesh server,
   - the welcome pages,
   - the customer-isolation and safety rules,
   - the "Free on Mesh" list.

   Keep the operator's network name, so customers' phones join as before.
5. **Switch over at a quiet hour.** Customers see the new Mesh welcome page and are reconnected automatically.
6. **Afterwards:** the operator gets an admin login for their own site.

**Not covered at first:** monthly home customers on PPPoE (a different login method many operators use). They stay on the operator's current system until Mesh supports it.

---

## 8. Money: operators keep their income

- **Every router is tagged with its owner.** Every purchase already records which router it came from, so each owner's income is a simple total.
- **One ledger per owner:**

  `sales − payment provider fees − Mesh platform fee = owed to the owner`

- **Payouts on a fixed schedule:**
  - Lightning to the owner's Blink wallet: instant and cheap, any time.
  - M-Pesa: needs a business payout account.
- **The operator's view** shows their site's customers, passes, sales and payouts. Operators can set prices within agreed limits.
- **One pass works on every Mesh node.** That's a big draw for customers. The simple rule: the node that sold the pass gets the money.
- **Licensing:** collecting and holding money on others' behalf may need a licence from the Central Bank of Kenya. Check with a lawyer before pooling money. The cleanest model gives each operator their own collection account, so their money never passes through Afribit.

---

## 9. Staying online: servers, payments, domains

### Servers
- **Today:** one Mesh server, at home. If it fails, people already online stay online until their pass ends, but new purchases and codes stop.
- **Planned:**
  - **Cloud standby (LunaNode):** a copy of the database kept a few seconds behind the primary. It takes over if the home server fails.
  - **Local service nodes:** servers at Mesh sites that keep Mesh running offline and share data with each other.
- **One rule:** only one server controls the routers at a time. Two servers both acting as primary would hand out passes twice. Switch-over is one command at first, then automatic once a third "witness" machine is added to break ties.

### Payments
- Bitika for M-Pesa, Paystack as a second M-Pesa option, and Bitcoin Lightning, which works independently of both.
- **Planned:** check each provider's health, hide one that keeps failing, and offer the next.
- **Rule:** never retry a payment with another provider after an M-Pesa prompt may have been sent, or people get charged twice. Mesh already handles the "not sure if it went through" case without charging twice.

### Domain and edge
- A backup domain with a different registrar and DNS provider, allowed on every router.
- Health checks and automatic failover between servers. A scheduled check or a Cloudflare Worker is enough; no AI is needed for this.

---

## 10. Local services: storage, chat, learning, AI

### Service nodes with SSDs
- The MikroTik router has very little memory and can't serve storage, so storage lives in small **service nodes**:
  - low-power mini PCs (Intel N100 class, about 10–15 W), or
  - a Raspberry Pi 5 with an NVMe SSD.
- 1–2 TB per node holds:
  - chat history and media, encrypted
  - an offline library: Wikipedia, Khan Academy-style courses, local knowledge
  - app files and updates, so phones install without the internet
  - AI models
  - a cache of popular internet content, which saves paid bandwidth
- Every piece of data is stored on at least two nodes, because SSDs fail.

### Communication layer
- **Nostr:** a local relay (strfry) plus a media server (Blossom) gives encrypted messages and media. Relays sync with internet relays whenever the line is up. This matches Afribit's existing Bitcoin and Nostr work.
- **Matrix:** self-hosted, end-to-end encrypted and designed to sync between servers. A strong alternative.
- **Not a Signal copy:** Signal's server depends on cloud services and SMS sign-up, and the Signal name and branding can't be reused.
- **Notifications without internet:**
  - Android can use a local push server (ntfy).
  - iPhones only receive background notifications through Apple's servers, so offline the app must be open to receive messages.

### Offline AI
- Open models run on community hardware with no internet.
- **Small models** fit on a mini PC, but they are slow and serve few people at once.
- **Serving a community** needs a GPU machine (150–350 W) or an efficient Mac mini (30–60 W). One machine serves roughly 5–20 people at once with a mid-size model.
- Swahili and Sheng support in open models is weaker than English. Test with real users early.
- **Plan:** one well-powered AI node first, reached from every site over Mesh.

### The Mesh super app
- **One app:**
  - pass and payments (built)
  - chat
  - library
  - media
  - AI
  - community notices (built)
- **Delivered as:**
  - an installable web app (built)
  - Android packages from a local app store on Mesh
- It works fully inside Mesh. The internet adds syncing with the outside world.

---

## 11. Power: 24 hours and more without mains

Kibera loses power often. Each node needs its own battery and solar.

### Power use

| Item | Watts |
|---|---|
| MikroTik router | ~5 |
| Access point | ~10–15 |
| Switch | ~5 |
| Service node (mini PC + SSD) | ~15 |
| **Typical node total** | **~35–40** |
| Starlink Mini backup uplink, if used | +25–40 |
| AI node (one site only) | +150–350 |

### Sizing a typical node

| | Amount | Why |
|---|---|---|
| Energy for 24 h | 40 W × 24 h ≈ **1 kWh** | Typical node load, all day |
| Battery | **1–1.3 kWh LiFePO4** | Lithium iron phosphate: long life, safe |
| Solar panel | **~300 W** | Nairobi gets about 5 hours of strong sun a day; this recharges in a day with margin for cloud |
| Charging | **Grid and solar** | Covers both outages and cloudy days |

### Two ways to build it

| Option | What it is | Strengths | Weaknesses |
|---|---|---|---|
| DC system (best) | 12/24 V LiFePO4 battery, a solar charge controller (for example Victron SmartSolar) and a PoE injector for the access point | No inverter, so about 15% less energy wasted. The MikroTik runs directly on 8–30 V DC. | Needs some installation skill |
| Portable power station (simplest) | For example an EcoFlow Delta 2 (1 kWh) or Bluetti AC180 (1.15 kWh) | Plug and play, with solar input and backup switching built in | Inverter losses and higher cost per kWh |

**Security:** a lockable enclosure, and panels mounted high and secured. Our first router was stolen.

---

## 12. How far it scales

These are rough guides, to be confirmed by measuring on site.

| Piece | Roughly supports | How we grow it |
|---|---|---|
| Today's MikroTik (RB951) | 50–100 people online at once | Upgrade to an RB5009-class core router |
| One access point | 30–60 active devices | Add access points; reduce overlap; add rooftop links |
| One internet line | Depends on the plan; usually the first limit | Add lines and Starlink, with load sharing |
| One Mesh server | Thousands of passes a day | Cloud standby now; more local nodes for offline services |
| Our controller (talks to each router) | A handful of routers | Above about 10 routers, switch to RADIUS, the standard protocol where routers simply ask the server "is this device allowed?" |
| Payments | Limited by providers | Several providers with automatic failover; Lightning for small amounts |

---

## 13. Roadmap

| Phase | What we build | What it unlocks |
|---|---|---|
| **Now** (done) | Passes, TV screen, recovery, admin, outage mode, safety fixes | A dependable first site |
| **1. Stronger core** | Cloud standby on LunaNode; battery and solar for the first site; core router upgrade | The first site survives server and power failures |
| **2. Many routers** | Routers list with owner tags; controller serves several routers; passes roam between sites | A second site can join |
| **3. Operator pilot** | Onboarding script; operator logins; revenue ledger; payouts by hand at first | First partner on Mesh, without moving customers |
| **4. Local services** | First service node with SSDs: chat (Nostr or Matrix), offline library, app store | Mesh is useful without the internet |
| **5. Scale out** | RADIUS for routers; automatic payouts; provider failover; backup domain; witness for automatic server failover | Many operators and sites across Kibera |
| **6. Offline AI** | One AI node on solar plus grid, available across Mesh | AI for everyone on Mesh, internet or not |

---

## 14. Risks and how we handle them

| Risk | How we handle it |
|---|---|
| Theft of equipment | Locked enclosures, mounting high, router credentials replaced after any loss (already done once) |
| Power cuts | Battery and solar at every node; DC power where possible |
| Internet line down | Mesh keeps running; sales pause automatically; a backup uplink is planned |
| Server failure | Cloud standby, then local nodes; only one controller ever active |
| A payment provider fails | Several providers, health checks, never a double charge |
| Money regulation | Each operator collects into their own account; get legal advice before pooling funds |
| Privacy | Customers isolated from each other; no phone numbers in admin views; encrypted chat and storage; every look at a code is logged |
| Operator trust | Each operator sees their own figures; scheduled payouts; operators can leave and take their customer list |

---

## 15. Equipment for one node

| Item | Purpose |
|---|---|
| MikroTik router (RB5009 class for a core site) | Sign-in, rules, passes |
| UniFi mesh access points | Wi-Fi coverage |
| Rooftop point-to-point radios | Links between sites |
| Mini PC with 1–2 TB SSD | Service node: storage and local apps |
| 1–1.3 kWh LiFePO4 battery, charge controller, ~300 W solar panel | 24 h+ autonomy |
| Lockable enclosure | Security |
| Optional: Starlink Mini | Backup internet uplink |

---

## 16. Decisions we need now

1. **LunaNode access** for the cloud standby server.
2. **First operator** to pilot onboarding.
3. **Power budget** for the first site: DC system or portable power station.
4. **Chat platform:** Nostr or Matrix for the communication layer.
5. **Legal check** on collecting and paying out money for operators.

---

## Glossary

- **Pass:** paid internet time for a phone, a household or a TV.
- **Voucher:** a printed 6-digit code that gives a pass.
- **HotSpot:** the MikroTik feature that shows the welcome page and lets paid devices through.
- **Controller:** our software that tells routers which devices get internet, and for how long.
- **Service node:** a small server with SSD storage that runs local apps at a Mesh site.
- **RADIUS:** the standard protocol routers use to ask a server whether a device is allowed online.
- **LiFePO4:** lithium iron phosphate, a long-lasting and safe battery type.
- **Lightning:** the Bitcoin network for small, instant payments.
