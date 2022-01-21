import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const commands = [];

const commandFiles = fs.readdirSync('./commands/slash').filter(file => file.endsWith('.js'));


const guildId = '552869662862606343';


const rest = new REST({version: '9'}).setToken(process.env.TOKEN);

(async () => {
  try{
    // It is important that the name of the variable would be the same as the file
    // Otherwise it won't load.
    for (const file of commandFiles){
      await import(`./commands/slash/${file}`).then((command) => {
        commands.push(command[path.basename(file, '.js')].data);
        console.log(`${file} added !`)
      })
    };

    console.log('Started refreshing appliaction (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      {body: commands},
    );
    console.log('Successfully reloaded application (/) commands.');
  }catch (e){
    console.error(e);
  }
})();
