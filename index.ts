import makeWASocket, {
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { createWriteStream } from "fs";
import pino from "pino";
import qr from "qr-image";
import express from "express";
import { Boom } from "@hapi/boom";
import { rimraf } from "rimraf";
import { join } from "path";
const PORT = process.env.PORT || 3000;
interface IGroup {
  id: string;
  name: string;
}
const baileyGenerateImage = async (base64: string, name = "qr.png") => {
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

  constructor(name: string) {
    this.name = name;
    this.mysock = undefined;
    this.saveCredsGlobal = undefined;
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
    } catch (e) {
      console.log(e);
    }
  };
  initBusEvents = (_sock: ReturnType<typeof makeWASocket>) => {
    this.mysock = _sock;
  };
}
let bailey = new BaileysProvider("melkmeshi");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  if (bailey.mysock) {
    bailey.mysock?.sendMessage("218910441322@s.whatsapp.net", { text: "hi" });
    res.send({ message: "sent" });
  } else {
    console.log("Sock is not avalible");
    res.send({ message: "Sock is not avalible" });
  }
});
app.get("/allgroups", async (req, res) => {
  if (bailey.mysock) {
    const data = await bailey.mysock?.groupFetchAllParticipating();
    res.send({ data });
  } else {
    console.log("Sock is not avalible");
    res.send({ message: "Sock is not avalible" });
  }
});
app.get("/getgroubid/:name", async (req, res) => {
  if (bailey.mysock) {
    const data = await bailey.mysock?.groupFetchAllParticipating();
    let id = "";
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
app.get("/getgroubs", async (req, res) => {
  if (bailey.mysock) {
    const data = await bailey.mysock?.groupFetchAllParticipating();
    const groups: IGroup[] = [];
    for (const [key, value] of Object.entries(data)) {
      groups.push({ name: value.subject, id: key });
    }
    res.send(groups);
  } else {
    res.send({ message: "Sock is not avalible" });
  }
});
app.post("/", async (req, res) => {
  if (!bailey.mysock) {
    console.log("WhatsApp connection not established.");
    return res
      .status(310)
      .json({ message: "WhatsApp connection not established." });
  }
  try {
    let phoneNumber = req.body.phoneNumber || "218910441322";
    const message = req.body.message || "hi";
    phoneNumber = phoneNumber
      .replaceAll("+", "")
      .replaceAll("-", "")
      .replaceAll(" ", "")
      .replaceAll("(", "")
      .replaceAll(")", "");
    if (phoneNumber[3] === "0") {
      phoneNumber = phoneNumber.slice(0, 3) + phoneNumber.slice(4);
    }
    const on = await bailey.mysock.onWhatsApp(phoneNumber);
    if (on.length > 0) {
      console.log("Sending message to: ", phoneNumber);
      await bailey.mysock.sendMessage(`${phoneNumber}@s.whatsapp.net`, {
        text: message,
      });
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
app.post("/group", async (req, res) => {
  try {
    console.log(req.body);
    const groupID = req.body.groupid;
    const message = req.body.message || "hi";
    if (!groupID) {
      res.status(400).json({ message: "Group id is required." });
      return;
    }
    await bailey.mysock?.sendMessage(`${groupID}@g.us`, {
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

app.listen(PORT, () => {
  console.log(`Example app live in http://localhost:${PORT}`);
});
