import axios from 'axios';

// Axios rieng cho API public/guest: khong gan Authorization token.
const publicApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default publicApi;
