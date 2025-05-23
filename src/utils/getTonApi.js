import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// TESTNET
const TONAPI_URL = "https://tonapi.io/v2";
const { TONAPI_KEY } = process.env;
const HEADERS = { Authorization: `Bearer ${TONAPI_KEY}` };

export const getTonApi = async (path) => {
  const url = normalizeUrl(path);
  return makeRequest(url);
};

const normalizeUrl = (path) => {
  return `${TONAPI_URL}/${path}`.replace(/\/+/g, "/");
};

const makeRequest = async (url) => {
  try {
    const { data } = await axios.get(url, { headers: HEADERS });
    return data;
  } catch (error) {
    console.error(`TON API ERROR > ${error}`);
    return null;
  }
};
