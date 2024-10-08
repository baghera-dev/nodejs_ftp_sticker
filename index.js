const express = require('express');
const bodyParser = require('body-parser');
const ftp = require('basic-ftp');
const { Buffer } = require('node:buffer');

// nodejs 10.17.0 and up
const axios = require('axios');
const { Readable } = require('stream');


const app = express();

app.use(bodyParser.json({limit: '50mb'}));

app.post('/upload', async (req, res) => {
  try {
    console.log(req.body);
    // {
    //     "orderId": ,
    //     "lineItems": [
    //         {
    //             "_sticker_image": "",
    //             "_sticker_product_sku": ""
    //         }
    //     ]
    // }
   

    const orderId = req.body.orderId;
    const arr = req.body.lineItems.filter(el => el._sticker_image);
    const warehouse = req.body.warehouse;



    if(warehouse == 'Belgium') {
      const client = new ftp.Client();
      client.ftp.verbose = true;

      await client.access({
          host: 'ftp.interlines.be',
          user: 'BAGHERA2',
          password: 'Tobir9DrodentijCyFry',
      });




      for(let i=0; i<arr.length; i++) {
        const base64Data = arr[i]._sticker_image.replace(/^data:image\/png;base64,/, "");
        const decodedImage = Buffer.from(base64Data, 'base64');
        const stream = Readable.from(decodedImage);

        const remoteDir = '/00-RECEIPT/05-ETIKETS';
        await client.cd(remoteDir);


        // await client.uploadFrom(decodedImage, `/00-RECEIPT/05-ETIKETS/order-${orderId}__sku-${arr[i]._sticker_product_sku}.png`);
        await client.uploadFrom(stream, `order-${orderId}__sku-${arr[i]._sticker_product_sku}.jpg`);
      }

      await client.close();

      res.status(200).send('Images uploaded to FTP server');
    } else if (warehouse == 'Germany') {
      for (let i = 0; i < arr.length; i++) {
        const base64Data = arr[i]._sticker_image.replace(/^data:image\/\w+;base64,/, "");
        
        const payload = {
          fileName: `order-${orderId}__sku-${arr[i]._sticker_product_sku}.jpg`,
          mimeType: 'image/jpeg',
          imageData: base64Data
        };
  
        await axios.post('https://script.google.com/macros/s/AKfycbztA5HJ6mUwpPls3Mmp4syiT-3ctYGKxoB6PSJjW91c9LljBb0Y7n5Vi5ik6U9XaY5yIQ/exec', payload)
          .then(response => {
            console.log('Image uploaded successfully:', response.data);
          })
          .catch(error => {
            console.error('Error uploading image:', error);
          });
      }
  
      res.status(200).send('Images uploaded to Google Drive');
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading image to server');
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
