const { Command } = require("discord.js-commando")
const config = require("../../config.json")
const { getRequestee, getVoiceChannel, getOrCreateMusic } = require("../../classes/Helpers")
const Track = require("../../classes/Track")
const { MessageAttachment, Util } = require("discord.js")

module.exports = class extends Command {
    constructor (client) {
      super(client, {
        name: "banga",
        aliases: ["banger", "banging", "bangin", "b"],
        group: "fun",
        memberName: "banga",
        description: "Logs user bangers",
        args: [
            {
              key: "arg1",
              prompt: "Arg1",
              type: "string",
              default: "",
            },
            {
              key: "arg2",
              prompt: "Arg2",
              type: "string",
              default: "",
            },
          ],
        guildOnly: true,
      })
    }

    async run (msg, args) {

        const music = getOrCreateMusic(msg);

        if(args.arg1.toLowerCase() === "list") {
            let listId = this.findUserId(msg, args.arg2)
            if(!listId) return
            let nickname = msg.guild.member(listId).nickname
            if(!nickname) nickname = msg.guild.member(listId).user.username
            const tempArr = this.list(this.client.bangaTracker.listBangas(listId), nickname)
            if(tempArr.length === 0) {
                msg.channel.send("This person is boring and has no bangers")
                return
            }
            const embed = { embed: {
                color: 0x0099ff,
                title: "Lucille :musical_note:",
                author: {
                  name: msg.member.displayName,
                  icon_url: msg.author.displayAvatarURL(),
                },
                fields: tempArr,
                footer: {
                  text: config.discord.footer,
                },
              }
            }
            msg.reply(embed)
            return
        }

        if(args.arg1.toLowerCase() === "play") {
            let playArr = []
            let playId = this.findUserId(msg, args.arg2)
            if(!playId) return
            playArr = this.client.bangaTracker.listBangas(playId)
            let trackedMusic = playArr.map(dbSong => new Track()
            .setPlatform("search")
            .setQuery(dbSong.song)
            .setYouTubeTitle(dbSong.song))
            music.add(trackedMusic, getRequestee(msg), getVoiceChannel(msg))
            return
        }

        if(args.arg1.toLowerCase() === "remove") {
            const grug = this.client.bangaTracker.findBanga(args.arg2, msg.author.id);
            if(!grug) {
                msg.channel.send("Nice try")
                return
            }
            const replyMsg = await msg.reply(`Are you sure you want to remove ${grug}`)
            replyMsg.react("☑️").then(() => replyMsg.react("❌"))
            const filter = (reaction, user) => ["☑️", "❌"].includes(reaction.emoji.name) && user.id === msg.author.id
            const collected = await replyMsg.awaitReactions(filter, { time: 15000, max: 1 })
            replyMsg.delete()

            const firstKey = collected.firstKey()
            if (firstKey) {
                msg.react(firstKey)

                    if (firstKey === "☑️") {
                      this.client.bangaTracker.removeBanga(args.arg2, msg.author.id)
                    }
            } 
            return
        }

        let currTrack = false;
        let queueItem = music.state.queue[0]

        if(queueItem) currTrack = queueItem.youTubeTitle;
        if(queueItem && queueItem.radioMetadata && queueItem.radioMetadata.info && queueItem.radioMetadata.info.title && queueItem.radioMetadata.info.artist) currTrack = queueItem.radioMetadata.info.artist + " - " + queueItem.radioMetadata.info.title;
        if(queueItem && queueItem.platform === "soundcloud") currTrack = queueItem.title;

        if(!currTrack) {
            msg.channel.send("Hold your horses")
            return
        }

        const checkEx = this.client.bangaTracker.checkForBanga(currTrack);

        if(args.arg1 === "?") {
            msg.channel.send(`${this.findUsers(checkEx).join(", ")} thinks its a banger`)
            return;
        }

        let bangerStampImg = new MessageAttachment(`./assets/images/bangerstamps/${msg.author.id}.png`)

        if(checkEx.length) {
            if (this.checkForUser(checkEx, msg)) {
                msg.channel.send("You've already said this was a banger");
            } else {
                this.client.bangaTracker.updateUsers(currTrack, msg.author.id)
                msg.react("👍")
                msg.channel.send(bangerStampImg)
            }
        } else {
            this.client.bangaTracker.writeBanga(currTrack, msg.author.id);
            msg.react("👍")
            msg.channel.send(bangerStampImg)
        }
        
    }

    checkForUser(user, mess) {
        let greg = false;
        user[0].users.map(e => {
            if(e === mess.author.id) greg = true; 
        })
        return greg
    }

    findUsers(banger) {
        const usrArr = []
        let username
        if(banger[0]){
            banger[0].users.map(e => {
                username = this.client.users.cache.get(e);
                if(username) {
                    usrArr.push(username.username)
                }
            })
        } else {
            usrArr.push("No one")
        }
        return usrArr;
    }

    findUserId(msg, user) {
        let userID
        if(user.length > 0) {
            msg.guild.members.cache.map(e => {
                if(e.user.username.toLowerCase().includes(user.toLowerCase())) userID = e.user.id
            })
        } else {
            userID = msg.author.id
        }
        if(!userID) {
            msg.channel.send("No user found")
            return null
        }
        return userID
    }

    list(songs, nickname) {
        return Util.splitMessage(songs.map(s => Util.escapeMarkdown(`- ${s.song}`)), { maxLength: 1024 }).map((str, idx) => ({
            name: `${nickname}'s Bangers ${idx + 1}`,
            value: str,
        }))
    }
}