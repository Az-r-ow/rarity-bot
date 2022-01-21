
function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
};

function setTier(rank, overall_num){

  let percentage = (rank / overall_num) * 100;

  let tier = percentage <= 1 ? "Mythic"
            : percentage <= 5 ? "Legendary"
            : percentage <= 15 ? "Epic"
            : percentage <= 35 ? "Rare"
            : percentage <= 60 ? "Uncommon" : "Common";

  return tier;
}


export {sleep, setTier};
