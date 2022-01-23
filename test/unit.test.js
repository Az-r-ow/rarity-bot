import {
  getMetadataData_sol,
  calculateScores_sol,
  getTraitsRecurrences_sol,
  moonRarityAlgo
} from '../src/utils/sol.mjs';
import {assert} from 'chai';
import fs from 'fs';


describe('getMetadata_sol()', function(){
  it('Passing in a valid hash and returning an object', function(){
    return getMetadataData_sol('HnDYPS8jE3jpX5UbLHoVo3CjSprbNRfu9kyh1XZCWgsa').then(d => {
      assert.isObject(d, 'Returned an object !')
    })
  });
});

describe('getTraitsRecurrences_sol()', function(){
  it('Should return a string that is a valid path', async () => {
     await getTraitsRecurrences_sol('/Users/antoineazar/rarity-bot/test/test_cases/hash_list.json', '/Users/antoineazar/rarity-bot/test/test_cases/output').then(res => {
      assert.typeOf(res, 'string', 'Returned String');
      assert.isTrue(fs.existsSync(res), 'The path exists');
    })
  }).timeout(10000);
})

describe('moonRarityAlgo()', function(){
  it('Returns array of scored nft', async () => {
    await moonRarityAlgo('/Users/antoineazar/rarity-bot/test/test_cases/output/hash_list.json', '/Users/antoineazar/rarity-bot/test/test_cases/hash_list.json').then(res => {
      assert.isArray(res, 'An array was returned.');
      assert.lengthOf(res, 9, 'It has the lenght of the hash_list')
    });
  }).timeout(10000);
})
