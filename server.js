const express = require('express');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

// Escape user input before putting it in HTML, so nobody can inject a <script>.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function page(signups, error) {
  const rows = signups
    .map(
      (s) => `
        <tr>
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.email)}</td>
          <td>${escapeHtml(new Date(s.created_at).toLocaleString('en-CA'))}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AWS 101 sign-up</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; color: #232f3e; }
    form { display: grid; gap: .5rem; margin-bottom: 2rem; }
    input, button { font: inherit; padding: .5rem; }
    button { background: #ff9900; border: 0; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: .4rem; border-bottom: 1px solid #ddd; }
    .error { color: #b00020; }
    .storage { font-size: .85rem; color: #666; }
  </style>
</head>
<body>
  <h1>Sign up</h1>
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
  <form method="post" action="/signup">
    <label>Name <input name="name" required maxlength="100"></label>
    <label>Email <input name="email" type="email" required maxlength="200"></label>
    <button type="submit">Sign up</button>
  </form>

  <h2>Signed up (${signups.length})</h2>
  <table>
    <thead><tr><th>Name</th><th>Email</th><th>When</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="3">Nobody yet.</td></tr>'}</tbody>
  </table>
  <p class="storage">Stored in: ${escapeHtml(store.description)}</p>
</body>
</html>`;
}

app.get('/', async (req, res, next) => {
  try {
    res.send(page(await store.listSignups()));
  } catch (err) {
    next(err);
  }
});

app.post('/signup', async (req, res, next) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();

  if (!name || !email) {
    return res.status(400).send(page(await store.listSignups(), 'Name and email are both required.'));
  }

  try {
    await store.addSignup(name, email);
    // Redirect after POST so refreshing the page does not submit the form twice.
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong. Check the terminal running the app for the error.');
});

store
  .init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App running on port ${PORT}, storing sign-ups in: ${store.description}`);
    });
  })
  .catch((err) => {
    console.error('Could not start: storage setup failed.');
    console.error(err.message);
    process.exit(1);
  });
