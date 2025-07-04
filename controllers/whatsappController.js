import baileys from "@whiskeysockets/baileys";

const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  makeInMemoryStore,
  useMultiFileAuthState,
} = baileys;

import dotenv from "dotenv";
dotenv.config();

import { Boom } from "@hapi/boom";
import logger from "../helpers/logger.js";
import qrcode from "qrcode";
import fs from "fs";
import pino from "pino";
import {
  parseMessage,
  checkIfShowCommand,
  parsingShowCommand,
} from "../helpers/parsingMessage.js";

import {
  buildMessageLog,
  getHelpCommand,
  buildMessageReport,
} from "../helpers/formatter.js";
import * as transactionService from "../services/transactionService.js";

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

let sock;
let qr;
let soket;

export const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    logger: pino({ level: "silent" }),
    version,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
  });

  store.bind(sock.ev);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect.error).output.statusCode;
      switch (reason) {
        case DisconnectReason.badSession:
          logger.warn(`Bad Session File, Please Delete session and Scan Again`);
          deleteAuthData();
          break;
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.restartRequired:
        case DisconnectReason.timedOut:
          logger.warn("Connection closed, reconnecting....");
          connectToWhatsApp();
          break;
        case DisconnectReason.connectionReplaced:
          logger.warn(
            "Connection Replaced, Please Close Current Session First"
          );
          deleteAuthData();
          connectToWhatsApp();
          break;
        case DisconnectReason.loggedOut:
          logger.warn(
            `Device Logged Out, Please Delete session and Scan Again.`
          );
          deleteAuthData();
          connectToWhatsApp();
          break;
        default:
          logger.error(
            `Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`
          );
      }
    } else if (connection === "open") {
      logger.info("Conncection opened successfully!");
    }
    if (update.qr) {
      qr = update.qr;
      updateQR("qr");
    } else if ((qr = undefined)) {
      updateQR("loading");
    } else if (update.connection === "open") {
      updateQR("qrscanned");
    }
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify" || messages[0].key.fromMe) return;

    const msg = messages[0].message.conversation || "";
    const whatsappNumber = messages[0].key.remoteJid;
    logger.info(`Received message from ${whatsappNumber} "${msg}"`);

    if (!isNumberAllowed(whatsappNumber)) {
      return;
    }

    await sock.readMessages([messages[0].key]);

    if (await handleHelpCommand(sock, whatsappNumber, msg, messages[0])) return;
    if (await handleShowCommand(sock, whatsappNumber, msg, messages[0])) return;
    await handleStoreCommand(sock, whatsappNumber, msg, messages[0]);
  });
};

function isNumberAllowed(whatsappNumber) {
  // whataspp number param is 6287856725286@s.whatsapp.net
  const allowedNumber = process.env.ALLOWED_WHATSAPP_NUMBER;
  const numberOnly = whatsappNumber.split("@")[0];
  return allowedNumber.includes(numberOnly);
}

async function handleHelpCommand(sock, whatsappNumber, msg, originalMsg) {
  if (/^help$/i.test(msg)) {
    const helpText = await getHelpCommand();
    logger.info(`Sending help message to ${whatsappNumber}`);
    await sock.sendMessage(
      whatsappNumber,
      { text: helpText },
      { quoted: originalMsg }
    );
    return true;
  }
  return false;
}

async function handleShowCommand(sock, whatsappNumber, msg, originalMsg) {
  if (!checkIfShowCommand(msg)) return false;

  const parsed = parsingShowCommand(msg);
  logger.info(`parsed show command result is "${JSON.stringify(parsed)}"`);
  if (!parsed.success) {
    logger.error(`Error parsing show command: ${parsed.error}`);
    await sock.sendMessage(
      whatsappNumber,
      { text: `Error: ${parsed.error}` },
      { quoted: originalMsg }
    );
    return true;
  }

  const { type, day, month, year } = parsed;
  const params = { day, month, year };
  const res = await transactionService.getBy(type, params);
  logger.info(`show command result is "${JSON.stringify(res)}"`);
  const replyText = await buildMessageReport(
    res.total_income,
    res.total_expense,
    type,
    params
  );

  if (replyText) {
    await sock.sendMessage(
      whatsappNumber,
      { text: replyText },
      { quoted: originalMsg }
    );
  }
  return true;
}

async function handleStoreCommand(sock, whatsappNumber, msg, originalMsg) {
  const parseResult = parseMessage(msg);
  logger.info(`parsed result is "${JSON.stringify(parseResult)}"`);
  if (!parseResult.success) {
    logger.error(`Error parsing store command: ${parseResult.error}`);
    await sock.sendMessage(
      whatsappNumber,
      { text: `Error: ${parseResult.error}` },
      { quoted: originalMsg }
    );
    return true;
  }

  const res = await transactionService.store(parseResult);
  logger.info(`stored result is "${JSON.stringify(res)}"`);
  const replyText = await buildMessageLog(
    res.id,
    parseResult.type,
    parseResult.amount,
    parseResult.description
  );

  if (replyText) {
    await sock.sendMessage(
      whatsappNumber,
      { text: replyText },
      { quoted: originalMsg }
    );
  } else {
    logger.error("Error building reply message.");
  }

  return true;
}

const deleteAuthData = () => {
  try {
    fs.rmSync("baileys_auth_info", { recursive: true, force: true });
    logger.info("Authentication data deleted.");
  } catch (error) {
    logger.error("Error deleting authentication data:", error);
  }
};

export const isConnected = () => !!sock?.user;

export const updateQR = (data) => {
  switch (data) {
    case "qr":
      qrcode.toDataURL(qr, (err, url) => {
        soket?.emit("qr", url);
        soket?.emit("log", "QR Code received, please scan!");
      });
      break;
    case "connected":
      soket?.emit("qrstatus", "./assets/check.svg");
      soket?.emit("log", "WhatsApp is connected!");
      break;
    case "qrscanned":
      soket?.emit("qrstatus", "./assets/check.svg");
      soket?.emit("log", "Qr Code has been scanned, please wait!");
      break;
    case "loading":
      soket?.emit("qrstatus", "./assets/loader.gif");
      soket?.emit("log", "Registering QR Code, please wait!");
      break;
    default:
      break;
  }
};

export const sendMessage = async (req, res) => {
  const message = req.body.message;
  const number = req.body.number;

  try {
    if (!number) {
      return res.status(500).json({
        status: false,
        response: "Phone number is required.",
      });
    }

    const numberWA = `62${number.substring(1)}@s.whatsapp.net`;

    if (!isConnected()) {
      return res.status(500).json({
        status: false,
        response: `WhatsApp is not connected. Please wait until the QR code is scanned.`,
      });
    }

    const exists = await sock.onWhatsApp(numberWA);

    if (!exists?.jid && (!exists || !exists[0]?.jid)) {
      return res.status(500).json({
        status: false,
        response: `Phone number ${number} is not registered on WhatsApp.`,
      });
    }

    if (req.files) {
      const file = req.files.file;
      await sock.sendMessage(exists.jid || exists[0].jid, {
        image: file.data,
        caption: message,
      });
      return res.status(200).json({
        status: true,
        response: "Mesage with image sent successfully.",
      });
    }

    await sock.sendMessage(exists.jid || exists[0].jid, { text: message });
    return res.status(200).json({
      status: true,
      response: "Message sent successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      response: error.message,
    });
  }
};

export const getQR = () => qr;

export const setSocket = (socket) => {
  soket = socket;
};
