const { Command } = require("discord.js-commando")
const { postmasterCheck, refreshToken } = require("../../classes/DestinyRoute")

module.exports = class extends Command {
  constructor (client) {
    super(client, {
      name: "d2postmaster",
      aliases: ["d2pm", "postmaster"],
      group: "destiny",
      memberName: "postmaster",
      description: "Forcefully check your postmaster ",
      args: [],
      guildOnly: true,
    })
  }

  run (msg, args) {
    // postmasterCheck(this.client, msg.author.id)
    // refreshToken(this.client, msg.author.id)
  }
}