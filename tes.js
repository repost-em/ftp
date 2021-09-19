const Slimbot = require("slimbot");
const slimbot = new Slimbot("2018545141:AAGWponPNzISOAFAIS4w91a-AWeHfvIVZGs");
const moment = require("moment");
const now = moment();
const db = require("./lib/db");
const qrcode = require("qrcode-terminal");
const config = require("./config");
const delay = require("delay");
const {
  WAConnection,
  MessageType,
  Presence,
  MessageOptions,
  Mimetype,
  WALocationMessage,
  WA_MESSAGE_STUB_TYPES,
  ReconnectMode,
  ProxyAgent,
  waChatKey,
} = require("@adiwajshing/baileys");
const fs = require("fs");
const bca = require("mutasi-bca");
var tgl = now.format("DD");
var bln = now.format("MM");
var thn = now.format("YY");
var jam = now.format("HH:mm:ss");
// Register listeners
const conn = new WAConnection();
conn.on("qr", (qr) => {
  qrcode.generate(qr, {
    small: true,
  });
  console.log(`[ ${moment().format("HH:mm:ss")} ] Please Scan QR with app!`);
});
conn.on("open", () => {
  // save credentials whenever updated
  console.log(`credentials updated!`);
  const authInfo = conn.base64EncodedAuthInfo(); // get all the auth info we need to restore this session
  fs.writeFileSync("./auth_info.json", JSON.stringify(authInfo, null, "\t")); // save this info to a file
});
// uncomment the following line to proxy the connection; some random proxy I got off of: https://proxyscrape.com/free-proxy-list
//conn.connectOptions.agent = ProxyAgent ('http://1.0.180.120:8080')
fs.existsSync("./auth_info.json") && conn.loadAuthInfo("./auth_info.json");
conn.connect();

conn.on("user-presence-update", (json) =>
  console.log(json.id + " presence is " + json.type)
);
conn.on("message-status-update", (json) => {
  const participant = json.participant ? " (" + json.participant + ")" : ""; // participant exists when the message is from a group
  console.log(
    `${json.to}${participant} acknlowledged message(s) ${json.ids} as ${json.type}`
  );
});

function mysql_real_escape_string(str) {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(char) {
    switch (char) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case '"':
      case "'":
      case "\\":
      case "%":
        return "\\" + char; // prepends a backslash to backslash, percent,
      // and double/single quotes
    }
  });
}

(async function() {
  setInterval(async () => {
    const detailakun = await bca.getBalance("REINALDY9324", "888999");
    await delay(5000);
    const result = await bca.getSettlement(
      "REINALDY9324",
      "888999",
      tgl,
      bln,
      tgl,
      bln
    );

    console.log(detailakun);

    console.log(result);
    for (var i = 0; i < result.length; i++) {
      const masukin = await db.mutasiakun(JSON.stringify(result[i]));

      var data;

      if (result[i].mutasi === "DB") {
        data = `
Mutasi Baru BCA - ${detailakun[0].norek}:
    
Tanggal : ${tgl + "-" + bln + "-" + thn}
Jam : ${jam}
Jenis : Dana Keluar
Jumlah : Rp.${result[i].nominal}   
Keterangan : ${result[i].keterangan.replace(/-\n/g, "")}

Saldo : Rp ${result[i].saldoakhir}

===========
Saldo Akun: Rp.${detailakun[0].saldo} 
     `;
      } else if (result[i].mutasi === "CR") {
        data = `
Mutasi Baru BCA - ${detailakun[0].norek}:
   
Tanggal : ${tgl + "-" + bln + "-" + thn}
Jam : ${jam}
Jenis : Dana Masuk
Jumlah : Rp.${result[i].nominal}   
Keterangan : ${result[i].keterangan.replace(/-\n/g, "")}

Saldo : Rp.${result[i].saldoakhir}
   
===========
Saldo Akun: Rp.${detailakun[0].saldo} 
    `;
      }

      if (masukin === false) {
        console.log("DATA SUDAH ADA == SKIPPED");
      } else {
        conn.sendMessage("16788888910@s.whatsapp.net", data, MessageType.text);
        slimbot.sendMessage("1728769611", data);
      }
    }
    // Call API
  }, 50000);
  slimbot.on("message", (message) => {
    console.log(message.chat.id);
    // define inline keyboard to send to user
    if (message.text === "install") {
      let optionalParams = {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { text: "Yes", callback_data: "db" },
              { text: "No", callback_data: "no" },
            ],
          ],
        }),
      };
      slimbot.sendMessage(message.chat.id, "Are you sure ?", optionalParams);
    }
    // let optionalParams = {
    //   parse_mode: 'Markdown',
    //   reply_markup: JSON.stringify({
    //     inline_keyboard: [[
    //       { text: 'Hello', callback_data: 'hello' }
    //     ],[
    //       { text: 'Good', callback_data: 'good' },
    //       { text: 'Day', callback_data: 'day' }
    //     ],[
    //       { text: 'How', callback_data: 'how' },
    //       { text: 'Are', callback_data: 'are' },
    //       { text: 'You', callback_data: 'you' }
    //     ]
    //     ]
    //   })
    // };
    // // reply when user sends a message, and send him our inline keyboard as well
    // slimbot.sendMessage(message.chat.id, 'Setting', optionalParams);
  });

  slimbot.on("callback_query", (query) => {
    console.log(query.data);
    if (query.data === "hello") {
      slimbot.sendMessage(query.message.chat.id, "Hello to you too!");
    }
  });

  slimbot.startPolling();
})();
