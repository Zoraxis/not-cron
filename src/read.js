import { Cell } from "@ton/core";

const bocRaw = `te6cckECBQEAAREAAeWIABnMaN1e6HYuy3RcHibqj1WswqPqdqDrJTdcQTyCeqJgA5tLO3P\/\/\/\/rORVxQAAABe3IVdvoGmUzNvLcgGMn7kyXQc2BY0w/MD5LnkyvdC7RQZ5Se+h7auRPZ2b9Tymz4jIukZDRrS4fhgQKz8Nae0IHAQIKDsPIbQMEAgFoYgA5y4MpIZKDAKt6Pam+qdfmWyUHi2CYRRI+z1ii8xNj1qAJiWgAAAAAAAAAAAAAAAAAAQMArg+KfqUAAAAAAAAAAEAvrwgIAQN/3NO4JD6iy4qxoPNvQ1LMKZhbWSp+eMiYWir33e9BAAM5jRur3Q7F2W6Lg8TdUeq1mFR9TtQdZKbriCeQT1RMBluNgAAAnvztHg==`;

const hash = Cell.fromBase64(bocRaw).hash().toString("hex");
const res = await fetch(`https://testnet.tonapi.io/v2/traces/${hash}`);
const data = await res.json();

const transaction = data.transaction;
console.log("🚀 ~ transaction:", transaction)
const jettonTransaction = data.children[0].transaction;
console.log("🚀 ~ jettonTransaction:", jettonTransaction)
