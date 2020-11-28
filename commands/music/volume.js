const { Command } = require("discord.js-commando")
const { getOrCreateMusic } = require("../../classes/Helpers")

module.exports = class extends Command {
  constructor (client) {
    super(client, {
      name: "volume",
      aliases: ["vol"],
      group: "music",
      memberName: "volume",
      description: "Changes the volume of the player.",
      args: [
        {
          key: "volume",
          prompt: "Enter volume between 1 & 300",
          type: "integer",
          validate: num => num >= 1 && num <= 300,
        },
      ],
      guildOnly: true,
    })
  }

  async run (msg, args) {
    const music = getOrCreateMusic(msg)
    const currentVol = music.state.volume

    music.setVolume(args.volume)

    msg.react(args.volume > currentVol ? "🔊" : args.volume < currentVol ? "🔉" : "🔈")
  }
}