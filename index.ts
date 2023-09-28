import makeWASocket, {
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
  AnyMessageContent,
  delay,
} from "@whiskeysockets/baileys";
import { createWriteStream } from "fs";
import pino from "pino";
import qr, { image } from "qr-image";
import express from "express";
import { Boom } from "@hapi/boom";
import { rimraf } from "rimraf";
import { join } from "path";
import fileUpload from "express-fileupload";
import WebSocket from "ws";
import http from "http";
import QRCode from "qrcode";
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const userConnections: Record<string, { ws: WebSocket }> = {};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    //@ts-ignore
    const data = JSON.parse(message);
    console.log(data.type);
    if (data.type === "set-username") {
      const username = data.username;
      userConnections[username] = { ws };
      console.log(qrs);
      ws.send(
        JSON.stringify({
          type: "qr-code",
          message: qrs[username],
        })
      );
    }
  });

  ws.on("close", () => {
    for (const username in userConnections) {
      if (userConnections[username].ws === ws) {
        delete userConnections[username];
        break;
      }
    }
  });
});
let isListening = false;
const PORT = process.env.PORT || 3000;
interface IGroup {
  id: string;
  name: string;
}
const qrs: Record<string, string> = {};
const baileyGenerateImage = async (base64: string, name = "qr.png") => {
  const username = name.replace(".qr.png", "");
  QRCode.toDataURL(base64).then((url) => {
    qrs[username] = url;
  });
  if (userConnections[username]) {
    QRCode.toDataURL(base64).then((url) => {
      userConnections[username].ws.send(
        JSON.stringify({
          type: "qr-code",
          message: url,
        })
      );
    });
  }
  const PATH_QR = `${process.cwd()}/${name}`;
  let qr_svg = qr.image(base64, { type: "png", margin: 4 });

  const writeFilePromise = () =>
    new Promise((resolve, reject) => {
      const file = qr_svg.pipe(createWriteStream(PATH_QR));
      file.on("finish", () => resolve(true));
      file.on("error", reject);
    });

  await writeFilePromise();
};
class BaileysProvider {
  name: String;
  saveCredsGlobal: undefined | (() => Promise<void>);
  mysock: ReturnType<typeof makeWASocket> | undefined;
  sendMessageWTyping: (msg: AnyMessageContent, jid: string) => Promise<void>;
  constructor(name: string) {
    this.name = name;
    this.mysock = undefined;
    this.saveCredsGlobal = undefined;
    this.sendMessageWTyping = async (msg: AnyMessageContent, jid: string) => {
      await this.mysock!.presenceSubscribe(jid);
      await delay(500);

      await this.mysock!.sendPresenceUpdate("composing", jid);
      await delay(2000);

      await this.mysock!.sendPresenceUpdate("paused", jid);

      await this.mysock!.sendMessage(jid, msg);
      await delay(2000);
    };
    this.initBailey().then();
  }
  initBailey = async () => {
    const NAME_DIR_SESSION = `${this.name}_sessions`;
    const { state, saveCreds } = await useMultiFileAuthState(NAME_DIR_SESSION);
    this.saveCredsGlobal = saveCreds;

    try {
      const sock = makeWASocket({
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS("Desktop"),
        syncFullHistory: false,
        logger: pino({ level: "fatal" }),
      });
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        if (connection === "close") {
          if (statusCode !== DisconnectReason.loggedOut) {
            this.initBailey();
          }
          if (statusCode === DisconnectReason.loggedOut) {
            const PATH_BASE = join(process.cwd(), NAME_DIR_SESSION);
            rimraf(PATH_BASE);
            this.initBailey();
          }
        }
        if (connection === "open") {
          console.log("ready");
          if (!isListening) {
            isListening = true;
          }
          this.initBusEvents(sock);
        }
        /** QR Code */
        if (qr) {
          await baileyGenerateImage(qr, `${this.name}.qr.png`);
        }
      });
      sock.ev.on("creds.update", async () => {
        await saveCreds();
      });
      sock.ev.on("messages.upsert", async (upsert) => {
        if (upsert.type === "notify") {
          // console.log("recv messages ", JSON.stringify(upsert, undefined, 2));
          for (const msg of upsert.messages) {
            if (!msg.key.fromMe) {
              if (msg.key.participant) {
                console.log(
                  "message from: ",
                  msg.key.participant,
                  " in group id: ",
                  msg.key.remoteJid,
                  " message content: ",
                  msg.message?.conversation
                );
              } else {
                console.log(
                  "message from: ",
                  msg.pushName,
                  "message content ",
                  msg.message?.conversation
                );
              }
              await sock!.readMessages([msg.key]);
              this.sendMessageWTyping(
                { text: msg.message?.conversation || "hi" },
                msg.key.remoteJid!
              );
            }
          }
        }
      });
    } catch (e) {
      console.log(e);
    }
  };
  initBusEvents = (_sock: ReturnType<typeof makeWASocket>) => {
    this.mysock = _sock;
  };
}
let bailey: Record<string, BaileysProvider> = {};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
const checkusername = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (bailey[req.body.name]) {
    next();
  } else {
    res.send({ message: "User not found" });
  }
};

// app.get("/", (req, res) => {
//   if (bailey.mysock) {
//     const username = req.body.username;
//     bailey[username].sendMessageWTyping(
//       { text: "hi" },
//       "218910441322@s.whatsapp.net"
//     );
//     res.send({ message: "sent" });
//   } else {
//     console.log("Sock is not avalible");
//     res.send({ message: "Sock is not avalible" });
//   }
// });
app.post("/", checkusername, async (req, res) => {
  const username = req.body.username;
  if (!bailey[username].mysock) {
    console.log("WhatsApp connection not established.");
    return res
      .status(310)
      .json({ message: "WhatsApp connection not established." });
  }
  try {
    let phoneNumber = req.body.phoneNumber || "218910441322";
    const message = req.body.message || "hi";
    console.log(req.body);
    phoneNumber = phoneNumber
      .replaceAll("+", "")
      .replaceAll("-", "")
      .replaceAll(" ", "")
      .replaceAll("(", "")
      .replaceAll(")", "");
    if (phoneNumber[3] === "0") {
      phoneNumber = phoneNumber.slice(0, 3) + phoneNumber.slice(4);
    }
    const on = await bailey[username]?.mysock?.onWhatsApp(phoneNumber);
    if (!on) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    if (on.length > 0) {
      console.log("Sending message to: ", phoneNumber);
      await bailey[username]?.sendMessageWTyping(
        {
          text: message,
        },
        `${phoneNumber}@s.whatsapp.net`
      );
      res.status(200).json({ message: "Message sent." });
    } else {
      console.log("User not found: ", phoneNumber);
      res.status(404).json({ message: "User not found." });
    }
  } catch (err) {
    console.log("Error: ", err);
    res
      .status(500)
      .json({ message: "Internel server error.", error: String(err) });
  }
});
app.post("/newgroup", checkusername, async (req, res) => {
  if (!bailey.mysock) {
    console.log("WhatsApp connection not established.");
    return res
      .status(310)
      .json({ message: "WhatsApp connection not established." });
  }
  try {
    const groupName = req.body.groupName || "My test Group";
    const phoneNumber = req.body.phoneNumber || "218911779014";
    const username = req.body.username;
    const on = await bailey[username]?.mysock?.onWhatsApp(phoneNumber);
    if (!on) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    if (on.length > 0) {
      const group = await bailey[username]?.mysock?.groupCreate(groupName, [
        `${phoneNumber
          .replaceAll("+", "")
          .replaceAll("-", "")
          .replaceAll(" ", "")}@s.whatsapp.net`,
        "218910441322@s.whatsapp.net",
      ]);
      res.status(200).json({ message: "Message sent." });
    } else {
      console.log("User not found: ", phoneNumber);
      res.status(404).json({ message: "User not found." });
    }
  } catch (err) {
    console.log("Error: ", err);
    res
      .status(500)
      .json({ message: "Internel server error.", error: String(err) });
  }
});
app.post("/group", checkusername, async (req, res) => {
  try {
    const groupID = req.body.groupid;
    const message = req.body.message || "hi";
    const username = req.body.username;
    if (!groupID) {
      res.status(400).json({ message: "Group id is required." });
      return;
    }
    await bailey[username].mysock?.sendMessage(groupID, {
      text: message,
    });
    res.status(200).json({ message: "Message sent." });
  } catch (err) {
    console.log("Error: ", err);
    res
      .status(500)
      .json({ message: "Internel server error.", error: String(err) });
  }
});
app.post("/sendvideo", checkusername, async (req, res) => {
  const video = req.files!.video as fileUpload.UploadedFile;
  const phoneNumber = req.body.phoneNumber + "@s.whatsapp.net";
  const caption = req.body.caption;
  const username = req.body.username;
  await bailey[username].sendMessageWTyping(
    {
      video: video.data,
      caption,
      gifPlayback: false,
    },
    `${phoneNumber}`
  );
  res.send("ok");
});
app.post("/sendimage", checkusername, async (req, res) => {
  const image = req.files!.image as fileUpload.UploadedFile;
  const phoneNumber = req.body.phoneNumber + "@s.whatsapp.net";
  const caption = req.body.caption;
  const username = req.body.username;
  await bailey[username].sendMessageWTyping(
    {
      image: image.data,
      caption: caption ?? "",
    },
    `${phoneNumber}`
  );
  res.send("ok");
});
app.post("/sendfile", checkusername, async (req, res) => {
  const file = req.files!.file as fileUpload.UploadedFile;
  const phoneNumber = req.body.phoneNumber + "@s.whatsapp.net";
  const username = req.body.username;
  await bailey[username].sendMessageWTyping(
    {
      document: file.data,
      mimetype: file.mimetype,
      fileName: file.name,
    },
    `${phoneNumber}`
  );
  res.send("ok");
});
app.post("/bulk", checkusername, async (req, res) => {
  const message = req.body.message;
  const numbers = req.body.numbers;
  const username = req.body.username;
  const numbersArray = numbers.split(",");
  for (const number of numbersArray) {
    await bailey[username].sendMessageWTyping(
      { text: message },
      `${number}@s.whatsapp.net`
    );
  }
  res.send("ok");
});
app.get("/sendattchment", async (req, res) => {
  res.sendFile(__dirname + "/sendattchment.html");
});
app.get("/sendgroup", async (req, res) => {
  res.sendFile(__dirname + "/groupmessage.html");
});
app.get("/scan/:username", async (req, res) => {
  const username = req.params.username;
  if (!bailey.hasOwnProperty(username)) {
    console.log("new user");
    bailey[username] = new BaileysProvider(username);
  }
  res.sendFile(__dirname + "/scan.html");
});
app.get("/allgroups/:username", async (req, res) => {
  if (bailey.mysock) {
    const username = req.params.username;
    const data = await bailey[username].mysock?.groupFetchAllParticipating();
    res.send({ data });
  } else {
    console.log("Sock is not avalible");
    res.send({ message: "Sock is not avalible" });
  }
});
app.get("/getgroupid/:name/:username", async (req, res) => {
  if (bailey.mysock) {
    const username = req.params.username;
    const data = await bailey[username].mysock?.groupFetchAllParticipating();
    let id = "";
    if (!data) return res.send({ message: "No groups found" });
    for (const [key, value] of Object.entries(data)) {
      if (
        value.subject.trim().toLowerCase() ==
        req.params.name.trim().toLowerCase()
      ) {
        console.log(key);
        id = key;
      }
    }
    res.send({ id });
  } else {
    res.send({ message: "Sock is not avalible" });
  }
});
app.get("/getgroups/:username", async (req, res) => {
  if (bailey.mysock) {
    const username = req.params.username;
    const data = await bailey[username].mysock?.groupFetchAllParticipating();
    const groups: IGroup[] = [];
    if (!data) return res.send({ message: "No groups found" });
    for (const [key, value] of Object.entries(data)) {
      groups.push({ name: value.subject, id: key });
    }
    res.send(groups);
  } else {
    res.send({ message: "Sock is not avalible" });
  }
});
server.listen(PORT, () => {
  console.log("Server is running on port 3000");
});
