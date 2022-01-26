import {MessageEmbed} from 'discord.js';

class DisplayRarity extends MessageEmbed {
  constructor(name, rank, pieces, image_url, tier, footer){
    super();
    this.setTitle(name)
    .addFields(
      {name: '🏆 Rank', value: rank, inline: true},
      {name: '📦 Pieces', value: pieces, inline: true},
      {name: '🎖️ Tier', value: tier, inline: true}
    )
    .setImage(image_url)
    .setColor(this.getColor(tier))
    .setFooter({
      text: footer
    })
  };

  getColor(tier){
    switch (tier) {
      case "Mythic":
        return "DARK_BUT_NOT_BLACK";
      case "Legendary":
        return "GOLD";
      case "Epic":
        return "RED";
      case "Rare":
        return "BLUE"
      case "Uncommon":
        return "AQUA";
      default:
        return "WHITE";
    }
  }
}

class DisplayAttributes extends MessageEmbed {
  constructor(name, attributes, tier, footer){
    super();
    this.setTitle(name)
    .setDescription(
      attributes.map(attribute => `\*\*${attribute.trait_type}:\*\* ${attribute.trait_value}  \`${(attribute.rarity * 100).toFixed(2)}%\``).join('\n')
    )
    .setColor(this.getColor(tier))
    .setFooter({
      text: footer
    })
  };

  getColor(tier){
    switch (tier) {
      case "Mythic":
        return "DARK_BUT_NOT_BLACK";
      case "Legendary":
        return "GOLD";
      case "Epic":
        return "RED";
      case "Rare":
        return "BLUE"
      case "Uncommon":
        return "AQUA";
      default:
        return "WHITE";
    }
  }
}

export {DisplayRarity, DisplayAttributes};
