import {command} from '../text/help.js';
export const help = {
  data: {
    name: command.name,
    description: command.description,
    options: [
      {
        type: 3,
        name: "command-name",
        description: "For more info about a specific command."
      }
    ]
  }
};
