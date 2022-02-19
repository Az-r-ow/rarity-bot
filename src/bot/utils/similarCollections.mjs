import { Collection }from '../../utils/mongoose.mjs';
// Look for collections with similar names
async function similarCollections(args){
  // Finding similar collection names
  const regex =  new RegExp(`${args.slice(1).filter(arg => isNaN(arg)).join(" ")}`);
  const similar = await Collection.find({name: {$regex: regex, $options: 'i'}}).exec();
  if(!similar.length)throw {
    name: "Nothing was found !",
    message: "This collection might not be listed."
  };
  throw {
    name: "Nothing was found !",
    message: `You might be searching for : \`\`\`${similar.map(i => i.name).join('\n')}\`\`\``
  }
};

export default similarCollections; 
