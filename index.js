const fs = require("fs");
const { writeFile, mkdir, readFile } = require("fs/promises");
const path = require("path");
const qrcode = require("qrcode-terminal");
const { Client, LegacySessionAuth, LocalAuth } = require("whatsapp-web.js");
/*
const axios = require("axios");

async function postMessageToWebhook(embeds) {
  let data = JSON.stringify({ embeds });
  let config = {
    method: "POST",
    url: "YOUR WEBHOOK URL", // url: 'https://discord.com/webhook/url/here ',
    headers: { "Content-Type": "application/json" },
    data: data,
  };

  //Send the request
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

client.on("message", async (msg) => {
  const date = new Date().toISOString().substring(0, 10);
  const time = new Date();
  const formattedTime = time
    .toISOString()
    .replace(/T/, " ")
    .replace(/:/g, "_")
    .split(" ")[1]
    .split(".")[0];
  const fullDate = date + "_" + formattedTime;
  //console.log(msg["_data"]);
  const person = msg._data.notifyName;
  var phoneNumber;
  if (msg.id.participant !== undefined) {
    // 'participant' alanı tanımlı ise GRUPTUR
    var phoneNumber = msg._data.author.replace(/@c.us/g, "");
  } else {
    // 'participant' alanı tanımlı değilse DM'DİR
    var phoneNumber = msg._data.from.replace(/@c.us/g, "");
  }

  if (msg.hasMedia) {
    const media = await msg.downloadMedia();

    if (msg.type === "ptt") {
      try {
        const folder = path.join(
          process.cwd(),
          "audio",
          `${phoneNumber}_${person}`,
          date,
        );
        await mkdir(folder, { recursive: true });
        const filename = path.join(
          folder,
          `${formattedTime}_${msg.id.id}.${media.mimetype.split("/")[1]}`,
        );

        const decodedData = Buffer.from(media.data, "base64");
        fs.writeFileSync(filename, decodedData);
        console.log("Voice clip saved successfully:", filename);
      } catch (error) {
        console.error("Error saving voice clip:", error);
      }
    } else if (msg.type === "image" || msg.type === "video") {
      try {
        const folder = path.join(
          process.cwd(),
          media.mimetype.split("/")[0],
          `${phoneNumber}_${person}`,
          date,
        );
        await mkdir(folder, { recursive: true });
        const filename = path.join(
          folder,
          `${formattedTime} ${msg.id.id}.${media.mimetype.split("/")[1]}`,
        );

        await writeFile(filename, Buffer.from(media.data, "base64"), "binary");
        console.log(
          `${media.mimetype.split("/")[0]} saved successfully:`,
          filename,
        );
      } catch (error) {
        console.error(`Error saving ${media.mimetype.split("/")[0]}:`, error);
      }
    }
    //else if (msg.type == "") {}
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
    await mkdir(dir, { recursive: true });
    const filePath = path.join(__dirname, dir, "text.json");

    try {
      const data = JSON.parse(await readFile(filePath, "utf8"));
      const jsonArray = [...data, ...json];
      await writeFile(filePath, JSON.stringify(jsonArray));
    } catch (error) {
      await writeFile(filePath, JSON.stringify(json));
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
            value: `${message}`,
            inline: true,
          },
        ],
        footer: {
          text: `Date • ${fullDate}`,
        },
      },
    ];
    postMessageToWebhook(embeds);
    */
  }
});

client.initialize();
