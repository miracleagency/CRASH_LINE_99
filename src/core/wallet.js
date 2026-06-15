(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  class Wallet {
    constructor(options) {
      const cfg = CT.Config;
      this.balance = Number(options && options.balance != null ? options.balance : cfg.startBalance);
      this.currentBet = Number(options && options.currentBet != null ? options.currentBet : cfg.startBet);
      this.betOptions = cfg.betOptions.slice();
    }

    canBet() {
      return this.balance >= this.currentBet;
    }

    placeBet() {
      if (!this.canBet()) return false;
      this.balance -= this.currentBet;
      return true;
    }

    addWin(value) {
      this.balance += Number(value || 0);
    }

    setBet(value) {
      const next = Number(value);
      if (!this.betOptions.includes(next)) return false;
      this.currentBet = next;
      return true;
    }

    format(value) {
      return Number(value || 0).toFixed(2);
    }
  }

  CT.Wallet = Wallet;
})();
