const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/Users',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiU3lzdGVtIEFkbWluIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiUGVyc29uIiwibmJmIjoxNzg2ODY4ODQ5LCJleHAiOjE3ODY5Mjg4NDksImlzcyI6Ind3dy5iYWNrZW5kU0RLLmNvbSIsImF1ZCI6Ind3dy5iYWNrZW5kU0RLLmNvbSJ9.My_W2c-bkvFl5e0zlZetaj2mNkqFctqpmtfuLNU2tgw'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('DATA:', data);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
