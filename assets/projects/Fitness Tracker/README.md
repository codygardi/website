# Fitness Tracker

Fitness Tracker is now a schedule-style MkDocs planner built around a premium daily landing view with a read-only
monthly tracking tab. The daily page shows the workout for the selected date and is the only place where a workout can
be marked done. The tracking tab provides a month-to-month calendar breakdown so people can stay on the routine and
track how long they have been working out.

## What Is Included

- a complete MkDocs configuration in `mkdocs.yml`
- a daily-first planner entry point in `docs/index.md`
- custom documentation styling in `docs/assets/stylesheets/extra.css`
- planner logic in `docs/assets/javascripts/weekly-planner.js`
- generated static output in `site/` for direct website linking

## Local Setup

1. Create and activate a virtual environment.

   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install the documentation dependencies.

   ```powershell
   py -3.12 -m pip install -r requirements.txt
   ```

If `py` is not available, use your local Python executable with the same `-m` commands.

## Run Locally

Start the MkDocs development server from the `assets/projects/Fitness Tracker/` directory:

```powershell
py -3.12 -m mkdocs serve
```

MkDocs will print a local preview URL, typically `http://127.0.0.1:8000/`.

## Build the Static Site

Generate the production-ready static documentation:

```powershell
py -3.12 -m mkdocs build --strict
```

Strict mode is enabled so broken links and invalid page references are caught during the build.

## Project Structure

```text
Fitness Tracker/
|-- docs/
|   |-- assets/
|   |   |-- images/
|   |   |-- javascripts/
|   |   `-- stylesheets/
|   `-- index.md
|-- mkdocs.yml
|-- requirements.txt
`-- site/
```
