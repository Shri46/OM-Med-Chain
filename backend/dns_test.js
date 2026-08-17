const dns = require('dns');

console.log('DNS Servers:', dns.getServers());

dns.resolveSrv('_mongodb._tcp.cluster0.5mlyemn.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV Error:', err);
  } else {
    console.log('SRV Addresses:', addresses);
  }
});
