import axios from 'axios';
import { SERVER_URL } from '../config/config';

const api = axios.create({
  baseURL: SERVER_URL.replace(/\/+$/, '') + '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
