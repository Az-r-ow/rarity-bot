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

  const pda = await Metadata.getPDA(NFT_MINT_ADDRESS);
  const metadata = await Metadata.load(new Connection('mainnet-beta'), pda);
  req_metadata = await axios.get(metadata.data.data.uri);

  return req_metadata.data;
};


/**
 * getTraitsRecurrences_sol - get the collection's traits and store them in a json file
 *
 * @param  {String} hs_file_path the path to the hash_list file
 * @param  {String} path_to_data_folder  the path to folder that'll store the traits recurrnces
 * @return {String}           The absolute path to the traits file
 */
async function getTraitsRecurrences_sol(hs_file_path, path_to_data_folder){
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

  let rawHashList = await fs.readFileSync(hs_file_path);
  let hash_list = JSON.parse(rawHashList);

  // Starting the progress bar
  bar.start(hash_list.length, 0);

  for(let i = 0; i < hash_list.length; i++){
    await sleep(100).then(async () =>{
      // Retreiving the attributes for each nft
      const {attributes} = await getMetadataData_sol(hash_list[i]);

      await attributes.forEach(async traits => {
        let trait_type;
        for(const trait in traits){
          if(Object.keys(traits).length > 2)continue;
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
  };

  let pathToTraits;

  try{
    pathToTraits = path.resolve(path_to_data_folder);
    const output = await JSON.stringify(traits_recurrences);
    await fs.writeFileSync(`${pathToTraits}/${path.basename(hs_file_path)}`, output);
    console.log(`\n${path.basename(hs_file_path)} created !`);
  }catch (e){
    console.log(e);
    process.exit(1);
  }
  return `${pathToTraits}/${path.basename(hs_file_path)}`
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
   * hash
   * mint_address
   * score
   * image_url
   */
  let scored_list = [];
  bar.start(hash_list.length, 0);

  for(let i = 0; i < hash_list.length; i++){
    await sleep(10).then(async () => {
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


/**
 * masterAlgo - Our rarity algorithm
 *
 * @param  {String} traits_file_path Path to the trait's file (json)
 * @param  {String} hs_file_path     Path to the hash list (json)
 * @return {Array}                  An array of scored NFT objects
 */
async function masterAlgo(traits_file_path, hs_file_path){
  let trait_recurrences = JSON.parse(await fs.readFileSync(traits_file_path));
  const hash_list = JSON.parse(await fs.readFileSync(hs_file_path));

  const bar = new cliProgress.SingleBar({
    format: 'Calculating Scores [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
  }, cliProgress.Presets.shades_classic);

  // There are two attributes in here that shouldn't be confused
  // The first attribtes that is being destructures is the attributes of the nft itself
  // The second attributes (in scored_nft) is the totality of the attributes types in the collection
  let scored_list = [];
  bar.start(hash_list.length, 0);
  for (let i = 0; i < hash_list.length; i++){
    await sleep(10).then(async () => {
      const {
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
        rarity: 0,
        attributes: Object.keys(trait_recurrences).map(key => {
          // Going over the traits
          // Checking the overall number of people who doesn't have
          // The trait_type and then calculating it's rarity percentage
          return {trait_type: key, trait_value: null, rarity: ((hash_list.length - Object.values(trait_recurrences[key]).reduce((a, b) => a + b)) / hash_list.length)}
        })
      };

      // Getting the rarity percentage of the traits that the nft has
      // Leaving the rest as null and having a rarity of
      await attributes.filter(attribute => Object.keys(attribute).length < 3).forEach(attribute => {
        const rarity_percentage = (trait_recurrences[attribute.trait_type][attribute.value]/hash_list.length);
        const indexOfTrait = scored_nft.attributes.findIndex(el => el.trait_type === attribute.trait_type);
        scored_nft.attributes[indexOfTrait].trait_value = attribute.value;
        scored_nft.attributes[indexOfTrait].rarity = rarity_percentage;
      });

      scored_nft.rarity = scored_nft.attributes.map(a => a.rarity).reduce((a, b) => a * b);

      await scored_list.push(scored_nft);
    });
    bar.increment();
  }
  return scored_list;
}

export {
  getMetadataData_sol,
  calculateScores_sol,
  getTraitsRecurrences_sol,
  masterAlgo
}
