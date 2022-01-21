import { Connection } from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from '@solana/web3.js';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import {sleep, setTier} from '../utils/helpers.mjs';
import toCsvString from '../utils/toCsvString.mjs';
import cliProgress from 'cli-progress';
import Nft from '../utils/mongoose.mjs';
import 'dotenv/config';
import {
  getMetadataData_sol,
  calculateScores_sol,
  getTraitsRecurrences_sol
} from '../utils/sol.mjs';


/**
 * checkCliArgs - Check if the cli args were passed correctly
 *
 * @param  {Array} argv Array of running processes
 * @return {Array}      Array of the flag and the path to the hash_list
 */
export function checkCliArgs(argv){

  if(argv.length < 4 || !(argv[2] === "-s" || argv[2] === "-e"))throw new Error('Wrong format !\nFormat : node <filename> <flag> <hash_file_path>');
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
    const traits_file_path = flag === "-s" ? await getTraitsRecurrences_sol(hs_file_path)
                                           : await getTraitsRecurrences_eth();
    const calculatedScores = flag === "-s" ? await calculateScores_sol(traits_file_path, hs_file_path)
                                           : await calculateScores_eth();
    // Sort in desc them and then save them in a db and a csv file
    const sortedScores = await calculatedScores.sort((firstEl, secondEl) => secondEl.score - firstEl.score);
    const csvString = await toCsvString(sortedScores);
    await fs.writeFileSync(`../data/csv/${path.basename(hs_file_path, '.json')}.csv`, csvString);
    const bar = new cliProgress.SingleBar({
      format: 'Uploading [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
    }, cliProgress.Presets.shades_classic);
    bar.start(sortedScores.length, 0);
    await sortedScores.forEach((nft, index) => {
      Nft.create({
        name: nft.name.toLowerCase(),
        hash: nft.hash,
        image: nft.image,
        collection_name: nft.collection_name,
        rank: (index + 1).toString(),
        score: (nft.score).toString(),
        pieces: (sortedScores.length).toString(),
        tier: setTier((index + 1), sortedScores.length)
      }, (err) => {
        if(err){
          console.log(err)
          process.exit(1);
        }else{
          bar.increment();
        }
      })
    })
  }catch (e){
    console.log(e);
    process.exit(1);
  };
}

// Checks if the file has been run directly
main();
