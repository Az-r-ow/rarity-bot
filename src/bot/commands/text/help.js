import {prefix} from '../../utils/consts.mjs';
import {MessageEmbed} from 'discord.js';

export const command = {
  name: 'help',
  usage: `${prefix} help <command_name>`,
  description: 'Get help on the commands',
  async execute(interaction, args, client){

    let command = args.length ? await client.commands.filter(command => command.name === args[0].toLowerCase()) : false;

    if(command && command.size){
      command = command.first();
      const command_info_embed = new MessageEmbed().setTitle("Command Name : " + command.name)
      .addFields(
        {name: "Description", value: command.description, inline: false},
        {name: "Usage", value: command.usage, inline: false}
      ).setColor("RANDOM")
      return interaction.reply({embeds: [command_info_embed]});
    }


    let public_commands = await client.commands.filter(command => !command.restricted);
    const help_embed = new MessageEmbed().setTitle("Commands").setColor("RANDOM");

    await public_commands.each(command => {
      let slash_availibility = command.slash ? "(Available in slash)" : "";
      help_embed.addField(`${prefix} ${command.name} ${slash_availibility}`, command.description, false);
    });

    interaction.reply({embeds: [help_embed]});
  }
}
