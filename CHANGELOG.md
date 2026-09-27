# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Integrated `sonner` toast notification system globally via `<Toaster />` in [src/app/layout.tsx](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/src/app/layout.tsx) with rich colors and close button enabled.
- Established persistent AI agent memory architecture with root [BRAIN.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/BRAIN.md), master index [brain/index.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/index.md), and topic modules ([architecture.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/architecture.md), [design_system.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/design_system.md), [features_and_modules.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/features_and_modules.md), [api_contracts.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/api_contracts.md), [routing_and_navigation.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/routing_and_navigation.md), [decisions.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/decisions.md), [design.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/design.md)) for token-efficient targeted development.
- Created [brain/learnings.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/learnings.md) to record self-learned patterns, conventions, developer tips, and edge-case gotchas (LRN-001 through LRN-004).
- Recorded ADR-007 (Approved Visual Design System & High-Contrast Screen Layouts) in [brain/decisions.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/decisions.md).
- Populated [AGENTS.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/AGENTS.md) with operational charter, permitted lightweight verification commands, and changelog/memory maintenance instructions.


### Changed
- Enhanced [.gitignore](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/.gitignore) with exceptions for `.env.example`, IDE configuration filters, OS system files, Turbopack cache (`.turbo/`), test reports, and logs.
- Updated [brain/design_system.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/design_system.md) with exact color palette tokens (`#0066FF` royal blue primary, `#00C48C` training green, `#0B0F17` obsidian dark canvas, `#FFFFFF`/`#F8FAFC` light canvas), pill button styles, cards, and form inputs from the approved high-fidelity design mockups.
- Expanded [brain/design.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/design.md) with Section 5 defining detailed UI layout specifications and component blueprints for all 8 approved screens (Home, Academy, Training, App Showcase, Course Catalog, Course Detail, App Pricing, Contact).
- Added Section 7 to [brain/architecture.md](file:///c:/Users/Anurag/Downloads/Project/Library@Intern/EurekaSportFitenessFrontend/brain/architecture.md) detailing Component Authoring Standards & Conventions (3-tier directory structure, RSC by default, explicit props typing, `cn` class merging, pill token strictness, accessibility).


