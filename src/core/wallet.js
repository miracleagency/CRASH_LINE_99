(function () {
  const CT = window.CrashTest = window.CrashTest || {};

  class Wallet {
    constructor(options) {
      const cfg = CT.Config;
      this.balance = Number(options && options.balance != null ? options.balance : cfg.startBalance);
      this.baseBet = Number(options && options.currentBet != null ? options.currentBet : cfg.startBet);
      this.betCostMultiplier = 1;
      this.currentBet = this.getEffectiveBet();
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

    canSpend(value) {
      return this.balance >= Number(value || 0);
    }

    spend(value) {
      const amount = Number(value || 0);
      if (amount < 0 || !this.canSpend(amount)) return false;
      this.balance -= amount;
      return true;
    }

    addWin(value) {
      this.balance += Number(value || 0);
    }

    setBet(value) {
      const next = Number(value);
      if (!this.betOptions.includes(next)) return false;
      this.baseBet = next;
      this.currentBet = this.getEffectiveBet();
      return true;
    }

    setBetCostMultiplier(value) {
      const next = Math.max(1, Number(value || 1));
      this.betCostMultiplier = next;
      this.currentBet = this.getEffectiveBet();
    }

    getEffectiveBet() {
      return Number((this.baseBet * this.betCostMultiplier).toFixed(2));
    }

    getPayoutBet() {
      return this.baseBet;
    }

    getBaseBet() {
      return this.baseBet;
    }

    format(value) {
      return Number(value || 0).toFixed(2);
    }
  }

  CT.Wallet = Wallet;
})();
