import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// TESTNET
const TONCENTER_URL = "https://testnet.toncenter.com/api/v3";
const { TONCENTER_KEY } = process.env;
const HEADERS = {
  Authorization: `Bearer ${TONCENTER_KEY}`,
  "X-Api-Key": `${TONCENTER_KEY}`,
  api_key: `${TONCENTER_KEY}`,
};

export const getTonCenter = async (path) => {
  const url = normalizeUrl(path);
  return makeRequest(url);
};

const normalizeUrl = (path) => {
  return `${TONCENTER_URL}/${path}`.replace(/\/+/g, "/");
};

const makeRequest = async (url) => {
  try {
    const { data } = await axios.get(url, { headers: HEADERS });
    return data;
  } catch (error) {
    console.error(
      `TONC API ERROR > ${error?.response?.data?.error} : ${error.status}`
    );
    return null;
  }
};
