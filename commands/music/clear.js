const { Command } = require("discord.js-commando")
const { getMusic } = require("../../messageHelpers")

module.exports = class extends Command {
  constructor (client) {
    super(client, {
      name: "clear",
      aliases: [],
      group: "music",
      memberName: "clear",
      description: "Clears the queue.",
      guildOnly: true,
    })
  }

  async run (msg, args) {
    const music = getMusic(msg)
    if (music.state.queue.length > 1) {
      const replyMsg = await msg.reply(`Are you sure you want to clear ${music.state.queue.length - 1} song(s) from the queue?`)
      replyMsg.react("☑️").then(() => replyMsg.react("❌"))

      const filter = (reaction, user) => ["☑️", "❌"].includes(reaction.emoji.name) && user.id === msg.author.id
      const collected = await replyMsg.awaitReactions(filter, { time: 15000, max: 1 })

      replyMsg.delete()

      const firstKey = collected.firstKey()
      if (firstKey) {
        msg.react(firstKey)

        if (firstKey === "☑️") {
          music.state.queue.splice(1)
          music.updateEmbed()
        }
      }
    }
  }
}