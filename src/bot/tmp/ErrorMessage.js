import {MessageEmbed} from 'discord.js';
class ErrorMessage extends MessageEmbed {
  constructor(error, solution){
    super();
    this.setColor('RED')
    .setTitle(error)
    .setDescription(solution)
  }
}

export default ErrorMessage; 
