import {MessageEmbed} from 'discord.js';

class DisplayRarity extends MessageEmbed {
  constructor(name, rank, pieces, image_url, tier){
    super();
    this.setTitle(name)
    .addFields(
      {name: '🏆 Rank', value: rank, inline: true},
      {name: '📦 Pieces', value: pieces, inline: true},
      {name: '🎖️ Tier', value: tier, inline: true}
    )
    .setImage(image_url)
    .setColor(this.getColor(tier))
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

export default DisplayRarity;
