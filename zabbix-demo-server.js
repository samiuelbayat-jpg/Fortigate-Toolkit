const http = require('http');

const PORT = 5052;

const demoHosts = [
  {
    hostid: '10101',
    host: 'site-fw-01',
    name: 'SITE-FW-01',
    status: '0',
    interfaces: [{ ip: '192.0.2.10', dns: '', type: '2', main: '1' }],
    groups: [{ name: 'Firewalls' }, { name: 'Customer Demo' }]
  },
  {
    hostid: '10102',
    host: 'core-sw-01',
    name: 'CORE-SW-01',
    status: '0',
    interfaces: [{ ip: '192.0.2.20', dns: '', type: '2', main: '1' }],
    groups: [{ name: 'Switches' }, { name: 'Customer Demo' }]
  },
  {
    hostid: '10103',
    host: 'branch-rtr-01',
    name: 'BRANCH-RTR-01',
    status: '0',
    interfaces: [{ ip: '192.0.2.30', dns: '', type: '2', main: '1' }],
    groups: [{ name: 'Routers' }, { name: 'Customer Demo' }]
  }
];

function nowMinus(seconds) {
  return String(Math.floor(Date.now() / 1000) - seconds);
}

function demoProblems() {
  return [
    {
      eventid: '90001',
      name: 'WAN packet loss is above threshold',
      severity: '4',
      clock: nowMinus(420),
      hosts: [{ host: 'site-fw-01', name: 'SITE-FW-01' }]
    },
    {
      eventid: '90002',
      name: 'IPsec tunnel to branch is down',
      severity: '5',
      clock: nowMinus(960),
      hosts: [{ host: 'site-fw-01', name: 'SITE-FW-01' }]
    },
    {
      eventid: '90003',
      name: 'Switch uplink interface is down',
      severity: '3',
      clock: nowMinus(1800),
      hosts: [{ host: 'core-sw-01', name: 'CORE-SW-01' }]
    }
  ];
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store'
  });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

function handleRpc(payload) {
  const id = payload && payload.id ? payload.id : 1;
  const method = payload && payload.method;

  if (method === 'apiinfo.version') {
    return { jsonrpc: '2.0', result: '7.0.0-demo', id };
  }
  if (method === 'problem.get') {
    return { jsonrpc: '2.0', result: demoProblems(), id };
  }
  if (method === 'host.get') {
    return { jsonrpc: '2.0', result: demoHosts, id };
  }

  return {
    jsonrpc: '2.0',
    error: { code: -32601, message: 'Method not found', data: `Demo API does not implement ${method || '(empty method)'}` },
    id
  };
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }

  if (req.method === 'GET') {
    return send(res, 200, [
      'NetWolf local Zabbix demo API',
      '',
      'Use this URL in NetWolf Monitoring:',
      'http://127.0.0.1:5052',
      '',
      'Token can be any text, for example: demo-token',
      '',
      'Implemented JSON-RPC methods:',
      '- apiinfo.version',
      '- problem.get',
      '- host.get'
    ].join('\n'), 'text/plain; charset=utf-8');
  }

  if (req.method !== 'POST' || !req.url.includes('/api_jsonrpc.php')) {
    return send(res, 404, { error: 'Use POST /api_jsonrpc.php' });
  }

  let raw = '';
  req.on('data', chunk => {
    raw += chunk;
    if (raw.length > 1024 * 1024) req.destroy();
  });
  req.on('end', () => {
    try {
      const payload = raw ? JSON.parse(raw) : {};
      send(res, 200, handleRpc(payload));
    } catch (err) {
      send(res, 400, { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error', data: err.message }, id: null });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`NetWolf Zabbix demo API listening on http://127.0.0.1:${PORT}`);
  console.log('Use token: demo-token');
});
