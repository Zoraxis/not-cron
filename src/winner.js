import { Address, Cell, Slice, TupleReader } from '@ton/ton';

const desiredSender = "EQCnsr6fKXXRJJTyJZJexJc0qqTgAoEKaI_6eeGw6dfNYXx4";
const desiredDestination = "EQD5kwG16rZ7DdCUB5KnkeAzdCf0oqwKnx1yprkjNc42jlGE";
// const desiredDestination = "EQD5kwG16rZ7DdCUB5KnkeAzdCf0oqwKnx1yprkjNc42jlGE";

const fetchWinner = async () => {
    const res = await fetch(`https://testnet.tonapi.io/v2/blockchain/accounts/${`EQCnsr6fKXXRJJTyJZJexJc0qqTgAoEKaI_6eeGw6dfNYXx4`}/transactions`);
    const body = await res.json();

    const outTrasaction = body.transactions.find((transaction) => transaction.out_msgs.find((out_msg) => out_msg.dst === `EQCnsr6fKXXRJJTyJZJexJc0qqTgAoEKaI_6eeGw6dfNYXx4`));
    console.log("🚀 ~ fetchWinner ~ outTrasaction:", outTrasaction)
    const hash = outTrasaction?.hash;
    // const transaction = body.transactions[0];

    // const destinationRaw = transaction.account.address;
    // const destination = Address.parse(destinationRaw);

    // const bodySenderRaw = transaction?.in_msg?.decoded_body?.sender;
    // const bodySender = Address.parse(bodySenderRaw);
    // console.log("🚀 ~ fetchWinner ~ transaction:", transaction)
    // console.log("🚀 ~ fetchWinner ~ transaction:", destination)
    // console.log("🚀 ~ fetchWinner ~ transaction:", bodySender)
}

fetchWinner();