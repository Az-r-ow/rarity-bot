import { Connection } from '@metaplex/js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from '@solana/web3.js';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { sleep, fileExists, readJsonFile } from './helpers.mjs';
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

  const pda = await Metadata.getPDA(NFT_MINT_ADDRESS);
  const metadata = await Metadata.load(new Connection('mainnet-beta'), pda);
  const response = await fetch(metadata.data.data.uri);
  const res_metadata = await response.json();

  return res_metadata;
};


/**
 * getMetadata_sol - Get the metadata of a given token
 *
 * @param  {String} nft_address The token address of the nft
 * @return {Object}             The metadata of this token
 */
async function getMetadata_sol(nft_address){
  const NFT_MINT_ADDRESS = new PublicKey(nft_address);
  let req_metadata;

  const pda = await Metadata.getPDA(NFT_MINT_ADDRESS);
  const metadata = await Metadata.load(new Connection('mainnet-beta'), pda);

  return metadata;
}


/**
 * inCollection - Since we're fetching hash lists from the verified creator token we will be getting
 * nft's from different collections created by the this verified creator account. Therefore we want to filter them out.
 *
 * @param  {String} hs_file_path The path of the hash list file (including the name of the file)
 * @param  {String} nftSymbol   The symbol of the nft collection (fetched from the metadata)
 * @return {Bool}        Will return true if it's in the desired collection and false otherwise
 */
function inCollection(hs_file_path, nftSymbol){

  const collectionSymbol = path.basename(hs_file_path, '.json');

  return collectionSymbol === nftSymbol ? true : false;
}


/**
 * removeIntruders - Will remove the intruders in the hash list
 *
 * @param  {Array} intruders The nft's that does not belong to the collection
 * @param  {Array} hash_list The list of nfts
 * @return {Array}           The hash list filtered from intruders
 */
function removeIntruders(intruders, hash_list){
  intruders.forEach(intruder => {
    let intruderIndex = hash_list.indexOf(intruder);
    hash_list.splice(intruderIndex, 1);
  });

  return hash_list;
}


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
  let traits_recurrences = {};

  // A list of all the tokens that don't belong in the collection we're listing
  let intruders = [];

  let last_index = undefined;

  const isSnapshot = await fileExists(`./${path.basename(hs_file_path)}`);

  if(isSnapshot){
    let snapshot = await readJsonFile(`./${path.basename(hs_file_path)}`);
    [traits_recurrences, intruders] = [snapshot.traits_recurrences, snapshot.intruders]
    last_index = snapshot.last_index;
  }

  /**
   * For the sake of entertainment while waiting
   * I will be adding a loading bar
   */

  const bar = new cliProgress.SingleBar({
    format: 'Traits Recurrences [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
  }, cliProgress.Presets.shades_classic);

  // Reading the hash list file and parsing it into a js array
  let hash_list = await readJsonFile(hs_file_path);

  let i = last_index ? last_index : 0;

  // Starting the progress bar
  bar.start(hash_list.length, i);


  for(i; i < hash_list.length; i++){
    try {
      await sleep(1);
      // Retreiving the metadata for each nft
      const metadata = await getMetadata_sol(hash_list[i]);

      // If the nft is not in the collection that we're listing
      // We will store it's index in an array and then remove it from the hash list file
      // And then we'll skip it
      if(!inCollection(hs_file_path, metadata.data.data.symbol)){
        intruders.push(hash_list[i]);
        // Everything else in the for loop will not be executed
        continue;
      }

      const request = await fetch(metadata.data.data.uri);
      const data = await request.json();

      const { attributes } = data;

      if(!attributes){
        intruders.push(hash_list[i]);
        continue;
      }


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
      });
    } catch (e) {
      // If an error was caught during the process
      // Create a back up file to continue from where it left off
      console.log(e);
      const snapshot = {
        pid: 1,
        traits_recurrences,
        intruders,
        last_index: i
      };

      const snapshot_file_content = await JSON.stringify(snapshot);
      await fs.writeFileSync(`./${path.basename(hs_file_path)}`, snapshot_file_content);
      console.log(`\nA snapshot file was created.\n`);
      process.exit(1);
    } finally {
      bar.increment();
    }
  };

  let pathToTraits;

  try{
    pathToTraits = path.resolve(path_to_data_folder);
    // Transforming the output into json
    const output = await JSON.stringify(traits_recurrences);
    // Writing the json trait file
    await fs.writeFileSync(`${pathToTraits}/${path.basename(hs_file_path)}`, output);
    console.log(`\n${path.basename(hs_file_path)} created !`);

    // If intruders were found they will be removed from the hash list and the hash list file will be updated.
    if(intruders.length){
      await removeIntruders(intruders, hash_list);
      await fs.writeFileSync(hs_file_path, JSON.stringify(hash_list));
      console.log(`Hash list file has been edited !`);
      console.log(`Found ${intruders.length} intruders.`);
      console.log(`New hash list size : ${hash_list.length}`);
    };

    // If there is a snapshot file delete that file
    if(isSnapshot){
      await fs.unlink(`./${path.basename(hs_file_path)}`, err => {
        if (err) throw err
        console.log('\nThe snapshot file has been deleted.')
      });
    }
  }catch (e){
    console.log(e);
    process.exit(1);
  }
  return `${pathToTraits}/${path.basename(hs_file_path)}`
};

async function calculateScores_sol(traits_file_path, hs_file_path) {

  let trait_recurrences = await readJsonFile(traits_file_path);
  const hash_list = await readJsonFile(hs_file_path);

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
  let trait_recurrences = await readJsonFile(traits_file_path);
  const hash_list = await readJsonFile(hs_file_path);

  // There are two attributes in here that shouldn't be confused
  // The first attribtes that is being destructures is the attributes of the nft itself
  // The second attributes (in scored_nft) is the totality of the attributes types in the collection
  let scored_list = [];


  const snapshot_file = await readJsonFile(`./${path.basename(hs_file_path)}`);
  if(snapshot_file && snapshot_file.pid == 2){
    scored_list = snapshot_file.scored_list;
  }

  let i = scored_list.length;

  const bar = new cliProgress.SingleBar({
    format: 'Calculating Scores [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
  }, cliProgress.Presets.shades_classic);

  bar.start(hash_list.length, i);
  for (i; i < hash_list.length; i++){
    await sleep(10);
    try {
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
        collection_name: "SolKongz",
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
    } catch (e) {
      console.log(e)
      // If any error occurs create a snapshot of the current progress
      const snapshot = {
        pid: 2,
        scored_list
      }
      const snapshot_file_content = await JSON.stringify(snapshot);
      await fs.writeFileSync(`./${path.basename(hs_file_path)}`, snapshot_file_content);
      console.log('Snapshot file created !')
      process.exit(1);
    } finally {
      bar.increment();
    }
  };

  if(await readJsonFile(`./${path.basename(hs_file_path)}`)){
    await fs.unlink(`./${path.basename(hs_file_path)}`, err => {
      if (err) throw err
      console.log('\nThe snapshot file has been deleted.')
    });
  };

  return scored_list;
}

export {
  getMetadataData_sol,
  calculateScores_sol,
  getTraitsRecurrences_sol,
  masterAlgo,
  getMetadata_sol
}
