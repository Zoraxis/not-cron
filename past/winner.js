import { Address, Cell, Slice, TupleReader } from "@ton/ton";

const desiredSender = "EQA8GEfq_nBKLKsUCsJL23P3EW1TZfu6FP2VqQcuL1K_x2EN";
const desiredDestination = "0QAM5jRur3Q7F2W6Lg8TdUeq1mFR9TtQdZKbriCeQT1RMN1U";
// const desiredDestination = "EQD5kwG16rZ7DdCUB5KnkeAzdCf0oqwKnx1yprkjNc42jlGE";

const fetchWinner = async () => {
  const res = await fetch(
    `https://testnet.tonapi.io/v2/blockchain/accounts/${desiredDestination}/transactions`
  );
  const body = await res.json();

  const outTrasaction = body.transactions.find((transaction) => transaction?.in_msg?.decoded_body?.sender &&
    Address.parseRaw(transaction?.in_msg?.decoded_body?.sender).equals(
      Address.parse(desiredSender)
    )
  );
  console.log("🚀 ~ fetchWinner ~ outTrasaction:", outTrasaction);
  const hash = outTrasaction?.hash;
  // const transaction = body.transactions[0];

  // const destinationRaw = transaction.account.address;
  // const destination = Address.parse(destinationRaw);

  // const bodySenderRaw = transaction?.in_msg?.decoded_body?.sender;
  // const bodySender = Address.parse(bodySenderRaw);
  // console.log("🚀 ~ fetchWinner ~ transaction:", transaction)
  // console.log("🚀 ~ fetchWinner ~ transaction:", destination)
  // console.log("🚀 ~ fetchWinner ~ transaction:", bodySender)
};

fetchWinner();
