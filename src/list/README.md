# Listing Process

## How to list ?

The listing process starts off with the command :
```
node index.js <flag> <hash_list_file_path> <--custom>
```

### Flags:
`-s` : For a solana listing.

`-e` : For a ethereum listing.

`--custom` : For a custom listing. **Omit** for a masterRarirty listing.

> For the `hash_list_file_path`, it should be either a relative or an absolute file path.

---

## What are the steps of listing (under the hood) ?

1. **Creating the traits file :** Going over the hash list, filtering the nft's that are not in the collection and getting the traits recurrences of the collection which will lead to the creation of a `.json` file of all the traits recurrences.

2. **Calculating the scores :** Going over the hash list again, but this time looking at the ntf's attributes and the traits recurrences file of this specific collection to calculate the rarity score of each NFT.

3. **Sorting the ranked NFTs :** Sorting the scores from the rarest to the least rare.

4. **Creating the csv file :** Generating a csv string from the object and then creating a csv file to be able to get a visual on the rankings.

5. **Uploading to the db (optional) :** After verifying that the ranking makes sense from the csv file generated. Send `y` in the terminal when prompted to upload the listing to the db.

> Sending an `n` will cancel the operation and quit the program.

6. **Sending an announcement (optional) :** You will asked if you want to send an announcement on discord. Agreeing will send it in the [`#🆕┃new-collections`](https://discord.com/channels/934957589215727686/935129701146566676) channel. 
