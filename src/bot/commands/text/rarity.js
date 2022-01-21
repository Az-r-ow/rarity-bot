import DisplayRarity from '../../tmp/RarityMessage.js';
import Nft from '../../../utils/mongoose.mjs';
import {prefix} from '../../utils/consts.mjs';
import {MissingArgsError} from '../../utils/classes.mjs';

export const command = {
  name: 'rarity',
  usage: `${prefix} rarity <collection_id>\n\n${prefix} rarity token <token_address>`,
  description: 'Check the rarity of a given NFT',
  async execute(interaction, args, client){
    if(!args.length)throw new MissingArgsError(this.usage);

    let data = args[0].toLowerCase() === "token" ? await Nft.findOne({hash: args[1]}).exec()
                                                 : await Nft.findOne({name: args.join(" ").toLowerCase()}).exec();

    if (!data)throw {
      name: "Nothing was found !",
      message: "This collection might not be listed."
    };

    interaction.reply({embeds: [new DisplayRarity(data.name,data.rank,data.pieces,data.image,data.tier)]})

  }
}
