# Website design implementation task

## Goal

Bring Adriamics’ public website into line with `adriamics_recursive_website_design.md`: explain the Study → Frame → Solar Tug system at a glance, keep the presentation restrained, and derive public project facts from the controlled registry.

## Work items

- [x] Keep the homepage hero focused on “We build engineers and physicists” with a quiet engineering drawing and minimal navigation.
- [x] Present Study, Frame, and Solar Tug as one Learn → Build → Prove sequence, with one diagram per project.
- [x] Keep homepage status in one compact strip, with Study topic count generated from the Study manifest.
- [x] Keep project metadata in `website/public.json` and validate IDs, URLs, and required fields during build.
- [x] Render shared navigation, homepage sequence, and status from the public project registry.
- [x] Use registry facts for Frame and Solar Tug detail page headlines and status; keep Solar Tug technical details explicitly unpublished.
- [x] Preserve static HTML functionality and reduced-motion support.
- [ ] Verify desktop and mobile layouts in the local preview.

## Acceptance checks

- A new visitor can understand the thesis and three-step system without reading a long paragraph.
- Project facts are editable in one public registry and do not depend on private Frame data.
- The site remains usable when JavaScript is disabled.
- The build succeeds and generated pages contain no unresolved project placeholders.
