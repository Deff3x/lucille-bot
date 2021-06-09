const express = require("express")
const { stringify } = require("query-string")
const fetch = require("node-fetch")

const APIBase = "https://www.bungie.net/Platform"

const CharClassType = {
  0: "Titan",
  1: "Hunter",
  2: "Warlock",
  3: "Unknown",
}

class BungieAPI {
  constructor(auth) {
    this.apiHeader = {
      headers: {
        "X-API-Key": "hahajue",
        Authorization: `${auth.TokenType} ${auth.AccessToken}`,
      },
    }
  }

  async makeCall(endpoint) {
    const results = await fetch(`${APIBase}${endpoint}`, { ...this.apiHeader, method: "GET" })
    const json = await results.json()
    return json
  }

  user = { getMembershipsForCurrentUser: async () => await this.makeCall("/User/GetMembershipsForCurrentUser/") };
  destiny2 = {
    getManifest: async () =>                            await makeCall(`${APIBase}/Destiny2/Manifest/`),
    searchDestinyPlayer: async (platform, user) =>      await makeCall(`${APIBase}/Destiny2/SearchDestinyPlayer/${platform}/${user}/`),
    getProfile: async (platform, userId, components) => await this.makeCall(`/Destiny2/${platform}/Profile/${userId}/?components=${components}`)
  };
}

const postmasterCheck = async (client, state) => {
  // get auith
  const auth = client.db.getBungieTokenData(state)
  if (auth.length < 1) {
    client.users.cache.get(state).send("Not authorised")
    return
  }

  // Setup bungie API auth for the user
  const Bungie = new BungieAPI(auth[0])
  
  try {
    // Get the current user
    const curUser = await Bungie.user.getMembershipsForCurrentUser()
    if (curUser === undefined)
      return

    // Get d2 profiles :)
    const d2 = curUser.Response.destinyMemberships.filter(x => x.membershipType === 3 || x.membershipType === 4)

    // Get Characters & CharacterInventories
    let apiProfileResult = await Bungie.destiny2.getProfile(3, d2[0].membershipId, "200,201")
    if (apiProfileResult.Response === undefined)
      return

    let chars = apiProfileResult.Response.characters.data;
    let inventories = apiProfileResult.Response.characterInventories.data
    let charIds = Object.keys(inventories)

    let result = {}

    for (let i = 0; i < charIds.length; i++) {
      let name = CharClassType[chars[charIds[i]].classType]
      result[name] = inventories[charIds[i]].items.filter(x => x.bucketHash === 215593132).length // 215593132 is the bucket hash, download the manifest to find out
    }
    client.users.cache.get(state).send(JSON.stringify(result))
  }
  catch (err) {
    console.log(err)
  }
}

const refreshToken = async (client, state) => {
    const previousToken = client.db.getBungieTokenData(state)

    if (previousToken.length < 1) {
      client.users.cache.get(state).send("Failed to refresh Bungie API - Please re-register if you wish to conitinue using the service")
      client.db.removeTokenData(state)
      return
    }

    const buffer = Buffer.from("33982:")
    const s = buffer.toString("base64")

  // get results back
    const params = stringify({
      grant_type: "refresh_token",
      "refresh_token": previousToken[0].RefreshToken
    })

    try {
      // not sure if you prefer axios or fetch at this point
      const fetchResult = await fetch("https://www.bungie.net/Platform/App/OAuth/Token/", {
        method: "POST",
        headers: {
          Authorization: "Basic " + s,
          "content-type": "application/x-www-form-urlencoded"
        },
        body: params,
      })

      const jsonData = await fetchResult.json()
      if (jsonData.access_token === undefined) {
        console.log(jsonData)
        resp.send("Failed to authenticate")
        return
      }

      // Save to db
      client.db.updateBungieToken(state, jsonData)

      client.users.cache.get(state).send("Token Refresh!")
    }
    catch (error) {
      console.log(error)
    }

}

const initRoute = (client) => {
  const router = express.Router()

  router.get("/authenticate", async (req, resp) => {
    const xstate = req.query.state
    const apiKey = req.query.code

    if (xstate === undefined || apiKey === undefined) {
      resp.send("Failed to authenticate")
      return
    }

    const buffer = Buffer.from("33982:")
    const s = buffer.toString("base64")

    // get results back
    const params = stringify({
      grant_type: "authorization_code",
      code: apiKey,
      state: xstate,
    })

    try {
      // not sure if you prefer axios or fetch at this point
      const fetchResult = await fetch("https://www.bungie.net/Platform/App/OAuth/Token/", {
        method: "POST",
        headers: {
          Authorization: "Basic " + s,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: params,
      })

      const jsonData = await fetchResult.json()
      if (jsonData.access_token === undefined) {
        console.log(jsonData)
        resp.send("Failed to authenticate")
        return
      }

      // Save to db
      client.db.addBungieToken(xstate, jsonData)

      resp.send("Your D2 account is now authenticated to be used and abused by Lucille.")
    }
    catch (error) {
      resp.send(JSON.stringify(error))
    }
  })

  return router
}

module.exports = {
  router: initRoute,
  postmasterCheck: postmasterCheck,
  refreshToken: refreshToken
}