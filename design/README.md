# Design source of truth — Wonderelo redesign

Exports from the Claude **project** (the fine-tuned per-page designs) live here.
This folder is the **baseline for change detection** — it is NOT imported by the
app and never ends up in the build.

## Workflow (each time the design changes)

1. Export the page(s) from the Claude project.
2. Drop the file(s) into this folder, **keeping filenames stable across exports**
   (same page → same filename every time, so `git diff` is meaningful).
3. Tell Claude Code: "nová verzia dizajnu".
4. Claude runs `git diff design/`, sees exactly what changed (files + lines),
   and ports the change into the matching React component(s) in `src/`.
5. The new export is committed as the new baseline.

## Naming (v1 — finalised after the first real export)

One file per app screen, kebab-case matching the route/component, e.g.:

```
event-page.<ext>          → UserPublicPage
participant-dashboard.<ext> → ParticipantDashboard
meeting-point.<ext>       → MatchInfo
find-each-other.<ext>     → MatchPartner
networking.<ext>          → MatchNetworking
contact-sharing.<ext>     → ContactSharing
```

Admin (`/admin/*`) is out of scope and keeps the old design.
