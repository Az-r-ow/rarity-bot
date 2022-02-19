import { Nft, Collection }from '../../../utils/mongoose.mjs';
import {prefix} from '../../utils/consts.mjs';
import {MissingArgsError} from '../../utils/classes.mjs';
import {
  MessageActionRow,
  MessageButton
} from 'discord.js';
import displayRarity from '../../utils/displayRarity.mjs';
import similarCollections from '../../utils/similarCollections.mjs';

export const command = {
  name: 'rank',
  usage: `\`${prefix} rank <collection_name> <rank>\``,
  description: 'Check the NFT on a certain rank in a collection.',
  async execute(interaction, args, client){

    if(args.length <= 1)throw new MissingArgsError(this.usage);

    const nftData = await Nft.findOne({rank: args.filter(arg => !isNaN(arg))[0], collection_name: args.filter(arg => isNaN(arg)).join(" ").toUpperCase()}).exec();
    if(!nftData) await similarCollections(args);
    await displayRarity(interaction, nftData);

  }
}
