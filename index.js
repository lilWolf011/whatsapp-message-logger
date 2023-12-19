const fs = require('fs');
const { writeFile, mkdir, readFile } = require('fs/promises');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, NoAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new NoAuth(),
});

client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async (msg) => {
  const time = new Date(msg.timestamp * 1000)
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .split(' ')[1]
    .replace(/:/g, '-');
  const date = new Date(msg.timestamp * 1000).toISOString().substring(0, 10);

  const person = msg._data.notifyName;
  const phoneNumber = msg.from.replace(/@c.us/g, '');

  if (msg.hasMedia) {
    const media = await msg.downloadMedia();
    const folder = path.join(process.cwd(), 'img', `${phoneNumber}_${person}`, date);
    await mkdir(folder, { recursive: true });
    const filename = path.join(folder, `${time}_${msg.id.id}.${media.mimetype.split('/')[1]}`);
    await writeFile(filename, Buffer.from(media.data, 'base64').toString('binary'), 'binary');
  } else if (msg.type === 'chat') {
    const message = msg.body;
    const json = [{
      Number: phoneNumber,
      Person: person,
      Date: date,
      Message: message,
    }];

    const dir = './text';
    await mkdir(dir, { recursive: true });

    const filePath = path.join(__dirname, dir, 'text.json');

    try {
      const data = JSON.parse(await readFile(filePath, 'utf8'));
      const jsonArray = [...data, ...json];
      await writeFile(filePath, JSON.stringify(jsonArray));
    } catch (error) {
      await writeFile(filePath, JSON.stringify(json));
    }
  }
});

client.initialize();
