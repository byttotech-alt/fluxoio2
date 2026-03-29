const url = process.env.VITE_SUPABASE_URL + '/rest/v1/profiles?select=*&limit=1';
const key = process.env.VITE_SUPABASE_ANON_KEY;
console.log('Fetching', url);
fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key } })
  .then(r => Math.round(r.status / 100) === 2 ? r.json() : Promise.reject(r.statusText))
  .then(d => console.log('DB SUCCESS:', d))
  .catch(e => console.error('DB ERROR:', e));
