const backendURL = 'http://localhost:3000';
const fetch = require('node-fetch');
fetch(`${backendURL}/books`)
  .then(response => response.json())
  .then(data=>{
    console.log(data);
      })
  .catch(error => console.error('Error:', error));