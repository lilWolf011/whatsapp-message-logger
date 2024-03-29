const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox"],
  },
});
client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: true });
});
client.on("ready", () => {
  console.log("Client is ready!");
});

/*
const axios = require("axios");
async function postMessageToWebhook(embeds) {
  let data = JSON.stringify({ embeds });
    let config = {
    method: "POST",
    url: "your webhook url", // url: 'https://discord.com/webhook/url/here ',
    headers: { "Content-Type": "application/json" },
    data: data,
  };
  axios(config)
    .then((response) => {
      console.log("Webhook delivered successfully");
      return response;
    })
      .catch((error) => {
      console.log(error);
      return error;
    });
}
*/

client.on("message", async (msg) => {
  const date = new Date().toISOString().substring(0, 10);
  const time = new Date();
  const formattedTime = time
    .toISOString()
    .replace(/T/, " ")
    .replace(/:/g, "_")
    .split(" ")[1]
    .split(".")[0];
  //console.log(msg["_data"]);
  const person = msg._data.notifyName;
  const fullDate = date + " " + formattedTime.replace(/_/g, ":");

  var phoneNumber;
  if (msg.id.participant !== undefined) {
    // 'participant' alanı tanımlı ise GRUPTUR
    var phoneNumber = msg._data.author.replace(/@c.us/g, "");
  } else {
    // 'participant' alanı tanımlı değilse DM'DİR
    var phoneNumber = msg._data.from.replace(/@c.us/g, "");
  }
  /*
  let embeds = [
    {
      title: "Whatsapp Message",
      color: 5814783,
      fields: [
        {
          name: "Id",
          value: `${msg.id.id}`,
          inline: true,
        },
        {
          name: "Phone Number",
          value: `${phoneNumber}`,
          inline: true,
        },
        {
          name: "Person",
          value: `${person}`,
          inline: true,
        },
        {
          name: "Message",
          value: "undefined",
          inline: true,
        },
      ],
      footer: {
        text: `Date • ${fullDate}`,
      },
    },
  ]
*/
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();
    if (msg.type === "image" || msg.type === "video" || msg.type === "ptt") {
      try {
        const folder = path.join(
          process.cwd(),
          media.mimetype.split("/")[0],
          `${phoneNumber}_${person}`,
          date,
        );

        fs.mkdirSync(folder, { recursive: true });

        let splited = media.mimetype.split("/")["1"];
        const filename = path.join(
          folder,
          `${formattedTime} ${msg.id.id}.${msg.type === "ptt" ? splited.split(";")[0] : splited}`,
        );

        fs.writeFileSync(filename, Buffer.from(media.data, "base64"), "binary");

        console.log(
          `${media.mimetype.split("/")[0]} saved successfully:`,
          filename,
        );

        //embeds[0].fields[3].value = filename;
        //postMessageToWebhook(embeds);
      } catch (error) {
        console.error(`Error saving ${media.mimetype.split("/")[0]}:`, error);
      }
    }
  } else if (msg.type === "chat") {
    const message = msg.body;
    const json = [
      {
        Id: msg.id.id,
        Number: phoneNumber,
        Person: person,
        Date: date,
        Time: formattedTime.replace(/_/g, ":"),
        Message: message,
      },
    ];

    const dir = "./text";
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(__dirname, dir, "text.json");

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const jsonArray = [...data, ...json];
      fs.writeFileSync(filePath, JSON.stringify(jsonArray));
    } catch (error) {
      console.log("error yazıo");
      console.log(error);
      fs.writeFileSync(filePath, JSON.stringify(json));
    }
    //embeds[0].fields[3].value = message;
    //postMessageToWebhook(embeds);
  }
});

client.initialize();
