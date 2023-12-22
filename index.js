const fs = require("fs");
const { writeFile, mkdir, readFile } = require("fs/promises");
const path = require("path");
const qrcode = require("qrcode-terminal");
const { Client, NoAuth } = require("whatsapp-web.js");

//If you want to connect this app to the discord webhook, remove the comment lines below.

//const axios = require("axios");
/*
async function postMessageToWebhook(embeds) {
  let data = JSON.stringify({ embeds });
  let config = {
    method: "POST",
    url: 'WEBHOOK URL HERE', // url: 'https://discord.com/webhook/url/here ',
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
  authStrategy: new NoAuth(),
});

// qr code in terminal
client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

//detecting that a message has arrived
client.on("message", async (msg) => {
  const date = new Date().toISOString().substring(0, 10);
  const time = new Date();
  const formattedTime = time
    .toISOString()
    .replace(/T/, " ")
    .replace(/:/g, "_")
    .split(" ")[1]
    .split(".")[0]; //time: 17_57_28
  //console.log(msg['_data']); //remove the comment line if you want to see all the information of incoming messages in the console.
  const person = msg._data.notifyName;
  var phoneNumber;
  //to understand if messages come from the group or from a dm
  if (msg.id.participant !== undefined) {
    var phoneNumber = msg._data.author.replace(/@c.us/g, "");
  } else {
    var phoneNumber = msg._data.from.replace(/@c.us/g, "");
  }

  if (msg.hasMedia) {
    const media = await msg.downloadMedia();

    if (msg.type === "ptt") {
      // message type === voice message
      try {
        console.log("Voice Clip Received");
        const folder = path.join(
          process.cwd(),
          "audio",
          `${phoneNumber}_${person}`,
          date
        );
        await mkdir(folder, { recursive: true });

        const filename = path.join(folder, `${formattedTime} ${msg.id.id}.ogg`);

        const decodedData = Buffer.from(media.data, "base64");
        writeFile(filename, decodedData);
        console.log("Voice clip saved successfully:", filename);
      } catch (error) {
        console.error("Error saving voice clip:", error);
      }
    } else if (msg.type === "image") {
      // message type === image
      try {
        const folder = path.join(
          process.cwd(),
          "img",
          `${phoneNumber}_${person}`,
          date
        );
        await mkdir(folder, { recursive: true });

        const filename = path.join(
          folder,
          `${formattedTime} ${msg.id.id}.${media.mimetype.split("/")[1]}`
        );
        writeFile(filename, Buffer.from(media.data, "base64"), "binary");

        console.log("Image saved successfully:", filename);
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }
    //else if (msg.type == "PDF") {} // Will be added soon (Maybe)
  } else if (msg.type === "chat") {
    const json = [
      {
        Id: msg.id.id,
        Number: phoneNumber,
        Person: person,
        Date: date,
        Time: formattedTime.replace(/_/g, ":"),
        Message: msg.body,
      },
    ];

    const dir = "./text";
    mkdir(dir, { recursive: true });

    const filePath = path.join(__dirname, dir, "text.json");

    try {
      const data = JSON.parse(await readFile(filePath, "utf8")); // Read the current data in the file
      const jsonArray = [...data, ...json]; // Merge existing data with new data
      fs.writeFileSync(filePath, JSON.stringify(jsonArray)); // Write merged data to file
    } catch (error) {
      console.error("Error saving message: ", error);
    }
    // if you want the discord webhook to work you need to remove the comment line here
    /*
    let embeds = [
      {
        title: "Whatsapp Messager",
        color: 5814783,
        fields: [
          {
            name: "Id",
            value: `${msg.id.id}`,
            inline: true
          },
          {
            name: "Phone Number",
            value: `${phoneNumber}`,
            inline: true
          },
          {
            name: "Person",
            value: `${person}`,
            inline: true
          },
          {
            name: "Message",
            value: `${msg.body}`,
            inline: true
          }
        ],
        footer: {
          text: `Date • ${date} & Time • ${formattedTime.replace(/_/g, ":")}`
        },
      },
    ];
    postMessageToWebhook(embeds);
    */
  }
});

client.initialize();
