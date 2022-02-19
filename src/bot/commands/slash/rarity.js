import {command} from '../text/rarity.js';
export const rarity = {
  data: {
    name: command.name,
    description: command.description,
    options: [
      {
        type: 1,
        name: "collection",
        description: "Searching for an nft in the collection.",
        options: [
          {
            type: 3,
            name: "collection-name",
            description: "The spot that you wanna check",
            required: true
          },
          {
            type: 3,
            name: "collection-id",
            description: "The id of the nft you're checking in that collection.",
            required: true
          }
      ]
      }
    ]
  }
};
