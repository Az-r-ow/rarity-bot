import { calculateScores_sol} from '../src/utils/sol.mjs'
import assert from 'assert';

describe("#calculateScores_sol()", async function(){
  it('should not return null :', async function() {
    const return_value = await calculateScores_sol('/Users/antoineazar/rarity-bot/collection_traits/Punktee.json', '/Users/antoineazar/rarity-bot/hash_list.json');
    assert.ifError(return_value);
    assert.equal(return_value.length, 169);
  })
})
