const API_KEY = '34FMvo_3DD6hL54apDwMKPXNk_aa86uv';

const urls = [
  `https://api.polygon.io/v1/last_quote/currencies/XAU/USD?apiKey=${API_KEY}`,
  `https://api.polygon.io/v2/aggs/ticker/C:XAUUSD/prev?adjusted=true&apiKey=${API_KEY}`,
];

Promise.all(
  urls.map((url) =>
    fetch(url)
      .then((res) => res.text())
      .then((body) => ({ url, body }))
  )
).then((results) => {
  results.forEach((result) => {
    console.log(`\n=== ${result.url} ===`);
    console.log(result.body);
  });
});
