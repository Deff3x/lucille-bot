const { Command } = require("discord.js-commando")

module.exports = class extends Command {
  constructor (client) {
    super(client, {
      name: "d2register",
      aliases: ["d2reg", "d2"],
      group: "destiny",
      memberName: "register",
      description: "Register to use the D2 commands",
      args: [],
      guildOnly: true,
    })
  }

  run (msg, args) {
    // Feel free to spam it ;) - You will get the same link every time.
    // Not adding any checks because it can Expire if the server ever dies.
    msg.author.send("Visit the following link to authorise Lucille: https://www.bungie.net/en/OAuth/Authorize?client_id=33982&response_type=code&state=" + msg.author.id)
  }
}