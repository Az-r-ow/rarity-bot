
![Maintenance](https://img.shields.io/badge/Maintained%3F-no-red.svg)

![Generic badge](https://img.shields.io/badge/Status-Down-red.svg)
# 🖼 NFT Ranker (Rarity Master)

This bot implements an algorithm that goes over each and every single **trait** in each NFT in the collection. Keeping count of the number of times each trait has occured.

This might sound confusing so this is an example :

![name](https://images-ext-1.discordapp.net/external/6FH-CPwga_es4JQErmm15A7KxE2gqy1qFfCqkz5XssI/https/pnkt.pronft.dev/img/a76dcbee-fa1f-434b-b56a-1c2aa681356e.png?width=300&height=300)

 Here we have our fellow `Punk Tee #53`, he has a hat.
 This hat goes in the trait type : `head_accessories`. There's around `165` Punk Tees in this collection.
 And `20` of them have this hat.
 So probability would be :
 
 $$0 / 165 = 0,12$$

 The formula I used to calculate the `trait`'s score of an attribute (Ex: the cap) is :
 
 $$ TraitScore_{\left( a \right)} = 100 \times (1 - (\frac{NumRecurrences_{(a)}}{TotalNum})) $$

 And then the final score is just the sum of all the  `TraitScore` together  giving a final formula of :

$$ \sum_{a\to n}^{a} TraitScore_{(a)} = 100 \times (1 - (\frac{NumRecurrences_{(a)}}{TotalNum})) $$

You can find the implementation in the function :
```javascript
/**
 * masterAlgo - Our rarity algorithm
 *
 * @param  {String} traits_file_path Path to the trait's file (json)
 * @param  {String} hs_file_path     Path to the hash list (json)
 * @return {Array}                  An array of scored NFT objects
 */
async function masterAlgo(traits_file_path, hs_file_path)
```

❗️I would recommend to check the `/src/utils` folder for more information about how I load and handle the fetching the `Metadata` from web3.
## 📸 Screenshots

#### A legendary Punktee :
<img src="https://media.discordapp.net/attachments/760579818256334878/1032035086339686432/Screenshot_2022-10-18_at_22.57.33.png" width="300" height="300">


#### The front page :
<img src="https://media.discordapp.net/attachments/760579818256334878/1032035086767489074/Screenshot_2022-10-18_at_22.58.23.png" alt="Recto" width="300" height="300">


#### The back page :
<img src="https://media.discordapp.net/attachments/760579818256334878/1032035087094665226/Screenshot_2022-10-18_at_22.58.33.png" alt="Verso" width="300" height="300">

## 💻 Tech Stack

**Client:** Discord JS

**Server:** Node JS

    Dependencies :
    - @metaplex/js
    - @solana/web3.js
    - cli-progress
    - csv-stringify
    - discordjs
    - dotenv
    - mongoose
    - nodefetch


## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`DB_URL` - A URL to your mongoose atlas Database

`TOKEN` - Discord bot token that you can get from the dev app


## Authors

- [@Az-r-ow](https://www.github.com/Az-r-ow)
