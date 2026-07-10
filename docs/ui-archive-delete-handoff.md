# UI Handoff: Archive And Delete For Reports, Sites, And Clients

This API update adds the backend surface needed for archive/delete UI flows.

## Resource Mapping

- UI `sites` map to API `projects`.
- UI `reports` map to API `reports`.
- UI `clients` map to API `clients`.

Archive is reversible. Delete is permanent.

## Shared List Status

The main list endpoints now support:

```txt
status=active | archived | all
```

Default is `active`.

Use `status=archived` for archive views/bins. Use `status=all` only when the UI genuinely needs mixed active and archived records.

## Clients

### Types

```ts
type Client = {
    id: string;
    name: string;
    archivedAt: string | null;
    createdAt: string;
};
```

### Endpoints

- `GET /clients?page=1&limit=10&search=&sort=createdAt&order=desc&status=active`
- `POST /clients`
- `GET /clients/:id`
- `PATCH /clients/:id`
- `POST /clients/:id/archive`
- `POST /clients/:id/restore`
- `DELETE /clients/:id`

Create/update body:

```json
{
    "name": "Crayons & Code"
}
```

Deleting a client is permanent. Any assigned projects keep existing, but their `clientId` becomes `null`.

## Sites

Sites are returned by the existing project endpoints.

### Type Additions

```ts
type Project = {
    id: string;
    name: string;
    url: string;
    clientId: string | null;
    archivedAt: string | null;
    createdAt: string;
};
```

### Endpoint Changes

- `GET /projects?...&status=active` excludes archived projects by default.
- `POST /projects` accepts optional `clientId`.
- `PATCH /projects/:id` accepts optional `clientId`, including `null` to unassign.
- `POST /projects/:id/archive` archives a site and returns the project.
- `POST /projects/:id/restore` restores a site and returns the project.
- `DELETE /projects/:id` still permanently deletes a site and cascades report data.

Create body with client:

```json
{
    "name": "Client site",
    "url": "https://example.com",
    "clientId": "client-id"
}
```

## Reports

### Type Addition

```ts
type Report = {
    // existing report fields
    archivedAt: string | null;
};
```

### Endpoint Changes

- `GET /projects/:id/reports?...&status=active` excludes archived reports by default.
- `POST /reports/:id/archive` archives a report and returns the report.
- `POST /reports/:id/restore` restores a report and returns the report.
- `DELETE /reports/:id` still permanently deletes a report.
- `GET /reports/:id` can still fetch an archived report directly for detail/archive screens.

Archived reports are excluded from project summaries, report lists, comparisons, and report group trend data.

## Suggested UI Work

1. Add overflow/action menus to client, site, and report rows.
2. Offer `Archive` as the default reversible removal action.
3. Place `Delete permanently` behind a stronger confirmation step.
4. Add archive views or tabs for clients, sites, and reports using `status=archived`.
5. Add restore actions in archive views.
6. Add optional client assignment to site create/edit forms.
7. Refresh or invalidate list queries after archive, restore, or delete.

## Accessibility Notes

- Use native `button` elements for actions.
- Confirm destructive actions in a real dialog with focus trapping and focus return.
- Use clear accessible names, for example `Archive report Homepage audit`.
- Announce successful archive/restore/delete actions with the app's existing status messaging pattern.
- Keep archive and delete separate in menus so permanent deletion is not easy to trigger accidentally.

## Risk Notes

- Archive is soft delete via `archivedAt`.
- Delete is hard delete.
- Project/site delete cascades report groups and reports through database foreign keys.
- Client delete unassigns projects rather than deleting them.
