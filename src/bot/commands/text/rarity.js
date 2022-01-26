import {
  DisplayAttributes,
  DisplayRarity
} from '../../tmp/RarityMessage.js';
import { Nft, Collection }from '../../../utils/mongoose.mjs';
import {prefix} from '../../utils/consts.mjs';
import {MissingArgsError} from '../../utils/classes.mjs';
import {
  MessageActionRow,
  MessageButton
} from 'discord.js'

export const command = {
  name: 'rarity',
  usage: `${prefix} rarity <collection_id>\n\n${prefix} rarity token <token_address>`,
  description: 'Check the rarity of a given NFT',
  async execute(interaction, args, client){
    if(!args.length)throw new MissingArgsError(this.usage);

    let nftData = args[0].toLowerCase() === "token" ? await Nft.findOne({hash: args[1]}).exec()
                                                     : await Nft.findOne({
                                                        collection_name: args.filter(el => !el.match(/\d+/g)).join(' ').toUpperCase(),
                                                        collection_number: args.filter(el => el.match(/\d+/g))[0].match(/\d+/g)[0]
                                                      }).exec();
    if (!nftData)throw {
      name: "Nothing was found !",
      message: "This collection might not be listed."
    };

    let collectionData = await Collection.findOne({name: nftData.collection_name}).exec();

    const displayRarity = {
      embeds: [new DisplayRarity(nftData.name,nftData.rank,collectionData.numPieces.toString(),nftData.image,nftData.tier)],
      components: [new MessageActionRow()
      .addComponents(
        new MessageButton()
        .setCustomId('attributes')
        .setLabel('Attributes')
        .setStyle('PRIMARY'),
      ),]
    };

    const displayAttributes = {
      embeds: [new DisplayAttributes(nftData.name, nftData.attributes, nftData.tier)],
      components: [new MessageActionRow()
      .addComponents(
        new MessageButton()
        .setCustomId('rarity')
        .setLabel('Rarity')
        .setStyle('PRIMARY'),
      ),]
    }

    interaction.reply(displayRarity)
    .then(async message => {
      const filter = c_interaction => c_interaction.isButton() && c_interaction.user.id === interaction.member.id;

      const collector = message.createMessageComponentCollector({filter, idle: 15000});

      collector.on('collect', i => {
        i.customId === 'attributes' ? message.edit(displayAttributes) : message.edit(displayRarity);
        return i.deferUpdate();
      });

      collector.on('end', () => {
        message.components[0].components.forEach(button => button.disabled = true);
        message.edit({components: message.components}).catch(e => console.log(e))
      })
    })

  }
}
