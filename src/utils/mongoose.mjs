import mongoose from 'mongoose';
import 'dotenv/config';

const connection = mongoose.createConnection(process.env.DB_URL);

const { Schema } = mongoose;

const nftSchema = new Schema({
  name: String,
  hash: String,
  image: String,
  collection_name: String, // all caps
  collection_number: {type: String, default: null},
  rank: String,
  rarity: String,
  attributes: Array,
  tier: String
});

const collectionSchema = new Schema({
  name: String, // all caps
  aliases: Array,
  numPieces: Number,
  rarityCheck: {type: Number, default: 0},
  image: String
})

const Nft = connection.model('nft', nftSchema);
const Collection = connection.model('collection', collectionSchema);

export {Nft, Collection};
