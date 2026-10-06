# Frame curation: draft for confirmation (2026-10-02)

Nothing expensive has been run. `frame.json` now holds a **draft** `include` on every row (`include_basis: draft_2026-10-02`).
It was **not** checked against the official registers (see "What I could not do").

## Problems found in the frame inherited from the handoff

1. **Duplicates.** The "181 `university_name`" rows were 145 unique institutions (127 duplicate rows in the whole frame). ROR paging is unstable.
2. **Omissions.** The same unstable paging dropped 119 records, including about 25 genuine universities: Manchester, Liverpool, Durham, Nottingham,
   Edinburgh, St Andrews, Heriot-Watt, Queen Mary, Kent, UEA, Lincoln, Northumbria, Roehampton, UAL, London South Bank, Norwich University of the Arts and others.
   Fixed by re-crawling with several query variants and taking the union by `ror_id`. GB reached 576 of the 587 records ROR reports; 11 were not reachable.
3. **Tier heuristic.** `tier` is by name only: Imperial, KCL, LSE, LSHTM and Trinity College Dublin sat in `other_candidate`.
4. **ROR typing.** Munster Technological University is typed `facility,funder` in ROR, so a `types:education` crawl never sees it. Added by hand.
   Other such cases may exist; University of Bolton did not turn up at all.

## Draft result (623 rows)

| `include` | Rows | Meaning |
|---|---|---|
| true | 170 | England 124, Scotland 16, Wales 8, Northern Ireland 4, Ireland 18 |
| null | 55 | needs a decision: specialist/small HE providers (conservatoires, art schools, private colleges, osteopathy, theology), overseas satellites, University of London |
| false | 398 | FE colleges, professional bodies, research institutes, schools, alliances, federal bodies, closed institutions (each has `include_reason`) |

## What I could not do

- **OfS register (England):** `register.officeforstudents.org.uk` returns HTTP 403 to automated requests. Not worked around. England `true` rows are
  by name and background knowledge, not by register. Please download the register CSV on a normal machine, or confirm the list by eye.
- SFC, Medr, DfE-NI and HEA lists were not cross-checked either. The 4 NI, 8 Wales, 16 Scotland and 18 Ireland counts match my understanding of those
  sectors but are unverified.

## Decisions needed from you

1. Is the 170-row draft the target, with the 55 `null` rows excluded unless you say otherwise?
2. Register check for England (OfS CSV from you), and add University of Bolton and any other providers ROR lacks.
3. Run size (see below).

## Budget (about 14.9M tokens left at this point)

Per the handoff rates, 170 institutions cost about 3.1M for discovery plus about 9.4M for coding (170 x 55k), plus about 0.5M for the 10% second
coding, giving about 13M. That leaves under 2M for orchestration, retries, the PGR/staff layer and fixes, which is not a safe margin. Coding rates
came from long pilot documents and could run higher. **The full run does not fit with margin.**

Proposed stratified subset of about 60 (cost about 4.4M, leaving room for the PGR/staff extension on about 20 of them):
all 4 Northern Ireland, all 8 Wales, 12 of 16 Scotland, 10 of 18 Ireland (all 5 technological universities, plus TCD, UCD, UCC, UL, DCU),
and 28 England drawn by seed from strata of Russell Group, other pre-1992, post-1992 and specialist/private.
