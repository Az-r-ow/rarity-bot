import { Connection } from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from '@solana/web3.js';
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import {sleep} from './helpers.mjs';
import cliProgress from 'cli-progress';


/**
 * getMetadataData_sol - Get the data including the attributes etc...
 * through the link prenset in the metadata
 *
 * @param  {String} nft_address Mint address of the nft
 * @return {Object}             The data of the nft gotten from the uri
 */
async function getMetadataData_sol(nft_address){
  const NFT_MINT_ADDRESS = new PublicKey(nft_address);
  let req_metadata;

  try{
    const pda = await Metadata.getPDA(NFT_MINT_ADDRESS);
    const metadata = await Metadata.load(new Connection('mainnet-beta'), pda);
    req_metadata = await axios.get(metadata.data.data.uri);
  }catch (e){
    console.log(e);
    process.exit(1);
  }
  return req_metadata.data;
};


/**
 * getTraitsRecurrences_sol - get the collection's traits and store them in a json file
 *
 * @param  {String} file_path the path to the hash_list file
 * @return {String}           The absolute path to the traits file
 */
async function getTraitsRecurrences_sol(file_path){
  /**
   * The object that will later on be tranformed
   * into a .json file and stored.
   */
  const traits_recurrences = {};


  /**
   * For the sake of entertainment while waiting
   * I will be adding a loading bar
   */

  const bar = new cliProgress.SingleBar({
    format: 'Traits Recurrences [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
  }, cliProgress.Presets.shades_classic);

  let rawHashList = await fs.readFileSync(file_path);
  let hash_list = JSON.parse(rawHashList);

  // Starting the progress bar
  bar.start(hash_list.length, 0);

  for(let i = 0; i < hash_list.length; i++){
    await sleep(500).then(async () =>{
      // Retreiving the attributes for each nft
      const {attributes} = await getMetadataData_sol(hash_list[i]);

      await attributes.forEach(async traits => {
        let trait_type;
        for(const trait in traits){
          if(trait === "trait_type"){
            trait_type = traits[trait];
            if(!traits_recurrences.hasOwnProperty(traits[trait])){
              // It will name the key of the object as the name of the type
              // And it will assign it an empty object which will be filled
              traits_recurrences[traits[trait]] = {};
            }
          }else{
            if(!traits_recurrences[trait_type].hasOwnProperty(traits[trait])){
              traits_recurrences[trait_type][traits[trait]] = 0;
            }
            traits_recurrences[trait_type][traits[trait]] += 1;
          }
        }
      })
    });
    bar.increment();
  }

  const pathToTraits = path.resolve('../data/traits');

  try{
    let output = await JSON.stringify(traits_recurrences);
    await fs.writeFileSync(`${pathToTraits}/${path.basename(file_path)}`, output);
    console.log(`\n${path.basename(file_path)} created !`);
  }catch (e){
    console.log(e);
    process.exit(1);
  }
  return `${pathToTraits}/${path.basename(file_path)}`
};

async function calculateScores_sol(traits_file_path, hs_file_path) {
  let trait_recurrences = JSON.parse(await fs.readFileSync(traits_file_path));
  const hash_list = JSON.parse(await fs.readFileSync(hs_file_path));
  // Another loading bar because why not
  const bar = new cliProgress.SingleBar({
    format: 'Calculating Scores [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
  }, cliProgress.Presets.shades_classic);

  /**
   * This will be the array that will store objects
   * Each object representing an nft in it we will have :
   * nft_name
   * mint_address
   * score
   * image_url
   */
  let scored_list = [];
  bar.start(hash_list.length, 0);

  for(let i = 0; i < hash_list.length; i++){
    await sleep(500).then(async () => {
      let {
        name,
        image,
        attributes,
        collection
      } = await getMetadataData_sol(hash_list[i]);

      const scored_nft = {
        name,
        hash: hash_list[i],
        image,
        collection_name: collection.name,
        score: 0
      };

      await attributes.forEach(attribute => {
        const num_recurrences = trait_recurrences[attribute.trait_type][attribute.value];
        const attribute_score  = 100 * (1 - (num_recurrences / hash_list.length));
        scored_nft.score += attribute_score;
      });

      await scored_list.push(scored_nft);
    });
    bar.increment();
  }

  return scored_list;

};

export {
  getMetadataData_sol,
  calculateScores_sol,
  getTraitsRecurrences_sol
}
