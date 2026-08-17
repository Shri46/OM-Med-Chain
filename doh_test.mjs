import https from 'https';

const url = 'https://dns.google/resolve?name=_mongodb._tcp.cluster0.5mlyemn.mongodb.net&type=SRV';
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('SRV:', JSON.parse(data));
  });
});

const txtUrl = 'https://dns.google/resolve?name=cluster0.5mlyemn.mongodb.net&type=TXT';
https.get(txtUrl, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('TXT:', JSON.parse(data));
  });
});
