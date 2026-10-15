# OU PYQ Portal

Previous year question papers, filtered by branch, semester, subject and year.

It is a static site. The PDFs live in this repo, and `build-index.js` turns
their folder paths into `public/papers.json`, which the page searches.
GitHub Pages rebuilds and publishes it on every push to `main`.

## Run locally

Needs Node 20 or newer.

```
npm start
```

## Adding a paper

Every paper goes at

```
public/papers/<branch>/<semester>/<SUBJECT>/<SUBJECT>-<year>.pdf
```

with `-backlog` before `.pdf` for a backlog exam, for example
`public/papers/CSE/5/DBMS/DBMS-2025-backlog.pdf`.

- Branch: CSE, AIML, ECE, EEE, MECH, CIVIL or IT
- Semester: 1 to 8
- Subject: 2 to 6 capital letters, like DBMS
- PDF only, at most 10 MB.

PDFs are compressed automatically when you commit. Set it up once per clone:

```
pip install pymupdf
git config core.hooksPath .githooks
```

The site build also compresses anything that got in without the hook.

**With a pull request:** on GitHub, open the folder the paper belongs in,
choose *Add file → Upload files*, and drop the PDF. If the subject folder
doesn't exist yet, drag in a folder named after the subject with the PDF
inside. GitHub opens the pull request for you. Its check fails if the name
or the file is wrong.

**Without git:** open an issue with the *Submit a question paper* form and
attach the PDF. A maintainer adds it.

## Publishing

One time, in the repo's *Settings → Pages*, set *Source* to *GitHub Actions*.
