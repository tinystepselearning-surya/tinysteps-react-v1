Short note: react-force-graph usage and npm audit
-----------------------------------------------

The package `react-force-graph` is used in the repository at:

- `src/pages/admin/RelationshipManagement/RelationshipGraph.tsx`

This dependency is required for rendering the relationship graph visualization. If npm audit reports a moderate vulnerability in a transitive dependency that cannot be immediately fixed, we will monitor upstream fixes and update the dependency when a patched release is available.

Action items:
- Monitor `react-force-graph` releases and relevant CVEs.
- If the vulnerability is critical and upstream doesn't patch, consider replacing the visualization library.

Contact: engineering@tinysteps (or open an issue on the repo) if you'd like this escalated.
