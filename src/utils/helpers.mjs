import readline from 'readline';
import { access, constants, readFileSync } from 'fs';
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
 * @param  {String} blockchain The name of the blockchain on which resides this collection
 * @param  {String} algo The rarity calculation algorythm used
 * @return {Object}     The collection that has been uploaded to the db
 */
async function uploadCollectionToDb(randomNft, collectionSize, blockchain, algo){

  // Check if there's some old instance of the collection in the db
  const oldCollection = await Collection.findOne({
    name: randomNft.collection_name.toUpperCase()
  }).exec();

  if(oldCollection){
    // Find and delete the old instance of the collection
    await Collection.deleteOne({
      name: randomNft.collection_name.toUpperCase()
    });
  }

  await Collection.create({
    name: randomNft.collection_name.toUpperCase(),
    aliases: [],
    numPieces: collectionSize,
    image: randomNft.image,
    blockchain,
    algo
  });

  const collection = await Collection.findOne({
    name: randomNft.collection_name.toUpperCase()
  }).exec();

  return collection;
}

/**
 * uploadScoresToDb - Upload the scores to the db
 *
 * @param  {Array} scoredList It should be an array of sorted nft's by scores
 * @return {type}            description
 */
async function uploadRankedNftToDb(scoredList){

  if(!scoredList ||typeof scoredList !== "object")reject("Wrong or missing argument !");
  const query = await Nft.find({
    collection_name: scoredList[0].collection_name
  }).exec();

  if(query.length){
    await Nft.deleteMany({
      // Find and delete the old instances of this collection
      collection_name: scoredList[0].collection_name
    })
  };

  const bar = new cliProgress.SingleBar({
    format: 'Uploading [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
  }, cliProgress.Presets.shades_classic);
  bar.start(scoredList.length, 0);

  let rank = 1;
  for(const nft of scoredList){
    await Nft.create({
      name: nft.name.toLowerCase(),
      hash: nft.hash,
      image: nft.image,
      collection_name: nft.collection_name.toUpperCase(), // To unify things all the collections will have their names in cap
      collection_number: nft.name.match(/\d+/g)[0],
      rank: (rank).toString(),
      rarity: (nft.rarity).toString(),
      attributes: nft.attributes,
      tier: setTier(rank, scoredList.length)
    });
    bar.increment();
    rank++
  };
  return;
};


/**
 * exists - checks if a file exists in the given path
 *
 * @param  {String} path The path file
 * @return {Bool}      true if it exists and false if it doesnt
 */
function fileExists(path){
  return new Promise(resolve => {
    let res;
    access(path, constants.F_OK, err => {
      res = err ? false : true;
      resolve(res);
    });
  })
};


/**
 * readJsonFile - Reads a json file and returns a prased object
 *
 * @param  {String} path The path to the json file
 * @return {Object}      The content of the json file
 */
async function readJsonFile(path){
  try{
    const raw_file = await readFileSync(path);
    return raw_file ? await JSON.parse(raw_file) : undefined;
  }catch (e){
    return undefined
  }
}


export {
  sleep,
  setTier,
  promptVerification,
  sendDiscordMessage,
  uploadRankedNftToDb,
  uploadCollectionToDb,
  fileExists,
  readJsonFile
};
