# OU PYQ Portal

Previous year question papers, filtered by branch, semester, subject and year.

## Run

Needs Node 20 or newer.

```
npm install
npm start
```

- Students: http://localhost:3000
- Admin: http://localhost:3000/admin.html

PDFs are saved to `uploads/<branch>/<semester>/<subject>/` and indexed in `data.db`.
Both are created on first run.

## Checking the server's validation

This skips the browser entirely, so the HTML and JS checks never run.
On Windows, type `curl.exe` instead of `curl`.

```
curl -i -F branch=CSE -F semester=5 -F "subject=dbms 1" -F year=2024 -F exam_type=main -F paper=@any.pdf http://localhost:3000/api/papers
```

The server answers `400 Invalid subject`.
