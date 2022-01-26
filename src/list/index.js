import { Connection } from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from '@solana/web3.js';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import toCsvString from '../utils/toCsvString.mjs';
import cliProgress from 'cli-progress';
import 'dotenv/config';
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
  moonRarityAlgo
} from '../utils/sol.mjs';


/**
 * checkCliArgs - Check if the cli args were passed correctly
 *
 * @param  {Array} argv Array of running processes
 * @return {Array}      Array of the flag and the path to the hash_list
 */
export function checkCliArgs(argv){

  if(argv.length < 4 || !(argv[2] === "-s" || argv[2] === "-e"))throw new Error('Wrong format !\nFormat : node <filename> <flag> <path_to_hash_file>');

  // Check if the file is there
  fs.access(argv[3], fs.constants.F_OK, (err) => {
    if(err)throw err
  });
  if(!argv[3].endsWith('.json'))throw new Error("The hash list file should be .json");

  return [argv[2], argv[3]];
}


async function calculateScores_eth(){}

async function main(){

  try{
    let args = await checkCliArgs(process.argv);
    let [flag, hs_file_path] = args;
    // Store the traits and their recurrences
    const traits_file_path = flag === "-s" ? await getTraitsRecurrences_sol(hs_file_path, '../data/traits')
                                           : await getTraitsRecurrences_eth();
    const calculatedScores = flag === "-s" ? await moonRarityAlgo(traits_file_path, hs_file_path)
                                           : await calculateScores_eth();
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


       // Send an embed message on discord
       const message = {
         embeds: [{
           title: `New collection added : ${rndNft.collection_name}`,
           description: `Welcome to \*\*${rndNft.collection_name}\*\*, you can now check their rankings with :\n\`!r rarity ${rndNft.collection_name} <number>\`\nor\n\`!r rarity token <token_address>\`\n\n⚠️ Please remember that rarity is calculated from metatada, wrong metadata may lead to a wrong ranking. We will be working our hardest to monitor such mistakes and fix them ASAP.`,
           image: {url: rndNft.image},
           color: 'RANDOM'
         }]
       }
       await sendDiscordMessage(message, '935129701146566676', process.env.TOKEN);
     }else{
       console.log('\nOperation quitting.\n');
       process.exit(1);
     }
  }catch (e){
    console.log(e);
    process.exit(1);
  };
}

// Checks if the file has been run directly
main();
