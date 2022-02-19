import {command} from '../text/rank.js';
export const rank = {
  data: {
    name: command.name,
    description: command.description,
    options: [
      {
        type: 3,
        name: "collection-name",
        description: "For more info about a specific command.",
        required: true,
      },
      {
        type: 3,
        name: "rank-number",
        description: "The spot that you wanna check",
        required: true
      }
    ]
  }
};
