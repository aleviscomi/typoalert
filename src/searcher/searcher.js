export default class Searcher {
  constructor() {
    if (new.target === Searcher) {
      throw new TypeError("Cannot instantiate an abstract class.");
    }
  }

  get searchResults() {
    throw new Error("Getter searchResults() must be implemented.");
  }

  get dym() {
    throw new Error("Getter dym() must be implemented.");
  }

  async search() {
    throw new Error("Method search() must be implemented.");
  }
}