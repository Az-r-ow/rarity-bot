import { Connection } from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from '@solana/web3.js';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import toCsvString from '../utils/toCsvString.mjs';
import cliProgress from 'cli-progress';
import 'dotenv/config';
import {command} from '../bot/commands/text/rarity.js';
import {
  sleep,
  promptVerification,
  sendDiscordMessage,
  uploadRankedNftToDb,
  uploadCollectionToDb
} from '../utils/helpers.mjs';
import {
  sleep,
  promptVerification,
  sendDiscordMessage,
  uploadRankedNftToDb,
  uploadCollectionToDb
} from '../utils/helpers.mjs';
import {
  getMetadataData_sol,
  calculateScores_sol,
  getTraitsRecurrences_sol,
  masterAlgo
} from '../utils/sol.mjs';


/**
 * checkCliArgs - Check if the cli args were passed correctly
 *
 * @param  {Array} argv Array of running processes
 * @return {Array}      Array of the flag and the path to the hash_list
 */
export function checkCliArgs(argv){

  if(argv.length < 4 || !(argv[2] === "-s" || argv[2] === "-e"))throw new Error('Wrong format !\nFormat : node <filename> <flag> <path_to_hash_file> <--custom>');

  // Check if the file is there
  fs.access(argv[3], fs.constants.F_OK, (err) => {
    if(err)throw err
  });
  if(!argv[3].endsWith('.json'))throw new Error("The hash list file should be .json");

  const algo = !argv[4] ? "masterAlgo" : argv[4].toLowerCase() === "--custom" ? "custom" : "masterAlgo";

  return [argv[2], argv[3], algo];
}


async function calculateScores_eth(){}

async function main(){

  try{
    let args = await checkCliArgs(process.argv);
    let [flag, hs_file_path, algoType] = args;
    const blockchain = flag === "-s" ? "SOL" : "ETH";
    // Store the traits and their recurrences
    const traits_file_path = flag === "-s" ? await getTraitsRecurrences_sol(hs_file_path, '../data/traits')
                                           : await getTraitsRecurrences_eth();

    const calculatedScores = algoType === "masterAlgo" ? await masterAlgo(traits_file_path, hs_file_path)
                                                        : await calculateScores_sol(traits_file_path, hs_file_path);
    // Sort in desc them and then save them in a db and a csv file
    const sortedScores = await calculatedScores.sort((firstEl, secondEl) => firstEl.rarity - secondEl.rarity);

    // Converting from object to a csv fomatted string
    const csvString = await toCsvString(sortedScores);

    // Writing the csv file
    await fs.writeFileSync(`../data/csv/${path.basename(hs_file_path, '.json')}.csv`, csvString);

    /**
     * After everything has been processed and done
     * The person listing the collection should check the csv file generated
     * To check validity of the rankings and the scores
<<<<<<< HEAD
     *
     * Then he will be asked if the collection should be added to the db
     * And then another time if an announcement should be sent on the server
     */

     let shouldUpload = await promptVerification("Do you wanna upload the collection to the database ?");

     if(!shouldUpload)throw "Operation cancelled";

     // We get a random nft to extract the data from
     let rndNft = sortedScores[Math.floor(Math.random() * sortedScores.length)]

     // Upload them to the db
     await uploadRankedNftToDb(sortedScores);

     // Upload the collection and return it
     const collection = await uploadCollectionToDb(rndNft, sortedScores.length, blockchain, algoType);
     const shouldList = await promptVerification('Did you check the generated file and are you sure you want to list it ? (y/n)');

     if(shouldList){
=======
     * He will then be prompted in the command line to verify
     * After that person verifies, the discord bot will send a message
     * in the new collections channel saying announcing the addition of the new channel.
     */

     // TODO: prompt the user for verify input
     let shouldList = await promptVerification('Did you check the generated file and are you sure you want to list it ? (y/n)');

     if(shouldList){

       // We get a random nft to extract the data from
       let rndNft = sortedScores[Math.floor(Math.random() * sortedScores.length)]

       // Upload them to the db
       await uploadRankedNftToDb(sortedScores);

       // Upload the collection
       await uploadCollectionToDb(rndNft, sortedScores.length);

>>>>>>> 619087bedaa7d87333eb7cd9aa36281158a56be5

       // Send an embed message on discord
       const message = {
         embeds: [{
<<<<<<< HEAD
           title: `New collection added : ${collection.name}`,
           description: `Welcome to \*\*${collection.name}\*\*, you can now check their rankings with :\n\`${command.usage}\`\n\n⚠️ Please remember that rarity is calculated from metatada, wrong metadata may lead to a wrong ranking. We will be working our hardest to monitor such mistakes and fix them ASAP.`,
           footer: {
             text: `${collection.blockchain} • ${collection.algo}`
           },
           image: {url: rndNft.image},
           color: 'RANDOM'
         }]
       };

       // The id passed as an arg is the id of the "new-collection" channel in the main server
=======
           title: `New collection added : ${rndNft.collection_name}`,
           description: `Welcome to \*\*${rndNft.collection_name}\*\*, you can now check their rankings with :\n\`!r rarity ${rndNft.collection_name} <number>\`\nor\n\`!r rarity token <token_address>\`\n\n⚠️ Please remember that rarity is calculated from metatada, wrong metadata may lead to a wrong ranking. We will be working our hardest to monitor such mistakes and fix them ASAP.`,
           image: {url: rndNft.image},
           color: 'RANDOM'
         }]
       }
>>>>>>> 619087bedaa7d87333eb7cd9aa36281158a56be5
       await sendDiscordMessage(message, '935129701146566676', process.env.TOKEN);
     }else{
       console.log('\nOperation quitting.\n');
       process.exit(1);
     }
  }catch (e){
    console.log(`\n${e}\n`);
    process.exit(1);
  };
}

// Checks if the file has been run directly
main();
