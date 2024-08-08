const express = require('express');
const bodyParser = require('body-parser');
const ftp = require('basic-ftp');
const { Buffer } = require('node:buffer');

// nodejs 10.17.0 and up
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');


const app = express();

app.use(bodyParser.json({limit: '50mb'}));

app.post('/upload', async (req, res) => {
  try {
    // console.log(req.body);
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

    for (let i = 0; i < arr.length; i++) {
      const base64Data = arr[i]._sticker_image.replace(/^data:image\/\w+;base64,/, "");
      const decodedImage = Buffer.from(base64Data, 'base64');
      const stream = Readable.from(decodedImage);
  
      
      const payload = {
        fileName: `order-${orderId}__sku-${arr[i]._sticker_product_sku}.jpg`,
        mimeType: 'image/jpeg',
        imageData: stream
      };

      await axios.post('https://script.google.com/macros/s/AKfycbw5cu9nh-xxd2BXJY6ZxQpZnMmeXFu_c0ErpWqpMqMHg3xTSMLHTgQ2E7gBAfEVuG36fg/exec', payload)
        .then(response => {
          console.log('Image uploaded successfully:', response.data);
        })
        .catch(error => {
          console.error('Error uploading image:', error);
        });
    }

    res.status(200).send('Images uploaded to Google Drive');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading image to Google Drive');
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
