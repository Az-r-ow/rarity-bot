import fs from "fs";
import {Client, Intents, Collection} from "discord.js";
import ErrorMessage from './tmp/ErrorMessage.js';
import {MissingArgsError} from './utils/classes.mjs';
import 'dotenv/config';
import {prefix} from './utils/consts.mjs';

// Might be conisdered bad practice but I need it to load files dinamically
import {createRequire} from 'module';
const require = createRequire(import.meta.url);

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES], presence: {status: 'online', activities: [{name: `${prefix} help`, type: 'WATCHING', url: 'https://punk-tee.com'}]}});

//Setting up collections for caching active interactions
client.active_interactions = new Collection();

//Setting up collections for caching commands
client.commands = new Collection();

const command_files = fs.readdirSync('./commands/text').filter(file => file.endsWith('.js'));

const slash_commands_files = fs.readdirSync('./commands/slash').filter(file => file.endsWith('.js'));


// Loading the commands into the collection
for(const file of command_files){

  import(`./commands/text/${file}`).then(({command}) => {
    console.log(`${file} has been loaded !`);
    command.slash = slash_commands_files.includes(file) ? true : false;
    client.commands.set(command.name, command);
  })

}


client.once('ready', () => {
  console.log('All set !');
});

//When the bots gets added to a server
client.on('guildCreate', async guild => {
})

client.on('messageCreate', async message => {

  //Ignore messages if they're not sent by a user and does not start with the prefix
  if(message.author.bot || !message.content.startsWith(prefix))return;

  //If the user has already an active interaction ignore his message
  if(client.active_interactions.get(message.author.id))return;

  let args = message.content.replace(/\s+/g, " ").split(" ").splice(1);

  if(!args.length)return;

  let commandName = args[0].toLowerCase();

  const command = client.commands.get(commandName);

  // If the command is not found exit
  if(!command)return;

  if(command.restricted && message.author.id !== "468141864134901770")return;

  try{

    await command.execute(message, args.slice(1), client);

  }catch (e){
    if (e instanceof Error && !(e instanceof MissingArgsError)){
      console.log(e);
    }
    message.reply({embeds: [new ErrorMessage(e.name, e.message)]});
  }
});

client.on('interactionCreate', async interaction => {
  if(!interaction.isCommand())return;

  const command = client.commands.get(interaction.commandName);

  // This variable is only valid in case I have one option proposed
  const args = interaction.options._hoistedOptions.length ? interaction.options._hoistedOptions[0].value.replace(/\s+/g, " ").split(" ") : [];

  // If the command is not found exit
  if(!command)return;

  try{
    await command.execute(interaction, args, client);
  }catch(e){
    if (e instanceof Error && !(e instanceof MissingArgsError)){
      console.log(e);
    }
    interaction.reply({embeds: [new ErrorMessage(e.name, e.message)]});
  }
})

if(process.argv[2] && process.argv[2] === "beta"){
  client.login(process.env.BETA_TOKEN);
  console.log("Beta is running !")
}else{
  client.login(process.env.TOKEN);
}
