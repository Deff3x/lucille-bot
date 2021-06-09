const { toNumber } = require("lodash")
const { DateTime } = require("luxon")

class DestinyDb {
  initDestinyDb () {
    //  this.db.exec("DROP TABLE IF EXISTS BungieAPI")
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS BungieAPI
      (
        RefId                 INTEGER PRIMARY KEY AUTOINCREMENT,
        State                 TEXT NOT NULL,
        AccessToken           TEXT NOT NULL,
        TokenType             TEXT NOT NULL,
        ExpiresIn             TEXT NOT NULL,
        RefreshToken          TEXT NOT NULL,
        RefreshExpiresIn      TEXT NOT NULL,
        MembershipId          TEXT NOT NULL,
        NextRefresh           TEXT NOT NULL
      )
    `)
  }

  addBungieToken (state, data) {
    const now = DateTime.now().toMillis()
    const tokenExpiresIn = toNumber(data.expires_in) * 1000 // convert to milliseconds
    const nextRefresh = now + tokenExpiresIn

    this.run("INSERT INTO BungieAPI (State, AccessToken, TokenType, ExpiresIn, RefreshToken, RefreshExpiresIn, MembershipId, NextRefresh) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      state, data.access_token, data.token_type, data.expires_in, data.refresh_token, data.refresh_expires_in, data.membership_id, nextRefresh)
  }

  getBungieTokenData (state) {
    return this.runQuery("SELECT AccessToken, TokenType, ExpiresIn, RefreshToken, RefreshExpiresIn MembershipId, NextRefresh FROM BungieAPI WHERE State = ?", state)
  }

  getAllBungieStates (state) {
    return this.runQuery("SELECT State, NextRefresh FROM BungieAPI")
  }

  updateBungieToken (state, data) {
    // because im lazy, refid increase inc
    this.removeTokenData(state)
    this.addBungieToken(state, data)
  }

  removeTokenData (state) {
    this.run("DELETE FROM BungieAPI WHERE State = ?", state)
  }

  static applyToClass (structure) {
    for (const prop of Object.getOwnPropertyNames(DestinyDb.prototype).slice(1)) {
      Object.defineProperty(structure.prototype, prop, Object.getOwnPropertyDescriptor(DestinyDb.prototype, prop))
    }
  }
}

module.exports = DestinyDb