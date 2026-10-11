# User guide

## Overview

The Overview page summarizes case volume, open cases, average resolution time, customer satisfaction, case categories, and priority distribution. The preview banner indicates when the page is using sample data instead of the API/database.

## Import a CSV

1. Choose **Import data**.
2. Select a `.csv` file with the required headers: `case_type`, `status`, `priority`, `owner`, and `created_at`.
3. Select **Validate & import**. The API validates headers, dates, text lengths, and optional numeric fields.
4. Review imported/rejected counts. Correct any reported row errors and import again if needed.

Optional columns are `id`, `resolution_hours`, `satisfaction`, and `amount`. If `id` is omitted, the API generates one. Duplicate IDs update the existing case row.

## Search, filter and export

- Use the top search field to search case ID, case type, or owner.
- Choose a reporting period above Performance overview.
- Use the Recent cases status filter to narrow the list.
- Select **Export** to download the currently displayed rows as CSV.

## Troubleshooting

- If the preview banner stays visible, start the API and check `http://localhost:4000/api/health`.
- If the health endpoint reports a database issue, confirm PostgreSQL is running and `DATABASE_URL` is set in the API process environment.
- If a CSV upload fails, check the required headers and ensure the file is smaller than the configured upload limit.
