import { Nft, Collection }from '../../../utils/mongoose.mjs';
import { prefix } from '../../utils/consts.mjs';
import { MissingArgsError } from '../../utils/classes.mjs';
import {
  DisplayAttributes,
  DisplayRarity
} from '../../tmp/RarityMessage.js';
import displayRarity from '../../utils/displayRarity.mjs';
import similarCollections from '../../utils/similarCollections.mjs';
import {Interaction} from 'discord.js';

export const command = {
  name: 'rarity',
  usage: `\`${prefix} rarity collection <collection_id>\`\n\n\`${prefix} rarity token <token_address>\``,
  description: 'Check the rarity of a given NFT',
  async execute(interaction, args, client){

    // Since there's only the option to check for the rarity by the collection by slash commands
    // Append collection to the beginning of the args array. 
    interaction instanceof Interaction && interaction.isCommand() ? args.unshift('collection') : args;

    if(args.length <= 1)throw new MissingArgsError(this.usage);

    switch (args[0].toLowerCase()) {
      case "token":
        const nftData = await Nft.findOne({hash: args[1]}).exec()
        if(!nftData)throw {
          name: "Nothing was found !",
          message: "This nft is not listed in our DB."
        }
        break;
      case "collection":
        const nftData2 = await Nft.findOne({collection_name: args.slice(1).filter(arg => isNaN(arg)).join(" ").toUpperCase(), collection_number: args.filter(arg => !isNaN(arg))[0]}).exec();
        if(!nftData2) await similarCollections(args);
        await displayRarity(interaction, nftData2);
        break;
      default:
        throw new MissingArgsError(this.usage);
    }
  }
}
