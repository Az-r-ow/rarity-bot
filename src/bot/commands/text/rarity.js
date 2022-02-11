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
  usage: `\`${prefix} rarity collection <collection_id>\`\n\n\`${prefix} rarity token <token_address>\`\n\n\`${prefix} rarity rank <collection_name> <rank>\``,
  description: 'Check the rarity of a given NFT',
  async execute(interaction, args, client){

    if(args.length <= 1)throw new MissingArgsError(this.usage);

    switch (args[0].toLowerCase()) {
      case "token":
        const nftData = await Nft.findOne({hash: args[1]}).exec()
        if(!nftData)throw {
          name: "Nothing was found !",
          message: "This nft is not listed in our DB."
        }
        break;
      case "rank":
        const nftData1 = await Nft.findOne({rank: args.filter(arg => !isNaN(arg))[0], collection_name: args.slice(1).filter(arg => isNaN(arg)).join(" ").toUpperCase()}).exec();
        if(!nftData1) await similarCollections(args);
        await displayRarity(nftData1);
        break;
      case "collection":
        const nftData2 = await Nft.findOne({collection_name: args.slice(1).filter(arg => isNaN(arg)).join(" ").toUpperCase(), collection_number: args.filter(arg => !isNaN(arg))[0]}).exec();
        if(!nftData2) await similarCollections(args);
        await displayRarity(nftData2);
        break;
      default:
      throw new MissingArgsError(this.usage);
    }

    // Look for collections with similar names
    async function similarCollections(args){
      // Finding similar collection names
      const regex =  new RegExp(`${args.slice(1).filter(arg => isNaN(arg)).join(" ")}`);
      const similar = await Collection.find({name: {$regex: regex, $options: 'i'}}).exec();
      if(!similar.length)throw {
        name: "Nothing was found !",
        message: "This collection might not be listed."
      };
      throw {
        name: "Nothing was found !",
        message: `You might be searching for : \`\`\`${similar.map(i => i.name).join('\n')}\`\`\``
      }
    }

    async function displayRarity(nftData){
      const collectionData = await Collection.findOne({name: nftData.collection_name}).exec();
      // Incrementing the view count of the collection
      // collectionData = collectionData.rarityCheck + 1;
      // await collectionData.save();

      const footer = `${collectionData.blockchain} • ${collectionData.algo}`;

      const displayRarity = {
        embeds: [new DisplayRarity(nftData.name,nftData.rank,collectionData.numPieces.toString(),nftData.image,nftData.tier, footer)],
        components: [new MessageActionRow()
        .addComponents(
          new MessageButton()
          .setCustomId('attributes')
          .setLabel('Attributes')
          .setStyle('PRIMARY'),
        ),]
      };

      const displayAttributes = {
        embeds: [new DisplayAttributes(nftData.name, nftData.attributes, nftData.tier, footer)],
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
          // Toggeling between attributes and rarity
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
}
