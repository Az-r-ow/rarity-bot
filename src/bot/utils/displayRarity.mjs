import {
  DisplayAttributes,
  DisplayRarity
} from '../tmp/RarityMessage.js';
import { Nft, Collection }from '../../utils/mongoose.mjs';
import {
  MessageActionRow,
  MessageButton
} from 'discord.js'

async function displayRarity(interaction, nftData){
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
    ),],
    fetchReply: true
  };

  const displayAttributes = {
    embeds: [new DisplayAttributes(nftData.name, nftData.attributes, nftData.tier, footer)],
    components: [new MessageActionRow()
    .addComponents(
      new MessageButton()
      .setCustomId('rarity')
      .setLabel('Rarity')
      .setStyle('PRIMARY'),
    ),],
    fetchReply: true
  }

  interaction.reply(displayRarity)
  .then(message => {
    const filter = c_interaction => c_interaction.isButton() && c_interaction.user.id === interaction.member.id;

    const collector = message.createMessageComponentCollector({filter, idle: 15000});

    collector.on('collect', i => {
      // Toggeling between attributes and rarity
      i.customId === 'attributes' ? interaction.editReply(displayAttributes) : interaction.editReply(displayRarity);
      return i.deferUpdate();
    });

    collector.on('end', () => {
      message.components[0].components.forEach(button => button.disabled = true);
      interaction.editReply({components: message.components}).catch(e => console.log(e))
    })
  })
};

export default displayRarity;
