import readline from 'readline';
import { Nft, Collection }from './mongoose.mjs';
import cliProgress from 'cli-progress';
import {
  Client,
  Intents
} from 'discord.js';

/**
 * sleep - Will set a promise to resolve after the passed amount of time
 *
 * @param  {Number} ms amount of time in ms
 * @return {Promise}    promise
 */
function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
};


/**
 * setTier - will return the tier of the nft based on it's rank
 * and the size of the collection.
 *
 * @param  {Number} rank      The rank of the nft in its collection
 * @param  {Number} overall_num The overall number of pieces in the collection
 * @return {String}             The tier of the nft
 */
function setTier(rank, overall_num){

  let percentage = (rank / overall_num) * 100;

  let tier = percentage <= 1 ? "Mythic"
            : percentage <= 5 ? "Legendary"
            : percentage <= 15 ? "Epic"
            : percentage <= 35 ? "Rare"
            : percentage <= 60 ? "Uncommon" : "Common";

  return tier;
};


/**
 * promptVerification - ask the user a question who's answer is y/n
 *
 * @param  {string} message The question that the person will be asked
 * @return {Bool}           True if user responds with "y" and false if user responds with "n"
 */
function promptVerification(question){

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    switch (ans){
      case "y":
        resolve(true);
        break;
      case "n":
        resolve(false);
        break;
      default:
        resolve(promptVerification(question));
    }
  }))
};



/**
 * sendDiscordMessage -  connect to the client and send a message
 * to the designated channel
 *
 * @param  {MessageObject/String} message   description
 * @param  {String} channelId The id of the channel
 * @param  {String} _token    The private token of the bot
 * @return {Void}             Will throw an error or return nothing
 */
function sendDiscordMessage(message, channelId, _token){

  const client = new Client({intents: [Intents.FLAGS.GUILDS]});

  client.login(_token);

  client.on('ready', async () => {
    try{
      const channel = await client.channels.fetch(channelId);
      if(!channel.isText())throw 'This channel is not a text channel';
      await channel.send(message).then(() => console.log("\nMessage Sent"))
      client.destroy();
      return;
    }catch(e){
      throw e;
    }
  });

  client.login(_token)
};



/**
 * uploadCollectionToDb - Upload the collection info to the db
 *
 * @param  {Object} randomNft     A random nft object
 * @param  {Number} collectionSize The number of nfts in the collection
 * @return {Void}
 */
function uploadCollectionToDb(randomNft, collectionSize){

  // Find and delete the old instance of the collection
  Collection.deleteOne({
    name: randomNft.collection_name.toUpperCase()
  }, (err) => {
    if(err)throw err;
  });

  return Collection.create({
    name: randomNft.collection_name.toUpperCase(),
    aliases: [],
    numPieces: collectionSize,
    image: randomNft.image
  }, (err) => {
    if(err)throw err;
  });
}

/**
 * uploadScoresToDb - Upload the scores to the db
 *
 * @param  {Array} scoredList It should be an array of sorted nft's by scores
 * @return {type}            description
 */
function uploadRankedNftToDb(scoredList){
  if(!scoredList ||typeof scoredList !== "object")throw "Wrong or missing argument !";

  // Find and delete the old instances of this collection :
  Nft.deleteMany({
    collection_name: scoredList[0].collection_name
  }, (err) => {
    if (err)throw err;
  })

  // Who doesn't like loading bars
  const bar = new cliProgress.SingleBar({
    format: 'Uploading [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
  }, cliProgress.Presets.shades_classic);
  bar.start(scoredList.length, 0);

  let rank = 1

  for(const nft of scoredList){
    Nft.create({
      name: nft.name.toLowerCase(),
      hash: nft.hash,
      image: nft.image,
      collection_name: nft.collection_name.toUpperCase(), // To unify things all the collections will have their names in cap
      collection_number: nft.name.match(/\d+/g)[0],
      rank: (rank).toString(),
      rarity: (nft.rarity).toString(),
      attributes: nft.attributes,
      tier: setTier(rank, scoredList.length)
    }, (err) => {
      if(err){
        throw err;
      }else{
        bar.increment();
      }
    });
    rank++;
  };
  return
}


export {
  sleep,
  setTier,
  promptVerification,
  sendDiscordMessage,
  uploadRankedNftToDb,
  uploadCollectionToDb
};
