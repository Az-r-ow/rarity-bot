import {Nft} from "../utils/mongoose.mjs";
import cliProgress from 'cli-progress';
import fs from 'fs';

async function main(){
  let rawHahlList = await fs.readFileSync('../data/hash_lists/degenape-mint-list.json');
  let hash_list = JSON.parse(rawHahlList);

  const bar = new cliProgress.SingleBar({
    format: 'Calculating Scores [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
  }, cliProgress.Presets.shades_classic);
  bar.start(hash_list.length, 0);

  for(let i = 0; i < hash_list.length; i++){
    // Fetch the duplicated for each nft
    const duplicates = await Nft.find({hash: hash_list[i]}).exec();
    duplicates.sort((a, b) => b._id.getTimestamp() - a._id.getTimestamp()).slice(1).forEach(async nft => {
      await Nft.deleteOne({_id: nft._id});
    });
    bar.increment();
  }

};

main();
