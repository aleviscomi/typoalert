export default class PhishingDetector {
  #similarityValue;

  constructor() {
    if (new.target === PhishingDetector) {
      throw new TypeError("Cannot instantiate an abstract class.");
    }
    this.#similarityValue = 0;
  }

  digest(data) {
    throw new Error("Method digest() must be implemented.");
  }

  similarity(d1, d2) {
    throw new Error("Method similarity() must be implemented.");
  }

  evaluate(html1, html2) {
      const hash1 = this.digest(html1);
      const hash2 = this.digest(html2);

      this.#similarityValue = this.similarity(hash1, hash2);
  }

  get similarityValue() {
      return this.#similarityValue;
  }
}