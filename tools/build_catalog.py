#!/usr/bin/env python3
"""Rebuild the lobby display catalogue.

Sources: the `leader` CLI decides WHAT we show (only SKUs Leader carries).
store.ui.com supplies HOW it is shown (official name, description, spec rows, render).

Outputs: js/catalog.js, assets/products/*.webp, ../context/09-lobby-product-list.md

Fields are whitelisted below. Prices and stock never reach js/catalog.js because this is a
public-facing screen. Stock appears only in the internal review list in context/.

Also updates the ?v= version numbers in index.html so displays fetch changed files.

Run from anywhere:  python lobby-display/tools/build_catalog.py [--no-images]
After editing app.js, app.css or the video:  python lobby-display/tools/build_catalog.py --stamp-only
"""
import collections, datetime, json, pathlib, re, subprocess, sys, urllib.parse, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parents[1]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36"

QUERIES = """ubiquiti unifi|unifi access|access reader|access hub|access intercom|intercom|door hub|UA-|UA G2|UA G3|UA Ultra|UA Lite|UA Hub
unifi protect|protect camera|UVC|UVC-G5|UVC-G6|UVC-AI|G4|G5|G6|AI Pro|AI Theta|NVR|UNVR|ENVR|UP Sense|doorbell|viewport|UP-
enterprise|enterprise nvr|enterprise campus|ECS|EFG|enterprise fortress|E7|U7 enterprise|aggregation|USW-Enterprise|USW-Pro|UXG Enterprise|EAS|NHU|ubiquiti
Require Deal Reg|Avail for Deal Reg|Deal Reg|Enterprise Access Hub|EAH|Access Hub Door|UA-Hub|UA-Ultra|UA-Intercom|UA-G3|UACC-Reader|UACC-Lock|Touch Pass
G6 Entry|G6 Mini|G4 Instant|G4 Bullet|G4 Pro|G4 Dome|G5 Flex|AI Bullet|AI 360|AI DSLR|UVC-AI-360|Super Link|USL-|ENAS|ECS-|EF-|EAV""".replace("\n", "|").split("|")
STORE_PAGES = ["all-door-access", "all-physical-security", "all-switching", "all-wifi", "all-cloud-gateways", "all-integrations", "accessories-cables-dacs"]

ACCESS_TABS = {"door-access-readers": "Readers", "door-access-hub": "Hubs", "door-access-starter-kit": "Kits", "door-access-intercoms": "Intercoms", "door-access-accessories": "Accessories"}
PROTECT_TABS = {"physical-security-dome-turret": "Dome & Turret", "physical-security-bullet": "Bullet", "physical-security-compact": "Compact", "physical-security-ptz": "PTZ", "physical-security-doorbells": "Doorbells", "physical-security-nvr": "NVRs", "physical-security-sensors-alarms": "Sensors & Alarms", "physical-security-accessories": "Accessories"}
TAB_ORDER = {
    "access": ["Readers", "Hubs", "Kits", "Intercoms", "Accessories"],
    "enterprise": ["Switching", "WiFi", "Gateways", "Video", "Storage & Accessories"],
    "protect": ["Dome & Turret", "Bullet", "Compact", "PTZ", "Doorbells", "NVRs", "Sensors & Alarms", "Accessories"],
}
# Judgement calls, listed in the review doc.
FORCE_TAB = {("access", "ua-g3-intercom"): "Intercoms", ("access", "ua-ultra"): "Readers"}
ALSO_IN = {"uvc-g6-entry": ("protect", "Doorbells"), "uvc-g6-pro-entry": ("protect", "Doorbells")}
ENTERPRISE_TAB = {"eav-bridge": "Switching"}
# Leader files these under Door Access; they are Connect, EV and demo kit products.
EXCLUDE_MANUF = re.compile(r"^(UACC-Display|UC-EV|UDK-01)", re.I)
# Could look in scope, but the rules above leave them out. Listed so sign-off can overrule.
NOTE_LEFT_OFF = {
    "NHU-UDR7-G6-INS-2": "Console bundle with cameras, filed under Console / Gateway, no store page",
    "NHU-UDR7-G6-INS-4": "Console bundle with cameras, filed under Console / Gateway, no store page",
}
SCOPE_SUB = re.compile(r"^(door-access-(readers|hub|starter-kit|intercoms|accessories)|physical-security-)")


def stamp_versions():
    page = ROOT / "index.html"
    version = datetime.datetime.now().strftime("%Y%m%d%H%M")
    page.write_text(re.sub(r"\?v=\d+", f"?v={version}", page.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"index.html version {version}")


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def strip_colour(s):
    return re.sub(r"-?(black|white|b|w)$", "", s, flags=re.I)


def fetch_leader():
    products = {}
    for q in QUERIES:
        out = subprocess.run(["leader", "search", q, "--json", "--agent", "--no-input"], capture_output=True, text=True, encoding="utf-8")
        try:
            rows = json.loads(out.stdout)
        except json.JSONDecodeError:
            print(f"  ! no JSON for query {q!r}")
            continue
        if isinstance(rows, dict):
            rows = rows.get("results") or rows.get("data") or []
        for p in rows or []:
            if p.get("VendorName") == "Ubiquiti" and p.get("Category") == "Network - UniFi":
                products[p["PartNum"]] = p
    return products


def fetch_store():
    products, subs, order = {}, collections.defaultdict(list), {}

    def find(o, out):
        if isinstance(o, dict):
            if "variants" in o and "title" in o and "slug" in o:
                out.append(o)
                return
            for v in o.values():
                find(v, out)
        elif isinstance(o, list):
            for v in o:
                find(v, out)

    for page in STORE_PAGES:
        req = urllib.request.Request(f"https://store.ui.com/us/en/category/{page}", headers={"User-Agent": UA})
        body = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
        data = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S).group(1))
        for sc in data["props"]["pageProps"].get("subCategories") or []:
            found = []
            find(sc, found)
            for p in found:
                subs[p["slug"]].append(sc.get("id"))
                products.setdefault(p["slug"], p)
                order.setdefault(p["slug"], len(order))
    return products, subs, order


def spec_rows(p):
    for sec in ((p.get("technicalSpecification") or {}).get("sections") or []):
        if sec["section"].get("slug") == "grid-overview":
            return [{"v": f["value"], "i": f["feature"].get("icon")} for f in sec["features"] if f.get("value")][:4]
    return []


def main():
    if "--stamp-only" in sys.argv:
        stamp_versions()
        return
    want_images = "--no-images" not in sys.argv
    print("Leader catalogue...")
    leader = fetch_leader()
    print(f"  {len(leader)} UniFi SKUs")
    print("Store...")
    store, subs, order = fetch_store()
    print(f"  {len(store)} store products")

    index = {}
    for slug, p in store.items():
        for key in [p.get("displaySku"), p.get("name"), slug] + [v.get("sku") or v.get("displaySku") for v in p.get("variants", [])]:
            if key:
                index.setdefault(norm(key), slug)

    groups, dropped = collections.OrderedDict(), []
    for part, p in sorted(leader.items()):
        name, sub, manuf = p["ProductName"], p.get("SubCategory"), p["PartNumManuf"]
        flag = "require" if re.search(r"requires? deal.?reg", name, re.I) else ("avail" if re.search(r"deal.?reg", name, re.I) else "")
        clean = re.sub(r"\s+", " ", re.sub(r"^Ubiquiti\s+", "", name))[:70]
        bare = part.replace("NHU-", "")
        slug = next((index[norm(c)] for c in (manuf, strip_colour(manuf), bare, strip_colour(bare)) if norm(c) in index), None)
        if not slug and (re.search(r"pack|oem", name + part, re.I) or re.search(r"-\d+$", bare)):
            base = re.sub(r"-\d+$", "", bare)
            slug = next((index[norm(c)] for c in (base, strip_colour(base)) if norm(c) in index), None)
        in_leader_scope = sub in ("Door Access", "Access Accessories", "Protect", "Protect Accessories", "Campus / Enterprise") or flag
        in_store_scope = bool(slug) and any(SCOPE_SUB.match(x or "") for x in subs[slug])
        if part in NOTE_LEFT_OFF:
            dropped.append((part, manuf, NOTE_LEFT_OFF[part], clean))
            continue
        if not (in_leader_scope or in_store_scope):
            continue
        if EXCLUDE_MANUF.match(manuf):
            dropped.append((part, manuf, "Connect, EV or demo kit product filed under Door Access", clean))
            continue
        if not slug:
            dropped.append((part, manuf, "no current store page", clean))
            continue
        stock = sum(p.get(k) or 0 for k in ("AvailNsw", "AvailQld", "AvailSa", "AvailVic", "AvailWa"))
        g = groups.setdefault(slug, {"parts": [], "flags": set(), "leader": set(), "stock": 0})
        g["parts"].append(part)
        g["flags"].add(flag)
        g["leader"].add(sub)
        g["stock"] += stock

    items = []
    for slug, g in groups.items():
        p, ss = store[slug], subs[slug]
        placements = []
        if "require" in g["flags"]:
            joined = " ".join(ss)
            tab = "Storage & Accessories"
            if "switching" in joined:
                tab = "Switching"
            elif "wifi" in joined:
                tab = "WiFi"
            elif re.search("cloud-gateways|advanced-hosting", joined):
                tab = "Gateways"
            elif re.search("physical-security-(nvr|ptz)|door-access-nvrs", joined):
                tab = "Video"
            placements.append(("enterprise", ENTERPRISE_TAB.get(slug, tab)))
        else:
            a = [ACCESS_TABS[s] for s in ss if s in ACCESS_TABS]
            b = [PROTECT_TABS[s] for s in ss if s in PROTECT_TABS]
            if a:
                placements.append(("access", a[0]))
            if b:
                placements.append(("protect", b[0]))
            if not placements:
                if g["leader"] & {"Door Access", "Access Accessories"}:
                    placements.append(("access", "Accessories"))
                if g["leader"] & {"Protect", "Protect Accessories"}:
                    placements.append(("protect", "Accessories"))
            if slug in ALSO_IN and ALSO_IN[slug] not in placements:
                placements.append(ALSO_IN[slug])
        if not placements:
            for part in g["parts"]:
                product = re.sub(r"\s+", " ", re.sub(r"^Ubiquiti\s+", "", leader[part]["ProductName"]))[:70]
                dropped.append((part, leader[part]["PartNumManuf"], "Filed under Campus / Enterprise with no deal-registration flag; the store lists it outside Access and Protect", product))
        for rng, tab in placements:
            items.append({
                "range": rng,
                "tab": FORCE_TAB.get((rng, slug), tab),
                "slug": slug,
                "title": p.get("title"),
                "sku": re.sub(r"\s*\(\d+W\)$", "", p.get("displaySku") or ""),
                "desc": p.get("shortDescription") or "",
                "specs": spec_rows(p),
                "badge": "required" if "require" in g["flags"] else ("available" if "avail" in g["flags"] else ""),
                "_thumb": (p.get("thumbnail") or {}).get("url"),
                "_parts": g["parts"],
                "_stock": g["stock"],
                "_order": order.get(slug, 9999),
            })
    items.sort(key=lambda x: (TAB_ORDER[x["range"]].index(x["tab"]), x["_order"]))

    if want_images:
        print("Images...")
        out_dir = ROOT / "assets" / "products"
        out_dir.mkdir(parents=True, exist_ok=True)
        for it in {i["slug"]: i for i in items}.values():
            target = out_dir / f"{it['slug']}.webp"
            if target.exists() or not it["_thumb"]:
                continue
            url = "https://images.svc.ui.com/?" + urllib.parse.urlencode({"u": it["_thumb"], "q": 80, "w": 640})
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/webp"})
            target.write_bytes(urllib.request.urlopen(req, timeout=60).read())

    today = datetime.date.today().isoformat()
    public = {"generated": today, "tabs": TAB_ORDER, "products": [{k: v for k, v in i.items() if not k.startswith("_")} for i in items]}
    (ROOT / "js").mkdir(exist_ok=True)
    (ROOT / "js" / "catalog.js").write_text(
        "/* Generated by tools/build_catalog.py. Do not edit by hand. No prices or stock by design. */\n"
        "window.CATALOG = " + json.dumps(public, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")

    # Internal review list
    titles = {"access": "UniFi Access", "enterprise": "UniFi Enterprise", "protect": "UniFi Protect"}
    md = [
        "# Lobby Display Product List (for sign-off)", "",
        f"> Generated by `lobby-display/tools/build_catalog.py` on {today} from the `leader` CLI (what Leader carries) and store.ui.com (names, descriptions, specs, renders).",
        "> Internal only. The stock column does not appear on the display.",
        "> **Pending `Q-SALES-DEF` and `Q-DEALREG-DEF`:** no official qualifying SKU list exists. This list is derived, not a confirmed promo rule.", "",
        "## How products were sorted", "",
        "- **UniFi Enterprise:** Leader's product name carries `*Require Deal Reg*`. These appear in Enterprise only.",
        "- **UniFi Access / UniFi Protect:** the store's Door Access and Physical Security categories, limited to SKUs Leader carries. `Avail for Deal Reg` items stay here with a Partner Program badge.",
        "- **NVRs** appear under Protect only, though the store also lists them under Door Access.",
        "- **G6 Entry and G6 Pro Entry** appear under both Access and Protect, because both ranges support them natively.",
        "- Colour variants and OEM multi-packs roll up into one card, as on the store.", ""]
    for rng in ("access", "enterprise", "protect"):
        rows = [i for i in items if i["range"] == rng]
        md += [f"## {titles[rng]} ({len(rows)} cards)", "", "| Tab | Product | Store SKU | Leader SKUs | Deal Reg | Stock at build |", "|---|---|---|---|---|---|"]
        for i in rows:
            md.append(f"| {i['tab']} | {i['title']} | {i['sku']} | {', '.join(i['_parts'])} | {i['badge'] or '-'} | {i['_stock']} |")
        md.append("")
    md += ["## Left off the display", "", "| Leader SKU | Manufacturer SKU | Why | Product |", "|---|---|---|---|"]
    md += [f"| {a} | {b} | {c} | {d} |" for a, b, c, d in dropped]
    (ROOT.parent / "context" / "09-lobby-product-list.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    stamp_versions()
    print(collections.Counter(i["range"] for i in items), "dropped", len(dropped))
    icons = collections.defaultdict(list)
    for i in items:
        for s in i["specs"]:
            if len(icons[s["i"]]) < 3 and s["v"] not in icons[s["i"]]:
                icons[s["i"]].append(s["v"])
    print(json.dumps(icons, ensure_ascii=False))


if __name__ == "__main__":
    main()
