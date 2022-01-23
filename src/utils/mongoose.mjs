import mongoose from 'mongoose';
import 'dotenv/config';

const connection = mongoose.createConnection(process.env.DB_URL);

const { Schema } = mongoose;

const nftSchema = new Schema({
  name: String,
  hash: String,
  image: String,
  collection_name: String,
  pieces: String,
  rank: String,
  rarity: String,
  attributes: Array,
  tier: String
})

const Nft = connection.model('nft', nftSchema);

export default Nft;
